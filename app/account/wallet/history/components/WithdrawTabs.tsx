// =====================================================
// app/account/wallet/history/components/WithdrawTabs.tsx
// =====================================================

"use client";

import type {
  WithdrawFilter,
} from "../history.types";

/* =====================================================
   TYPES
===================================================== */

type Props = {

  value: WithdrawFilter;

  counts: {

    all: number;

    pending: number;

    processing: number;

    completed: number;

    rejected: number;

    cancelled: number;

  };

  onChange: (
    value: WithdrawFilter
  ) => void;

};

/* =====================================================
   TABS
===================================================== */

const tabs: {

  value: WithdrawFilter;

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
    value: "processing",
    label: "Processing",
  },

  {
    value: "completed",
    label: "Completed",
  },

  {
    value: "rejected",
    label: "Rejected",
  },

  {
    value: "cancelled",
    label: "Cancelled",
  },

];

/* =====================================================
   COMPONENT
===================================================== */

export default function WithdrawTabs({

  value,

  counts,

  onChange,

}: Props) {

  return (

    <div
      className="
        flex
        gap-2
        overflow-x-auto
        px-4
        py-4
        scrollbar-hide
      "
    >

      {tabs.map((tab) => {

        const count =
          counts[
            tab.value
          ];

        const active =
          value ===
          tab.value;

        return (

          <button
            key={
              tab.value
            }
            type="button"
            onClick={() => {

              onChange(
                tab.value
              );

            }}
            className={`
              shrink-0
              rounded-full
              px-4
              py-2
              text-sm
              font-medium
              transition-all
              ${
                active
                  ? `
                    bg-primary
                    text-white
                  `
                  : `
                    border
                    border-border
                    bg-background
                    hover:bg-muted
                  `
              }
            `}
          >

            {tab.label}

            <span
              className="
                ml-2
                rounded-full
                bg-black/10
                px-2
                py-0.5
                text-[11px]
              "
            >

              {count}

            </span>

          </button>

        );

      })}

    </div>

  );

}
