"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
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
  id: string | number;
  product_id: string;
  price: number;
  quantity: number;
  product?: Product;
}

interface Order {
  id: number;
  total: number;
  createdAt: string;
  status: string;
  order_items?: OrderItem[];
}

type OrderTab =
  | "all"
  | "pending"
  | "pickup"
  | "shipping"
  | "received"
  | "completed"
  | "returned"
  | "cancelled";

/* =========================
   PAGE
========================= */
export default function CustomerOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
function formatPi(value: number | string) {
  return Number(value).toFixed(6).replace(/\.?0+$/, "");
}
   
  /* =========================
     LOAD ORDERS (1 LẦN)
  ========================= */
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
  try {
    const token = await getPiAccessToken();

    const res = await fetch("/api/orders", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) throw new Error("UNAUTHORIZED");

    const rawOrders: Order[] = await res.json();
    const safeOrders = Array.isArray(rawOrders) ? rawOrders : [];

    /* 1️⃣ Gom tất cả product_id */
    const productIds = Array.from(
      new Set(
        safeOrders.flatMap((o) =>
          o.order_items?.map((i) => i.product_id) ?? []
        )
      )
    );

    if (productIds.length === 0) {
      setOrders(safeOrders);
      return;
    }

    /* 2️⃣ Fetch products 1 lần */
    const productRes = await fetch(
      `/api/products?ids=${productIds.join(",")}`,
      { cache: "no-store" }
    );

    if (!productRes.ok) throw new Error("FETCH_PRODUCTS_FAILED");

    const products: Product[] = await productRes.json();

    const productMap = Object.fromEntries(
      products.map((p) => [p.id, p])
    );

    /* 3️⃣ Gắn product vào order_items */
    const enrichedOrders = safeOrders.map((o) => ({
      ...o,
      order_items: (o.order_items ?? []).map((i) => ({
        ...i,
        product: productMap[i.product_id],
      })),
    }));

    setOrders(enrichedOrders);
  } catch (e) {
    console.error("❌ Load orders error:", e);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};

  /* =========================
     FILTER THEO TAB
  ========================= */
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;

    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

    /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER ===== */}
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">{t.orders}</p>
          <p className="text-xs opacity-80 mt-1">
            {filteredOrders.length}
          </p>
        </div>
      </header>

      {/* ===== TABS ===== */}
      <div className="bg-white border-b">
        <div className="flex gap-6 px-4 py-3 text-sm overflow-x-auto whitespace-nowrap">
          {([
            ["all", t.all],
            ["pending", t.order_pending],
            ["pickup", t.order_pickup],
            ["shipping", t.order_shipping],
            ["received", t.order_received],
            ["returned", t.order_returned],
            ["cancelled", t.order_cancelled],
          ] as [OrderTab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-2 border-b-2 ${
                activeTab === key
                  ? "border-orange-500 text-orange-500 font-semibold"
                  : "border-transparent text-gray-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <section className="px-4 mt-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500">⏳ {t.loading}</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-center text-gray-400">{t.no_orders}</p>
        ) : (
          filteredOrders.map((o) => (
            <div key={o.id} className="bg-white rounded-lg shadow">
              {/* HEADER */}
              <div className="flex justify-between px-4 py-2 border-b text-sm">
                <span className="font-semibold">#{o.id}</span>
                <span className="text-orange-500">
                  {t[`status_${o.status}`] ?? o.status}
                </span>
              </div>
               
              {/* PRODUCTS */}
{o.items && o.items.length > 0 && (
  <div className="divide-y">
    {o.items.map((item) => (
      <div key={item.id} className="flex gap-3 p-4">
        <img
          src={item.image || "/placeholder.png"}
          alt={item.name}
          className="w-16 h-16 rounded object-cover"
        />

        <div className="flex-1">
          <p className="text-sm line-clamp-2">
            {item.name}
          </p>

          <div className="flex justify-between mt-1 text-sm">
            <span className="text-orange-500">
              π{formatPi(item.price)}
            </span>
            <span className="text-gray-500">
              x{item.quantity}
            </span>
          </div>
        </div>
      </div>
    ))}
  </div>
)}

              {/* FOOTER */}
              <div className="flex justify-between items-center px-4 py-3 border-t text-sm">
                <span>
                  {t.total}: <b>π{formatPi(o.total)}</b>
                </span>

                <button className="px-4 py-1 border border-orange-500 text-orange-500 rounded">
                  {t.buy_now}
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
