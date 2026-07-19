import { getProductById } from "@/lib/db/products";
import { getProductsByCategory } from "@/lib/db/products";
import { getReviewsByProductId } from "@/lib/db/reviews";

export async function getProductDetailService(
  productId: string
) {
  const product =
    await getProductById(
      productId,
      null
    );

  if (!product) {
    return {
      product: null,
      reviews: [],
      related: [],
    };
  }

  const [reviews, related] =
    await Promise.all([
      getReviewsByProductId(
        product.id
      ),

      getProductsByCategory(
        product.category_id,
        10
      ),
    ]);

  return {
    product,

    reviews,

    related:
      related.filter(
        (p) =>
          p.id !== product.id
      ),
  };
}
