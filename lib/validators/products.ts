import type {
  ProductVariant,
} from "@/types/product";

/* =========================================================
   RAW INPUT TYPE
========================================================= */

type VariantInput = {
  id?: unknown;

  /* OPTIONS */
  option1?: unknown;
  option2?: unknown;
  option3?: unknown;

  option_label1?: unknown;
  option_label2?: unknown;
  option_label3?: unknown;

  /* LEGACY SUPPORT */
  optionLabel1?: unknown;
  optionLabel2?: unknown;
  optionLabel3?: unknown;

  /* BASIC */
  name?: unknown;
  sku?: unknown;

  /* PRICE */
  price?: unknown;
  sale_price?: unknown;
  final_price?: unknown;

  /* LEGACY SUPPORT */
  salePrice?: unknown;

  currency?: unknown;

  /* SALE */
  sale_enabled?: unknown;

  /* LEGACY SUPPORT */
  saleEnabled?: unknown;

  sale_stock?: unknown;
  sale_sold?: unknown;

  /* LEGACY SUPPORT */
  saleStock?: unknown;
  saleSold?: unknown;

  /* STOCK */
  stock?: unknown;
  is_unlimited?: unknown;

  /* LEGACY SUPPORT */
  isUnlimited?: unknown;

  /* MEDIA */
  image?: unknown;

  /* STATUS */
  is_active?: unknown;

  /* LEGACY SUPPORT */
  isActive?: unknown;

  sort_order?: unknown;

  /* LEGACY SUPPORT */
  sortOrder?: unknown;

  /* ANALYTICS */
  sold?: unknown;
};

/* =========================================================
   HELPERS
========================================================= */

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function safeString(
  value: unknown,
  fallback = ""
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim();
}

function safeNullableString(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function safeNumber(
  value: unknown,
  fallback = 0
): number {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const n = Number(value);

  return Number.isNaN(n)
    ? fallback
    : n;
}

function safeNullableNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const n = Number(value);

  return Number.isNaN(n)
    ? null
    : n;
}

function safeBoolean(
  value: unknown,
  fallback = false
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return fallback;
}

function buildVariantName(
  option1: string,
  option2?: string | null,
  option3?: string | null
): string {
  return [
    option1,
    option2,
    option3,
  ]
    .filter(
      (
        value
      ): value is string =>
        Boolean(
          value &&
            value.trim()
              .length > 0
        )
    )
    .join(" - ");
}

function calcFinalPrice(
  price: number,
  salePrice: number | null,
  saleEnabled: boolean
): number {
  if (
    saleEnabled &&
    salePrice !== null &&
    salePrice > 0 &&
    salePrice < price
  ) {
    return salePrice;
  }

  return price;
}

/* =========================================================
   NORMALIZE SINGLE VARIANT
========================================================= */

export function normalizeVariant(
  raw: unknown,
  index = 0
): ProductVariant | null {
  if (!isObject(raw)) {
    return null;
  }

  const item =
    raw as VariantInput;

  /* ================= OPTIONS ================= */

  const option1 =
    safeString(
      item.option1
    );

  if (!option1) {
    console.warn(
      "❌ INVALID_VARIANT_OPTION1",
      {
        index,
        raw,
      }
    );

    return null;
  }

  const option2 =
    safeNullableString(
      item.option2
    );

  const option3 =
    safeNullableString(
      item.option3
    );

  /* ================= PRICE ================= */

  const price =
    safeNumber(
      item.price
    );

  const saleEnabled =
    safeBoolean(
      item.sale_enabled ??
        item.saleEnabled
    );

  const salePrice =
    safeNullableNumber(
      item.sale_price ??
        item.salePrice
    );

  const finalPrice =
    calcFinalPrice(
      price,
      salePrice,
      saleEnabled
    );

  /* ================= STOCK ================= */

  const stock =
    safeNumber(
      item.stock
    );

  const saleStock =
    safeNumber(
      item.sale_stock ??
        item.saleStock
    );

  /* ================= NORMALIZED ================= */

  const variant: ProductVariant =
    {
      id:
        safeNullableString(
          item.id
        ) ?? undefined,

      /* OPTIONS */

      option1,

      option2,

      option3,

      option_label1:
        safeNullableString(
          item.option_label1 ??
            item.optionLabel1
        ),

      option_label2:
        safeNullableString(
          item.option_label2 ??
            item.optionLabel2
        ),

      option_label3:
        safeNullableString(
          item.option_label3 ??
            item.optionLabel3
        ),

      name:
        safeNullableString(
          item.name
        ) ??
        buildVariantName(
          option1,
          option2,
          option3
        ),

      /* SKU */

      sku:
        safeNullableString(
          item.sku
        ),

      /* PRICE */

      price,

      sale_price:
        saleEnabled
          ? salePrice
          : null,

      final_price:
        finalPrice,

      currency: "PI",

      /* SALE */

      sale_enabled:
        saleEnabled,

      sale_stock:
        Math.min(
          saleStock,
          stock
        ),

      sale_sold:
        safeNumber(
          item.sale_sold ??
            item.saleSold
        ),

      /* STOCK */

      stock,

      is_unlimited:
        safeBoolean(
          item.is_unlimited ??
            item.isUnlimited
        ),

      /* MEDIA */

      image:
        safeString(
          item.image
        ),

      /* STATUS */

      is_active:
        safeBoolean(
          item.is_active ??
            item.isActive,
          true
        ),

      sort_order:
        safeNumber(
          item.sort_order ??
            item.sortOrder,
          index
        ),

      /* ANALYTICS */

      sold:
        safeNumber(
          item.sold
        ),
    };

  return variant;
}

/* =========================================================
   NORMALIZE VARIANTS
========================================================= */

export function normalizeVariants(
  input: unknown
): ProductVariant[] {
  if (
    !Array.isArray(input)
  ) {
    return [];
  }

  const result: ProductVariant[] =
    [];

  for (
    let index = 0;
    index < input.length;
    index++
  ) {
    const normalized =
      normalizeVariant(
        input[index],
        index
      );

    if (!normalized) {
      continue;
    }

    result.push(
      normalized
    );
  }

  return result;
}
