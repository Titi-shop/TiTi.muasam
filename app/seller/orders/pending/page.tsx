"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES
========================= */
interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    images: string[];
  };
}

interface Order {
  id: string;
  status: "pending";
  total: number;
  order_items: OrderItem[];
}

/* =========================
   HELPERS
========================= */
function formatPi(v: number): string {
  return v.toFixed(6);
}

/* =========================
   PAGE
========================= */
export default function SellerPendingOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* =========================
     LOAD ORDERS
  ========================= */
  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=pending",
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("LOAD_FAILED");

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ LOAD PENDING ERROR:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     ACTIONS
  ========================= */
  async function confirmOrder(orderId: string) {
    try {
      setProcessingId(orderId);

      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/confirm`,
        { method: "PATCH" }
      );

      if (!res.ok) throw new Error("CONFIRM_FAILED");

      await loadOrders();
    } catch {
      alert(t.confirm_failed || "Xác nhận thất bại");
    } finally {
      setProcessingId(null);
    }
  }

  async function cancelOrder(orderId: string) {
    if (!confirm("Bạn chắc chắn muốn huỷ đơn này?")) return;

    try {
      setProcessingId(orderId);

      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/cancel`,
        { method: "PATCH" }
      );

      if (!res.ok) throw new Error("CANCEL_FAILED");

      await loadOrders();
    } catch {
      alert("Huỷ đơn thất bại");
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
        ⏳ {t.loading || "Đang tải..."}
      </p>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="bg-orange-400 rounded-lg p-4">
          <p className="text-sm">
            {t.pending_orders || "Đơn hàng chờ xác nhận"}
          </p>
          <p className="text-xs mt-1">
            {orders.length} đơn
          </p>
        </div>
      </header>

      <section className="mt-6 px-4 space-y-3">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">
            Không có đơn chờ xác nhận
          </p>
        ) : (
          orders.map(order => (
            <div
              key={order.id}
              className="bg-white p-4 rounded-lg shadow"
            >
              <div className="flex justify-between mb-2">
                <b>#{order.id.slice(0, 8)}</b>
                <span className="text-orange-500">
                  Chờ xác nhận
                </span>
              </div>

              {order.order_items.map((item, idx) => (
                <div key={idx} className="flex gap-3 mt-2">
                  <img
                    src={item.product?.images?.[0] || "/placeholder.png"}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm">
                      {item.product?.name || "Sản phẩm"}
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

              <div className="flex gap-2 mt-3">
                <button
                  disabled={processingId === order.id}
                  onClick={() => confirmOrder(order.id)}
                  className="flex-1 bg-orange-500 text-white py-2 rounded disabled:opacity-50"
                >
                  ✅ Xác nhận
                </button>

                <button
                  disabled={processingId === order.id}
                  onClick={() => cancelOrder(order.id)}
                  className="flex-1 bg-gray-300 py-2 rounded"
                >
                  ❌ Huỷ
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
