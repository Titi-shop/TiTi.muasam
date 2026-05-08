"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";
import CustomerOrderCard from "./CustomerOrderCard";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =======================================================
   TYPES (SOURCE OF TRUTH = fulfillment_status)
======================================================= */

type OrderTab =
  | "all"
  | "pending"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled";

type FulfillmentStatus =
  | "pending"
  | "pending_fulfillment"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

type Order = {
  id: string;
  fulfillment_status?: FulfillmentStatus;
  payment_status?: PaymentStatus;
  status?: string;
  order_items?: unknown[];
};

/* =======================================================
   STATE MACHINE (FIXED)
======================================================= */

function normalizeStatus(order: Order): OrderTab {
  const f = order.fulfillment_status;
  const p = order.payment_status;

  if (!f) return "pending";

  switch (f) {
    case "pending":
    case "pending_fulfillment":
      return "pending";

    case "processing":
      return "processing";

    case "shipped":
    case "delivered":
      return "shipping";

    case "completed":
      return "completed";

    case "cancelled":
    case "refunded":
      return "cancelled";

    default:
      break;
  }

  // fallback legacy
  if (p === "pending") return "pending";
  if (p === "failed" || p === "refunded") return "cancelled";

  return "pending";
}

/* =======================================================
   COMPONENT
======================================================= */

type Props = {
  orders: Order[];
  initialTab?: OrderTab;

  onDetail: (id: string) => void;
  onCancel?: (id: string) => void;
  onReceived?: (id: string) => void;
  onBuyAgain?: (id: string) => void;
  onReview?: (id: string) => void;

  reviewedMap?: Record<string, boolean>;
};

export default function CustomerOrdersList({
  orders,
  initialTab = "all",
  onDetail,
  onCancel,
  onReceived,
  onBuyAgain,
  onReview,
  reviewedMap,
}: Props) {
  return (
    <Suspense fallback={<div className="p-4 h-12 bg-white animate-pulse rounded-xl" />}>
      <Inner {...{
        orders,
        initialTab,
        onDetail,
        onCancel,
        onReceived,
        onBuyAgain,
        onReview,
        reviewedMap,
      }} />
    </Suspense>
  );
}

/* =======================================================
   INNER
======================================================= */

function Inner({
  orders,
  initialTab,
  onDetail,
  onCancel,
  onReceived,
  onBuyAgain,
  onReview,
  reviewedMap,
}: Props) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const urlTab = searchParams.get("tab") as OrderTab | null;

  const safeTab: OrderTab =
    urlTab &&
    ["all", "pending", "processing", "shipping", "completed", "cancelled"].includes(urlTab)
      ? urlTab
      : initialTab;

  const [tab, setTab] = useState<OrderTab>(safeTab);

  useEffect(() => {
    setTab(safeTab);
  }, [safeTab]);

  /* ================= TABS ================= */

  const tabs: Array<[OrderTab, string]> = [
    ["all", t.all ?? "All"],
    ["pending", t.order_pending ?? "Pending"],
    ["processing", t.order_processing ?? "Processing"],
    ["shipping", t.order_shipping ?? "Shipping"],
    ["completed", t.order_completed ?? "Completed"],
    ["cancelled", t.order_cancelled ?? "Cancelled"],
  ];

  /* ================= COUNTS ================= */

  const counts = useMemo(() => {
    const map: Record<OrderTab, number> = {
      all: orders.length,
      pending: 0,
      processing: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const o of orders) {
      const s = normalizeStatus(o);
      map[s]++;
    }

    return map;
  }, [orders]);

  /* ================= FILTER ================= */

  const filtered = useMemo(() => {
    if (tab === "all") return orders;
    return orders.filter(o => normalizeStatus(o) === tab);
  }, [orders, tab]);

  /* ================= UI ================= */

  return (
    <>
      {/* TABS */}
      <div className="sticky top-0 z-10 bg-white border-b overflow-x-auto whitespace-nowrap">
        <div className="flex min-w-max px-2">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm border-b-2 ${
                tab === key
                  ? "border-orange-500 text-orange-500 font-semibold"
                  : "border-transparent text-gray-500"
              }`}
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div className="p-4 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center text-sm text-gray-400 bg-white p-8 rounded-xl">
            {t.no_orders ?? "No orders"}
          </div>
        ) : (
          filtered.map(order => (
            <CustomerOrderCard
              key={order.id}
              order={order}
              reviewed={reviewedMap?.[order.id] ?? false}
              onDetail={() => onDetail(order.id)}
              onCancel={() => onCancel?.(order.id)}
              onReceived={() => onReceived?.(order.id)}
              onBuyAgain={() => onBuyAgain?.(order.id)}
              onReview={() => onReview?.(order.id)}
            />
          ))
        )}
      </div>
    </>
  );
}
