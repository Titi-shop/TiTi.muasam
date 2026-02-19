"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useAuth } from "@/context/AuthContext";

/* ================= TYPES ================= */

interface Order {
  id: string;
  total: number | null;
  status: string;
  created_at: string;
}

/* ================= HELPERS ================= */

function formatPi(v: number | null): string {
  const n = Number(v) || 0;
  return n.toFixed(6);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("vi-VN");
}

/* ================= PAGE ================= */

export default function SellerShippingOrdersPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */

  useEffect(() => {
    if (authLoading) return;
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function loadOrders(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=shipped",
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("LOAD_FAILED");

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
    return orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [orders]);

  /* ================= LOADING ================= */

  if (loading || authLoading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">
          ⏳ Đang tải đơn đang giao...
        </p>
      </main>
    );
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gray-100 pb-28">
      {/* ===== HEADER XÁM MỜ ===== */}
      <header className="bg-gray-500/90 backdrop-blur text-white px-4 py-6 shadow-sm">
        <p className="text-sm opacity-90">
          🚚 Đơn đang giao
        </p>

        <div className="mt-2 flex justify-between items-end">
          <div>
            <p className="text-2xl font-semibold">
              {orders.length}
            </p>
            <p className="text-xs opacity-80">đơn</p>
          </div>

          <div className="text-right">
            <p className="text-xs opacity-80">Tổng PI</p>
            <p className="text-lg font-semibold">
              π{formatPi(totalPi)}
            </p>
          </div>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <section className="px-4 mt-5 space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow-sm">
            <p className="text-gray-400 text-sm">
              Không có đơn đang giao
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onClick={() =>
                router.push(`/seller/orders/${order.id}`)
              }
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.99] transition"
            >
              {/* HEADER CARD */}
              <div className="flex justify-between px-4 py-3 border-b bg-gray-50">
                <div>
                  <p className="font-semibold text-sm">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                  🚚 Đang giao
                </span>
              </div>

              {/* BODY */}
              <div className="px-4 py-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Tổng thanh toán
                </span>

                <span className="font-semibold text-gray-800">
                  π{formatPi(order.total)}
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
