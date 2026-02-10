"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useCart } from "@/app/context/CartContext";
import Link from "next/link";
import CheckoutSheet from "./CheckoutSheet";

/* =======================
   HELPERS
======================= */

function formatDetail(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

function formatShortDescription(text?: string): string[] {
  if (!text) return [];
  return text
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/* =======================
   TYPES
======================= */

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  finalPrice?: number;
  description?: string;
  detail?: string;
  views?: number;
  sold?: number;
  images?: string[];
  detailImages?: string[];
  categoryId?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  finalPrice: number;
  isSale: boolean;
  description: string;
  detail: string;
  views: number;
  sold: number;
  images: string[];
  detailImages: string[];
  categoryId: string | null;
}

/* =======================
   PAGE
======================= */

export default function ProductDetailPage() {

  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const i18n = useTranslation();
const t =
  typeof i18n === "object" && i18n.t
    ? i18n.t
    : {};

  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openCheckout, setOpenCheckout] = useState(false);

  /* =======================
     LOAD DATA
  ======================= */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const raw: unknown = await res.json();
        if (!Array.isArray(raw)) return;

        const normalized: Product[] = raw.map((p) => {
          const api = p as ApiProduct;
          const finalPrice =
            typeof api.finalPrice === "number"
              ? api.finalPrice
              : api.price;

          return {
            id: api.id,
            name: api.name,
            price: api.price,
            finalPrice,
            isSale: finalPrice < api.price,
            description: api.description ?? "",
            detail: api.detail ?? "",
            views: api.views ?? 0,
            sold: api.sold ?? 0,
            images: Array.isArray(api.images) ? api.images : [],
            detailImages: Array.isArray(api.detailImages)
              ? api.detailImages
              : [],
            categoryId: api.categoryId ?? null,
          };
        });

        setAllProducts(normalized);
        const found = normalized.find((p) => p.id === id);
        if (found) setProduct(found);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  /* =======================
     STATES
  ======================= */

  if (loading) return <p className="p-4">{t.loading}</p>;
  if (!product) return <p className="p-4">{t.no_products}</p>;

  const images =
    product.images.length > 0
      ? product.images
      : ["/placeholder.png"];

  const relatedProducts = useMemo(() => {
    if (!product.categoryId) return [];
    return allProducts.filter(
      (p) =>
        p.id !== product.id &&
        p.categoryId === product.categoryId
    ).slice(0, 6);
  }, [allProducts, product]);

  /* =======================
     ACTIONS
  ======================= */

  const add = () => {
    addToCart({
      ...product,
      price: product.finalPrice,
      quantity: 1,
    });
    router.push("/cart");
  };

  const buy = () => {
    addToCart({
      ...product,
      price: product.finalPrice,
      quantity: 1,
    });
    setOpenCheckout(true);
  };

  /* =======================
     RENDER
  ======================= */

  return (
    <div className="pb-32 bg-gray-50 min-h-screen">
      {/* IMAGES */}
      <div className="relative mt-14 bg-white">
        <img
          src={images[currentIndex]}
          alt={product.name}
          className="w-full h-80 object-cover"
        />

        {product.isSale && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            SALE
          </span>
        )}
      </div>

      {/* PRICE & NAME */}
      <div className="bg-white p-4">
        <h1 className="text-lg font-medium mb-2">
          {product.name}
        </h1>

        <div className="flex items-end gap-2">
          <span className="text-xl font-bold text-orange-600">
            π {product.finalPrice}
          </span>

          {product.isSale && (
            <span className="text-sm text-gray-400 line-through">
              π {product.price}
            </span>
          )}
        </div>
      </div>

      {/* SHORT DESCRIPTION */}
      <div className="bg-white mt-2 p-4">
        <h3 className="text-sm font-semibold mb-2">
          {t.product_description ?? "Mô tả sản phẩm"}
        </h3>

        {product.description ? (
          <ul className="space-y-1 text-sm text-gray-700">
            {formatShortDescription(product.description).map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-orange-500">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">
            {t.no_description}
          </p>
        )}
      </div>

      {/* DETAIL */}
      <div className="bg-white mt-2 p-4">
        <h3 className="text-base font-semibold mb-3">
          Chi tiết sản phẩm
        </h3>

        <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {product.detail
            ? formatDetail(product.detail)
            : "📌 Đang cập nhật chi tiết sản phẩm"}
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="bg-white mt-2 p-4">
          <h3 className="text-base font-semibold mb-3">
            🔗 {t.related_products ?? "Sản phẩm liên quan"}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {relatedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="bg-gray-50 rounded-lg p-2"
              >
                <img
                  src={p.images[0] || "/placeholder.png"}
                  className="w-full h-32 object-cover rounded"
                />
                <p className="text-sm mt-1 line-clamp-2">
                  {p.name}
                </p>
                <p className="text-orange-600 font-semibold text-sm">
                  π {p.finalPrice}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ACTION BAR */}
      <div className="fixed bottom-16 left-0 right-0 bg-white p-3 shadow flex gap-2 z-50">
        <button
          onClick={add}
          className="flex-1 bg-yellow-500 text-white py-2 rounded-md"
        >
          {t.add_to_cart}
        </button>
        <button
          onClick={buy}
          className="flex-1 bg-red-500 text-white py-2 rounded-md"
        >
          {t.buy_now}
        </button>
      </div>

      {/* CHECKOUT */}
      <CheckoutSheet
        open={openCheckout}
        onClose={() => setOpenCheckout(false)}
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          finalPrice: product.finalPrice,
          images: product.images,
        }}
      />
    </div>
  );
}
