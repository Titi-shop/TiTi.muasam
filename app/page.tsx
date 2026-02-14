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

  const discount =
    product.price > 0
      ? Math.round(
          ((product.price - (product.finalPrice ?? product.price)) /
            product.price) *
            100
        )
      : 0;

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

        {product.isSale && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            -{discount}%
          </div>
        )}

        const [added, setAdded] = useState(false);

<button
  onClick={(e) => {
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 800);
  }}
  className={`absolute top-2 right-2 p-2 rounded-full shadow transition-all duration-200
    ${added ? "bg-green-500 text-white scale-110" : "bg-white"}
  `}
>
  <ShoppingCart size={16} />
</button>
      </div>

      <div className="p-3">
        <p className="text-sm line-clamp-2 min-h-[40px]">
          {product.name}
        </p>

        <p className="text-orange-500 font-bold mt-1 text-[15px]">
          {formatPi(product.finalPrice ?? product.price)} π
        </p>

        {product.isSale && (
          <p className="text-xs text-gray-400 line-through">
            {formatPi(product.price)} π
          </p>
        )}

        <div className="mt-2 bg-pink-100 text-pink-600 text-xs text-center rounded-full py-1">
          Đã bán {product.sold ?? 0}
        </div>
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
  const [sortType, setSortType] = useState("sale");
  const [loading, setLoading] = useState(true);

  /* ===== COUNTDOWN ===== */
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const target = new Date();
    target.setHours(target.getHours() + 2);

    const interval = setInterval(() => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) return setTimeLeft("00:00:00");

      const h = Math.floor(diff / 1000 / 60 / 60);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${String(h).padStart(2, "0")}:${String(m).padStart(
          2,
          "0"
        )}:${String(s).padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ===== LOAD DATA ===== */

  useEffect(() => {
    Promise.all([
      fetch("/api/products", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/categories", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([productData, categoryData]) => {
        const normalized: Product[] = productData.map(
          (p: Product) => ({
            ...p,
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

  /* ===== FILTER ===== */

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter(
        (p) => p.categoryId === selectedCategory
      );
    }

    if (sortType === "sold") {
      return list.sort(
        (a, b) => (b.sold ?? 0) - (a.sold ?? 0)
      );
    }

    return list;
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
      <BannerCarousel />

      {/* PI PRICE */}
      <div className="my-4 flex justify-center">
        <PiPriceWidget />
      </div>

      {/* SORT MENU */}
      <div className="flex gap-3 overflow-x-auto px-3 py-3 bg-white text-sm">
        {[
          { key: "sold", label: "Bán chạy" },
          { key: "sale", label: "Flash Sale" },
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

      <div className="px-3 space-y-6 mt-4 w-full">

        {/* FLASH SALE */}
        <section className="bg-white p-4 rounded-xl">
          <div className="flex justify-between mb-3">
            <h2 className="font-bold text-red-600">
              🔥 Flash Sale
            </h2>
            <span className="text-sm font-mono bg-black text-white px-3 py-1 rounded">
              {timeLeft}
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto snap-x">
            {products
              .filter((p) => p.isSale)
              .slice(0, 6)
              .map((p) => (
                <div key={p.id} className="min-w-[170px] snap-start">
                  <ProductCard
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
                </div>
              ))}
          </div>
        </section>

        {/* CATEGORY SCROLL *}
        <section className="bg-white py-4 shadow-sm -mx-3 px-3">
          <div className="flex gap-4 overflow-x-auto snap-x">

            {/* ALL */}
            <button
              onClick={() => setSelectedCategory("all")}
              className="flex flex-col items-center min-w-[72px] snap-start active:scale-95"
            >
              <div className="w-[60px] h-[60px] rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-2xl">🛍</span>
              </div>
              <span className="text-xs mt-1 text-center">
                {t.all ?? "All"}
              </span>
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className="flex flex-col items-center min-w-[72px] snap-start active:scale-95"
              >
                <Image
                  src={c.icon || "/placeholder.png"}
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
        </section>

        {/* PRODUCT GRID */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
