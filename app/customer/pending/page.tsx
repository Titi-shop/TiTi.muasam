"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* ========================= */
type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled";

/* ========================= */
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

/* ========================= */
export default function PendingOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [processingConfirm, setProcessingConfirm] = useState<string | null>(null);

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
        headers: { Authorization: `Bearer ${token}` },
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

      const products: Product[] = await productRes.json();

      const productMap: Record<string, Product> =
        Object.fromEntries(products.map((p) => [p.id, p]));

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
     CONFIRM ORDER
  ========================= */
  async function handleConfirm(orderId: string) {
    try {
      setProcessingConfirm(orderId);

      const token = await getPiAccessToken();

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "confirmed",
        }),
      });

      if (!res.ok) throw new Error("CONFIRM_FAILED");

      await loadOrders();
    } catch (err) {
      console.error("❌ Confirm error:", err);
    } finally {
      setProcessingConfirm(null);
    }
  }

  /* =========================
     CANCEL ORDER
  ========================= */
  async function handleCancel(reason: string) {
    if (!cancelOrderId) return;

    try {
      setSubmitting(true);

      const token = await getPiAccessToken();

      const res = await fetch(`/api/orders/${cancelOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "cancelled",
          cancel_reason: reason,
        }),
      });

      if (!res.ok) throw new Error("CANCEL_FAILED");

      await loadOrders();
      setCancelOrderId(null);
    } catch (err) {
      console.error("❌ Cancel error:", err);
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
      {/* HEADER */}
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
          <div className="text-center mt-16 text-gray-400">
            {t.no_pending_orders}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-xl shadow-sm p-4"
              >
                {/* Top row */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    #{o.id.slice(0, 8)}
                  </span>

                  <button
                    onClick={() => handleConfirm(o.id)}
                    disabled={processingConfirm === o.id}
                    className="px-3 py-1 text-xs border border-green-500 text-green-500 rounded hover:bg-green-500 hover:text-white"
                  >
                    {processingConfirm === o.id
                      ? "Đang xử lý..."
                      : "Xác nhận"}
                  </button>
                </div>

                {/* Products */}
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

                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {item.product?.name ?? "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          x{item.quantity} · π{formatPi(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom row */}
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm font-semibold">
                    {t.total}: π{formatPi(o.total)}
                  </p>

                  <button
                    onClick={() => setCancelOrderId(o.id)}
                    className="text-xs text-red-500"
                  >
                    Huỷ đơn
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CANCEL POPUP */}
      {cancelOrderId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-sm rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm">
              Chọn lý do huỷ
            </h3>

            <button
              onClick={() => handleCancel("Hết hàng")}
              className="w-full border rounded-lg py-2 text-sm"
              disabled={submitting}
            >
              Hết hàng
            </button>

            <button
              onClick={() => handleCancel("Ngưng bán")}
              className="w-full border rounded-lg py-2 text-sm"
              disabled={submitting}
            >
              Ngưng bán
            </button>

            <button
              onClick={() => setCancelOrderId(null)}
              className="w-full text-gray-400 text-xs mt-2"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
