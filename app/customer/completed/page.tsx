"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   TYPES
========================= */
type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled";

interface Product {
  id: string;
  name: string;
  images: string[];
}

interface OrderItem {
  quantity: number;
  price: number;
  product_id: string;
  seller_message?: string | null;
  seller_cancel_reason?: string | null;
  product?: Product;
}

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  order_items: OrderItem[];
}

interface ReviewMap {
  [productId: string]: boolean;
}

/* =========================
   PAGE
========================= */
export default function CompletedOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedMap, setReviewedMap] = useState<ReviewMap>({});

  function formatPi(value: number | string): string {
    return Number(value).toFixed(6);
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  /* =========================
     LOAD COMPLETED ORDERS
  ========================== */
  async function loadOrders(): Promise<void> {
    try {
      const token = await getPiAccessToken();

      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("UNAUTHORIZED");

      const rawOrders: Order[] = await res.json();

      const completed = rawOrders.filter(
        (o) => o.status === "completed"
      );

      const productIds = Array.from(
        new Set(
          completed.flatMap((o) =>
            (o.order_items ?? []).map((i) => i.product_id)
          )
        )
      );

      if (productIds.length === 0) {
        setOrders([]);
        return;
      }

      /* FETCH PRODUCTS */
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

      /* FETCH REVIEWS */
      const reviewRes = await fetch(
        `/api/reviews?product_ids=${productIds.join(",")}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      if (!reviewRes.ok)
        throw new Error("FETCH_REVIEWS_FAILED");

      const reviews: { product_id: string }[] =
        await reviewRes.json();

      const reviewMap: ReviewMap = {};
      reviews.forEach((r) => {
        reviewMap[r.product_id] = true;
      });

      setReviewedMap(reviewMap);

      /* ENRICH + FILTER ONLY REVIEWED */
      const enriched = completed.map((o) => ({
        ...o,
        order_items: (o.order_items ?? [])
          .map((i) => ({
            ...i,
            product: productMap[i.product_id],
          }))
          .filter((i) => reviewMap[i.product_id]), // ✅ CHỈ HIỂN THỊ ĐÃ REVIEW
      }));

      /* Remove orders with no reviewed items */
      const filteredOrders = enriched.filter(
        (o) => o.order_items.length > 0
      );

      setOrders(filteredOrders);
    } catch (err) {
      console.error("Load completed error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
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
            {t.orders}: {orders.length} · π
            {formatPi(totalPi)}
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
          <div className="flex flex-col items-center justify-center mt-16 text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>{t.no_completed_orders}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                <div className="flex justify-between items-center px-4 py-3 border-b">
                  <span className="font-semibold text-sm">
                    #{o.id}
                  </span>
                  <span className="text-green-600 text-sm font-medium">
                    {t.order_review}
                  </span>
                </div>

                <div className="px-4 py-3 space-y-3">
                  {o.order_items.map((item) => (
                    <div
                      key={item.product_id}
                      className="border-t pt-3 mt-3"
                    >
                      <div className="flex gap-3 items-center">
                        <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden">
                          {item.product?.images?.[0] && (
                            <img
                              src={item.product.images[0]}
                              alt={
                                item.product?.name ?? ""
                              }
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">
                            {item.product?.name ??
                              t.no_name}
                          </p>

                          <p className="text-xs text-gray-500">
                            x{item.quantity} · π
                            {formatPi(item.price)}
                          </p>

                          {item.seller_message && (
                            <p className="text-xs text-blue-600 mt-1">
                              {t.seller_message}:{" "}
                              {item.seller_message}
                            </p>
                          )}

                          {item.seller_cancel_reason && (
                            <p className="text-xs text-red-500 mt-1">
                              {t.seller_cancel_reason}:{" "}
                              {item.seller_cancel_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
