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
  product?: Product;
}

interface Order {
  id: string;
  total: number;
  status: OrderStatus;
  order_items: OrderItem[];
}

interface Review {
  order_id: string;
  product_id: string;
  rating: number;
  comment: string;
}

/* =========================
   PAGE
========================= */

export default function CompletedOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());

  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  function formatPi(value: number | string): string {
    return Number(value).toFixed(6);
  }

  useEffect(() => {
    void init();
  }, []);

  async function init(): Promise<void> {
    await loadOrders();
    await loadReviews();
  }

  /* =========================
     LOAD ORDERS
  ========================== */
  async function loadOrders(): Promise<void> {
    try {
      const token = await getPiAccessToken();

      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("LOAD_ORDERS_FAILED");

      const rawOrders: Order[] = await res.json();

      const completed = rawOrders.filter(
        (o) => o.status === "completed"
      );

      setOrders(completed);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     LOAD REVIEWS
  ========================== */
  async function loadReviews(): Promise<void> {
    try {
      const token = await getPiAccessToken();

      const res = await fetch("/api/reviews", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) return;

      const reviews: Review[] = await res.json();

      const reviewedSet = new Set(
        reviews.map((r) => r.order_id)
      );

      setReviewedOrders(reviewedSet);
    } catch (err) {
      console.error(err);
    }
  }

  /* =========================
     SUBMIT REVIEW
  ========================== */
  async function submitReview(
    orderId: string,
    productId: string
  ): Promise<void> {
    try {
      setReviewError(null);

      if (!comment.trim()) {
        setReviewError(
          t.review_comment_required ?? "Comment required"
        );
        return;
      }

      const token = await getPiAccessToken();

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          product_id: productId,
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setReviewError(
          data?.error ?? t.review_failed ?? "Review failed"
        );
        return;
      }

      // đánh dấu đã review
      setReviewedOrders((prev) => {
        const updated = new Set(prev);
        updated.add(orderId);
        return updated;
      });

      setActiveReviewId(null);
      setComment("");
      setRating(5);
    } catch (err) {
      setReviewError(t.review_failed ?? "Review failed");
    }
  }

  /* =========================
     UI
  ========================== */

  return (
    <main className="min-h-screen bg-gray-100 pb-24 px-4 pt-6">
      {loading ? (
        <p className="text-center text-gray-400">
          {t.loading_orders}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-400">
          {t.no_completed_orders}
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-xl shadow-sm p-4"
            >
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-sm">
                  #{o.id}
                </span>
                <span className="text-orange-500 text-sm">
                  {t.status_completed}
                </span>
              </div>

              <p className="text-sm font-medium mb-3">
                {t.total}: π{formatPi(o.total)}
              </p>

              {/* ĐÃ REVIEW */}
              {reviewedOrders.has(o.id) ? (
                <div className="px-4 py-2 text-sm bg-green-100 text-green-600 rounded-md inline-block">
                  {t.order_review ?? "Đã đánh giá"}
                </div>
              ) : activeReviewId === o.id ? (
                /* FORM REVIEW */
                <div className="space-y-3">
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

                  <textarea
                    value={comment}
                    onChange={(e) =>
                      setComment(e.target.value)
                    }
                    placeholder={
                      t.default_review_comment ??
                      "Write your review..."
                    }
                    className="w-full border rounded-md p-2 text-sm"
                  />

                  {reviewError && (
                    <p className="text-sm text-red-500">
                      {reviewError}
                    </p>
                  )}

                  <button
                    onClick={() =>
                      submitReview(
                        o.id,
                        o.order_items?.[0]?.product_id
                      )
                    }
                    className="px-4 py-1.5 text-sm bg-orange-500 text-white rounded-md"
                  >
                    {t.submit_review}
                  </button>
                </div>
              ) : (
                /* NÚT ĐÁNH GIÁ */
                <button
                  onClick={() =>
                    setActiveReviewId(o.id)
                  }
                  className="px-4 py-1.5 text-sm border border-orange-500 text-orange-500 rounded-md"
                >
                  {t.review_orders}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
