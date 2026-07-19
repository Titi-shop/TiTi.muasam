import {
  getProductService,
} from "@/lib/services/products/by-id/get";

import {
  getProductsByCategory,
} from "@/lib/db/products";

import {
  getReviewsByProduct,
} from "@/lib/db/reviews";

export async function getProductDetailService(
  productId: string,
  userId: string | null
) {
  /* ================= PRODUCT ================= */

  const product =
    await getProductService(
      productId,
      userId
    );

  if (
    !product ||
    "error" in product
  ) {
    return {
      product: null,
      reviews: [],
      related: [],
    };
  }

  /* ================= LOAD EXTRA ================= */

  const [
    reviews,
    related,
  ] = await Promise.all([
    getReviewsByProduct(
      product.id
    ),

    getProductsByCategory(
      product.category_id,
      10
    ),
  ]);

  /* ================= RESPONSE ================= */

  return {
    product,

    reviews,

    related:
      related
        .filter(
          (p) =>
            p.id !== product.id
        )
        .slice(0, 10),
  };
}
