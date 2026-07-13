"use client";

import { Search, X } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

import type { OrderFilter } from "../types";

type Props = {
  value: OrderFilter;
  onChange: (value: OrderFilter) => void;
};

export default function FilterBar({
  value,
  onChange,
}: Props) {
  const { t } = useTranslation();

  function update<K extends keyof OrderFilter>(
    key: K,
    val: OrderFilter[K]
  ) {
    onChange({
      ...value,
      [key]: val,
    });
  }

  const hasFilter =
    value.keyword ||
    value.from ||
    value.to;

  return (
    <section className="space-y-3 px-4 py-4">

      {/* SEARCH */}

      <div className="relative">

        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />

        <input
          type="text"
          value={value.keyword}
          placeholder={
            t.search_order ??
            "Search order..."
          }
          onChange={(e) =>
            update(
              "keyword",
              e.target.value
            )
          }
          className="
  h-11
  w-full
  rounded-xl
  border
  border-[var(--border-color)]
  bg-[var(--card-bg)]
  pl-10
  pr-10
  text-sm
  text-[var(--text-primary)]
  outline-none
  transition-colors
  focus:border-[var(--color-primary)]
"
        />

        {value.keyword && (

          <button
            type="button"
            onClick={() =>
              update(
                "keyword",
                ""
              )
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          >
            <X size={16} />
          </button>

        )}

      </div>

      {/* DATE */}

      <div className="grid grid-cols-2 gap-3">

        <input
          type="date"
          value={value.from}
          onChange={(e) =>
            update(
              "from",
              e.target.value
            )
          }
          className="
  h-11
  rounded-xl
  border
  border-[var(--border-color)]
  bg-[var(--card-bg)]
  px-3
  text-sm
  text-[var(--text-primary)]
  transition-colors
  focus:border-[var(--color-primary)]
"
        />

        <input
          type="date"
          value={value.to}
          onChange={(e) =>
            update(
              "to",
              e.target.value
            )
          }
          className="
  h-11
  rounded-xl
  border
  border-[var(--border-color)]
  bg-[var(--card-bg)]
  px-3
  text-sm
  text-[var(--text-primary)]
  transition-colors
  focus:border-[var(--color-primary)]
"
        />

      </div>

      {/* FOOTER */}

      {hasFilter && (

        <div className="flex justify-end">

          <button
            type="button"
            onClick={() =>
              onChange({
                keyword: "",
                from: "",
                to: "",
                status: value.status,
              })
            }
            className="
  rounded-xl
  border
  border-[var(--border-color)]
  bg-[var(--card-bg)]
  px-4
  py-2
  text-sm
  text-[var(--text-primary)]
  transition-colors
  hover:bg-[var(--surface-2)]
"
          >
            {t.reset ?? "Reset"}
          </button>

        </div>

      )}

    </section>
  );
}
