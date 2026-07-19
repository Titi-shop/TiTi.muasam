import { getAllProducts } from "@/lib/db/products";

export async function getHomeService() {
  const products =
    await getAllProducts(20);

  const trending =
    [...products]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 8);

  const flashSale =
    products
      .filter((p) => p.sale_price)
      .slice(0, 10);

  return {
    products,
    trending,
    flashSale,
  };
}
