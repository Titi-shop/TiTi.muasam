"use client";

export const dynamic = "force-dynamic";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import type { ReturnRecord } from "./types/returns";
import ReturnList from "./components/ReturnList";
import ReturnsSkeleton from "./components/ReturnsSkeleton";
export default function ReturnsPage() {
  const { user, loading: authLoading } =
    useAuth();

  const [returns, setReturns] =
    useState<ReturnRecord[]>([]);

  const [loading, setLoading] =
    useState(true);
const tabs = [
  "all",
  "pending",
  "approved",
  "shipping_back",
  "received",
  "refund_pending",
  "refunded",
  "rejected",
  "cancelled",
] as const;

const [tab, setTab] =
  useState<(typeof tabs)[number]>("all");
  useEffect(() => {
    if (authLoading || !user) return;

    loadReturns();
  }, [authLoading, user]);

  async function loadReturns() {
  try {
    const res = await apiAuthFetch("/api/returns");

    if (!res.ok) {
      setReturns([]);
      return;
    }

    const data = await res.json();

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : [];

    // 🔥 FIX: chuẩn hóa order_id
    const normalized = list.map((item: any) => ({
      ...item,

      order_id:
        item.order_id ||
        item.orderId ||
        item.order?.id ||
        null,
    }));

    setReturns(normalized);
  } catch (error) {
    console.error("❌ LOAD RETURNS ERROR", error);
    setReturns([]);
  } finally {
    setLoading(false);
  }
  }

  const filteredReturns = useMemo(() => {
  const list =
    tab === "all"
      ? returns
      : returns.filter(
          (item) =>
            item.status === tab
        );

  return [...list].sort((a, b) => {
    const da = a.created_at
      ? new Date(a.created_at).getTime()
      : 0;

    const db = b.created_at
      ? new Date(b.created_at).getTime()
      : 0;

    return db - da;
  });
}, [returns, tab]);

  if (loading || authLoading) {
    return <ReturnsSkeleton />;
  }

  return (
  <main className="min-h-screen bg-[var(--background)]">

    <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--background)] overflow-x-auto">
      <div className="flex min-w-max gap-2 p-4">

        {tabs.map((value) => (
          <button
            key={value}
            onClick={() =>
              setTab(value)
            }
            className={`rounded-full px-4 py-2 text-sm transition ${
              tab === value
                ? "bg-orange-500 text-white"
                : "bg-[var(--card-secondary)]"
            }`}
          >
            {value === "all"
              ? "All"
              : value}
          </button>
        ))}

      </div>
    </div>

    <div className="p-4">
      <ReturnList
        returns={filteredReturns}
        onReload={loadReturns}
      />
    </div>

  </main>
);
}
