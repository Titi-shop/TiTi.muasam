"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import {
  PackagePlus,
  Package,
  ClipboardList,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  RotateCcw,
  XCircle,
} from "lucide-react";

/* ================= PAGE ================= */

export default function SellerPage() {
  const { t } = useTranslation();
  const { user, loading, piReady } = useAuth();

  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    shipping: 0,
    completed: 0,
    returned: 0,
    cancelled: 0,
    total: 0,
  });

  const isSeller = user?.role === "seller";

  useEffect(() => {
    if (!isSeller || !piReady) return;

    const loadStats = async () => {
      try {
        const res = await apiAuthFetch(
          "/api/seller/orders/count",
          { cache: "no-store" }
        );

        if (!res.ok) return;

        const data = await res.json();
        setStats(data);
      } catch {
        setStats({
          pending: 0,
          confirmed: 0,
          shipping: 0,
          completed: 0,
          returned: 0,
          cancelled: 0,
          total: 0,
        });
      }
    };

    void loadStats();
  }, [isSeller, piReady]);

  if (loading || !piReady) {
    return (
      <div className="flex justify-center mt-16 text-gray-500 text-sm">
        {t.loading ?? "Loading..."}
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="flex justify-center mt-16 text-gray-500 text-sm">
        {t.no_permission ?? "No permission"}
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="bg-gray-200 border border-gray-300 rounded-xl p-4">
        <h1 className="text-lg font-semibold text-gray-800">
          🏪 {t.seller_dashboard ?? "Seller Dashboard"}
        </h1>
      </div>

      {/* MAIN ACTIONS */}
      <section className="grid grid-cols-3 gap-4">
        <MainCard
          href="/seller/post"
          icon={<PackagePlus size={18} />}
          label={t.post_product ?? "Post Product"}
        />

        <MainCard
          href="/seller/stock"
          icon={<Package size={18} />}
          label={t.stock ?? "Stock"}
        />

        <MainCard
          href="/seller/orders"
          icon={<ClipboardList size={18} />}
          label={t.all_orders ?? "All Orders"}
          badge={stats.total}
        />
      </section>

      {/* ORDER STATUS */}
      <section>
        <div className="bg-gray-200 border border-gray-300 rounded-xl p-3 mb-4">
          <h2 className="text-xs font-semibold text-gray-700 tracking-wide">
            {t.order_status ?? "ORDER STATUS"}
          </h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          <StatusCard href="/seller/orders/pending" icon={<Clock size={16} />} count={stats.pending} label={t.pending_orders ?? "Pending"} />
          <StatusCard href="/seller/orders/confirmed" icon={<CheckCircle2 size={16} />} count={stats.confirmed} label={t.confirmed_orders ?? "Confirmed"} />
          <StatusCard href="/seller/orders/shipping" icon={<Truck size={16} />} count={stats.shipping} label={t.shipping_orders ?? "Shipping"} />
          <StatusCard href="/seller/orders/completed" icon={<PackageCheck size={16} />} count={stats.completed} label={t.completed_orders ?? "Completed"} />
          <StatusCard href="/seller/orders/returned" icon={<RotateCcw size={16} />} count={stats.returned} label={t.returned_orders ?? "Returned"} />
          <StatusCard href="/seller/orders/cancelled" icon={<XCircle size={16} />} count={stats.cancelled} label={t.cancelled_orders ?? "Cancelled"} />
        </div>
      </section>
    </main>
  );
}
