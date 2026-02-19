"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES
========================= */

interface Product {
  id: string;
  name: string;
  images: string[];
}

interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  product?: Product;
}

interface Order {
  id: string;
  status: string;
  total: number;
  created_at?: string;
  order_items: OrderItem[];
}

/* =========================
   HELPERS
========================= */

function formatPi(v: number): string {
  return Number.isFinite(v) ? v.toFixed(6) : "0.000000";
}

function formatDate(date?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

/* =========================
   PAGE
========================= */

export default function SellerCanceledOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /* =========================
     LOAD CANCELED ORDERS
  ========================= */

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=cancelled",
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("LOAD_FAILED");

      const data: unknown = await res.json();
      if (Array.isArray(data)) {
        setOrders(data as Order[]);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("❌ LOAD CANCELED ERROR:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
  ========================= */

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        {t.loading || "Đang tải..."}
      </p>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-gray-600 text-white px-4 py-4">
        <div className="bg-gray-500 rounded-lg p-4">
          <p className="text-sm">
            {t.canceled_orders || "Đơn hàng đã huỷ"}
          </p>
          <p className="text-xs mt-1">
            {orders.length} đơn
          </p>
        </div>
      </header>

      <section className="mt-6 px-4 space-y-3">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">
            Không có đơn đã huỷ
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-4 rounded-lg shadow"
            >
              <div className="flex justify-between mb-2">
                <b>#{order.id.slice(0, 8)}</b>
                <span className="text-gray-600">
                  Đã huỷ
                </span>
              </div>

              {order.created_at && (
                <p className="text-xs text-gray-400 mb-2">
                  {formatDate(order.created_at)}
                </p>
              )}

              {order.order_items.map((item) => (
                <div
                  key={`${order.id}-${item.product_id}`}
                  className="flex gap-3 mt-2"
                >
                  <img
                    src={
                      item.product?.images?.[0] ??
                      "/placeholder.png"
                    }
                    alt={item.product?.name ?? "product"}
                    className="w-12 h-12 rounded object-cover"
                  />

                  <div className="flex-1">
                    <p className="text-sm">
                      {item.product?.name ?? "Sản phẩm"}
                    </p>
                    <p className="text-xs text-gray-500">
                      x{item.quantity} · π{formatPi(item.price)}
                    </p>
                  </div>
                </div>
              ))}

              <p className="mt-3 font-semibold text-gray-700">
                Tổng: π{formatPi(order.total)}
              </p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
