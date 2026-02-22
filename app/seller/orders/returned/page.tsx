"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* ================= TYPES ================= */

interface Order {
  id: string;
  total: number | null;
  status: string;
  created_at: string;
}

/* ================= HELPERS ================= */

function formatPi(v: number | null): string {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n.toFixed(6) : "0.000000";
}

function formatDate(date: string): string {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN");
}

/* ================= PAGE ================= */

export default function ReturnedOrdersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */

  useEffect(() => {
    if (authLoading) return;
    void fetchOrders();
  }, [authLoading]);

  async function fetchOrders(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=returned",
        { cache: "no-store" }
      );

      if (!res.ok) {
        setOrders([]);
        return;
      }

      const data: unknown = await res.json();
      setOrders(Array.isArray(data) ? (data as Order[]) : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= TOTAL ================= */

  const totalPi = useMemo(() => {
    return orders.reduce(
      (sum, o) => sum + (Number(o.total) || 0),
      0
    );
  }, [orders]);

  /* ================= LOADING ================= */

  if (loading || authLoading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading ?? "Loading..."}
      </p>
    );
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER XÁM MỜ ===== */}
      <header className="bg-gray-600/90 backdrop-blur-lg text-white px-4 py-5 shadow-md">
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <p className="text-sm font-medium opacity-90">
            {t.returned_orders ?? "Returned Orders"}
          </p>

          <p className="text-xs mt-1 text-white/80">
            {t.orders ?? "Orders"}: {orders.length} · π
            {formatPi(totalPi)}
          </p>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <section className="px-4 mt-5 space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">
            {t.no_return_orders ?? "No returned orders"}
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onDoubleClick={() =>
                router.push(`/seller/orders/${order.id}`)
              }
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition"
            >
              {/* ORDER HEADER */}
              <div className="flex justify-between px-4 py-3 border-b bg-gray-50">
                <div>
                  <p className="font-semibold text-sm">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <span className="text-xs font-medium px-3 py-1 rounded-full bg-red-100 text-red-700">
                  {t.status_returned ?? "Returned"}
                </span>
              </div>

              {/* FOOTER */}
              <div className="px-4 py-3 border-t bg-gray-50 text-sm">
                <span className="font-semibold">
                  {t.total ?? "Total"}: π
                  {formatPi(order.total)}
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
