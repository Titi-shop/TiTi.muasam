"use client";

import React, { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import {
  Clock3,
  PackageCheck,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
} from "lucide-react";

import { getPiAccessToken } from "@/lib/piAuth";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =====================================================
   TYPES
===================================================== */

type OrderCountResponse = {
  pending?: number;
  pending_fulfillment?: number;
  processing?: number;
  shipped?: number;
  delivered?: number;
  completed?: number;
  cancelled?: number;
  refunded?: number;
  returns?: number;
};

/* =====================================================
   FETCHER
===================================================== */

async function fetcher(url: string): Promise<OrderCountResponse | null> {
  try {
    const token = await getPiAccessToken();
    if (!token) return null;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data: unknown = await res.json();

    if (!data || typeof data !== "object") return null;

    return data as OrderCountResponse;
  } catch {
    return null;
  }
}

/* =====================================================
   COMPONENT
===================================================== */

export default function OrderSummary() {
  const router = useRouter();
  const { t } = useTranslation();

  const { data, isLoading } = useSWR("/api/orders/count", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    keepPreviousData: true,
  });

  const go = useCallback(
    (tab: string) => router.push(`/customer/orders?tab=${tab}`),
    [router]
  );

  /* =====================================================
     NORMALIZED COUNTS (SAFE + CONSISTENT)
  ===================================================== */

  const counts = useMemo(
    () => ({
      pending_fulfillment: data?.pending_fulfillment ?? 0,
      processing: data?.processing ?? 0,
      shipped: data?.shipped ?? 0,
      completed: data?.completed ?? 0,
      cancelled: data?.cancelled ?? 0,
      returns: data?.returns ?? 0,
    }),
    [data]
  );

  const items = useMemo(
    () => [
      {
        key: "pending",
        icon: <Clock3 size={20} />,
        label: t.pending_orders ?? "Pending",
        count: counts.pending,
        onClick: () => go("pending"),
      },
      {
        key: "processing",
        icon: <PackageCheck size={20} />,
        label: t.processing_orders ?? "Processing",
        count: counts.processing,
        onClick: () => go("processing"),
      },
      {
        key: "shipped",
        icon: <Truck size={20} />,
        label: t.shipping_orders ?? "Shipping",
        count: counts.shipped,
        onClick: () => go("shipping"),
      },
      {
        key: "completed",
        icon: <CheckCircle2 size={20} />,
        label: t.completed_orders ?? "Completed",
        count: counts.completed,
        onClick: () => go("completed"),
      },
      {
        key: "cancelled",
        icon: <XCircle size={20} />,
        label: t.cancelled_orders ?? "Cancelled",
        count: counts.cancelled,
        onClick: () => go("cancelled"),
      },
      {
        key: "returns",
        icon: <RotateCcw size={20} />,
        label: t.returns_orders ?? "Returns",
        count: counts.returns,
        onClick: () => router.push("/customer/returns"),
      },
    ],
    [counts, t, go, router]
  );

  return (
    <section className="mx-4 mt-4 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      {/* HEADER */}
      <button
        type="button"
        onClick={() => router.push("/customer/orders")}
        className="flex w-full items-center justify-between px-5 py-4 transition active:bg-gray-50"
      >
        <div className="text-left">
          <h2 className="text-[17px] font-semibold text-gray-900">
            {t.orders ?? "Orders"}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {t.track_orders ?? "Track, manage and review purchases"}
          </p>
        </div>

        <ChevronRight size={18} className="text-gray-400" />
      </button>

      <div className="h-px bg-gray-100" />

      {/* GRID */}
      <div className="grid grid-cols-4 gap-y-5 px-3 py-5">
        {items.map((item) => (
          <OrderItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            count={item.count}
            loading={isLoading}
            onClick={item.onClick}
          />
        ))}
      </div>
    </section>
  );
}

/* =====================================================
   ITEM
===================================================== */

type OrderItemProps = {
  icon: React.ReactNode;
  label: string;
  count: number;
  loading: boolean;
  onClick: () => void;
};

function OrderItem({
  icon,
  label,
  count,
  loading,
  onClick,
}: OrderItemProps) {
  const badge = useMemo(() => {
    if (loading) {
      return (
        <span className="absolute -right-1 -top-1 h-[18px] w-[18px] animate-pulse rounded-full bg-gray-300" />
      );
    }

    if (count > 0) {
      return (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      );
    }

    return null;
  }, [count, loading]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center px-1 transition-transform active:scale-95"
    >
      <div className="relative mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-gray-700 shadow-sm transition group-active:bg-orange-50">
        {icon}
        {badge}
      </div>

      <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-gray-700">
        {label}
      </span>
    </button>
  );
}
