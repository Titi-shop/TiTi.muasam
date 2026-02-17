"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =====================================================
   TYPES
===================================================== */
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
  status: "pending";
  total: number;
  created_at: string; // 👈 ngày thanh toán thành công
  order_items: OrderItem[];
}

/* =====================================================
   HELPERS
===================================================== */
function formatPi(value: number): string {
  return Number(value).toFixed(6);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString("vi-VN");
}

/* =====================================================
   PAGE
===================================================== */
export default function SellerPendingOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* =====================================================
     LOAD ORDERS
  ===================================================== */
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
    } catch (error) {
      console.error("❌ LOAD PENDING ERROR:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     ACTIONS
  ===================================================== */
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

  /* =====================================================
     LOADING
  ===================================================== */
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          ⏳ {t.loading || "Đang tải..."}
        </p>
      </main>
    );
  }

  /* =====================================================
     UI
  ===================================================== */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER ===== */}
      <header className="bg-gray-800 text-white px-4 py-6">
        <div>
          <p className="text-sm opacity-80">
            {t.pending_orders || "Đơn hàng chờ xác nhận"}
          </p>
          <p className="text-xl font-semibold mt-1">
            {orders.length} đơn
          </p>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <section className="px-4 mt-5 space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">
            Không có đơn chờ xác nhận
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border"
            >
              {/* ===== ORDER HEADER ===== */}
              <div className="flex justify-between px-4 py-3 border-b text-sm">
                <div>
                  <p className="font-semibold">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <span className="text-orange-500 font-medium">
                  {t.order_pending || "Chờ xác nhận"}
                </span>
              </div>

              {/* ===== PRODUCTS ===== */}
              <div className="divide-y">
                {order.order_items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-4"
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={
                          item.product?.images?.[0] ||
                          "/placeholder.png"
                        }
                        alt={item.product?.name || "product"}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.product?.name || "Sản phẩm"}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        x{item.quantity} · π{formatPi(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ===== FOOTER ===== */}
              <div className="flex justify-between items-center px-4 py-3 border-t text-sm">
                <span>
                  Tổng:{" "}
                  <b>π{formatPi(order.total)}</b>
                </span>

                <div className="flex gap-2">
                  <button
                    disabled={processingId === order.id}
                    onClick={() =>
                      confirmOrder(order.id)
                    }
                    className="px-4 py-1.5 bg-orange-500 text-white rounded disabled:opacity-50"
                  >
                    Xác nhận
                  </button>

                  <button
                    disabled={processingId === order.id}
                    onClick={() =>
                      cancelOrder(order.id)
                    }
                    className="px-4 py-1.5 border border-gray-400 rounded"
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
