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

/* ================= TYPES ================= */

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

/* ================= PAGE ================= */

export default function SellerPage() {
  const { user, loading, piReady } = useAuth();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [fetching, setFetching] = useState<boolean>(false);

  const isSeller = user?.role === "seller";

  /* ================= LOAD ORDERS ================= */

  useEffect(() => {
    if (!isSeller) return;

    const loadOrders = async () => {
      try {
        setFetching(true);

        const res = await apiAuthFetch("/api/seller/orders", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data: unknown = await res.json();

        if (Array.isArray(data)) {
          const validOrders: SellerOrder[] = data.filter(
            (o): o is SellerOrder =>
              typeof o === "object" &&
              o !== null &&
              "id" in o &&
              "status" in o
          );

          setOrders(validOrders);
        }
      } catch {
        // Pi Browser cần silent fail
      } finally {
        setFetching(false);
      }
    };

    loadOrders();
  }, [isSeller]);

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    const base = {
      pending: 0,
      confirmed: 0,
      shipping: 0,
      completed: 0,
      returned: 0,
      cancelled: 0,
    };

    for (const order of orders) {
      base[order.status]++;
    }

    return {
      ...base,
      total: orders.length,
    };
  }, [orders]);

  /* ================= LOADING ================= */

  if (loading || !piReady) {
    return (
      <div className="flex justify-center mt-16 text-gray-500 text-sm">
        ⏳ Đang tải...
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="flex justify-center mt-16 text-gray-500 text-sm">
        Bạn không có quyền truy cập
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <h1 className="text-lg font-semibold text-gray-800">
        🏪 Seller Dashboard
      </h1>

      {/* ===== MAIN ACTIONS ===== */}
      <section className="grid grid-cols-3 gap-3">
        <MainCard
          href="/seller/post"
          icon={<PackagePlus size={18} />}
          label="Đăng sản phẩm"
        />

        <MainCard
          href="/seller/stock"
          icon={<Package size={18} />}
          label="Kho hàng"
        />

        <MainCard
          href="/seller/orders"
          icon={<ClipboardList size={18} />}
          label="Tất cả đơn"
          badge={stats.total}
        />
      </section>

      {/* ===== ORDER STATUS ===== */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 mb-3">
          TRẠNG THÁI ĐƠN
        </h2>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <StatusCard
            href="/seller/orders/pending"
            icon={<Clock size={16} />}
            count={stats.pending}
          />

          <StatusCard
            href="/seller/orders/confirmed"
            icon={<CheckCircle2 size={16} />}
            count={stats.confirmed}
          />

          <StatusCard
            href="/seller/orders/shipping"
            icon={<Truck size={16} />}
            count={stats.shipping}
          />

          <StatusCard
            href="/seller/orders/completed"
            icon={<PackageCheck size={16} />}
            count={stats.completed}
          />

          <StatusCard
            href="/seller/orders/returned"
            icon={<RotateCcw size={16} />}
            count={stats.returned}
          />

          <StatusCard
            href="/seller/orders/cancelled"
            icon={<XCircle size={16} />}
            count={stats.cancelled}
          />
        </div>
      </section>
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
    <Link href={href} className="block">
      <div className="relative bg-white border rounded-xl p-3 text-center shadow-sm active:scale-[0.98] transition">
        {badge !== undefined && badge > 0 && (
          <span className="absolute top-1.5 right-1.5 text-[10px] bg-black text-white px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}

        <div className="flex flex-col items-center gap-1">
          <div className="text-gray-700">{icon}</div>
          <span className="text-xs font-medium text-gray-700">
            {label}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ================= STATUS CARD ================= */

function StatusCard({
  href,
  icon,
  count,
}: {
  href: string;
  icon: React.ReactNode;
  count: number;
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-gray-50 border rounded-lg p-2 text-center active:scale-[0.98] transition">
        <div className="flex justify-center mb-1 text-gray-600">
          {icon}
        </div>
        <span className="text-xs font-semibold text-gray-800">
          {count}
        </span>
      </div>
    </Link>
  );
}
