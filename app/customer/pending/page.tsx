"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   TYPES
========================= */
interface OrderItem {
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  total: number;
  status: string;
  order_items: OrderItem[];
}

/* =========================
   PAGE
========================= */
export default function PendingOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /* =========================
     LOAD ORDERS (PENDING)
  ========================= */
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = await getPiAccessToken();

      const res = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("UNAUTHORIZED");

      const data: unknown = await res.json();
      const list = Array.isArray(data) ? (data as Order[]) : [];

      // ✅ chỉ lấy đơn pending
      setOrders(list.filter((o) => o.status === "pending"));
    } catch (err) {
      console.error("❌ Load pending orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SUMMARY
  ========================= */
  const totalPi = orders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER ===== */}
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.order_info}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {t.orders}: {orders.length} · π{totalPi}
          </p>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <div
  key={o.id}
  className="bg-white rounded-lg p-4 shadow-sm"
>
  <div className="flex justify-between items-center">
    <span className="font-semibold">
      #{o.id.slice(0, 8)}
    </span>
    <span className="text-orange-500 text-sm font-medium">
      {t[`status_${o.status}`]}
    </span>
  </div>

  {/* ===== ORDER ITEMS ===== */}
  <div className="mt-3 space-y-2">
    {o.order_items?.map((item, idx) => (
      <div
        key={idx}
        className="flex gap-3 items-center"
      >
        {/* IMAGE */}
        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
          {item.product?.images?.[0] && (
            <img
              src={item.product.images[0]}
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* INFO */}
        <div className="flex-1">
          <p className="text-sm font-medium line-clamp-1">
            {item.product?.name}
          </p>
          <p className="text-xs text-gray-500">
            x{item.quantity} · π{item.price}
          </p>
        </div>
      </div>
    ))}
  </div>

  {/* TOTAL */}
  <p className="mt-3 text-sm text-gray-700 font-medium">
    {t.total}: π{o.total}
  </p>
</div>
        )}
      </section>
    </main>
  );
}
