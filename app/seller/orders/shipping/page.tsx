"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

/* =========================
   TYPES (NO any)
========================= */
interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
}

/* =========================
   HELPERS
========================= */
function formatPi(value: number): string {
  return Number(value).toFixed(6);
}

/* =========================
   PAGE
========================= */
export default function SellerShippingOrdersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    void loadOrders();
  }, [authLoading]);

  async function loadOrders(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=shipping",
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("FAILED_TO_LOAD");

      const data: unknown = await res.json();
      setOrders(Array.isArray(data) ? (data as Order[]) : []);
    } catch (err) {
      console.error("❌ Load seller shipping orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function completeOrder(orderId: string): Promise<void> {
    try {
      setProcessingId(orderId);

      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/complete`,
        { method: "PATCH" }
      );

      if (!res.ok) throw new Error("COMPLETE_FAILED");

      await loadOrders();
    } catch (err) {
      console.error("❌ Complete order error:", err);
      alert(t.complete_failed || "Hoàn tất đơn thất bại");
    } finally {
      setProcessingId(null);
    }
  }

  if (loading || authLoading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading || "Đang tải..."}
      </p>
    );
  }

  return (
    <main className="min-h-screen max-w-4xl mx-auto p-4 pb-24 bg-gray-50">
      {/* HEADER */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-gray-800">
          🚚 {t.shipping_orders || "Đơn đang giao"}
        </h1>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {t.no_shipping_orders || "Không có đơn đang giao"}
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <p>
                🧾 <b>{t.order_id}:</b> #{o.id.slice(0, 8)}
              </p>

              <p>
                💰 <b>{t.total}:</b> π{formatPi(o.total)}
              </p>

              <p className="text-sm text-gray-500">
                📅 {new Date(o.created_at).toLocaleString()}
              </p>

              <button
                disabled={processingId === o.id}
                onClick={() => void completeOrder(o.id)}
                className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {processingId === o.id
                  ? " Đang xử lý..."
                  : t.complete_order || "✅ Hoàn tất đơn"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
