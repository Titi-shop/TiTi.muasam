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
  status: string; // không hard-code literal
  total: number;
  order_items: OrderItem[];
}

/* =========================
   HELPERS
========================= */

function formatPi(v: number): string {
  return Number.isFinite(v) ? v.toFixed(6) : "0.000000";
}

/* =========================
   PAGE
========================= */

export default function SellerConfirmedOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* =========================
     LOAD CONFIRMED ORDERS
  ========================= */

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=confirmed",
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
      console.error("❌ LOAD CONFIRMED ERROR:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     START SHIPPING
  ========================= */

  async function startShipping(orderId: string): Promise<void> {
    try {
      setProcessingId(orderId);

      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/shipping`,
        { method: "PATCH" }
      );

      if (!res.ok) throw new Error("SHIP_FAILED");

      await loadOrders();
    } catch {
      alert("Không thể bắt đầu giao hàng");
    } finally {
      setProcessingId(null);
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
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="bg-orange-400 rounded-lg p-4">
          <p className="text-sm">Đơn hàng đã xác nhận</p>
          <p className="text-xs mt-1">{orders.length} đơn</p>
        </div>
      </header>

      <section className="mt-6 px-4 space-y-3">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">
            Không có đơn chờ giao
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-4 rounded-lg shadow"
            >
              <div className="flex justify-between mb-2">
                <b>#{order.id.slice(0, 8)}</b>
                <span className="text-green-600">
                  Đã xác nhận
                </span>
              </div>

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

              <p className="mt-3 font-semibold">
                Tổng: π{formatPi(order.total)}
              </p>

              <button
                disabled={processingId === order.id}
                onClick={() => startShipping(order.id)}
                className="mt-3 w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
              >
                🚚 Bắt đầu giao hàng
              </button>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
