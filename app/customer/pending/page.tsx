"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   ORDER STATUS
========================= */
type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled";

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

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  order_items: OrderItem[];
}

/* =========================
   PAGE
========================= */
export default function PendingOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  function formatPi(value: number | string): string {
    return Number(value).toFixed(6);
  }

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

      const filtered = rawOrders.filter(
        (o) => o.status === "pending"
      );

      const productIds = Array.from(
        new Set(
          filtered.flatMap((o) =>
            o.order_items?.map((i) => i.product_id) ?? []
          )
        )
      );

      if (productIds.length === 0) {
        setOrders(filtered);
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

      const enriched = filtered.map((o) => ({
        ...o,
        order_items: (o.order_items ?? []).map((i) => ({
          ...i,
          product: productMap[i.product_id],
        })),
      }));

      setOrders(enriched);
    } catch (err) {
      console.error("❌ Load pending orders error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     CANCEL ORDER
  ========================= */
  async function handleCancel(): Promise<void> {
    if (!cancelOrderId) return;

    try {
      setSubmitting(true);

      const token = await getPiAccessToken();

      const res = await fetch(
        `/api/orders/${cancelOrderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "cancelled",
            cancel_reason: cancelReason,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("CANCEL_FAILED");
      }

      setOrders((prev) =>
        prev.filter((o) => o.id !== cancelOrderId)
      );

      setCancelOrderId(null);
      setCancelReason("");
    } catch (err) {
      console.error("❌ Cancel order error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  const totalPi = orders.reduce(
    (sum, o) => sum + Number(o.total),
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.order_info}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {t.orders}: {orders.length} · π{formatPi(totalPi)}
          </p>
        </div>
      </header>

      <section className="mt-6 px-4">
        {loading ? (
          <p className="text-center text-gray-400">
            {t.loading_orders}
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>{t.no_pending_orders}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-lg p-4 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    #{o.id.slice(0, 8)}
                  </span>
                  <span className="text-orange-500 text-sm font-medium">
                    {t.status_pending}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {o.order_items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-center"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
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
                </div>

                <p className="mt-3 text-sm text-gray-700 font-medium">
                  {t.total}: π{formatPi(o.total)}
                </p>

                {/* 🔥 CANCEL BUTTON */}
                <button
                  onClick={() => setCancelOrderId(o.id)}
                  className="mt-3 w-full bg-red-500 text-white py-2 rounded-lg text-sm font-medium"
                >
                  Huỷ đơn
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 🔥 CANCEL MODAL */}
      {cancelOrderId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-sm rounded-lg p-4">
            <h3 className="font-semibold mb-3">
              Lý do huỷ đơn
            </h3>

            <textarea
              value={cancelReason}
              onChange={(e) =>
                setCancelReason(e.target.value)
              }
              className="w-full border rounded-lg p-2 text-sm"
              rows={3}
              placeholder="Nhập lý do..."
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setCancelOrderId(null)}
                className="flex-1 border rounded-lg py-2 text-sm"
              >
                Đóng
              </button>

              <button
                onClick={handleCancel}
                disabled={submitting}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm"
              >
                {submitting ? "Đang huỷ..." : "Xác nhận huỷ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
