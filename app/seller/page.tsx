"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  PackagePlus,
  Package,
  ClipboardList,
  BarChart3,
  Truck,
  Wallet,
} from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function SellerPage() {
  const { user, loading, piReady } = useAuth();
  const { t } = useTranslation();

  const canOperate = user?.role === "seller";

  if (loading || !piReady) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading || "Đang tải..."}
      </p>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      {/* HEADER */}
      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        🏪 {t.seller_platform || "Seller Dashboard"}
      </h1>

      {/* GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <SellerCard
          href="/seller/post"
          icon={<PackagePlus size={28} />}
          label={t.post_product || "Post Product"}
          canOperate={canOperate}
          bg="bg-gradient-to-br from-green-400 to-emerald-500"
        />

        <SellerCard
          href="/seller/stock"
          icon={<Package size={28} />}
          label={t.stock || "Stock"}
          canOperate={canOperate}
          bg="bg-gradient-to-br from-blue-400 to-indigo-500"
        />

        <SellerCard
          href="/seller/orders"
          icon={<ClipboardList size={28} />}
          label={t.seller_orders || "Orders"}
          canOperate={canOperate}
          bg="bg-gradient-to-br from-orange-400 to-red-500"
        />

        <SellerCard
          href="/seller/orders/shipping"
          icon={<Truck size={28} />}
          label="Shipping"
          canOperate={canOperate}
          bg="bg-gradient-to-br from-purple-400 to-pink-500"
        />

        <SellerCard
          href="/seller/orders/completed"
          icon={<BarChart3 size={28} />}
          label="Completed"
          canOperate={canOperate}
          bg="bg-gradient-to-br from-teal-400 to-cyan-500"
        />

        <SellerCard
          href="/seller/wallet"
          icon={<Wallet size={28} />}
          label="Wallet"
          canOperate={canOperate}
          bg="bg-gradient-to-br from-yellow-400 to-amber-500"
        />
      </div>
    </main>
  );
}

/* =========================
   CARD COMPONENT
========================= */
function SellerCard({
  href,
  icon,
  label,
  canOperate,
  bg,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  canOperate: boolean;
  bg: string;
}) {
  return (
    <Link
      href={canOperate ? href : "#"}
      className={`
        ${!canOperate ? "pointer-events-none opacity-40" : ""}
        group
      `}
    >
      <div
        className={`
          ${bg}
          text-white
          rounded-2xl
          p-6
          shadow-lg
          hover:shadow-2xl
          transform
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
        </div>
      </div>
    </Link>
  );
}
