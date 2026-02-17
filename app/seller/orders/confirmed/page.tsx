"use client";

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
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
}

interface Props {
  status: string;
  title: string;
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
   COMPONENT
===================================================== */
export default function SellerOrdersList({
  status,
  title,
}: Props) {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [status]);

  async function loadOrders() {
    try {
      const res = await apiAuthFetch(
        `/api/seller/orders?status=${status}`,
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("LOAD_FAILED");

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("LOAD ERROR:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">
          ⏳ {t.loading || "Đang tải..."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* HEADER */}
      <header className="bg-gray-800 text-white px-4 py-6">
        <p className="text-sm opacity-80">{title}</p>
        <p className="text-xl font-semibold mt-1">
          {orders.length} đơn
        </p>
      </header>

      <section className="px-4 mt-5 space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">
            Không có đơn
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border"
            >
              {/* HEADER */}
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
                  {t[`status_${status}`] ?? status}
                </span>
              </div>

              {/* PRODUCTS */}
              <div className="divide-y">
                {order.order_items.map((item, index) => (
                  <div key={index} className="flex gap-3 p-4">
                    <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={
                          item.product?.images?.[0] ||
                          "/placeholder.png"
                        }
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

              {/* FOOTER */}
              <div className="px-4 py-3 border-t text-sm font-semibold">
                Tổng: π{formatPi(order.total)}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
