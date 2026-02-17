"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useRouter } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

/* =========================
   TYPES (NO any)
========================= */
type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled";

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
}

/* =========================
   PAGE
========================= */
export default function SellerOrdersHomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD ALL SELLER ORDERS
  ========================= */
  useEffect(() => {
    if (authLoading) return;
    loadOrders();
  }, [authLoading]);

  async function loadOrders(): Promise<void> {
    try {
      const res = await apiAuthFetch("/api/seller/orders", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("FAILED_TO_LOAD_ORDERS");

      const data: unknown = await res.json();
      setOrders(Array.isArray(data) ? (data as Order[]) : []);
    } catch (err) {
      console.error("❌ Load seller orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     STATS BY STATUS
  ========================= */
  function calcStats(status?: OrderStatus) {
    const list = status
      ? orders.filter(o => o.status === status)
      : orders;

    const totalPi = list.reduce(
      (sum, o) => sum + Number(o.total || 0),
      0
    );

    return {
      count: list.length,
      totalPi: totalPi.toFixed(6),
    };
  }

  /* =========================
     LOADING
  ========================= */
  if (loading || authLoading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading || "Đang tải..."}
      </p>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="max-w-md mx-auto p-4 pb-24 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          {t.orders_list || "📋 Quản lý đơn hàng"}
        </h1>
      </div>

      {/* ORDER TABS */}
      <div className="flex flex-col gap-3 mt-4">
        <OrderButton
          label={t.all_orders || "📦 Tất cả đơn"}
          onClick={() => router.push("/seller/orders/summary")}
          stats={calcStats()}
        />

        <OrderButton
          label={t.pending_orders || "⏳ Chờ xác nhận"}
          onClick={() => router.push("/seller/orders/pending")}
          stats={calcStats("pending")}
        />

        <OrderButton
          label={"📦 Đã xác nhận"}
          onClick={() => router.push("/seller/orders/confirmed")}
          stats={calcStats("confirmed")}
        />

        <OrderButton
          label={t.shipping_orders || "🚚 Đang giao"}
          onClick={() => router.push("/seller/orders/shipping")}
          stats={calcStats("shipping")}
        />

        <OrderButton
          label={t.completed_orders || "✅ Hoàn tất"}
          onClick={() => router.push("/seller/orders/completed")}
          stats={calcStats("completed")}
        />

        <OrderButton
          label={t.cancelled_orders || "❌ Đã hủy"}
          onClick={() => router.push("/seller/orders/canceled")}
          stats={calcStats("cancelled")}
        />
      </div>

      <div className="h-20" />
    </main>
  );
}

/* =========================
   COMPONENT
========================= */
function OrderButton({
  label,
  onClick,
  stats,
}: {
  label: string;
  onClick: () => void;
  stats: { count: number; totalPi: string };
}) {
  return (
    <button
      onClick={onClick}
      className="btn-gray flex justify-between items-center"
    >
      <span>{label}</span>
      <span className="text-sm text-gray-200">
        {stats.count} đơn · {stats.totalPi} π
      </span>
    </button>
  );
}
