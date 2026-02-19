"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
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

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "returned"
  | "cancelled";

type SellerOrder = {
  id: string;
  status: OrderStatus;
};

export default function SellerPage() {
  const { user, loading, piReady } = useAuth();
  const [orders, setOrders] = useState<SellerOrder[]>([]);

  const canOperate = user?.role === "seller";

  useEffect(() => {
    if (!canOperate) return;

    const load = async () => {
      const res = await apiAuthFetch("/api/seller/orders", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data: unknown = await res.json();

      if (Array.isArray(data)) {
        setOrders(
          data.filter(
            (o): o is SellerOrder =>
              typeof o === "object" &&
              o !== null &&
              "id" in o &&
              "status" in o
          )
        );
      }
    };

    load();
  }, [canOperate]);

  const stats = useMemo(() => {
    return {
      pending: orders.filter(o => o.status === "pending").length,
      confirmed: orders.filter(o => o.status === "confirmed").length,
      shipping: orders.filter(o => o.status === "shipping").length,
      completed: orders.filter(o => o.status === "completed").length,
      returned: orders.filter(o => o.status === "returned").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
      total: orders.length,
    };
  }, [orders]);

  if (loading || !piReady) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ Đang tải...
      </p>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        🏪 Seller Dashboard
      </h1>

      {/* ===== MAIN ACTIONS ===== */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <MainCard
          href="/seller/post"
          icon={<PackagePlus size={20} />}
          label="Đăng sản phẩm"
        />

        <MainCard
          href="/seller/stock"
          icon={<Package size={20} />}
          label="Kho hàng"
        />

        <MainCard
          href="/seller/orders"
          icon={<ClipboardList size={20} />}
          label="Tất cả đơn"
          badge={stats.total}
        />
      </div>

      {/* ===== ORDER STATUS ===== */}
      <h2 className="text-sm font-semibold text-gray-600 mb-3">
        Trạng thái đơn hàng
      </h2>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <StatusMiniCard
          href="/seller/orders/pending"
          icon={<Clock size={18} />}
          count={stats.pending}
        />

        <StatusMiniCard
          href="/seller/orders/confirmed"
          icon={<CheckCircle2 size={18} />}
          count={stats.confirmed}
        />

        <StatusMiniCard
          href="/seller/orders/shipping"
          icon={<Truck size={18} />}
          count={stats.shipping}
        />

        <StatusMiniCard
          href="/seller/orders/completed"
          icon={<PackageCheck size={18} />}
          count={stats.completed}
        />

        <StatusMiniCard
          href="/seller/orders/returned"
          icon={<RotateCcw size={18} />}
          count={stats.returned}
        />

        <StatusMiniCard
          href="/seller/orders/cancelled"
          icon={<XCircle size={18} />}
          count={stats.cancelled}
        />
      </div>
    </main>
  );
}

/* ================= MAIN CARD ================= */
function MainCard({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <Link href={href}>
      <div className="relative bg-white rounded-xl border p-4 text-center shadow-sm hover:shadow-md transition">
        {badge !== undefined && (
          <span className="absolute top-2 right-2 text-xs bg-black text-white px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        <div className="flex flex-col items-center">
          <div className="mb-2 text-gray-700">{icon}</div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
        </div>
      </div>
    </Link>
  );
}

/* ================= MINI STATUS CARD ================= */
function StatusMiniCard({
  href,
  icon,
  count,
}: {
  href: string;
  icon: React.ReactNode;
  count: number;
}) {
  return (
    <Link href={href}>
      <div className="bg-gray-50 rounded-lg border p-3 text-center hover:bg-gray-100 transition">
        <div className="flex justify-center mb-1 text-gray-600">
          {icon}
        </div>
        <p className="text-sm font-semibold text-gray-800">
          {count}
        </p>
      </div>
    </Link>
  );
}
