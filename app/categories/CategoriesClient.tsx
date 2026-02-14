"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* ================= TYPES ================= */

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
  sold?: number;
};

/* ================= FORMAT PI ================= */

function formatPi(value: number | string) {
  return Number(value).toFixed(6);
}

/* ================= CLIENT PAGE ================= */

export default function CategoriesClient() {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategoryId, setActiveCategoryId] =
    useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    Promise.all([
      fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/products", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([cateData, prodData]: [Category[], Product[]]) => {
        setCategories(
          [...cateData].sort((a, b) => Number(a.id) - Number(b.id))
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

  /* ================= FILTER ================= */

  const visibleProducts = useMemo(() => {
    if (activeCategoryId === null) return products;
    return products.filter(
      (p) => String(p.categoryId) === String(activeCategoryId)
    );
  }, [products, activeCategoryId]);

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* BANNER */}
      <div className="mt-3">
        <Image
          src="/banners/30FD1BCC-E31C-4702-9E63-8BF08C5E311C.png"
          alt="Banner"
          width={1200}
          height={400}
          className="w-full h-[160px] object-cover"
          priority
        />
      </div>

      <div className="mt-2 grid grid-cols-[70px_1fr] gap-0">
        {/* ===== LEFT CATEGORY ===== */}
        <aside className="bg-white border-r">
  <div className="flex flex-col">
    {/* ALL */}
    <button
      onClick={() => setActiveCategoryId(null)}
      className={`flex items-center gap-2 px-2 py-3 text-sm ${
        activeCategoryId === null
          ? "bg-orange-50 text-orange-600 font-semibold"
          : "text-gray-600"
      }`}
    >
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-lg">🛍</span>
      </div>
      <span className="truncate">
        {t["all"] ?? "Tất cả"}
      </span>
    </button>

    {categories.map((c) => {
      const active =
        String(activeCategoryId) === String(c.id);

      return (
        <button
          key={c.id}
          onClick={() => setActiveCategoryId(c.id)}
          className={`flex items-center gap-3 px-3 py-3 text-sm ${
            active
              ? "bg-orange-50 text-orange-600 font-semibold"
              : "text-gray-600"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              active ? "bg-orange-100" : "bg-gray-100"
            }`}
          >
            <img
              src={c.icon || "/placeholder.png"}
              alt={t[`category_${c.id}`] || c.name}
              className="w-5 h-5 object-contain"
            />
          </div>

          {/* ✅ TÊN DANH MỤC – hiển thị đúng, không ép nhỏ */}
          <span className="truncate">
            {t[`category_${c.id}`] || c.name}
          </span>
        </button>
      );
    })}
  </div>
</aside>

        {/* ===== RIGHT PRODUCTS ===== */}
        <section className="bg-gray-100 p-1">
          {loading ? (
            <p className="text-sm text-gray-400">
              {t["loading_products"] || "Đang tải..."}
            </p>
          ) : visibleProducts.length === 0 ? (
            <p className="text-sm text-gray-400">
              {t["no_products"] ?? "Chưa có sản phẩm"}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-[6px]">
              {visibleProducts.map((p) => {
                const isSale =
                  typeof p.finalPrice === "number" &&
                  p.finalPrice < p.price;

                const discount =
                  isSale && p.finalPrice
                    ? Math.round(
                        ((p.price - p.finalPrice) / p.price) * 100
                      )
                    : 0;

                return (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                  >
                    <div className="bg-white rounded-xl overflow-hidden border">
                      <div className="relative">
                        <Image
                          src={p.images?.[0] || "/placeholder.png"}
                          alt={p.name}
                          width={300}
                          height={300}
                          className="w-full h-44 object-cover"
                        />

                        {isSale && (
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                            -{discount}%
                          </div>
                        )}

                        <button
  type="button"
  onClick={(e) => {
    e.preventDefault(); // không nhảy Link
    e.stopPropagation();

    addToCart({
      id: String(p.id),
      name: p.name,
      price: p.price,
      sale_price: p.finalPrice,
      quantity: 1,
      image: p.images?.[0],
      images: p.images,
    });
  }}
  className="absolute top-2 right-2 bg-white p-2 rounded-full shadow active:scale-95"
  aria-label="Add to cart"
>
  <ShoppingCart size={16} />
</button>
                      </div>

                      <div className="p-3">
                        <p className="text-sm line-clamp-2 min-h-[40px]">
                          {p.name}
                        </p>

                        <p className="text-red-600 font-bold mt-1">
                          {formatPi(
                            isSale ? p.finalPrice! : p.price
                          )}{" "}
                          π
                        </p>

                        {isSale && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatPi(p.price)} π
                          </p>
                        )}
                      </div>
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
