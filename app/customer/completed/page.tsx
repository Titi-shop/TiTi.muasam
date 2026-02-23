"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
   ORDER STATUS
========================= */
type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled"
  | "returned";

/* =========================
   TYPES
========================= */
interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  created_at?: string;
}

/* =========================
   HELPERS
========================= */
function formatPi(value: number | string): string {
  return Number(value).toFixed(6);
}

/* =========================
   PAGE
========================= */
export default function CustomerCompletedPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /* =========================
     LOAD COMPLETED ORDERS
  ========================= */
  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        "/api/orders?status=completed",
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("LOAD_FAILED");

      const data: unknown = await res.json();

      if (!Array.isArray(data)) {
        setOrders([]);
        return;
      }

      const cleanOrders = (data as Order[])
        .sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0;
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        });

      setOrders(cleanOrders);
    } catch (err) {
      console.error("❌ Load completed orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     SUMMARY
  ========================= */
  const totalPi = useMemo(() => {
    return orders.reduce(
      (sum, o) => sum + Number(o.total),
      0
    );
  }, [orders]);

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER ===== */}
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.completed_orders || "Đơn hàng đã hoàn thành"}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {t.orders}: {orders.length} · π
            {formatPi(totalPi)}
          </p>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <section className="mt-6 px-4">
        {loading ? (
          <p className="text-center text-gray-400">
            ⏳ {t.loading_orders || "Đang tải..."}
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>
              {t.no_completed_orders ||
                "Bạn chưa có đơn hàng hoàn thành"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-lg p-4 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    #{o.id.slice(0, 8)}
                  </span>

                  <span className="text-green-600 text-sm font-medium">
                    {t.status_completed || "Hoàn thành"}
                  </span>
                </div>

                {o.created_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(o.created_at).toLocaleDateString()}
                  </p>
                )}

                <p className="mt-2 text-sm text-gray-700 font-medium">
                  {t.total}: π{formatPi(o.total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
