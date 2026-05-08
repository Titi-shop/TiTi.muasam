"use client";

import React from "react";

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

  confirmed?: number;

  processing?: number;

  shipping?: number;

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

const fetcher = async (
  url: string
): Promise<OrderCountResponse | null> => {
  try {
    const token =
      await getPiAccessToken();

    if (!token) {
      return null;
    }

    const res = await fetch(
      url,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return null;
    }

    const data: unknown =
      await res.json();

    if (
      typeof data !==
        "object" ||
      data === null
    ) {
      return null;
    }

    return data as OrderCountResponse;
  } catch {
    return null;
  }
};

/* =====================================================
   COMPONENT
===================================================== */

export default function OrderSummary() {
  const router =
    useRouter();

  const { t } =
    useTranslation();

  const {
    data,
    isLoading,
  } = useSWR<
    OrderCountResponse | null
  >(
    "/api/orders/count",
    fetcher,
    {
      revalidateOnFocus:
        false,

      dedupingInterval:
        5000,

      keepPreviousData:
        true,
    }
  );

  /* =====================================================
     NORMALIZED COUNTS
  ===================================================== */

  const counts = {
    /* pending */
    pending:
      Number(
        data?.pending ?? 0
      ) +
      Number(
        data?.pending_fulfillment ??
          0
      ),

    /* confirmed */
    confirmed:
      Number(
        data?.confirmed ?? 0
      ) +
      Number(
        data?.processing ??
          0
      ),

    /* shipping */
    shipping:
      Number(
        data?.shipping ?? 0
      ) +
      Number(
        data?.shipped ?? 0
      ) +
      Number(
        data?.delivered ??
          0
      ),

    /* completed */
    completed:
      Number(
        data?.completed ??
          0
      ),

    /* cancelled */
    cancelled:
      Number(
        data?.cancelled ??
          0
      ) +
      Number(
        data?.refunded ??
          0
      ),

    /* returns */
    returns:
      Number(
        data?.returns ?? 0
      ),
  };

  /* =====================================================
     NAVIGATION
  ===================================================== */

  function go(
    tab: string
  ) {
    router.push(
      `/customer/orders?tab=${tab}`
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <section className="mx-4 mt-4 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      {/* HEADER */}
      <button
        type="button"
        onClick={() =>
          router.push(
            "/customer/orders"
          )
        }
        className="flex w-full items-center justify-between px-5 py-4 transition active:bg-gray-50"
      >
        <div className="text-left">
          <h2 className="text-[17px] font-semibold text-gray-900">
            {t.orders ??
              "Orders"}
          </h2>

          <p className="mt-0.5 text-xs text-gray-500">
            {t.track_orders ??
              "Track, manage and review purchases"}
          </p>
        </div>

        <ChevronRight
          size={18}
          className="text-gray-400"
        />
      </button>

      <div className="h-px bg-gray-100" />

      {/* GRID */}
      <div className="grid grid-cols-4 gap-y-5 px-3 py-5">
        {/* PENDING */}
        <Item
          icon={
            <Clock3 size={20} />
          }
          label={
            t.pending_orders ??
            "Pending"
          }
          count={
            counts.pending
          }
          loading={
            isLoading
          }
          onClick={() =>
            go("pending")
          }
        />

        {/* CONFIRMED */}
        <Item
          icon={
            <PackageCheck size={20} />
          }
          label={
            t.confirmed_orders ??
            "Confirmed"
          }
          count={
            counts.confirmed
          }
          loading={
            isLoading
          }
          onClick={() =>
            go("confirmed")
          }
        />

        {/* SHIPPING */}
        <Item
          icon={
            <Truck size={20} />
          }
          label={
            t.shipping_orders ??
            "Shipping"
          }
          count={
            counts.shipping
          }
          loading={
            isLoading
          }
          onClick={() =>
            go("shipping")
          }
        />

        {/* COMPLETED */}
        <Item
          icon={
            <CheckCircle2 size={20} />
          }
          label={
            t.completed_orders ??
            "Completed"
          }
          count={
            counts.completed
          }
          loading={
            isLoading
          }
          onClick={() =>
            go("completed")
          }
        />

        {/* CANCELLED */}
        <Item
          icon={
            <XCircle size={20} />
          }
          label={
            t.cancelled_orders ??
            "Cancelled"
          }
          count={
            counts.cancelled
          }
          loading={
            isLoading
          }
          onClick={() =>
            go("cancelled")
          }
        />

        {/* RETURNS */}
        <Item
          icon={
            <RotateCcw size={20} />
          }
          label={
            t.returns_orders ??
            "Returns"
          }
          count={
            counts.returns
          }
          loading={
            isLoading
          }
          onClick={() =>
            router.push(
              "/customer/returns"
            )
          }
        />
      </div>
    </section>
  );
}

/* =====================================================
   ITEM
===================================================== */

type ItemProps = {
  icon: React.ReactNode;

  label: string;

  count?: number;

  loading?: boolean;

  onClick: () => void;
};

function Item({
  icon,
  label,
  count,
  loading,
  onClick,
}: ItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center px-1 transition-transform active:scale-95"
    >
      {/* ICON */}
      <div className="relative mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-gray-50 text-gray-700 shadow-sm transition group-active:bg-orange-50">
        {icon}

        {/* BADGE */}
        {loading ? (
          <span className="absolute -right-1 -top-1 h-[18px] w-[18px] animate-pulse rounded-full bg-gray-300" />
        ) : typeof count ===
            "number" &&
          count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {count > 99
              ? "99+"
              : count}
          </span>
        ) : null}
      </div>

      {/* TEXT */}
      <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight text-gray-700">
        {label}
      </span>
    </button>
  );
}
