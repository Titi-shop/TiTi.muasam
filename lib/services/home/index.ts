import {
  getAllProducts,
} from "@/lib/db/products";

import {
  getAllCategories,
} from "@/lib/db/categories";

export async function getHomeService() {
  const [
    products,
    categories,
  ] = await Promise.all([
    getAllProducts(20),
    getAllCategories(),
  ]);

  const trending =
    [...products]
      .sort(
        (a, b) =>
          (b.sold ?? 0) -
          (a.sold ?? 0)
      )
      .slice(0, 8);

  const flashSale =
    products
      .filter(
        (p) => p.sale_price
      )
      .slice(0, 10);

  return {
    products,
    categories,
    trending,
    flashSale,
  };
}
