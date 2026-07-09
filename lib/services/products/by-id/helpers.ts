import type {
  ProductVariantRecord,
} from "@/lib/db/variants";

import type {
  ShippingRateInput,
} from "@/lib/db/shipping";

import type {
  ProductRequestBody,
} from "./types";
/* =====================================================
   LOGGER
===================================================== */

export function log(
  step: string,
  data?: unknown
): void {
  console.log(
    `[PRODUCTS][${step}]`,
    data ?? ""
  );
}

export function logError(
  step: string,
  error: unknown
): void {
  console.error(
    `[PRODUCTS][${step}]`,
    {
      error:
        error instanceof Error
          ? error.message
          : "UNKNOWN_ERROR",
    }
  );
}

export function maskId(
  value: string
): string {
  if (value.length <= 8) {
    return value;
  }

  return (
    value.slice(0, 4) +
    "..." +
    value.slice(-4)
  );
}

/* =====================================================
   VARIANT PRICE
===================================================== */

export function calcVariantFinalPrice(
  variant: ProductVariantRecord
): number {
  const saleActive =
    variant.sale_enabled &&
    variant.sale_price !== null &&
    Number(variant.sale_price) > 0 &&
    Number(variant.sale_price) <
      Number(variant.price);

  return saleActive
    ? Number(variant.sale_price)
    : Number(variant.price);
}

/* =====================================================
   SHIPPING
===================================================== */

export function normalizeShippingRates(
  body: ProductRequestBody
): ShippingRateInput[] {
  const rates =
    body.shipping_rates ?? [];

  return rates.map((rate) => ({
    zone: rate.zone,

    price:
  rate.price === "" ||
  rate.price === null ||
  rate.price === undefined
    ? null
    : Number(rate.price),

    domestic_country_code:
      rate.zone === "domestic"
        ? rate.domestic_country_code ??
          body.primary_shipping_country ??
          null
        : null,
  }));
}

/* =====================================================
   PRICE SUMMARY
===================================================== */

export function calculatePriceSummary(
  variants: ProductVariantRecord[]
) {
  const enrichedVariants =
    variants.map((variant) => ({
      ...variant,

      final_price:
        calcVariantFinalPrice(
          variant
        ),
    }));

  const prices =
    enrichedVariants.map((variant) =>
      Number(
        variant.final_price
      )
    );

  return {
    enrichedVariants,

    minPrice:
      prices.length > 0
        ? Math.min(...prices)
        : null,

    maxPrice:
      prices.length > 0
        ? Math.max(...prices)
        : null,
  };
}

/* =====================================================
   STORAGE
===================================================== */

export function extractProductStoragePaths(
  thumbnail?: string | null,
  images?: string[]
): string[] {
  const paths: string[] = [];

  const collectPath = (
    url?: string | null
  ) => {
    if (!url) {
      return;
    }

    const marker =
      "/products/";

    const index =
      url.indexOf(marker);

    if (index === -1) {
      return;
    }

    const path =
      url.substring(
        index +
          marker.length
      );

    if (path) {
      paths.push(path);
    }
  };

  collectPath(thumbnail);

  if (Array.isArray(images)) {
    for (const image of images) {
      collectPath(image);
    }
  }

  return paths;
}
