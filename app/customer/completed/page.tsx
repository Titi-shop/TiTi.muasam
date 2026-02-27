"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useRouter } from "next/navigation";
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
  product?: Product;
}

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  order_items: OrderItem[];
}

interface ReviewMap {
  [orderId: string]: boolean;
}

/* =========================
   PAGE
========================= */
export default function CompletedOrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewedMap, setReviewedMap] = useState<ReviewMap>({});
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");

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

      const filtered = rawOrders.filter(
        (o) => o.status === "completed"
      );

      setOrders(filtered);

      // check review existence
      const reviewRes = await fetch("/api/reviews/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (reviewRes.ok) {
        const reviewedIds: string[] = await reviewRes.json();
        const map: ReviewMap = {};
        reviewedIds.forEach((id) => (map[id] = true));
        setReviewedMap(map);
      }
    } catch (err) {
      console.error("Load completed error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     SUBMIT REVIEW
  ========================== */
  async function submitReview(orderId: string) {
    try {
      const token = await getPiAccessToken();

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          rating,
          comment,
        }),
      });

      if (!res.ok) throw new Error("REVIEW_FAILED");

      setReviewedMap((prev) => ({
        ...prev,
        [orderId]: true,
      }));

      setActiveReviewId(null);
      setComment("");
      setRating(5);
    } catch (err) {
      alert("Review failed");
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
            {t.loading_orders}
          </p>
        ) : orders.length === 0 ? (
          <div className="flex justify-center mt-16 text-gray-400">
            {t.no_completed_orders}
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
                    {t.status_completed}
                  </span>
                </div>

                <div className="px-4 py-3 space-y-3">
                  {o.order_items.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {item.product?.name ?? t.no_name}
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
                <div className="px-4 py-3 border-t">
                  <p className="text-sm font-semibold mb-2">
                    {t.total}: π{formatPi(o.total)}
                  </p>

                  {reviewedMap[o.id] ? (
                    <button
                      disabled
                      className="px-4 py-1.5 text-sm bg-gray-200 text-gray-500 rounded-md"
                    >
                      {t.review_orders}
                    </button>
                  ) : activeReviewId === o.id ? (
                    <div className="space-y-2">
                      {/* 5 Stars */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-lg ${
                              star <= rating
                                ? "text-yellow-500"
                                : "text-gray-300"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      {/* Default comment */}
                      <textarea
                        value={comment}
                        onChange={(e) =>
                          setComment(e.target.value)
                        }
                        placeholder="Great product!"
                        className="w-full border rounded-md p-2 text-sm"
                      />

                      <button
                        onClick={() => submitReview(o.id)}
                        className="px-4 py-1.5 text-sm bg-green-500 text-white rounded-md"
                      >
                        {t.submit_review}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveReviewId(o.id)}
                      className="px-4 py-1.5 text-sm border border-green-500 text-green-500 rounded-md hover:bg-green-500 hover:text-white transition"
                    >
                      {t.review}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
