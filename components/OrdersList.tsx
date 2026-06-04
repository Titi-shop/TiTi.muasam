"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import OrderCard from "./OrderCard";

/* ======================================================
   TYPES (SELLER VIEW ONLY)
====================================================== */

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export type OrderTab = "all" | OrderStatus;

export interface Order {
  id: string;
  status: OrderStatus;
  created_at: string;
  total: number;
}

/* ======================================================
   COMPONENT
====================================================== */

type Props = {
  orders: Order[];
  onClick: (id: string) => void;
  initialTab?: OrderTab;
  onTabChange?: (tab: OrderTab) => void;
  renderActions?: (order: Order) => React.ReactNode;
  renderExtra?: (order: Order) => React.ReactNode;
};

export default function OrdersList({
  orders,
  onClick,
  initialTab = "all",
  onTabChange,
  renderActions,
  renderExtra,
}: Props) {
  const { t } = useTranslation();

  const [tab, setTab] = useState<OrderTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  /* ======================================================
     TABS (SELLER ONLY)
  ====================================================== */

  const tabs: Array<[OrderTab, string]> = [
    ["all", t.all ?? "All"],
    ["pending", t.pending ?? "Pending"],
    ["processing", t.processing ?? "Processing"],
    ["shipped", t.shipped ?? "Shipped"],
    ["delivered", t.delivered ?? "Delivered"],
    ["completed", t.completed ?? "Completed"],
    ["cancelled", t.cancelled ?? "Cancelled"],
    ["refunded", t.refunded ?? "Refunded"],
  ];

  /* ======================================================
     COUNTS
  ====================================================== */

  const counts = useMemo(() => {
    const map: Record<OrderTab, number> = {
      all: orders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
    };

    for (const o of orders) {
      if (o.status in map) {
        map[o.status as OrderTab]++;
      }
    }

    return map;
  }, [orders]);

  /* ======================================================
     FILTER
  ====================================================== */

  const filtered = useMemo(() => {
    if (tab === "all") return orders;
    return orders.filter((o) => o.status === tab);
  }, [orders, tab]);

  function handleTabChange(next: OrderTab) {
    setTab(next);
    onTabChange?.(next);
  }

  /* ======================================================
     UI
  ====================================================== */

  return (
    <section className="w-full">
      {/* TABS */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="flex gap-3 px-4 py-3 overflow-x-auto whitespace-nowrap">
          {tabs.map(([key, label]) => {
            const active = tab === key;

            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`px-3 py-2 text-sm rounded-xl border transition ${
                  active
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-500 border-gray-200"
                }`}
              >
                <div>{label}</div>
                <div className="text-[11px] opacity-70">
                  {counts[key]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* LIST */}
      <div className="p-4 space-y-4">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400 border rounded-2xl">
            {t.no_orders ?? "No orders"}
          </div>
        ) : (
          filtered.map((order) => (
            <div key={order.id} className="space-y-3">
              <OrderCard
                order={order}
                onClick={() => onClick(order.id)}
                actions={renderActions?.(order)}
              />

              {renderExtra?.(order)}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
