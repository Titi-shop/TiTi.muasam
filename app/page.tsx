"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import {
  ShoppingCart,
  Flame,
  Star,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

import SplashScreen from "./components/SplashScreen";
import BannerCarousel from "./components/BannerCarousel";
import PiPriceWidget from "./components/PiPriceWidget";

import { useCart } from "@/app/context/CartContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { formatPi } from "@/lib/pi";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";

/* ================= FETCH ================= */

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("FETCH_FAILED");
  return res.json();
};

/* ================= HELPERS ================= */

const getMainImage = (p: Product) =>
  p.thumbnail?.trim() ? p.thumbnail : "/placeholder.png";

const getDiscount = (p: Product) =>
  p.sale_price && p.price > p.sale_price
    ? Math.round(((p.price - p.sale_price) / p.price) * 100)
    : 0;

/* ================= CARD ================= */

function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
}) {
  const router = useRouter();
  const discount = getDiscount(product);

  return (
    <div
      onClick={() => router.push(`/product/${product.id}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg"
    >
      <div className="relative">
        <Image
          src={getMainImage(product)}
          alt={product.name}
          width={400}
          height={400}
          className="h-40 w-full object-cover group-hover:scale-105 transition"
        />

        {discount > 0 && (
          <div className="absolute left-2 top-2 rounded bg-red-500 px-2 py-1 text-[10px] text-white font-bold">
            -{discount}%
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="absolute right-2 bottom-2 rounded-full bg-white p-2 shadow"
        >
          <ShoppingCart size={16} />
        </button>
      </div>

      <div className="p-3">
        <p className="text-xs font-medium line-clamp-2">
          {product.name}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-red-500 font-bold text-sm">
            {formatPi(product.final_price || product.price)} π
          </p>

          <span className="text-[10px] text-gray-500">
            {product.sold} sold
          </span>
        </div>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function HomePage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { t } = useTranslation();

  const [selectedCategory, setSelectedCategory] =
    useState<number | "all">("all");

  const { data: products = [] } = useSWR<Product[]>(
    "/api/products",
    fetcher
  );

  const { data: categories = [] } = useSWR<Category[]>(
    "/api/categories",
    fetcher
  );

  const filtered = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter(
      (p) => Number(p.category_id) === Number(selectedCategory)
    );
  }, [products, selectedCategory]);

  const flashSale = useMemo(
    () => products.filter((p) => p.sale_price).slice(0, 10),
    [products]
  );

  const handleAddToCart = (p: Product) => {
    addToCart({
      id: String(p.id),
      product_id: p.id,
      name: p.name,
      price: p.price,
      sale_price: p.final_price || p.sale_price,
      quantity: 1,
      thumbnail: p.thumbnail,
    });
  };

  return (
    <main className="bg-gray-50 min-h-screen pb-20">

      {/* HERO */}
      <section className="bg-black text-white p-5">
        <BannerCarousel />
        <PiPriceWidget />

        <h1 className="text-xl font-bold mt-4">
          {t.home_title}
        </h1>

        <button
          onClick={() => router.push("/categories")}
          className="mt-3 flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg"
        >
          {t.explore}
          <ChevronRight size={16} />
        </button>
      </section>

      {/* CATEGORY */}
      <section className="p-4">
        <h2 className="font-bold text-lg mb-3">
          {t.categories}
        </h2>

        <div className="flex gap-3 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory("all")}
            className="px-3 py-2 bg-white rounded-full shadow"
          >
            {t.all}
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(Number(c.id))}
              className="px-3 py-2 bg-white rounded-full shadow"
            >
              {t[c.key] || c.key}
            </button>
          ))}
        </div>
      </section>

      {/* FLASH SALE */}
      <section className="p-4">
        <div className="flex justify-between mb-3">
          <h2 className="font-bold flex items-center gap-2">
            <Flame size={16} />
            {t.flash_sale}
          </h2>

          <button onClick={() => router.push("/flash-sale")}>
            {t.view_all}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {flashSale.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </section>

      {/* PRODUCTS (AMAZON STYLE) */}
      <section className="p-4">
        <h2 className="font-bold text-lg mb-3">
          {t.products}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </section>

    </main>
  );
}
