"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";
import {
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
  total: number;
};

export default function SellerPage() {
  const { user, loading, piReady } = useAuth();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [fetching, setFetching] = useState(false);

  const canOperate = user?.role === "seller";

  useEffect(() => {
    if (!canOperate) return;

    const load = async () => {
      try {
        setFetching(true);
        const res = await apiAuthFetch("/api/seller/orders", {
          cache: "no-store",
        });

        if (!res.ok) {
          setOrders([]);
          return;
        }

        const data: unknown = await res.json();

        if (Array.isArray(data)) {
          setOrders(
            data.filter(
              (o): o is SellerOrder =>
                typeof o === "object" &&
                o !== null &&
                "id" in o &&
                "status" in o &&
                "total" in o
            )
          );
        }
      } finally {
        setFetching(false);
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
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        🏪 Seller Dashboard
      </h1>

      {fetching && (
        <p className="text-sm text-gray-500 mb-4">Đang tải đơn hàng...</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <StatusCard
          href="/seller/orders/pending"
          icon={<Clock size={28} />}
          label="Chờ xác nhận"
          count={stats.pending}
          bg="from-yellow-400 to-orange-500"
        />

        <StatusCard
          href="/seller/orders/confirmed"
          icon={<CheckCircle2 size={28} />}
          label="Đã xác nhận"
          count={stats.confirmed}
          bg="from-blue-400 to-indigo-500"
        />

        <StatusCard
          href="/seller/orders/shipping"
          icon={<Truck size={28} />}
          label="Đang vận chuyển"
          count={stats.shipping}
          bg="from-purple-400 to-pink-500"
        />

        <StatusCard
          href="/seller/orders/completed"
          icon={<PackageCheck size={28} />}
          label="Đã hoàn thành"
          count={stats.completed}
          bg="from-green-400 to-emerald-500"
        />

        <StatusCard
          href="/seller/orders/returned"
          icon={<RotateCcw size={28} />}
          label="Hoàn trả"
          count={stats.returned}
          bg="from-teal-400 to-cyan-500"
        />

        <StatusCard
          href="/seller/orders/cancelled"
          icon={<XCircle size={28} />}
          label="Đơn huỷ"
          count={stats.cancelled}
          bg="from-red-400 to-rose-500"
        />
      </div>
    </main>
  );
}

function StatusCard({
  href,
  icon,
  label,
  count,
  bg,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  bg: string;
}) {
  return (
    <Link href={href} className="group">
      <div
        className={`
          bg-gradient-to-br ${bg}
          text-white
          rounded-2xl
          p-6
          shadow-lg
          hover:shadow-2xl
          hover:-translate-y-1
          transition-all
          duration-300
        `}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 group-hover:scale-110 transition">
            {icon}
          </div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-2xl font-bold mt-2">{count}</p>
        </div>
      </div>
    </Link>
  );
}
