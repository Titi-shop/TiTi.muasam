

import {
  calculatePricing,
  type PricingInput,
  type PricingResult,
} from "@/lib/payments/pricing.engine";

/* =========================================================
   TYPES
========================================================= */

export type PreviewItemInput = {
  product_id: string;
  quantity: number;
  variant_id?: string | null;
};

export type PreviewOrderInput = {
  userId: string;
  items: PreviewItemInput[];
  country: string;
  zone?: string | null;
};

export type PreviewOrderResult = {
  items: {
    product_id: string;
    variant_id: string | null;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];

  subtotal: number;
  shipping_fee: number;
  total: number;
  buyer_zone: string;
};

/* =========================================================
   LOGGER
========================================================= */

function vlog(
  step: string,
  data?: unknown
) {
  console.log(
    `[ORDER_PREVIEW_V7][${step}]`,
    data ?? ""
  );
}

/* =========================================================
   MAPPER
========================================================= */

function mapPricingToPreview(
  pricing: PricingResult
): PreviewOrderResult {
  return {
    items: pricing.items.map(
      (item) => ({
        product_id:
          item.product_id,

        variant_id:
          item.variant_id,

        name: item.name,

        price:
          item.unit_price,

        quantity:
          item.quantity,

        total:
          item.subtotal,
      })
    ),

    subtotal:
      pricing.subtotal,

    shipping_fee:
      pricing.shipping_fee,

    total: pricing.total,

    buyer_zone:
      pricing.buyer_zone,
  };
}

/* =========================================================
   MAIN
========================================================= */

export async function previewOrder(input: PreviewOrderInput) {
  vlog("START", input);

  if (!input.userId) {
    throw new Error("INVALID_USER");
  }

  // 1. GET BUYER COUNTRY FROM ADDRESS (IMPORTANT)
  const address = await getAddressById(input.address_id, input.userId);

  if (!address) {
    throw new Error("ADDRESS_NOT_FOUND");
  }

  const buyerCountry = address.country?.toUpperCase();

  // 2. GET SELLER COUNTRY FROM PRODUCT
  const sellerCountry = await getSellerCountry(input.items[0].product_id);

  // 3. DECIDE DOMESTIC OR NOT
  const isDomestic =
    buyerCountry === sellerCountry;

  let zone: string;

  if (isDomestic) {
    zone = "domestic";
  } else {
    zone = await getZoneFromCountry(buyerCountry);
  }

  // 4. BUILD PRICING INPUT
  const pricingInput: PricingInput = {
    items: input.items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: item.quantity,
    })),

    buyer_country: buyerCountry,
    seller_country: sellerCountry,
    zone,
  };

  vlog("PRICING_INPUT", pricingInput);

  const pricing = await calculatePricing(pricingInput);

  return mapPricingToPreview(pricing);
}
