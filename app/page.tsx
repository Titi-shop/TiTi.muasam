"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";

type Category = {
  id: string;
  name: string;
  icon?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  finalPrice?: number;
  images?: string[];
  isSale?: boolean;
  sold?: number;
  categoryId?: string;
  saleEnd?: string; // ISO date
};

export default function HomePage() {
  const router = useRouter();

  /* =========================
     STATE
  ========================= */
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  /* =========================
     FORMAT PI 6 SỐ
  ========================= */
  const formatPi = (value: number): string => {
    return value.toFixed(6);
  };

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    const fetchData = async () => {
      const resCat = await fetch("/api/categories");
      const resProd = await fetch("/api/products");

      const catData = await resCat.json();
      const prodData = await resProd.json();

      setCategories(catData);
      setProducts(prodData);
    };

    fetchData();
  }, []);

  /* =========================
     FLASH SALE COUNTDOWN
  ========================= */
  useEffect(() => {
    const interval = setInterval(() => {
      const flash = products.find((p) => p.isSale && p.saleEnd);
      if (!flash?.saleEnd) return;

      const end = new Date(flash.saleEnd).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const hours = Math.floor(
        (distance / (1000 * 60 * 60)) % 24
      );
      const minutes = Math.floor(
        (distance / (1000 * 60)) % 60
      );
      const seconds = Math.floor(
        (distance / 1000) % 60
      );

      setTimeLeft(
        `${hours
          .toString()
          .padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [products]);

  /* =========================
     FILTER PRODUCT
  ========================= */
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(
      (p) => p.categoryId === selectedCategory
    );
  }, [products, selectedCategory]);

  /* =========================
     UI
  ========================= */
  return (
    <main className="p-4 space-y-6 bg-gray-100 min-h-screen">

      {/* =========================
         FLASH SALE
      ========================= */}
      <section className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-red-600">
            🔥 Flash Sale
          </h2>
          <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full">
            {timeLeft}
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {products
            .filter((p) => p.isSale)
            .map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                router={router}
                formatPi={formatPi}
              />
            ))}
        </div>
      </section>

      {/* =========================
         DANH MỤC 2 HÀNG NGANG
      ========================= */}
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

      {/* =========================
         PRODUCT GRID
      ========================= */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            router={router}
            formatPi={formatPi}
          />
        ))}
      </section>
    </main>
  );
}

/* =========================
   PRODUCT CARD COMPONENT
========================= */

function ProductCard({
  product,
  router,
  formatPi,
}: {
  product: Product;
  router: ReturnType<typeof useRouter>;
  formatPi: (v: number) => string;
}) {
  const discount =
    product.price > 0
      ? Math.round(
          ((product.price -
            (product.finalPrice ??
              product.price)) /
            product.price) *
            100
        )
      : 0;

  return (
    <div
      onClick={() =>
        router.push(`/product/${product.id}`)
      }
      className="bg-white rounded-xl shadow-sm border overflow-hidden cursor-pointer hover:shadow-md transition"
    >
      <div className="relative">
        <Image
          src={
            product.images?.[0] ||
            "/placeholder.png"
          }
          alt={product.name}
          width={300}
          height={300}
          className="w-full h-44 object-cover"
        />

        {product.isSale && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            {discount}% OFF
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow"
        >
          <ShoppingCart size={16} />
        </button>
      </div>

      <div className="p-3">
        <p className="text-sm line-clamp-2 min-h-[40px]">
          {product.name}
        </p>

        <p className="text-red-600 font-bold mt-1">
          {formatPi(
            product.finalPrice ??
              product.price
          )}{" "}
          π
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
