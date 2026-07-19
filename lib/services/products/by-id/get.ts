import {
  getProductById,
} from "@/lib/db/products";

import {
  getVariantsByProductId,
} from "@/lib/db/variants";

import {
  getShippingRatesByProduct,
} from "@/lib/db/shipping";

import {
  log,
  logError,
  maskId,
  calculatePriceSummary,
} from "./helpers";

/* =====================================================
   GET PRODUCT
===================================================== */

export async function getProductService(
  id: string,
  userId: string | null
) {
  log(
  "GET_START",
  {
    productId:
      maskId(id),
  }
);

  try {
    if (!id) {
      return {
        error:
          "INVALID_PRODUCT_ID",
      };
    }

    const product =
  await getProductById(
    id,
    userId
  );
    if (!product) {
      return {
        error:
          "PRODUCT_NOT_FOUND",
      };
    }

    log(
  "GET_FOUND",
  {
    productId:
      maskId(id),

    hasVariants:
      product.has_variants,
  }
);

    log(
  "VARIANTS_LOAD_START",
  {
    productId:
      maskId(id),
  }
);

    const [
  variants,
  shippingRates,
] = await Promise.all([
  product.has_variants
    ? getVariantsByProductId(id)
    : Promise.resolve([]),

  getShippingRatesByProduct(id),
]);

log(
  "VARIANTS_LOAD_DONE",
  {
    count: variants.length,
  }
);

log(
  "SHIPPING_LOAD_DONE",
  {
    count: shippingRates.length,
  }
);

const {
  enrichedVariants,
  minPrice,
  maxPrice,
} = calculatePriceSummary(
  variants
);

    return {
      ...product,

      has_variants:
        product.has_variants,

      variants:
        enrichedVariants,

      min_price:
        minPrice,

      max_price:
        maxPrice,

      shipping_rates:
        shippingRates,
    };
  } catch (error) {
    logError(
  "GET_ERROR",
  error
);
    return {
      error:
        "INTERNAL_SERVER_ERROR",
    };
  }
}
