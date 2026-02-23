"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useCallback, useEffect, useMemo, useState } from "react";
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

/* ================= CANCEL REASONS ================= */

const SELLER_CANCEL_REASONS: string[] = [
  "Hết hàng",
  "Ngưng kinh doanh sản phẩm",
  "Sai giá sản phẩm",
  "Khác",
];

/* ================= HELPERS ================= */

function formatPi(v: number): string {
  return Number.isFinite(v) ? v.toFixed(6) : "0.000000";
}

/* ================= PAGE ================= */

export default function SellerPendingOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [showConfirmFor, setShowConfirmFor] = useState<string | null>(null);
  const [sellerMessage, setSellerMessage] = useState<string>("");

  const [showCancelFor, setShowCancelFor] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  /* ================= LOAD ================= */

  const loadOrders = useCallback(async () => {
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

  const totalPi = useMemo(
    () => orders.reduce((sum, o) => sum + o.total, 0),
    [orders]
  );

  /* ================= CONFIRM ================= */

  async function handleConfirm(orderId: string) {
    if (!sellerMessage.trim()) return;

    try {
      setProcessingId(orderId);

      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/confirm`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seller_message: sellerMessage,
          }),
        }
      );

      if (!res.ok) return;

      setSellerMessage("");
      setShowConfirmFor(null);

      await loadOrders();
    } catch {
      // silent fail
    } finally {
      setProcessingId(null);
    }
  }

  /* ================= CANCEL ================= */

  async function handleCancel(orderId: string) {
    const finalReason =
      selectedReason === "Khác"
        ? customReason
        : selectedReason;

    if (!finalReason.trim()) return;

    try {
      setProcessingId(orderId);

      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/cancel`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cancel_reason: finalReason,
          }),
        }
      );

      if (!res.ok) return;

      setSelectedReason("");
      setCustomReason("");
      setShowCancelFor(null);

      await loadOrders();
    } catch {
      // silent fail
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-400">
        {t.loading ?? "Đang tải..."}
      </p>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* HEADER */}
      <header className="bg-gray-600 text-white px-4 py-4">
        <div className="bg-gray-500 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.pending_orders ?? "Đơn chờ xác nhận"}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {t.orders}: {orders.length} · π
            {formatPi(totalPi)}
          </p>
        </div>
      </header>

      <section className="mt-6 px-4 space-y-4">
        {orders.map((o) => (
          <div
            key={o.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            {/* HEADER CARD */}
            <div className="flex justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm">
                #{o.id}
              </span>
              <span className="text-yellow-600 text-sm">
                {t.status_pending ?? "Chờ xác nhận"}
              </span>
            </div>

            {/* TOTAL */}
            <div className="px-4 py-3 text-sm font-semibold border-b">
              {t.total ?? "Tổng"}: π{formatPi(o.total)}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2 px-4 py-3">
              <button
                onClick={() => setShowConfirmFor(o.id)}
                className="px-4 py-1.5 text-sm bg-gray-700 text-white rounded-md"
              >
                {t.confirm ?? "Xác nhận"}
              </button>

              <button
                onClick={() => setShowCancelFor(o.id)}
                className="px-4 py-1.5 text-sm border border-red-500 text-red-500 rounded-md"
              >
                {t.cancel ?? "Huỷ"}
              </button>
            </div>

            {/* CONFIRM FORM */}
            {showConfirmFor === o.id && (
              <div className="px-4 pb-4 space-y-3">
                <textarea
                  value={sellerMessage}
                  onChange={(e) =>
                    setSellerMessage(e.target.value)
                  }
                  placeholder="Nhập lời chúc khách hàng..."
                  className="w-full border rounded-md p-2 text-sm"
                  rows={3}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirm(o.id)}
                    disabled={processingId === o.id}
                    className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-md"
                  >
                    Xác nhận đơn
                  </button>

                  <button
                    onClick={() => {
                      setShowConfirmFor(null);
                      setSellerMessage("");
                    }}
                    className="px-4 py-1.5 text-sm border rounded-md"
                  >
                    Huỷ bỏ
                  </button>
                </div>
              </div>
            )}

            {/* CANCEL FORM */}
            {showCancelFor === o.id && (
              <div className="px-4 pb-4 space-y-3">
                {SELLER_CANCEL_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) =>
                        setSelectedReason(e.target.value)
                      }
                    />
                    {reason}
                  </label>
                ))}

                {selectedReason === "Khác" && (
                  <textarea
                    value={customReason}
                    onChange={(e) =>
                      setCustomReason(e.target.value)
                    }
                    placeholder="Nhập lý do cụ thể..."
                    className="w-full border rounded-md p-2 text-sm"
                    rows={3}
                  />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCancel(o.id)}
                    className="px-4 py-1.5 text-sm bg-red-500 text-white rounded-md"
                  >
                    Xác nhận huỷ
                  </button>

                  <button
                    onClick={() => {
                      setShowCancelFor(null);
                      setSelectedReason("");
                      setCustomReason("");
                    }}
                    className="px-4 py-1.5 text-sm border rounded-md"
                  >
                    Huỷ bỏ
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
