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
  created_at: string;
  order_items: OrderItem[];
}

/* =========================
   HELPERS
========================= */
function formatPi(v: number): string {
  return Number.isFinite(v) ? v.toFixed(6) : "0.000000";
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("vi-VN");
}

/* =========================
   PAGE
========================= */
export default function SellerPendingOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    void loadOrders();
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
      console.error("LOAD PENDING ERROR:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmOrder(orderId: string): Promise<void> {
    try {
      setProcessingId(orderId);
      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/confirm`,
        { method: "PATCH" }
      );
      if (!res.ok) throw new Error();
      await loadOrders();
    } finally {
      setProcessingId(null);
    }
  }

  async function cancelOrder(orderId: string): Promise<void> {
    if (!confirm("Bạn chắc chắn muốn huỷ đơn này?")) return;

    try {
      setProcessingId(orderId);
      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/cancel`,
        { method: "PATCH" }
      );
      if (!res.ok) throw new Error();
      await loadOrders();
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading || "Đang tải..."}
      </p>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4efe6] pb-24">
      {/* HEADER – MỆNH THỔ */}
      <header className="bg-[#7a553a] text-white px-4 py-5">
        <p className="text-sm opacity-90">
          {t.pending_orders || "Đơn hàng chờ xác nhận"}
        </p>
        <p className="text-lg font-semibold mt-1">
          {orders.length} đơn
        </p>
      </header>

      <section className="mt-6 px-4 space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-500">
            Không có đơn chờ xác nhận
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow border"
            >
              {/* ORDER HEADER */}
              <div className="flex justify-between px-4 py-3 border-b">
                <div>
                  <p className="font-semibold">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <span className="text-[#7a553a] font-medium">
                  Chờ xác nhận
                </span>
              </div>

              {/* PRODUCTS */}
              <div className="divide-y">
                {order.order_items.map((item) => (
                  <div
                    key={`${order.id}-${item.product_id}`}
                    className="flex gap-3 p-4"
                  >
                    <img
                      src={
                        item.product?.images?.[0] ??
                        "/placeholder.png"
                      }
                      alt={item.product?.name ?? "product"}
                      className="w-14 h-14 rounded object-cover bg-gray-100"
                    />

                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {item.product?.name ?? "Sản phẩm"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        x{item.quantity} · π{formatPi(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="flex justify-between items-center px-4 py-3 border-t text-sm">
                <b>π{formatPi(order.total)}</b>

                <div className="flex gap-2">
                  <button
                    disabled={processingId === order.id}
                    onClick={() => confirmOrder(order.id)}
                    className="px-3 py-1.5 bg-[#7a553a] text-white rounded disabled:opacity-50"
                  >
                    Xác nhận
                  </button>
                  <button
                    disabled={processingId === order.id}
                    onClick={() => cancelOrder(order.id)}
                    className="px-3 py-1.5 border border-gray-400 rounded"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
