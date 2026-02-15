"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useCart } from "@/app/context/CartContext";
import CheckoutSheet from "./CheckoutSheet";

function formatPi(v: number) {
  return v.toFixed(6);
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openCheckout, setOpenCheckout] = useState(false);

  /* ================= LOAD PRODUCT ================= */
  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      const res = await fetch(`/api/products?id=${id}`, { cache: "no-store" });
      const data = await res.json();

      if (Array.isArray(data) && data[0]) {
        setProduct(data[0]);
      }

      setLoading(false);
    }

    load();
  }, [id]);

  /* ================= INCREASE VIEW (NON BLOCKING) ================= */
  useEffect(() => {
    if (!id) return;

    const key = `viewed-${id}`;
    if (sessionStorage.getItem(key)) return;

    fetch("/api/products/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});

    sessionStorage.setItem(key, "1");
  }, [id]);

  if (loading) return <p className="p-4">{t.loading}</p>;
  if (!product) return <p className="p-4">{t.no_products}</p>;

  const finalPrice = product.finalPrice ?? product.price;

  return (
    <div className="pb-32 bg-gray-50 min-h-screen">
      {/* IMAGE */}
      <img
        src={product.images?.[0] || "/placeholder.png"}
        className="w-full h-80 object-cover"
      />

      {/* INFO */}
      <div className="bg-white p-4">
        <h2 className="text-lg font-medium">{product.name}</h2>

        <p className="text-xl font-bold text-orange-600">
          π {formatPi(finalPrice)}
        </p>

        {finalPrice < product.price && (
          <p className="text-sm text-gray-400 line-through">
            π {formatPi(product.price)}
          </p>
        )}
      </div>

      {/* META */}
      <div className="bg-white px-4 pb-4 flex gap-4 text-sm text-gray-600">
        <span>👁 {product.views}</span>
        <span>🛒 {product.sold} {t.orders}</span>
      </div>

      {/* ACTIONS */}
      <div className="fixed bottom-16 left-0 right-0 bg-white p-3 flex gap-2">
        <button
          onClick={() => {
            addToCart({ ...product, price: finalPrice, quantity: 1 });
            router.push("/cart");
          }}
          className="flex-1 bg-yellow-500 text-white py-2 rounded"
        >
          {t.add_to_cart}
        </button>

        <button
          onClick={() => {
            addToCart({ ...product, price: finalPrice, quantity: 1 });
            setOpenCheckout(true);
          }}
          className="flex-1 bg-red-500 text-white py-2 rounded"
        >
          {t.buy_now}
        </button>
      </div>

      <CheckoutSheet
        open={openCheckout}
        onClose={() => setOpenCheckout(false)}
        product={product}
      />
    </div>
  );
}
