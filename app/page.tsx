"use client";
export const dynamic = "force-dynamic";
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
  const [visibleCount, setVisibleCount] = useState(20);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  /* =======================
     LOAD CATEGORIES
  ======================= */
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data))
      .finally(() => setLoadingCategories(false));
  }, []);

  /* =======================
     LOAD PRODUCTS
  ======================= */
  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        const normalized = data.map((p) => ({
          ...p,
          sold: p.sold ?? 0,
          finalPrice:
            typeof p.finalPrice === "number"
              ? p.finalPrice
              : p.price,
        }));
        setProducts(normalized);
      })
      .finally(() => setLoadingProducts(false));
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
    (p) =>
      typeof p.finalPrice === "number" &&
      typeof p.price === "number" &&
      p.finalPrice < p.price
  );

  const newestProducts = [...filteredProducts]
    .sort((a, b) => {
      const aTime = a.createdAt ?? "";
      const bTime = b.createdAt ?? "";
      return bTime.localeCompare(aTime);
    })
    .slice(0, visibleCount);

  /* =======================
     LOADING
  ======================= */
  if (loadingProducts) {
    return (
      <p className="text-center mt-10 text-sm">
        ⏳ {t("loading_products")}
      </p>
    );
  }

  /* =======================
     RENDER
  ======================= */
  return (
    <main className="bg-white min-h-screen pb-24">
      <BannerCarousel />

      <div className="px-3 space-y-6 max-w-6xl mx-auto">
        {/* ===================
            CATEGORIES
        =================== */}
        <section>
          <h2 className="text-sm font-semibold mb-2">
            {t("featured_categories")}
          </h2>

          {loadingCategories ? (
            <p className="text-xs">
              {t("loading_categories")}
            </p>
          ) : (
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`min-w-[56px] text-xs ${
                  selectedCategory === "all"
                    ? "text-red-500 font-semibold"
                    : "text-gray-500"
                }`}
              >
                {t("all")}
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
          )}
        </section>

        {/* ===================
            SALE PRODUCTS
        =================== */}
        {saleProducts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-red-500 mb-2">
              🔥 {t("sale_today")}
            </h2>

            <div className="flex gap-3 overflow-x-auto no-scrollbar">
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
                      {t("sold")} {p.sold}
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
        <section>
          <h2 className="text-sm font-semibold mb-2">
            🆕 {t("new_products")}
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
                  {typeof p.finalPrice === "number" &&
                    p.finalPrice < p.price && (
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

                  {typeof p.finalPrice === "number" &&
                    p.finalPrice < p.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {p.price} π
                      </span>
                    )}
                </div>

                {p.sold ? (
                  <p className="text-[11px] text-gray-400">
                    {t("sold")} {p.sold}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {visibleCount < filteredProducts.length && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() =>
                  setVisibleCount((v) => v + 20)
                }
                className="px-6 py-2 bg-red-500 text-white rounded-full text-sm"
              >
                {t("load_more")}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
