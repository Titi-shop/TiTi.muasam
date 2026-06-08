"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { formatPi } from "@/lib/pi";

import type { ReturnRecord } from "../types";
import {
  getImage,
  getStatusConfig,
} from "../utils";

type Props = {
  item: ReturnRecord;
};

export default function ReturnCard({
  item,
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  const config = getStatusConfig(
    item.status,
    t as Record<string, string>
  );

  const Icon = config.icon;

  const steps = [
    "pending",
    "approved",
    "shipping_back",
    "received",
    "refund_pending",
    "refunded",
  ];

  return (
    <button
      type="button"
      onClick={() =>
        router.push(
          `/customer/returns/${item.id}`
        )
      }
      className="
        group w-full overflow-hidden
        rounded-3xl
        border border-orange-500/10
        bg-[var(--card-bg)]
        text-left
        shadow-sm
        transition-all duration-300
        hover:border-orange-500/30
        hover:shadow-lg
        active:scale-[0.99]
      "
    >
      <div className="p-4">

        {/* TOP */}
        <div className="flex gap-4">

          {/* IMAGE */}
          <div
            className="
              relative h-24 w-24 shrink-0
              overflow-hidden rounded-2xl
              border border-orange-500/10
              bg-[var(--card-secondary)]
            "
          >
            <img
              src={getImage(item.thumbnail)}
              alt="product"
              onError={(e) => {
                e.currentTarget.src =
                  "/placeholder.png";
              }}
              className="
                h-full w-full object-cover
                transition-transform duration-300
                group-hover:scale-105
              "
            />
          </div>

          {/* INFO */}
          <div className="min-w-0 flex-1">

            {/* HEADER */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className="
                    truncate text-sm font-bold
                    text-[var(--foreground)]
                  "
                >
                  #
                  {item.return_number ??
                    item.id.slice(0, 8)}
                </p>

                <p
                  className="
                    mt-1 text-xs
                    text-[var(--text-muted)]
                  "
                >
                  {t.order ?? "Order"}:
                  #{item.order_id?.slice(0, 8)}
                </p>
              </div>

              <ChevronRight
                size={18}
                className="
                  mt-1 shrink-0
                  text-[var(--text-muted)]
                "
              />
            </div>

            {/* STATUS */}
            <div
              className={`
                mt-3 inline-flex items-center gap-2
                rounded-full border px-3 py-1.5
                text-xs font-semibold
                ${config.className}
              `}
            >
              <Icon size={14} />

              <span>{config.text}</span>
            </div>

            {/* PRODUCT */}
            {item.product_name && (
              <p
                className="
                  mt-3 line-clamp-2
                  text-sm
                  text-[var(--foreground)]
                "
              >
                {item.product_name}
              </p>
            )}
          </div>
        </div>

        {/* TIMELINE */}
        {![
          "rejected",
          "cancelled",
        ].includes(item.status) && (
          <div className="mt-5">
            <div className="flex items-center gap-2">
              {steps.map(
                (step, index) => {
                  const active =
                    steps.indexOf(
                      item.status
                    ) >= index;

                  return (
                    <div
                      key={step}
                      className="
                        flex flex-1
                        items-center gap-2
                      "
                    >
                      <div
                        className={`
                          h-2.5 w-2.5 rounded-full
                          ${
                            active
                              ? "bg-orange-500"
                              : "bg-[var(--border)]"
                          }
                        `}
                      />

                      {index !==
                        steps.length -
                          1 && (
                        <div
                          className={`
                            h-[2px] flex-1
                            ${
                              active
                                ? "bg-orange-500"
                                : "bg-[var(--border)]"
                            }
                          `}
                        />
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* EXTRA */}
        <div className="mt-4 space-y-2">

          {/* TRACKING */}
          {item.return_tracking_code && (
            <div
              className="
                rounded-2xl
                border border-blue-500/10
                bg-blue-500/5
                px-3 py-2
                text-xs text-blue-500
              "
            >
              🚚{" "}
              {t.return_tracking ??
                "Tracking"}
              :{" "}
              {
                item.return_tracking_code
              }
            </div>
          )}

          {/* REFUND */}
          {item.refund_amount && (
            <div
              className="
                flex items-center justify-between
                rounded-2xl
                border border-green-500/10
                bg-green-500/5
                px-3 py-2
              "
            >
              <span
                className="
                  text-xs
                  text-[var(--text-muted)]
                "
              >
                {t.refund_amount ??
                  "Refund Amount"}
              </span>

              <span
                className="
                  text-sm font-bold
                  text-green-500
                "
              >
                π
                {formatPi(
                  Number(
                    item.refund_amount
                  )
                )}
              </span>
            </div>
          )}

          {/* DATES */}
          <div
            className="
              flex flex-wrap
              items-center gap-3
              text-[11px]
              text-[var(--text-muted)]
            "
          >
            {item.created_at && (
              <span>
                🕒{" "}
                {new Date(
                  item.created_at
                ).toLocaleString()}
              </span>
            )}

            {item.refunded_at && (
              <span className="text-green-500">
                💸{" "}
                {new Date(
                  item.refunded_at
                ).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
