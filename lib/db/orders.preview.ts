

import { query } from "@/lib/db";

import {
  getShippingRatesByProduct,
  getZoneByCountry,
} from "@/lib/db/shipping";

import {
  getVariantById,
  isVariantActive,
  isVariantBelongsToProduct,
  isVariantPurchasable,
} from "@/lib/db/variants";

/* =========================================================
   TYPES
========================================================= */

type PreviewItemInput = {
  product_id: string;
  quantity: number;
  variant_id?: string | null;
};

type PreviewOrderInput = {
  userId: string;
  items: PreviewItemInput[];
  country: string;
  zone?: string;
};

type PreviewOrderItem = {
  product_id: string;
  variant_id: string | null;
  name: string;
  price: number;
  quantity: number;
  total: number;
};

type PreviewOrderResult = {
  items: PreviewOrderItem[];
  subtotal: number;
  shipping_fee: number;
  total: number;
  buyer_zone: string;
};

type ProductRow = {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
};

type VariantRow = {
  id: string;
  product_id: string;
  price: number;
  sale_price: number | null;
  stock: number | null;
  is_active: boolean;
};

/* =========================================================
   HELPERS
========================================================= */

function log(tag: string, data?: unknown): void {
  console.log(`[ORDER PREVIEW V7][${tag}]`, data ?? "");
}

function isUUID(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v
    )
  );
}

function safeQty(q: unknown): number {
  const n = Number(q);

  if (!Number.isInteger(n) || n <= 0) {
    return 1;
  }

  return Math.min(n, 100);
}

function resolveProductSalePrice(product: ProductRow): number {
  const now = Date.now();

  const start = product.sale_start
    ? new Date(product.sale_start).getTime()
    : null;

  const end = product.sale_end
    ? new Date(product.sale_end).getTime()
    : null;

  const active =
    start !== null &&
    end !== null &&
    now >= start &&
    now <= end;

  if (
    active &&
    product.sale_price !== null &&
    Number(product.sale_price) > 0
  ) {
    return Number(product.sale_price);
  }

  return Number(product.price);
}

function resolveVariantSalePrice(
  baseSaleActive: boolean,
  variant: VariantRow
): number {
  if (
    baseSaleActive &&
    variant.sale_price !== null &&
    Number(variant.sale_price) > 0
  ) {
    return Number(variant.sale_price);
  }

  return Number(variant.price);
}

function isProductSaleActive(product: ProductRow): boolean {
  const now = Date.now();

  const start = product.sale_start
    ? new Date(product.sale_start).getTime()
    : null;

  const end = product.sale_end
    ? new Date(product.sale_end).getTime()
    : null;

  return (
    start !== null &&
    end !== null &&
    now >= start &&
    now <= end
  );
}

function chooseShippingPrice(params: {
  rates: Awaited<ReturnType<typeof getShippingRatesByProduct>>;
  buyerCountry: string;
  buyerZone: string | null;
}): number {
  const { rates, buyerCountry, buyerZone } = params;

  const domestic = rates.find(
    (r) =>
      r.zone === "domestic" &&
      (r.domesticCountryCode || "").toUpperCase() ===
        buyerCountry
  );

  if (domestic) {
    return Number(domestic.price);
  }

  if (buyerZone) {
    const regional = rates.find(
      (r) => r.zone === buyerZone
    );

    if (regional) {
      return Number(regional.price);
    }
  }

  const global = rates.find(
    (r) => r.zone === "rest_of_world"
  );

  if (global) {
    return Number(global.price);
  }

  throw new Error("SHIPPING_NOT_AVAILABLE");
}

/* =========================================================
   MAIN
========================================================= */

