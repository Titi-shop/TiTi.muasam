"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES
========================= */
type Category = {
  id: number | string;
  name: string;
  icon?: string | null;
};

type Product = {
  id: number | string;
  name: string;
  price: number;
  finalPrice?: number;
  images?: string[];
  categoryId: number | string;
  createdAt?: string;
};

/* =========================
   PAGE
========================= */
export default function CategoriesPage() {
  const i18n = useTranslation();
const t =
  typeof i18n === "function"
    ? i18n
    : i18n?.t;

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<
    number | string | null
  >(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    Promise.all([
      fetch("/api/categories", { cache: "no-store" }).then((r) =>
        r.json()
      ),
      fetch("/api/products", { cache: "no-store" }).then((r) =>
        r.json()
      ),
    ])
      .then(([cateData, prodData]: [Category[], Product[]]) => {
        setCategories(
          [...cateData].sort(
            (a, b) => Number(a.id) - Number(b.id)
          )
        );

        setProducts(
          [...prodData].sort((a, b) => {
            const at = a.createdAt ?? "";
            const bt = b.createdAt ?? "";
            return bt.localeCompare(at);
          })
        );
      })
      .finally(() => setLoading(false));
  }, []);

  /* =========================
     FILTER PRODUCTS
  ========================= */
  const visibleProducts = useMemo(() => {
    if (activeCategoryId === null) return products;
    return products.filter(
      (p) =>
        String(p.categoryId) ===
        String(activeCategoryId)
    );
  }, [products, activeCategoryId]);

  return (
    <main className="bg-white min-h-screen pb-24">
      {/* =========================
          BANNER
      ========================= */}
      <div className="px-3 mt-4">
        <img
          src="/banners/30FD1BCC-E31C-4702-9E63-8BF08C5E311C.png"
          alt="Banner"
          className="w-full h-[160px] rounded-2xl object-cover"
        />
      </div>

      {/* =========================
          CONTENT
      ========================= */}
      <div className="mt-4 grid grid-cols-12 gap-2 px-2">
        {/* ===== LEFT: CATEGORIES ===== */}
        <aside className="col-span-2 overflow-y-auto">
          <div className="flex flex-col items-center gap-4 py-2">
            {/* ALL */}
            <button
              onClick={() => setActiveCategoryId(null)}
              className={`text-xs ${
                activeCategoryId === null
                  ? "text-red-500 font-semibold"
                  : "text-gray-500"
              }`}
            >
              🛍 {t("all")}
            </button>

            {categories.map((c) => {
              const active =
                String(activeCategoryId) ===
                String(c.id);

              return (
                <button
                  key={c.id}
                  onClick={() =>
                    setActiveCategoryId(c.id)
                  }
                  className={`flex flex-col items-center gap-1 ${
                    active
                      ? "text-red-500 font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <img
                      src={
                        c.icon || "/placeholder.png"
                      }
                      alt={t(
                        `category_${c.id}`
                      )}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-center line-clamp-2">
                    {t(`category_${c.id}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ===== RIGHT: PRODUCTS ===== */}
        <section className="col-span-10 px-2">
          {loading ? (
            <p className="text-sm text-gray-400">
              {t("loading_products")}
            </p>
          ) : visibleProducts.length === 0 ? (
            <p className="text-sm text-gray-400">
              {t("no_product")}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-4">
              {visibleProducts.map((p) => {
                const isSale =
                  typeof p.finalPrice ===
                    "number" &&
                  p.finalPrice < p.price;

                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    className="cursor-pointer"
                  >
                    <div className="relative">
                      {isSale && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-[1px] rounded">
                          SALE
                        </span>
                      )}

                      <img
                        src={
                          p.images?.[0] ||
                          "/placeholder.png"
                        }
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                    </div>

                    <p className="mt-1 text-sm line-clamp-2">
                      {p.name}
                    </p>

                    <div className="flex items-center gap-1">
                      <span className="text-red-500 font-semibold">
                        {(isSale
                          ? p.finalPrice
                          : p.price
                        )?.toLocaleString()}{" "}
                        π
                      </span>

                      {isSale && (
                        <span className="text-xs text-gray-400 line-through">
                          {p.price.toLocaleString()}{" "}
                          π
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
