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
  created_at: string;  
  status: string;
  order_items?: OrderItem[];
}
/* =========================
   CANCEL REASONS (safe keys)
========================= */
const CANCEL_REASON_KEYS = [
  "cancel_reason_change_mind",
  "cancel_reason_wrong_product",
  "cancel_reason_change_variant",
  "cancel_reason_better_price",
  "cancel_reason_delivery_slow",
  "cancel_reason_update_address",
  "cancel_reason_other",
] as const;
/* =========================
   PAGE
========================= */
export default function PendingOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [showCancelFor, setShowCancelFor] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
   
  function formatPi(value: number | string): string {
    return Number(value).toFixed(6);
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  /* =========================
     LOAD ORDERS
  ========================== */
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
  ========================== */
  async function handleCancel(
  orderId: string,
  reason: string
) {
  try {
    setProcessingId(orderId);

    const token = await getPiAccessToken();

    const res = await fetch(`/api/orders/${orderId}`, {
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

    if (!res.ok) {
      throw new Error("CANCEL_FAILED");
    }

    setSelectedReason("");
    setCustomReason("");
    setShowCancelFor(null);

    await loadOrders();
  } catch (err) {
    alert("Không thể huỷ đơn.");
  } finally {
    setProcessingId(null);
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

      {/* CONTENT */}
      <section className="mt-6 px-4">
        {loading ? (
          <p className="text-center text-gray-400">
            {t.loading_orders || "Đang tải..."}
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>
              {t.no_pending_orders ||
                "Không có đơn chờ xác nhận"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                {/* HEADER CARD */}
                <div className="flex justify-between items-center px-4 py-3 border-b">
                  <span className="font-semibold text-sm">
                    #{o.id}
                  </span>
                  <span className="text-orange-500 text-sm font-medium">
                    {t.status_pending || "Chờ xác nhận"}
                  </span>
                </div>

                {/* PRODUCTS */}
                <div className="px-4 py-3 space-y-3">
                  {o.order_items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-center"
                    >
                      <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden">
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
                          x{item.quantity} · π
                          {formatPi(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FOOTER */}
<div className="flex justify-between items-center px-4 py-3 border-t">
  <p className="text-sm font-semibold">
    {t.total || "Tổng cộng"}: π
    {formatPi(o.total)}
  </p>

  <button
    onClick={() => setShowCancelFor(o.id)}
    disabled={processingId === o.id}
    className="px-4 py-1.5 text-sm border border-red-500 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition disabled:opacity-50"
  >
    {processingId === o.id
      ? "Đang huỷ..."
      : "Huỷ đơn"}
  </button>
</div>

{/* 👇 CHÈN ĐOẠN NÀY NGAY ĐÂY */}
{showCancelFor === o.id && (
  <div className="px-4 pb-4 space-y-3">
    <div className="space-y-2">
      {CANCEL_REASONS.map((reason) => (
        <label
          key={reason}
          className="flex items-center gap-2 text-sm"
        >
          <input
            type="radio"
            name={`cancel-${o.id}`}
            value={reason}
            checked={selectedReason === reason}
            onChange={(e) =>
              setSelectedReason(e.target.value)
            }
          />
          {reason}
        </label>
      ))}
    </div>

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
        onClick={() => {
          const finalReason =
            selectedReason === "Khác"
              ? customReason
              : selectedReason;

          if (!finalReason.trim()) {
            alert("Vui lòng chọn lý do.");
            return;
          }

          handleCancel(o.id, finalReason);
        }}
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
          </div>
        )}
      </section>
    </main>
  );
}

