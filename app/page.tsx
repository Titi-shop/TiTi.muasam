"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BannerCarousel from "./components/BannerCarousel";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =======================
   TYPES
======================= */

interface Product {
  id: string;
  name: string;
  price: number;
  finalPrice?: number;
  images?: string[];
  sold?: number;
  categoryId?: string | null;
  createdAt?: string;
}

interface Category {
  id: string;
  icon?: string;
}

/* =======================
   PAGE
======================= */

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<string | "all">("all");
  const [loading, setLoading] = useState(true);

  /* =======================
     LOAD DATA
  ======================= */
  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([productData, categoryData]: [Product[], Category[]]) => {
      const normalized = productData.map((p) => ({
        ...p,
        sold: p.sold ?? 0,
        finalPrice: p.finalPrice ?? p.price,
      }));

      setProducts(normalized);
      setCategories(categoryData);
      setLoading(false);
    });
  }, []);

  /* =======================
     FILTER
  ======================= */
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter(
      (p) => p.categoryId === selectedCategory
    );
  }, [products, selectedCategory]);

  const saleProducts = filteredProducts.filter(
    (p) => p.finalPrice! < p.price
  );

  const newestProducts = [...filteredProducts].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );

  /* =======================
     LOADING
  ======================= */
  if (loading) {
    return (
      <p className="text-center mt-10 text-sm">
        ⏳ {t.loading_products}
      </p>
    );
  }

  /* =======================
     RENDER
  ======================= */
  return (
    <main className="bg-white min-h-screen pb-24">
      <BannerCarousel />

      {/* ===================
          CATEGORIES
      =================== */}
      <section className="px-3 mt-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`min-w-[56px] text-xs ${
              selectedCategory === "all"
                ? "text-red-500 font-semibold"
                : "text-gray-500"
            }`}
          >
            {t.all}
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`min-w-[56px] text-xs ${
                selectedCategory === c.id
                  ? "text-red-500 font-semibold"
                  : "text-gray-500"
              }`}
            >
              <Image
                src={c.icon || "/placeholder.png"}
                alt={t(`category_${c.id}`)}
                width={48}
                height={48}
                className="rounded-full mx-auto mb-1"
              />
              <span className="line-clamp-1">
                {t(`category_${c.id}`)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ===================
          SALE PRODUCTS
      =================== */}
      {saleProducts.length > 0 && (
        <section className="mt-6">
          <h2 className="px-3 mb-2 text-sm font-semibold text-red-500">
            🔥 {t.sale_today}
          </h2>

          <div className="flex gap-3 overflow-x-auto px-3">
            {saleProducts.map((p) => (
              <div
                key={p.id}
                onClick={() =>
                  router.push(`/product/${p.id}`)
                }
                className="min-w-[150px] cursor-pointer"
              >
                <div className="relative">
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded">
                    SALE
                  </span>

                  <Image
                    src={p.images?.[0] || "/placeholder.png"}
                    alt={p.name}
                    width={300}
                    height={300}
                    className="rounded-lg aspect-square object-cover"
                  />
                </div>

                <p className="mt-1 text-sm line-clamp-2">
                  {p.name}
                </p>

                <div className="flex items-center gap-1">
                  <span className="text-red-500 font-semibold">
                    {p.finalPrice} π
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    {p.price} π
                  </span>
                </div>

                {p.sold ? (
                  <p className="text-[11px] text-gray-400">
                    {t.sold} {p.sold}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================
          PRODUCTS (NEW → OLD)
      =================== */}
      <section className="px-3 mt-6">
        <h2 className="mb-2 text-sm font-semibold">
          🆕 {t.new_products}
        </h2>

        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          {newestProducts.map((p) => (
            <div
              key={p.id}
              onClick={() =>
                router.push(`/product/${p.id}`)
              }
              className="cursor-pointer"
            >
              <div className="relative">
                {p.finalPrice! < p.price && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded">
                    SALE
                  </span>
                )}

                <Image
                  src={p.images?.[0] || "/placeholder.png"}
                  alt={p.name}
                  width={300}
                  height={300}
                  className="rounded-lg aspect-square object-cover"
                />
              </div>

              <p className="mt-1 text-sm line-clamp-2">
                {p.name}
              </p>

              <div className="flex items-center gap-1">
                <span className="text-red-500 font-semibold">
                  {p.finalPrice} π
                </span>

                {p.finalPrice! < p.price && (
                  <span className="text-xs text-gray-400 line-through">
                    {p.price} π
                  </span>
                )}
              </div>

              {p.sold ? (
                <p className="text-[11px] text-gray-400">
                  {t.sold} {p.sold}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
