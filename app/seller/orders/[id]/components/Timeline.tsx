"use client";

import type { Order } from "../types";

type Props = {
  order: Order;
};

function formatDate(date?: string | null) {
  if (!date) return "Waiting";

  const d = new Date(date);

  return Number.isNaN(d.getTime())
    ? "Waiting"
    : d.toLocaleString();
}

export default function Timeline({
  order,
}: Props) {
  const steps = [
    {
      key: "pending",
      label: "Pending",
      time: order.created_at,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      time: order.confirmed_at,
    },
    {
      key: "shipping",
      label: "Shipping",
      time: order.shipped_at,
    },
    {
      key: "completed",
      label: "Completed",
      time: order.delivered_at,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      time: order.cancelled_at,
    },
  ];

  const current =
    order.cancelled_at
      ? "cancelled"
      : order.delivered_at
      ? "completed"
      : order.shipped_at
      ? "shipping"
      : order.confirmed_at
      ? "confirmed"
      : "pending";

  return (
    <section
      className="
        mb-4
        rounded-2xl
        border
        border-[var(--border-color)]
        bg-[var(--card-bg)]
        p-4
      "
    >
      <h2 className="mb-4 text-base font-semibold">
        Order Timeline
      </h2>

      <div className="space-y-4">
        {steps.map((step) => {
          const active = !!step.time;
          const currentStep =
            current === step.key;

          return (
            <div
              key={step.key}
              className="flex items-center gap-3"
            >
              <div
                className={`
                  h-3
                  w-3
                  rounded-full
                  ${
                    currentStep
                      ? "bg-[var(--color-info)] scale-125"
                      : active
                      ? "bg-[var(--color-success)]"
                      : "bg-gray-300"
                  }
                `}
              />

              <div>

                <div
                  className={`
                    font-medium
                    ${
                      currentStep
                        ? "text-[var(--color-info)]"
                        : ""
                    }
                  `}
                >
                  {step.label}
                </div>

                <div className="text-xs text-[var(--text-muted)]">
                  {formatDate(step.time)}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
