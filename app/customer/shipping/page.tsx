"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   TYPES (NO any)
========================= */

interface Product {
  id: string;
  name: string;
  image_url: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  product: Product;
}

interface Order {
  id: string;
  total: number;
  status: string;
  items: OrderItem[];
}

/* =========================
   HELPERS
========================= */

function formatPi(value: number): string {
  return Number(value).toFixed(6);
}

/* =========================
   PAGE
========================= */

export default function CustomerShippingPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders(): Promise<void> {
    try {
      const token = await getPiAccessToken();

      const res = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("UNAUTHORIZED");

      const data: unknown = await res.json();
      const list = Array.isArray(data) ? (data as Order[]) : [];

      // chỉ lấy đơn đang giao
      setOrders(list.filter((o) => o.status === "shipping"));
    } catch (err) {
      console.error("❌ Load shipping orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const totalPi = orders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* HEADER */}
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.shipping_orders || "Đơn đang vận chuyển"}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {t.orders}: {orders.length} · π{formatPi(totalPi)}
          </p>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mt-6 px-4">
        {loading ? (
          <p className="text-center text-gray-400">
            {t.loading_orders}
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>{t.no_shipping_orders || "Không có đơn đang giao"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-lg p-4 shadow-sm"
              >
                {/* ORDER HEADER */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    #{o.id.slice(0, 8)}
                  </span>
                  <span className="text-orange-500 text-sm font-medium">
                    {t.status_shipping || "Đang giao"}
                  </span>
                </div>

                {/* PRODUCTS */}
                <div className="mt-3 space-y-3">
                  {o.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          x{item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* TOTAL */}
                <p className="mt-4 text-sm text-gray-700 font-medium">
                  {t.total}: π{formatPi(o.total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
