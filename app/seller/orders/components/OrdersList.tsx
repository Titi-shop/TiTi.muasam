"use client";

import OrderCard from "./OrderCard";
import OrderActions from "./OrderActions";

import type {
  Order,
  OrderFilter,
  OrderStatus,
} from "../types";

type Props = {
  orders: Order[];

  filter: OrderFilter;

  onFilterChange: (
    filter: OrderFilter
  ) => void;

  loadingId?: string | null;

  onDetail: (id: string) => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onShipping: (id: string) => void;
};

const STATUS_TABS: {
  value: OrderFilter["status"];
  label: string;
}[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "pending_fulfillment",
    label: "To Fulfill",
  },
  {
    value: "processing",
    label: "Processing",
  },
  {
    value: "shipped",
    label: "Shipped",
  },
  {
    value: "delivered",
    label: "Delivered",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

export default function OrdersList({
  orders,

  filter,
  onFilterChange,

  loadingId,

  onDetail,
  onConfirm,
  onCancel,
  onShipping,
}: Props) {
  const stats = {
    all: orders.length,

    pending: orders.filter(
      (o) =>
        o.fulfillment_status ===
        "pending"
    ).length,

    pending_fulfillment:
      orders.filter(
        (o) =>
          o.fulfillment_status ===
          "pending_fulfillment"
      ).length,

    processing:
      orders.filter(
        (o) =>
          o.fulfillment_status ===
          "processing"
      ).length,

    shipped: orders.filter(
      (o) =>
        o.fulfillment_status ===
        "shipped"
    ).length,

    delivered:
      orders.filter(
        (o) =>
          o.fulfillment_status ===
          "delivered"
      ).length,

    completed:
      orders.filter(
        (o) =>
          o.fulfillment_status ===
          "completed"
      ).length,

    cancelled:
      orders.filter(
        (o) =>
          o.fulfillment_status ===
          "cancelled"
      ).length,
  };

  
    /* =========================================================
     STATUS TABS
  ========================================================= */

  return (
    <div className="space-y-4">

      <div
        className="
          sticky
          top-0
          z-20
          -mx-4
          border-y
          border-gray-200
          bg-white/95
          backdrop-blur
          dark:border-zinc-800
          dark:bg-zinc-950/95
        "
      >
        <div
          className="
            flex
            gap-2
            overflow-x-auto
            px-4
            py-3
            scrollbar-none
          "
        >
          {STATUS_TABS.map((tab) => {
            const count =
              stats[
                tab.value as keyof typeof stats
              ];

            const active =
              filter.status === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() =>
                  onFilterChange({
                    ...filter,
                    status: tab.value,
                  })
                }
                className={`
                  flex
                  shrink-0
                  items-center
                  gap-2
                  rounded-full
                  border
                  px-4
                  py-2
                  text-sm
                  font-medium
                  transition-all
                  duration-200

                  ${
                    active
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  }
                `}
              >
                <span>
                  {tab.label}
                </span>

                <span
                  className={`
                    rounded-full
                    px-2
                    py-0.5
                    text-xs
                    font-semibold

                    ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300"
                    }
                  `}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
            {/* =========================================================
          EMPTY
      ========================================================= */}

      {visibleOrders.length === 0 ? (
        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-gray-300
            bg-white
            py-20
            text-center
            text-gray-500
            dark:border-zinc-700
            dark:bg-zinc-900
            dark:text-zinc-400
          "
        >
          Không có đơn hàng.
        </div>
      ) : (
        <div className="space-y-4 px-4">

          {visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() =>
                onDetail(order.id)
              }
              actions={
                <OrderActions
                  orderId={order.id}
                  status={order.fulfillment_status}
                  loading={
                    loadingId === order.id
                  }
                  onDetail={() =>
                    onDetail(order.id)
                  }
                  onConfirm={() =>
                    onConfirm(order.id)
                  }
                  onCancel={() =>
                    onCancel(order.id)
                  }
                  onShipping={() =>
                    onShipping(order.id)
                  }
                />
              }
            />
          ))}

        </div>
      )}

    </div>
  );
}
