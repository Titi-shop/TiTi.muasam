"use client";

import { Package } from "lucide-react";

import { formatPi } from "@/lib/pi";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

type Props = {
  title: string;
  totalOrders: number;
  totalAmount: number;
};

export default function Header({
  title,
  totalOrders,
  totalAmount,
}: Props) {
  const { t } = useTranslation();

  return (
    <header
  className="
    sticky
    top-0
    z-30
    border-b
    border-[var(--border-color)]
    bg-[color:color-mix(in_srgb,var(--surface-1)_92%,transparent)]
    backdrop-blur
  "
>
      <div className="mx-auto flex items-center justify-between px-4 py-4">

        <div className="flex items-center gap-3">

      <div
  className="
    flex
    h-11
    w-11
    items-center
    justify-center
    rounded-2xl
    bg-[var(--color-primary)]
    text-white
  "
>
            <Package size={22} />
          </div>

          <div>
            <h1 className="text-lg font-bold">
              {title}
            </h1>

          <p className="text-xs text-[var(--text-muted)]">
              {totalOrders} {t.orders ?? "orders"}
            </p>
          </div>

        </div>

<div
  className="
    rounded-2xl
    px-4
    py-2
    text-right
    bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)]
  "
>

          <div className="text-xs text-[var(--text-muted)]">
            {t.total ?? "Total"}
          </div>

          <div className="font-semibold text-[var(--color-primary)]">
            π{formatPi(totalAmount)}
          </div>

        </div>

      </div>
    </header>
  );
}
