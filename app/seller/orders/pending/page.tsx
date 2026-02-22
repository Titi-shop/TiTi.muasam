"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
  quantity: number;
  price: number;
  product_id: string;
  product?: Product;
}

type OrderStatus = "pending" | "confirmed" | "cancelled";

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  order_items: OrderItem[];
}

/* =========================
   HELPERS
========================= */

function formatPi(value: number | string): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(6) : "0.000000";
}

/* =========================
   PAGE
========================= */

export default function PendingOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /* =========================
     LOAD ORDERS
  ========================= */

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

      const rawOrders: Order[] = await res.json();

      const pendingOrders = rawOrders.filter(
        (o) => o.status === "pending"
      );

      /* Collect product ids */
      const productIds = Array.from(
        new Set(
          pendingOrders.flatMap((o) =>
            o.order_items?.map((i) => i.product_id) ?? []
          )
        )
      );

      if (productIds.length === 0) {
        setOrders(pendingOrders);
        return;
      }

      const productRes = await fetch(
        `/api/products?ids=${productIds.join(",")}`,
        { cache: "no-store" }
      );

      if (!productRes.ok)
        throw new Error("FETCH_PRODUCTS_FAILED");

      const products: Product[] = await productRes.json();

      const productMap: Record<string, Product> =
        Object.fromEntries(
          products.map((p) => [p.id, p])
        );

      const enrichedOrders: Order[] = pendingOrders.map(
        (o) => ({
          ...o,
          order_items: (o.order_items ?? []).map((i) => ({
            ...i,
            product: productMap[i.product_id],
          })),
        })
      );

      setOrders(enrichedOrders);
    } catch (err) {
      console.error("Load pending orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     SUMMARY
  ========================= */

  const totalPi = useMemo(
    () =>
      orders.reduce(
        (sum, o) => sum + Number(o.total),
        0
      ),
    [orders]
  );

  /* =========================
     STATUS LABEL SAFE
  ========================= */

  function getStatusLabel(status: OrderStatus): string {
    switch (status) {
      case "pending":
        return t.status_pending ?? "Pending";
      case "confirmed":
        return t.status_confirmed ?? "Confirmed";
      case "cancelled":
        return t.status_cancelled ?? "Cancelled";
      default:
        return status;
    }
  }

  /* =========================
     UI
  ========================= */

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER ===== */}
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.order_info ?? "Order Information"}
          </p>

          <p className="text-xs opacity-80 mt-1">
            {t.orders ?? "Orders"}: {orders.length} · π
            {formatPi(totalPi)}
          </p>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <section className="mt-6 px-4">
        {loading ? (
          <p className="text-center text-gray-400">
            ⏳ {t.loading_orders ?? "Loading orders..."}
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>
              {t.no_pending_orders ??
                "No pending orders"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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
                    {getStatusLabel(o.status)}
                  </span>
                </div>

                {/* ITEMS */}
                <div className="mt-3 space-y-2">
                  {(o.order_items ?? []).map(
                    (item) => (
                      <div
                        key={`${o.id}-${item.product_id}`}
                        className="flex gap-3 items-center"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.product?.images?.[0] && (
                            <img
                              src={
                                item.product.images[0]
                              }
                              alt={
                                item.product.name
                              }
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">
                            {item.product?.name ?? "—"}
                          </p>

                          <p className="text-xs text-gray-500">
                            x{item.quantity} · π
                            {formatPi(item.price)}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* TOTAL */}
                <p className="mt-3 text-sm text-gray-700 font-medium">
                  {t.total ?? "Total"}: π
                  {formatPi(o.total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
