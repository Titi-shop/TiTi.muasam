"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import BannerCarousel from "./components/BannerCarousel";
import PiPriceWidget from "./components/PiPriceWidget";
import { useCart } from "@/app/context/CartContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* ================= TYPES ================= */

interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[];
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

/* ================= FORMAT ================= */

function formatPi(value: number | string) {
  return Number(value).toFixed(6);
}

/* ================= PRODUCT CARD ================= */

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (product: Product) => void;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/product/${product.id}`)}
      className="bg-white rounded-xl border shadow-sm overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
    >
      <div className="relative">
        <Image
          src={product.images?.[0] || "/placeholder.png"}
          alt={product.name}
          width={300}
          height={300}
          className="w-full h-44 object-cover"
        />

        {/* ICON GIỎ HÀNG – BẤM LÀ THÊM */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow active:scale-95"
          aria-label="Add to cart"
        >
          <ShoppingCart size={16} />
        </button>
      </div>

      <div className="p-3">
        <p className="text-sm line-clamp-2 min-h-[40px]">
          {product.name}
        </p>

        {/* GIÁ PI */}
        <p className="text-orange-500 font-bold mt-1">
          {formatPi(product.finalPrice ?? product.price)} π
        </p>

        {product.isSale && (
          <p className="text-xs text-gray-400 line-through">
            {formatPi(product.price)} π
          </p>
        )}
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function HomePage() {
  const { addToCart } = useCart();
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<string | "all">("all");
  const [loading, setLoading] = useState(true);

  /* ===== LOAD DATA ===== */

  useEffect(() => {
    Promise.all([
      fetch("/api/products", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([productData, categoryData]) => {
        setProducts(
          productData.map((p: Product) => ({
            ...p,
            sold: p.sold ?? 0,
            finalPrice: p.finalPrice ?? p.price,
            isSale:
              typeof p.finalPrice === "number" &&
              p.finalPrice < p.price,
          }))
        );
        setCategories(categoryData);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ===== FILTER ===== */

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter(
      (p) => p.categoryId === selectedCategory
    );
  }, [products, selectedCategory]);

  if (loading) {
    return (
      <p className="text-center mt-10">
        ⏳ {t.loading_products}
      </p>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      <BannerCarousel />

      {/* GIÁ PI – HIỂN THỊ CHÍNH GIỮA */}
      <div className="my-4 flex justify-center">
        <PiPriceWidget />
      </div>

      <div className="px-3 space-y-6 mt-4">

        {/* CATEGORY */}
        <section className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex gap-4 overflow-x-auto">

            {/* ALL */}
            <button
              onClick={() => setSelectedCategory("all")}
              className="flex flex-col items-center min-w-[70px]"
            >
              <div className="w-[60px] h-[60px] rounded-full bg-orange-100 flex items-center justify-center">
                🛍
              </div>
              <span className="text-xs mt-1">
                {t.all ?? "All"}
              </span>
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className="flex flex-col items-center min-w-[70px]"
              >
                <Image
                  src={c.icon || "/placeholder.png"}
                  alt={c.name}
                  width={60}
                  height={60}
                  className="rounded-full border"
                />
                <span className="text-xs mt-1">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* PRODUCT GRID */}
        <section className="grid grid-cols-2 gap-3">
          {filteredProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={(product) =>
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  sale_price: product.finalPrice,
                  quantity: 1,
                  image: product.images?.[0],
                  images: product.images,
                })
              }
            />
          ))}
        </section>
      </div>
    </main>
  );
}
