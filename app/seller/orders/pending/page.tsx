"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

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

interface Buyer {
  name: string;
  phone: string;
  address: string;
}

type OrderStatus = "pending" | "confirmed" | "cancelled";

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  buyer?: Buyer;
  order_items: OrderItem[];
}

/* ================= HELPERS ================= */

function formatPi(v: number): string {
  return Number.isFinite(v) ? v.toFixed(6) : "0.000000";
}

function formatDate(date: string): string {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN");
}

/* ================= PAGE ================= */

export default function SellerPendingOrdersPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  /* ================= LOAD ================= */

  const loadOrders = useCallback(async () => {
    setLoading(true);

    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=pending",
        { cache: "no-store" }
      );

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
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  /* ================= SUMMARY ================= */

  const totalPi = useMemo(
    () => orders.reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  /* ================= STATUS LABEL ================= */

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

  /* ================= ACTIONS ================= */

  const confirmOrder = useCallback(
    async (orderId: string) => {
      try {
        setProcessingId(orderId);

        const res = await apiAuthFetch(
          `/api/seller/orders/${orderId}/confirm`,
          { method: "PATCH" }
        );

        if (!res.ok) return;

        await loadOrders();
      } catch {
        // silent fail for Pi Browser
      } finally {
        setProcessingId(null);
      }
    },
    [loadOrders]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!window.confirm(t.confirm_cancel ?? "Cancel this order?"))
        return;

      try {
        setProcessingId(orderId);

        const res = await apiAuthFetch(
          `/api/seller/orders/${orderId}/cancel`,
          { method: "PATCH" }
        );

        if (!res.ok) return;

        await loadOrders();
      } catch {
        // silent fail
      } finally {
        setProcessingId(null);
      }
    },
    [loadOrders, t.confirm_cancel]
  );

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading ?? "Loading..."}
      </p>
    );
  }

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER (XÁM MỜ) ===== */}
      <header className="bg-gray-600/90 backdrop-blur-lg text-white px-4 py-5 shadow-md">
        <div className="bg-white/10 rounded-xl p-4 border border-white/20">
          <p className="text-sm font-medium opacity-90">
            {t.pending_orders ?? "Pending Orders"}
          </p>

          <p className="text-xs mt-1 text-white/80">
            {t.orders ?? "Orders"}: {orders.length} · π
            {formatPi(totalPi)}
          </p>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <section className="px-4 mt-5 space-y-4">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">
            {t.no_pending_orders ?? "No pending orders"}
          </p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onClick={() =>
                router.push(`/seller/orders/${order.id}`)
              }
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.99] transition"
            >
              {/* ORDER HEADER */}
              <div className="flex justify-between px-4 py-3 border-b bg-gray-50">
                <div>
                  <p className="font-semibold text-sm">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <span className="text-xs font-medium px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* BUYER */}
              <div className="px-4 py-3 text-sm space-y-1">
                <p>
                  <span className="text-gray-500">
                    {t.customer ?? "Customer"}:
                  </span>{" "}
                  {order.buyer?.name ?? "—"}
                </p>

                <p>
                  <span className="text-gray-500">
                    {t.phone ?? "Phone"}:
                  </span>{" "}
                  {order.buyer?.phone ?? "—"}
                </p>

                <p className="text-gray-600 text-xs">
                  {order.buyer?.address ??
                    (t.no_address ?? "No address")}
                </p>
              </div>

              {/* PRODUCTS */}
              <div className="divide-y">
                {(order.order_items ?? []).map((item) => (
                  <div
                    key={`${order.id}-${item.product_id}`}
                    className="flex gap-3 p-4"
                  >
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.product?.name ??
                          (t.product ?? "Product")}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        x{item.quantity} · π
                        {formatPi(item.price)}
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
                <span className="font-semibold">
                  {t.total ?? "Total"}: π
                  {formatPi(order.total)}
                </span>

                <div className="flex gap-2">
                  <button
                    disabled={processingId === order.id}
                    onClick={() =>
                      confirmOrder(order.id)
                    }
                    className="px-3 py-1.5 text-xs bg-gray-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {t.confirm ?? "Confirm"}
                  </button>

                  <button
                    disabled={processingId === order.id}
                    onClick={() =>
                      cancelOrder(order.id)
                    }
                    className="px-3 py-1.5 text-xs border border-gray-400 rounded-lg"
                  >
                    {t.cancel ?? "Cancel"}
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
