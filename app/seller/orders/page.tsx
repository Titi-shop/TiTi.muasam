"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* ================= TYPES ================= */

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

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled";

interface Order {
  id: string;
  total: number;
  created_at: string;
  status: OrderStatus;
  order_items?: OrderItem[];
}

type OrderTab = "all" | OrderStatus;

/* ================= PAGE ================= */

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<OrderTab>("all");

  /* ================= FORMAT ================= */

  function formatPi(value: number) {
    return value.toFixed(6);
  }

  /* ================= LOAD ================= */

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiAuthFetch("/api/seller/orders", {
          cache: "no-store",
        });

        if (!res.ok) {
          setOrders([]);
          return;
        }

        const data: unknown = await res.json();

        if (Array.isArray(data)) {
          setOrders(data as Order[]);
        } else {
          setOrders([]);
        }
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ================= FILTER ================= */

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  /* ================= COUNT ================= */

  const countByStatus = (status: OrderTab): number => {
    if (status === "all") return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* HEADER */}
      <header className="bg-gray-700 text-white px-4 py-4">
        <div className="bg-gray-600 rounded-lg p-4">
          <p className="text-sm opacity-90">Đơn hàng của shop</p>
          <p className="text-xs opacity-80 mt-1">
            {filteredOrders.length} đơn
          </p>
        </div>
      </header>

      {/* TABS */}
      <div className="bg-white border-b">
        <div className="flex gap-6 px-4 py-3 text-sm overflow-x-auto whitespace-nowrap">
          {([
            ["all", "Tất cả"],
            ["pending", "Chờ xác nhận"],
            ["confirmed", "Đã xác nhận"],
            ["shipping", "Đang vận chuyển"],
            ["completed", "Đã hoàn thành"],
            ["cancelled", "Huỷ"],
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

      {/* CONTENT */}
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
            <div key={o.id} className="bg-white rounded-lg shadow-sm">
              {/* ORDER HEADER */}
              <div className="flex justify-between px-4 py-2 border-b text-sm">
                <span className="font-semibold">#{o.id}</span>
                <span className="capitalize text-gray-700">
                  {o.status}
                </span>
              </div>

              {/* ORDER ITEMS */}
              {o.order_items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 items-center p-4 border-t"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

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