export async function previewOrder(
  input: PreviewOrderInput
): Promise<PreviewOrderResult> {
  log("START", input);

  const { userId, items, country } = input;

  if (!userId) {
    throw new Error("INVALID_USER");
  }

  if (!country) {
    throw new Error("INVALID_COUNTRY");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("INVALID_ITEMS");
  }

  /* =====================================================
     CLEAN ITEMS
  ===================================================== */

  const cleanItems = items.map((item) => {
    if (!isUUID(item.product_id)) {
      throw new Error("INVALID_PRODUCT_ID");
    }

    if (
      item.variant_id &&
      !isUUID(item.variant_id)
    ) {
      throw new Error("INVALID_VARIANT_ID");
    }

    return {
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: safeQty(item.quantity),
    };
  });

  log("CLEAN_ITEMS", cleanItems);

  /* =====================================================
     BUYER GEO
  ===================================================== */

  const buyerCountry = country.trim().toUpperCase();

  const buyerZone =
    await getZoneByCountry(buyerCountry);

  log("BUYER_GEO", {
    buyerCountry,
    buyerZone,
  });

  /* =====================================================
     LOAD PRODUCTS
  ===================================================== */

  const productIds = cleanItems.map(
    (i) => i.product_id
  );

  const { rows: products } = await query<ProductRow>(
    `
      SELECT
        id,
        name,
        price,
        sale_price,
        sale_start,
        sale_end
      FROM products
      WHERE id = ANY($1::uuid[])
    `,
    [productIds]
  );

  const productMap = new Map<string, ProductRow>(
    products.map((p) => [p.id, p])
  );

  /* =====================================================
     CALCULATE
  ===================================================== */

  let subtotal = 0;

  const previewItems: PreviewOrderItem[] = [];

  for (const item of cleanItems) {
    const product = productMap.get(
      item.product_id
    );

    if (!product) {
      throw new Error("INVALID_PRODUCT");
    }

    let finalPrice =
      resolveProductSalePrice(product);

    let finalVariantId: string | null = null;

    /* ===================================================
       VARIANT VALIDATION
    =================================================== */

    if (item.variant_id) {
      const variant = (await getVariantById(
        item.variant_id
      )) as VariantRow | null;

      if (!variant) {
        throw new Error("INVALID_VARIANT");
      }

      const belongs =
        await isVariantBelongsToProduct(
          variant.id,
          product.id
        );

      if (!belongs) {
        throw new Error(
          "VARIANT_PRODUCT_MISMATCH"
        );
      }

      const active = await isVariantActive(
        variant.id
      );

      if (!active || !variant.is_active) {
        throw new Error("VARIANT_DISABLED");
      }

      const purchasable =
        await isVariantPurchasable(
          variant.id,
          item.quantity
        );

      if (!purchasable) {
        throw new Error(
          "VARIANT_NOT_PURCHASABLE"
        );
      }

      if (
        variant.stock !== null &&
        variant.stock < item.quantity
      ) {
        throw new Error(
          "VARIANT_OUT_OF_STOCK"
        );
      }

      const saleActive =
        isProductSaleActive(product);

      finalPrice = resolveVariantSalePrice(
        saleActive,
        variant
      );

      finalVariantId = variant.id;

      log("VARIANT_OK", {
        variantId: variant.id,
        productId: product.id,
        quantity: item.quantity,
      });
    }

    const total =
      finalPrice * item.quantity;

    subtotal += total;

    previewItems.push({
      product_id: product.id,
      variant_id: finalVariantId,
      name: product.name,
      price: finalPrice,
      quantity: item.quantity,
      total,
    });
  }

  log("SUBTOTAL_OK", subtotal);

  /* =====================================================
     SHIPPING
  ===================================================== */

  let shippingFee = 0;

  for (const item of cleanItems) {
    const rates =
      await getShippingRatesByProduct(
        item.product_id
      );

    const matched =
      chooseShippingPrice({
        rates,
        buyerCountry,
        buyerZone,
      });

    shippingFee += matched;
  }

  log("SHIPPING_OK", shippingFee);

  /* =====================================================
     TOTAL
  ===================================================== */

  const total = subtotal + shippingFee;

  log("SUCCESS", {
    subtotal,
    shippingFee,
    total,
    buyerZone:
      buyerZone ?? "rest_of_world",
  });

  return {
    items: previewItems,
    subtotal,
    shipping_fee: shippingFee,
    total,
    buyer_zone:
      buyerZone ?? "rest_of_world",
  };
}
