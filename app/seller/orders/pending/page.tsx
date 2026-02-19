"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* ================= TYPES ================= */

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
  buyer_name?: string;
  buyer_phone?: string;
  buyer_address?: string;
  order_items: OrderItem[];
}

/* ================= HELPERS ================= */

function formatPi(v: number): string {
  return Number.isFinite(v) ? v.toFixed(6) : "0.000000";
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("vi-VN");
}

/* ================= PAGE ================= */

export default function SellerPendingOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* ================= LOAD ================= */

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

      const data: unknown = await res.json();
      setOrders(Array.isArray(data) ? (data as Order[]) : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* ================= TOTAL PI ================= */

  const totalPi = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  /* ================= ACTIONS ================= */

  async function confirmOrder(orderId: string): Promise<void> {
    try {
      setProcessingId(orderId);

      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/confirm`,
        { method: "PATCH" }
      );

      if (!res.ok) throw new Error("CONFIRM_FAILED");

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

      if (!res.ok) throw new Error("CANCEL_FAILED");

      await loadOrders();
    } finally {
      setProcessingId(null);
    }
  }

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400 text-sm animate-pulse">
          ⏳ Đang tải đơn hàng...
        </p>
      </main>
    );
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gray-100 pb-28">
      {/* ===== HEADER ===== */}
      <header className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">
              ⏳ Đơn chờ xác nhận
            </p>
            <p className="text-2xl font-semibold mt-1">
              {orders.length} đơn
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs opacity-90">Tổng PI</p>
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
              Không có đơn chờ xác nhận
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onClick={() => router.push(`/seller/orders/${order.id}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition"
            >
              {/* HEADER CARD */}
              <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
                <div>
                  <p className="font-semibold text-sm">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <span className="text-xs font-medium px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  ⏳ Chờ xác nhận
                </span>
              </div>

              {/* BUYER */}
              <div className="px-4 py-3 text-sm space-y-1">
                <p>
                  <span className="text-gray-500">Khách:</span>{" "}
                  {order.buyer_name || "—"}
                </p>
                <p>
                  <span className="text-gray-500">SĐT:</span>{" "}
                  {order.buyer_phone || "—"}
                </p>
                <p className="text-gray-500 text-xs">
                  {order.buyer_address || "Không có địa chỉ"}
                </p>
              </div>

              {/* PRODUCTS */}
              <div className="divide-y">
                {order.order_items.map((item) => (
                  <div
                    key={`${order.id}-${item.product_id}`}
                    className="flex gap-3 p-4"
                  >
                    <img
                      src={item.product?.images?.[0] ?? "/placeholder.png"}
                      alt={item.product?.name ?? "product"}
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
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
              <div
                className="flex justify-between items-center px-4 py-3 border-t bg-gray-50 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="font-semibold text-gray-800">
                  π{formatPi(order.total)}
                </span>

                <div className="flex gap-2">
                  <button
                    disabled={processingId === order.id}
                    onClick={() => confirmOrder(order.id)}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {processingId === order.id
                      ? "Đang xử lý..."
                      : "Xác nhận"}
                  </button>

                  <button
                    disabled={processingId === order.id}
                    onClick={() => cancelOrder(order.id)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
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
