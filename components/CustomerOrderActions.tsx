"use client";

import type { MouseEvent } from "react";

import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =======================================================
   TYPES
======================================================= */

type FulfillmentStatus =
  | "pending"
  | "pending_fulfillment"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

type LegacyStatus =
  | "confirmed"
  | "shipping";

type OrderStatus =
  | FulfillmentStatus
  | LegacyStatus
  | string;

type Props = {
  status: OrderStatus;

  reviewed?: boolean;

  onDetail: () => void;

  onCancel?: () => void;

  onReceived?: () => void;

  onReview?: () => void;
};

/* =======================================================
   STATUS HELPERS
======================================================= */

function isPending(
  status: OrderStatus
): boolean {
  return (
    status === "pending" ||
    status ===
      "pending_fulfillment"
  );
}

function isConfirmed(
  status: OrderStatus
): boolean {
  return (
    status === "confirmed" ||
    status === "processing"
  );
}

function isShipping(
  status: OrderStatus
): boolean {
  return (
    status === "shipping" ||
    status === "shipped" ||
    status === "delivered"
  );
}

function isCompleted(
  status: OrderStatus
): boolean {
  return (
    status === "completed"
  );
}

function isCancelled(
  status: OrderStatus
): boolean {
  return (
    status === "cancelled" ||
    status === "refunded"
  );
}

/* =======================================================
   COMPONENT
======================================================= */

export default function CustomerOrderActions({
  status,
  reviewed = false,
  onDetail,
  onCancel,
  onReceived,
  onReview,
}: Props) {
  const { t } =
    useTranslation();

  function stopAndRun(
    fn?: () => void
  ) {
    return (
      e: MouseEvent<HTMLButtonElement>
    ) => {
      e.preventDefault();
      e.stopPropagation();

      fn?.();
    };
  }

  const baseBtn =
    "px-3 py-2 rounded-xl text-sm font-medium transition active:scale-95";

  const pending =
    isPending(status);

  const confirmed =
    isConfirmed(status);

  const shipping =
    isShipping(status);

  const completed =
    isCompleted(status);

  const cancelled =
    isCancelled(status);

  return (
    <div
      className="flex flex-wrap justify-end gap-2"
      onClick={(e) =>
        e.stopPropagation()
      }
    >
      {/* DETAIL */}
      <button
        type="button"
        onClick={stopAndRun(
          onDetail
        )}
        className={`${baseBtn} border border-gray-300 bg-white text-gray-700`}
      >
        {t.detail ??
          "Detail"}
      </button>

      {/* PENDING -> CANCEL */}
      {pending &&
        !cancelled &&
        onCancel && (
          <button
            type="button"
            onClick={stopAndRun(
              onCancel
            )}
            className={`${baseBtn} border border-red-500 bg-white text-red-500`}
          >
            {t.cancel_order ??
              "Cancel"}
          </button>
        )}

      {/* SHIPPING -> RECEIVED */}
      {shipping &&
        onReceived && (
          <button
            type="button"
            onClick={stopAndRun(
              onReceived
            )}
            className={`${baseBtn} bg-green-600 text-white`}
          >
            {t.received ??
              "Received"}
          </button>
        )}

      {/* COMPLETED -> REVIEW */}
      {completed &&
        !reviewed &&
        onReview && (
          <button
            type="button"
            onClick={stopAndRun(
              onReview
            )}
            className={`${baseBtn} border border-orange-500 bg-white text-orange-500`}
          >
            {t.review_orders ??
              "Review"}
          </button>
        )}

      {/* COMPLETED -> REVIEWED */}
      {completed &&
        reviewed && (
          <button
            type="button"
            disabled
            className={`${baseBtn} cursor-default bg-green-100 text-green-600`}
          >
            {t.order_review ??
              "Reviewed"}
          </button>
        )}
    </div>
  );
}
