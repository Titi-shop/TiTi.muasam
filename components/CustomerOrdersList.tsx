"use client";

import { useMemo, useState } from "react";

export type OrderStatus =
  | "pending"
  | "pending_fulfillment"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export type Order = {
  id: string;
  order_number: string;
  created_at: string;
  fulfillment_status: OrderStatus;
  total: number;
  order_items: any[];
};

type Props = {
  orders: Order[];
  initialTab?: OrderStatus | "all";
  reviewedMap?: Record<string, boolean>;

  onDetail?: (id: string) => void;
  onCancel?: (id: string) => void;
  onReceived?: (id: string) => void;
  onReview?: (id: string) => void;
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending Payment",
  pending_fulfillment: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-gray-200 text-gray-700",
  pending_fulfillment: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-orange-100 text-orange-700",
};

export default function CustomerOrdersList({
  orders,
  initialTab = "all",
  reviewedMap = {},
  onDetail,
  onCancel,
  onReceived,
  onReview,
}: Props) {
  const [tab, setTab] = useState(initialTab);

  /* ================= FILTER ================= */

  const filtered = useMemo(() => {
    if (tab === "all") return orders;
    return orders.filter(o => o.fulfillment_status === tab);
  }, [orders, tab]);

  /* ================= TABS ================= */

  const tabs: (OrderStatus | "all")[] = [
    "all",
    "pending",
    "pending_fulfillment",
    "processing",
    "shipped",
    "delivered",
    "completed",
    "cancelled",
    "refunded",
  ];

  /* ================= UI ================= */

  return (
    <div className="w-full">
      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto px-3 py-3 border-b bg-white">
        {tabs.map(t => {
          const active = tab === t;

          return (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${
                active
                  ? "bg-black text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {t === "all" ? "All" : STATUS_LABEL[t as OrderStatus]}
            </button>
          );
        })}
      </div>

      {/* LIST */}
      <div className="p-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-10">
            No orders
          </div>
        ) : (
          filtered.map(order => (
            <div
              key={order.id}
              className="border rounded-xl p-3 bg-white shadow-sm"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold">
                    #{order.order_number}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>

                {/* STATUS BADGE */}
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    STATUS_COLOR[order.fulfillment_status]
                  }`}
                >
                  {STATUS_LABEL[order.fulfillment_status]}
                </span>
              </div>

              {/* TOTAL */}
              <div className="mt-2 text-sm">
                Total: <b>${order.total}</b>
              </div>

              {/* ACTIONS */}
              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => onDetail?.(order.id)}
                  className="px-3 py-1 text-xs border rounded"
                >
                  Detail
                </button>

                {order.fulfillment_status === "delivered" && (
                  <>
                    <button
                      onClick={() => onReceived?.(order.id)}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded"
                    >
                      Confirm received
                    </button>

                    {!reviewedMap[order.id] && (
                      <button
                        onClick={() => onReview?.(order.id)}
                        className="px-3 py-1 text-xs bg-yellow-500 text-white rounded"
                      >
                        Review
                      </button>
                    )}
                  </>
                )}

                {["pending", "pending_fulfillment"].includes(
                  order.fulfillment_status
                ) && (
                  <button
                    onClick={() => onCancel?.(order.id)}
                    className="px-3 py-1 text-xs border border-red-500 text-red-500 rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
            }
