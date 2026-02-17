"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES (NO any)
========================= */
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
  created_at: string;
  total: number;
  order_items: OrderItem[];
}

/* =========================
   HELPERS
========================= */
function formatPi(value: number): string {
  return value.toFixed(6);
}

/* =========================
   PAGE
========================= */
export default function SellerPendingOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  /* =========================
     LOAD SELLER ORDERS
  ========================= */
  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders(): Promise<void> {
    try {
      const res = await apiAuthFetch(
        "/api/seller/orders?status=pending",
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("FAILED_TO_LOAD_ORDERS");

      const raw: unknown = await res.json();
      if (!Array.isArray(raw)) {
        setOrders([]);
        return;
      }

      const pendingOrders = raw as Order[];

      /* Gom product_id */
      const productIds = Array.from(
        new Set(
          pendingOrders.flatMap((o) =>
            o.order_items.map((i) => i.product_id)
          )
        )
      );

      if (productIds.length === 0) {
        setOrders(pendingOrders);
        return;
      }

      /* Fetch products */
      const productRes = await fetch(
        `/api/products?ids=${productIds.join(",")}`,
        { cache: "no-store" }
      );

      if (!productRes.ok) {
        setOrders(pendingOrders);
        return;
      }

      const products: Product[] = await productRes.json();
      const productMap = Object.fromEntries(
        products.map((p) => [p.id, p])
      );

      /* Gắn product vào order_items */
      const enriched = pendingOrders.map((o) => ({
        ...o,
        order_items: o.order_items.map((i) => ({
          ...i,
          product: productMap[i.product_id],
        })),
      }));

      setOrders(enriched);
    } catch (err) {
      console.error("❌ Seller pending load error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     CONFIRM ORDER (SELLER)
  ========================= */
  async function confirmOrder(orderId: string): Promise<void> {
    try {
      setConfirmingId(orderId);

      const res = await apiAuthFetch(
        `/api/seller/orders/${orderId}/confirm`,
        { method: "PATCH" }
      );

      if (!res.ok) {
        throw new Error("CONFIRM_FAILED");
      }

      await loadOrders();
    } catch (err) {
      console.error("❌ Confirm error:", err);
      alert(t.confirm_failed || "Xác nhận thất bại");
    } finally {
      setConfirmingId(null);
    }
  }

  /* =========================
     STATS
  ========================= */
  const totalPi = orders.reduce(
    (sum, o) =>
      sum +
      o.order_items.reduce(
        (s, i) => s + i.price * i.quantity,
        0
      ),
    0
  );

  /* =========================
     UI
  ========================= */
  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading || "Đang tải..."}
      </p>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* HEADER */}
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.pending_orders || "Đơn hàng chờ xác nhận"}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {t.orders}: {orders.length} · π{formatPi(totalPi)}
          </p>
        </div>
      </header>

      {/* CONTENT */}
      <section className="mt-6 px-4 space-y-3">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">
            {t.no_pending_orders ||
              "Không có đơn hàng chờ xác nhận"}
          </p>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-lg p-4 shadow-sm"
            >
              {/* ORDER HEADER */}
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">
                  #{o.id.slice(0, 8)}
                </span>
                <span className="text-orange-500 text-sm">
                  {t[`status_${o.status}`] ?? o.status}
                </span>
              </div>

              {/* ITEMS */}
              <div className="space-y-2">
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

              {/* TOTAL */}
              <p className="mt-3 text-sm font-medium">
                {t.total || "Tổng"}: π
                {formatPi(
                  o.order_items.reduce(
                    (s, i) => s + i.price * i.quantity,
                    0
                  )
                )}
              </p>

              {/* ACTION */}
              <button
                disabled={confirmingId === o.id}
                onClick={() => void confirmOrder(o.id)}
                className="mt-3 w-full bg-orange-500 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
              >
                {confirmingId === o.id
                  ? " Đang xử lý..."
                  : t.confirm_order || "✅ Xác nhận đơn"}
              </button>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
