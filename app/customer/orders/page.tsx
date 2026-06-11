"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

import CustomerOrdersList from "@/components/CustomerOrdersList";

import { formatPi } from "@/lib/pi";

import { useOrders } from "./hooks/useOrders";
import { useOrderReviews } from "./hooks/useOrderReviews";
import { useOptimisticOrders } from "./hooks/useOptimisticOrders";
import { useOrderActions } from "./hooks/useOrderActions";

import CancelOrderModal from "./modals/CancelOrderModal";
import ReviewOrderModal from "./modals/ReviewOrderModal";
import ConfirmReceivedModal from "./modals/ConfirmReceivedModal";

export default function CustomerOrdersPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const { user, loading } = useAuth();

  const [toast, setToast] = useState("");

  const [showCancelFor, setShowCancelFor] =
    useState<string | null>(null);

  const [activeReviewId, setActiveReviewId] =
    useState<string | null>(null);

  const [confirmReceivedFor, setConfirmReceivedFor] =
    useState<string | null>(null);

  const {
    orders,
    totalPi,
    mutate,
    isLoading,
  } = useOrders(user);

  const mergedOrders =
    useOptimisticOrders(orders);

  const {
    reviewedMap,
    markReviewed,
  } = useOrderReviews();

  const {
    processingId,
    rating,
    setRating,
    comment,
    setComment,
    selectedReason,
    setSelectedReason,
    customReason,
    setCustomReason,
    resetReview,
    resetCancel,
    handleCancel,
    handleReceived,
    handleReview,
  } = useOrderActions({
    mutate,
    markReviewed,
    showToast: setToast,
    t,
    orders: mergedOrders,
    onCloseReview: () =>
      setActiveReviewId(null),
    onCloseCancel: () =>
      setShowCancelFor(null),
  });

  if (loading || isLoading) {
    return (
      <main className="min-h-screen p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="
              h-28
              animate-pulse
              rounded-2xl
              bg-[var(--card-bg)]
            "
          />
        ))}
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-32">

      {toast && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2">
          {toast}
        </div>
      )}

      <header className="p-4">
        <div className="rounded-2xl border p-4">
          <p>
            {t.orders ?? "Orders"}
          </p>

          <p>
            {mergedOrders.length}
            {" · "}
            π{formatPi(totalPi)}
          </p>
        </div>
      </header>

      <Suspense fallback={null}>
        <CustomerOrdersList
          initialTab="all"
          orders={mergedOrders}
          reviewedMap={reviewedMap}
          onDetail={(id) =>
            router.push(
              `/customer/orders/${id}`
            )
          }
          onCancel={setShowCancelFor}
          onReceived={setConfirmReceivedFor}
          onReview={setActiveReviewId}
        />
      </Suspense>

      <CancelOrderModal
        open={Boolean(showCancelFor)}
        processingId={processingId}
        selectedReason={selectedReason}
        customReason={customReason}
        setSelectedReason={setSelectedReason}
        setCustomReason={setCustomReason}
        onClose={resetCancel}
        onConfirm={() => {
          if (!showCancelFor) return;

          void handleCancel(showCancelFor);
        }}
      />

      <ReviewOrderModal
        open={Boolean(activeReviewId)}
        rating={rating}
        comment={comment}
        processingId={processingId}
        setRating={setRating}
        setComment={setComment}
        onClose={resetReview}
        onSubmit={() => {
          const order =
            mergedOrders.find(
              item =>
                item.id === activeReviewId
            );

          if (!order) return;

          void handleReview(order);
        }}
      />

      <ConfirmReceivedModal
        open={Boolean(confirmReceivedFor)}
        processingId={processingId}
        onClose={() =>
          setConfirmReceivedFor(null)
        }
        onConfirm={async () => {
          if (!confirmReceivedFor) return;

          await handleReceived(
            confirmReceivedFor
          );

          setConfirmReceivedFor(null);
        }}
      />
    </main>
  );
}
