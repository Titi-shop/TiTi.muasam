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
} from "lucide-react";

import BannerCarousel from "./components/BannerCarousel";
import PiPriceWidget from "./components/PiPriceWidget";
import SplashScreen from "./components/SplashScreen";

import { useCart } from "@/app/context/CartContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { formatPi } from "@/lib/pi";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";

/* ================= FETCHER ================= */

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json());

/* ================= HELPERS ================= */

const getImage = (p: Product) =>
  p.thumbnail || "/placeholder.png";

/* discount */
const getDiscount = (p: Product) => {
  if (!p.sale_price || p.price <= p.sale_price) return 0;
  return Math.round(((p.price - p.sale_price) / p.price) * 100);
};

/* ================= PRODUCT CARD ================= */

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
      className="rounded-2xl bg-white shadow-sm overflow-hidden hover:shadow-lg transition"
    >
      <div className="relative">
        <Image
          src={getImage(product)}
          alt={product.name}
          width={400}
          height={400}
          className="h-44 w-full object-cover"
        />

        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow"
        >
          <ShoppingCart size={16} />
        </button>
      </div>

      <div className="p-3">
        <p className="text-sm line-clamp-2 min-h-[40px]">
          {product.name}
        </p>

        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          {product.rating_avg || 5}
          <span>• {product.sold} sold</span>
        </div>

        <div className="mt-2">
          <p className="font-bold text-red-500">
            {formatPi(product.sale_price || product.price)} π
          </p>

          {product.sale_price && (
            <p className="text-xs line-through text-gray-400">
              {formatPi(product.price)} π
            </p>
          )}
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

  const [timeLeft, setTimeLeft] = useState("--:--:--");

  /* ================= DATA ================= */

  const { data: products = [] } = useSWR<Product[]>(
    "/api/products",
    fetcher
  );

  const { data: categories = [] } = useSWR<Category[]>(
    "/api/categories",
    fetcher
  );

  /* ================= FLASH SALE TIMER (GLOBAL) ================= */

  useEffect(() => {
    // 👉 backend-ready: nên thay bằng `sale_end_time` từ DB
    const end = Date.now() + 2 * 60 * 60 * 1000;

    const timer = setInterval(() => {
      const diff = end - Date.now();

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ================= FILTER ================= */

  const trending = useMemo(() => {
    return [...products]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6);
  }, [products]);

  const flashSale = useMemo(() => {
    return products.filter((p) => p.sale_price).slice(0, 8);
  }, [products]);

  /* ================= LOADING ================= */

  if (!products.length) return <SplashScreen />;

  /* ================= UI ================= */

  return (
    <main className="pb-20 bg-gray-50">

      {/* HERO */}
      <section className="bg-gradient-to-r from-black to-orange-600 text-white p-4">
        <BannerCarousel />

        <div className="mt-3 flex justify-center">
          <PiPriceWidget />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="p-4">
        <h2 className="font-bold text-lg mb-2">Categories</h2>

        <div className="flex gap-3 overflow-x-auto">
          {categories.map((c) => (
            <button key={c.id} className="px-4 py-2 bg-white rounded-full shadow text-sm">
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* TRENDING */}
      <section className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} />
          <h2 className="font-bold">Trending</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
          ))}
        </div>
      </section>

      {/* FLASH SALE (CLEAN) */}
      <section className="p-4">
        <div className="flex justify-between items-center bg-red-500 text-white p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <Flame size={16} />
            Flash Sale
          </div>

          <div className="font-mono font-bold">{timeLeft}</div>
        </div>

        <div className="flex gap-3 overflow-x-auto mt-3">
          {flashSale.map((p) => (
            <div key={p.id} className="min-w-[160px]">
              <ProductCard product={p} onAddToCart={addToCart} />
            </div>
          ))}
        </div>
      </section>

      {/* GRID */}
      <section className="p-4">
        <h2 className="font-bold mb-3">All Products</h2>

        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
          ))}
        </div>
      </section>
    </main>
  );
}
