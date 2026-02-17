"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   ORDER STATUS
========================= */
type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled";

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
   PAGE
========================= */
export default function CustomerCompletedPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  function formatPi(value: number | string): string {
    return Number(value).toFixed(6);
  }

  /* =========================
     LOAD COMPLETED ORDERS
  ========================= */
  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders(): Promise<void> {
    try {
      const token = await getPiAccessToken();

      const res = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("UNAUTHORIZED");

      const rawOrders: Order[] = await res.json();

      /* ✅ CHỈ LẤY COMPLETED */
      const completedOrders = rawOrders
        .filter((o) => o.status === "completed")
        .sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0;
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        });

      setOrders(completedOrders);
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
  const totalPi = orders.reduce(
    (sum, o) => sum + Number(o.total),
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
            ⏳ {t.loading_orders}
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
