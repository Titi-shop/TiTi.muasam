"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BannerCarousel from "./components/BannerCarousel";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* ================= TYPES ================= */

interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[];
  views?: number;
  sold?: number;
  finalPrice?: number;
  isSale?: boolean;
  categoryId?: string | null;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

/* ================= PAGE ================= */

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<string | "all">("all");
  const [sortType, setSortType] = useState<string>("sale");
  const [loading, setLoading] = useState(true);

  /* ===== FORMAT PI ===== */
  function formatPi(value: number | string) {
    return Number(value).toFixed(6);
  }

  /* ===== LOAD DATA ===== */
  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([productData, categoryData]) => {
        const normalized: Product[] = productData.map(
          (p: Product) => ({
            ...p,
            views: p.views ?? 0,
            sold: p.sold ?? 0,
            finalPrice: p.finalPrice ?? p.price,
            isSale:
              typeof p.finalPrice === "number" &&
              p.finalPrice < p.price,
          })
        );

        setProducts(normalized);
        setCategories(categoryData);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ===== FILTER + SORT ===== */
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter(
        (p) => p.categoryId === selectedCategory
      );
    }

    switch (sortType) {
      case "sale":
        return list.filter((p) => p.isSale);
      case "new":
        return list.reverse();
      case "high":
        return list.sort(
          (a, b) =>
            (b.finalPrice ?? b.price) -
            (a.finalPrice ?? a.price)
        );
      case "low":
        return list.sort(
          (a, b) =>
            (a.finalPrice ?? a.price) -
            (b.finalPrice ?? b.price)
        );
      case "sold":
        return list.sort(
          (a, b) => (b.sold ?? 0) - (a.sold ?? 0)
        );
      default:
        return list;
    }
  }, [products, selectedCategory, sortType]);

  if (loading) {
    return (
      <p className="text-center mt-10">
        ⏳ {t.loading_products}
      </p>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* 1️⃣ Banner */}
      <BannerCarousel />

      {/* 2️⃣ MENU NGANG */}
      <div className="flex gap-3 overflow-x-auto px-3 py-3 bg-white text-sm">
        {[
          { key: "sold", label: "Bán chạy" },
          { key: "sale", label: "Đang giảm giá" },
          { key: "new", label: "Deal thịnh hành" },
          { key: "high", label: "Hot nhất" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setSortType(item.key)}
            className={`px-4 py-1 rounded-full whitespace-nowrap ${
              sortType === item.key
                ? "bg-orange-600 text-white"
                : "bg-gray-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="px-3 space-y-6 max-w-6xl mx-auto mt-4">
        {/* 3️⃣ FLASH SALE */}
        <section className="bg-white p-4 rounded-xl">
          <h2 className="font-bold mb-3">
            🔥 Flash Sale
          </h2>

          <div className="flex gap-3 overflow-x-auto">
            {products
              .filter((p) => p.isSale)
              .slice(0, 5)
              .map((p) => (
                <div
                  key={p.id}
                  className="min-w-[150px]"
                >
                  <Image
                    src={
                      p.images?.[0] ||
                      "/placeholder.png"
                    }
                    alt={p.name}
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />

                  <p className="text-sm line-clamp-1 mt-1">
                    {p.name}
                  </p>

                  <p className="text-orange-600 font-bold">
                    {formatPi(
                      p.finalPrice ?? p.price
                    )}{" "}
                    π
                  </p>

                  <p className="text-xs text-gray-400 line-through">
                    {formatPi(p.price)} π
                  </p>
                </div>
              ))}
          </div>
        </section>

        {/* 4️⃣ DANH MỤC */}
         <section className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-col gap-4">
          {[0, 1].map((row) => (
            <div
              key={row}
              className="flex gap-4 overflow-x-auto"
            >
              {categories
                .slice(row * 10, row * 10 + 10)
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={() =>
                      setSelectedCategory(c.id)
                    }
                    className="flex flex-col items-center min-w-[70px]"
                  >
                    <Image
                      src={
                        c.icon ||
                        "/placeholder.png"
                      }
                      alt={c.name}
                      width={60}
                      height={60}
                      className="rounded-full border"
                    />
                    <span className="text-xs mt-1 text-center">
                      {c.name}
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </section>

        {/* 5️⃣ SORT BAR */}
        <section className="flex justify-between text-sm">
          <span>
            {filteredProducts.length} sản phẩm
          </span>

          <select
            value={sortType}
            onChange={(e) =>
              setSortType(e.target.value)
            }
            className="border rounded px-2 py-1"
          >
            <option value="sale">
              Sản phẩm sale
            </option>
            <option value="new">
              Mới nhất
            </option>
            <option value="high">
              Giá cao → thấp
            </option>
            <option value="low">
              Giá thấp → cao
            </option>
            <option value="sold">
              Bán chạy
            </option>
          </select>
        </section>

        {/* 6️⃣ PRODUCT GRID */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() =>
                router.push(`/product/${p.id}`)
              }
              className="bg-white rounded-xl shadow-sm border cursor-pointer"
            >
              <Image
                src={
                  p.images?.[0] ||
                  "/placeholder.png"
                }
                alt={p.name}
                width={300}
                height={300}
                className="w-full h-40 object-cover rounded-t-xl"
              />

              <div className="p-2">
                <p className="text-sm line-clamp-2">
                  {p.name}
                </p>

                <p className="text-orange-600 font-bold mt-1">
                  {formatPi(
                    p.finalPrice ?? p.price
                  )}{" "}
                  π
                </p>

                {p.isSale && (
                  <p className="text-xs text-gray-400 line-through">
                    {formatPi(p.price)} π
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
