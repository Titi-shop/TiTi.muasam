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
  images?: string[];
  sold?: number;
  finalPrice?: number;
  isSale?: boolean;
  categoryId?: string | null;
  createdAt?: string;
}

interface Category {
  id: string;
  name: string;
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
        isSale:
          typeof p.finalPrice === "number" &&
          p.finalPrice < p.price,
      }));

      setProducts(normalized);
      setCategories(categoryData);
      setLoading(false);
    });
  }, []);

  /* =======================
     FILTERS
  ======================= */
  const filtered = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter(
      (p) => p.categoryId === selectedCategory
    );
  }, [products, selectedCategory]);

  const saleProducts = filtered.filter((p) => p.isSale);

  const newestProducts = [...filtered].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );

  /* =======================
     LOADING
  ======================= */
  if (loading) {
    return (
      <p className="text-center mt-10">
        ⏳ {t.loading_products}
      </p>
    );
  }

  /* =======================
     RENDER
  ======================= */
  return (
    <main className="bg-[#fafafa] min-h-screen pb-24">
      <BannerCarousel />

      <div className="space-y-8 mt-4">
        {/* ===================
            CATEGORIES
        =================== */}
        <section className="px-4">
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`min-w-[64px] text-xs ${
                selectedCategory === "all"
                  ? "font-bold text-orange-600"
                  : "text-gray-500"
              }`}
            >
              🛍 {t.all}
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`min-w-[64px] text-xs ${
                  selectedCategory === c.id
                    ? "font-bold text-orange-600"
                    : "text-gray-500"
                }`}
              >
                <Image
                  src={c.icon || "/placeholder.png"}
                  alt={c.name}
                  width={48}
                  height={48}
                  className="rounded-full mx-auto mb-1"
                />
                <span className="line-clamp-1">{c.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ===================
            SALE PRODUCTS
        =================== */}
        {saleProducts.length > 0 && (
          <section>
            <h2 className="px-4 mb-3 text-base font-bold text-red-500">
              🔥 Sale hôm nay
            </h2>

            <div className="flex gap-4 overflow-x-auto px-4">
              {saleProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() =>
                    router.push(`/product/${p.id}`)
                  }
                  className="min-w-[160px] cursor-pointer"
                >
                  <div className="relative">
                    <span className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] px-2 py-[2px] rounded-full">
                      SALE
                    </span>

                    <Image
                      src={p.images?.[0] || "/placeholder.png"}
                      alt={p.name}
                      width={300}
                      height={300}
                      className="rounded-xl aspect-square object-cover"
                    />
                  </div>

                  <p className="mt-2 text-sm line-clamp-2">
                    {p.name}
                  </p>

                  <div className="flex items-center gap-1">
                    <span className="text-red-500 font-bold">
                      {p.finalPrice} π
                    </span>
                    <span className="text-xs line-through text-gray-400">
                      {p.price} π
                    </span>
                  </div>

                  {p.sold ? (
                    <p className="text-xs text-gray-400">
                      Đã bán {p.sold}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================
            NEW → OLD PRODUCTS
        =================== */}
        <section className="px-4">
          <h2 className="mb-3 text-base font-semibold">
            🆕 Sản phẩm mới
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {newestProducts.map((p) => (
              <div
                key={p.id}
                onClick={() =>
                  router.push(`/product/${p.id}`)
                }
                className="cursor-pointer"
              >
                <Image
                  src={p.images?.[0] || "/placeholder.png"}
                  alt={p.name}
                  width={300}
                  height={300}
                  className="rounded-xl aspect-square object-cover"
                />

                <p className="mt-2 text-sm line-clamp-2">
                  {p.name}
                </p>

                <div className="flex items-center gap-1">
                  <span className="font-bold text-orange-600">
                    {p.finalPrice} π
                  </span>

                  {p.isSale && (
                    <span className="text-xs line-through text-gray-400">
                      {p.price} π
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
