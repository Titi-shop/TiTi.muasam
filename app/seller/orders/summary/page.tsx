"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { getPiAccessToken } from "@/lib/piAuth";

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
  price: number;
  quantity: number;
  product?: Product;
}

interface Order {
  id: string;
  total: number;
  created_at: string;
  status: string;
  order_items?: OrderItem[];
}

type OrderTab =
  | "all"
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled"
  | "returned";


function getSellerOrderStatus(order: Order): OrderTab {
  if (!order.order_items || order.order_items.length === 0)
    return "all";

  if (order.order_items.some((i) => i.status === "pending"))
    return "pending";

  if (order.order_items.some((i) => i.status === "confirmed"))
    return "confirmed";

  if (order.order_items.some((i) => i.status === "shipping"))
    return "shipping";

  if (order.order_items.every((i) => i.status === "completed"))
    return "completed";

  if (order.order_items.every((i) => i.status === "cancelled"))
    return "cancelled";

  return "all";
}

/* =========================
   PAGE
========================= */
export default function SellerOrdersSummaryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>("all");

  function formatPi(value: number | string) {
    return Number(value).toFixed(6);
  }

  /* =========================
     LOAD ORDERS
  ========================= */
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = await getPiAccessToken();
      if (!token) return;

      const res = await fetch("/api/seller/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("LOAD_FAILED");

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Load seller orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     FILTER TAB
  ========================= */
  const filteredOrders = useMemo(() => {
  if (activeTab === "all") return orders;

  return orders.filter(
    (o) => getSellerOrderStatus(o) === activeTab
  );
}, [orders, activeTab]);

  /* =========================
     COUNT PER STATUS
  ========================= */
  const countByStatus = (status: OrderTab) => {
  if (status === "all") return orders.length;

  return orders.filter(
    (o) => getSellerOrderStatus(o) === status
  ).length;
};

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER (MÀU NÂU/XÁM) ===== */}
      <header className="bg-gray-700 text-white px-4 py-4">
        <div className="rounded-lg p-4 bg-gray-600">
          <p className="text-sm opacity-90">Đơn hàng của shop</p>
          <p className="text-xs opacity-80 mt-1">
            {filteredOrders.length} đơn
          </p>
        </div>
      </header>

      {/* ===== TABS ===== */}
      <div className="bg-white border-b">
        <div className="flex gap-6 px-4 py-3 text-sm overflow-x-auto whitespace-nowrap">
          {([
            ["all", "Tất cả"],
            ["pending", "Chờ xác nhận"],
            ["confirmed", "Đã xác nhận"],
            ["shipping", "Đang vận chuyển"],
            ["completed", "Đã hoàn thành"],
            ["cancelled", "Huỷ"],
            ["returned", "Trả hàng"],
          ] as [OrderTab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-2 border-b-2 ${
                activeTab === key
                  ? "border-gray-700 text-gray-700 font-semibold"
                  : "border-transparent text-gray-500"
              }`}
            >
              {label}
              <div className="text-xs mt-1 text-center">
                {countByStatus(key)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <section className="px-4 mt-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">
            ⏳ Đang tải...
          </p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-center text-gray-400">
            Không có đơn hàng
          </p>
        ) : (
          filteredOrders.map((o) => (
            <div key={o.id} className="bg-white rounded-lg shadow">
              {/* HEADER */}
              <div className="flex justify-between px-4 py-2 border-b text-sm">
                <span className="font-semibold">#{o.id}</span>
                <span className="text-gray-700 capitalize">
                  {o.status}
                </span>
              </div>

              {/* PRODUCTS */}
              {o.order_items && o.order_items.length > 0 && (
                <div className="mt-3 space-y-2">
                  {o.order_items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-center p-4 border-t"
                    >
                      {/* IMAGE */}
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {item.product?.images?.length > 0 && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* INFO */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.product?.name ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          x{item.quantity} · π{formatPi(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FOOTER */}
              <div className="flex justify-between items-center px-4 py-3 border-t text-sm">
                <span>
                  Tổng: <b>π{formatPi(o.total)}</b>
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
