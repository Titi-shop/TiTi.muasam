"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

import {
  Search,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  Flame,
  Star,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { useCart } from "@/app/context/CartContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

import { formatPi } from "@/lib/pi";

import type { Product } from "@/types/product";
import type { Category } from "@/types/category";

/* =========================================================
   FETCHER
========================================================= */

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("FETCH_FAILED");
  }

  return res.json() as Promise<T>;
};

/* =========================================================
   HELPERS
========================================================= */

function getImage(src?: string | null) {
  if (!src) return "/placeholder.png";

  if (src.startsWith("http")) {
    return src;
  }

  return src;
}

/* =========================================================
   PAGE
========================================================= */

export default function HomePage() {
  const router = useRouter();

  const { addToCart } = useCart();

  const { t } = useTranslation();

  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  /* =========================================================
     DATA
  ========================================================= */

  const {
    data: productsData,
    isLoading: loadingProducts,
  } = useSWR<Product[]>(
    "/api/products",
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  const {
    data: categoriesData,
    isLoading: loadingCategories,
  } = useSWR<Category[]>(
    "/api/categories",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const products = useMemo(() => {
    return productsData || [];
  }, [productsData]);

  const categories = useMemo(() => {
    return categoriesData || [];
  }, [categoriesData]);

  const loading =
    loadingProducts || loadingCategories;

  /* =========================================================
     PRODUCTS
  ========================================================= */

  const trendingProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 8);
  }, [products]);

  const flashSaleProducts = useMemo(() => {
    return products
      .filter((p) => p.sale_price)
      .slice(0, 10);
  }, [products]);

  const newProducts = useMemo(() => {
    return [...products]
      .reverse()
      .slice(0, 6);
  }, [products]);

  /* =========================================================
     MESSAGE
  ========================================================= */

  const showMessage = (
    text: string,
    type: "success" | "error" = "error"
  ) => {
    setMessage({ text, type });

    setTimeout(() => {
      setMessage(null);
    }, 2500);
  };

  /* =========================================================
     CART
  ========================================================= */

  const handleAddToCart = (
    product: Product
  ) => {
    if (!product.is_active) {
      showMessage(
        t.product_unavailable ||
          "Product unavailable"
      );

      return;
    }

    if (
      product.stock <= 0 &&
      !product.is_unlimited
    ) {
      showMessage(
        t.out_of_stock ||
          "Out of stock"
      );

      return;
    }

    addToCart({
      id: String(product.id),
      product_id: product.id,
      name: product.name,
      price: product.price,
      sale_price: product.final_price,
      quantity: 1,
      thumbnail: product.thumbnail,
    });

    showMessage(
      t.added_to_cart ||
        "Added to cart",
      "success"
    );
  };

  /* =========================================================
     EFFECT
  ========================================================= */

  useEffect(() => {
    const prev =
      document.body.style.background;

    document.body.style.background =
      "#f5f7fb";

    return () => {
      document.body.style.background =
        prev;
    };
  }, []);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-56 rounded-[32px] bg-white" />

          <div className="grid grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-white"
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-[28px] bg-white"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f5f7fb] pb-28">
      {/* MESSAGE */}

      {message && (
        <div
          className={`fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-2xl ${
            message.type === "error"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-white/30 bg-white/80 backdrop-blur-2xl">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-12 flex-1 items-center gap-3 rounded-2xl bg-gray-100 px-4">
            <Search
              size={18}
              className="text-gray-400"
            />

            <input
              type="text"
              placeholder={
                t.search_products ||
                "Search products..."
              }
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
            <ShoppingCart size={18} />

            <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              2
            </span>
          </button>
        </div>
      </header>

      {/* HERO */}

      <section className="px-4 pt-5">
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-black via-zinc-900 to-orange-600 p-7 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/30 blur-3xl" />

          <div className="absolute bottom-0 right-0 opacity-20">
            <Sparkles size={180} />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold backdrop-blur-xl">
              <Flame size={14} />

              {t.trending_marketplace ||
                "Trending Marketplace"}
            </div>

            <h1 className="mt-5 max-w-xs text-4xl font-black leading-tight">
              {t.discover_products ||
                "Discover Future Commerce"}
            </h1>

            <p className="mt-4 max-w-sm text-sm text-white/80">
              {t.smart_shopping_discovery ||
                "Explore curated collections, flash deals and modern shopping experiences."}
            </p>

            <button
              onClick={() =>
                router.push("/categories")
              }
              className="mt-6 flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black"
            >
              {t.explore_now ||
                "Explore Now"}

              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* QUICK CATEGORIES */}

      <section className="mt-7 px-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">
              {t.categories ||
                "Categories"}
            </h2>

            <p className="text-sm text-gray-500">
              {t.shop_by_category ||
                "Shop by category"}
            </p>
          </div>

          <Link
            href="/categories"
            className="text-sm font-semibold text-gray-500"
          >
            {t.view_all ||
              "View all"}
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {categories
            .slice(0, 8)
            .map((category) => (
              <Link
                key={category.id}
                href={`/categories?id=${category.id}`}
              >
                <div className="rounded-[24px] bg-white p-3 shadow-sm transition-all duration-300 active:scale-95">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                    <Image
                      src={getImage(
                        category.icon
                      )}
                      alt={category.key}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-xl object-cover"
                    />
                  </div>

                  <p className="mt-2 line-clamp-2 text-center text-[11px] font-medium">
                    {t[
                      category.key
                    ] || category.key}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* FLASH SALE */}

      <section className="mt-8 px-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Flame
                size={18}
                className="text-red-500"
              />

              <h2 className="text-2xl font-black">
                {t.flash_sale ||
                  "Flash Sale"}
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {t.best_deals_today ||
                "Best deals today"}
            </p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {flashSaleProducts.map(
            (product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="min-w-[220px]"
              >
                <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
                  <div className="relative">
                    <Image
                      src={getImage(
                        product.thumbnail
                      )}
                      alt={product.name}
                      width={500}
                      height={500}
                      className="h-52 w-full object-cover"
                    />

                    <div className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                      SALE
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold">
                      {product.name}
                    </h3>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-lg font-black text-red-500">
                          {formatPi(
                            product.final_price
                          )}{" "}
                          π
                        </p>

                        <p className="text-xs text-gray-400 line-through">
                          {formatPi(
                            product.price
                          )}{" "}
                          π
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();

                          handleAddToCart(
                            product
                          );
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white"
                      >
                        <ShoppingCart
                          size={18}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      </section>

      {/* TRENDING */}

      <section className="mt-10 px-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">
              {t.trending_now ||
                "Trending Now"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {t.most_popular_products_today ||
                "Most popular today"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {trendingProducts.map(
            (product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
              >
                <div className="group overflow-hidden rounded-[30px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  <div className="relative overflow-hidden">
                    <Image
                      src={getImage(
                        product.thumbnail
                      )}
                      alt={product.name}
                      width={500}
                      height={500}
                      className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <button
                      onClick={(e) => {
                        e.preventDefault();

                        handleAddToCart(
                          product
                        );
                      }}
                      className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black shadow-xl"
                    >
                      <ShoppingCart
                        size={18}
                      />
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold">
                      {product.name}
                    </h3>

                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <Star
                        size={14}
                        className="fill-yellow-400 text-yellow-400"
                      />

                      {product.rating_avg ||
                        5}

                      <span>
                        •{" "}
                        {product.sold}{" "}
                        {t.sold ||
                          "sold"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="text-lg font-black text-red-500">
                        {formatPi(
                          product.final_price
                        )}{" "}
                        π
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      </section>

      {/* NEW ARRIVALS */}

      <section className="mt-10 px-4">
        <div className="mb-5">
          <h2 className="text-2xl font-black">
            {t.new_arrivals ||
              "New Arrivals"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {t.latest_products ||
              "Latest products"}
          </p>
        </div>

        <div className="space-y-4">
          {newProducts.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
            >
              <div className="flex items-center gap-4 rounded-[28px] bg-white p-3 shadow-sm">
                <Image
                  src={getImage(
                    product.thumbnail
                  )}
                  alt={product.name}
                  width={120}
                  height={120}
                  className="h-24 w-24 rounded-2xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-semibold">
                    {product.name}
                  </h3>

                  <p className="mt-2 text-lg font-black text-red-500">
                    {formatPi(
                      product.final_price
                    )}{" "}
                    π
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {product.sold}{" "}
                    {t.sold ||
                      "sold"}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();

                    handleAddToCart(
                      product
                    );
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white"
                >
                  <ShoppingCart
                    size={18}
                  />
                </button>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
