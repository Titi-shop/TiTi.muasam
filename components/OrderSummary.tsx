"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPiAccessToken } from "@/lib/piAuth";
import {
  Clock,
  Package,
  Truck,
  Star,
  RotateCcw,
} from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   COMPONENT
========================= */
export default function OrderSummary() {
  const { t } = useTranslation();
  const router = useRouter();
  const [counts, setCounts] = useState({
  pending: 0,
  pickup: 0,
  shipping: 0,
  review: 0,
  returns: 0,
});
  useEffect(() => {
  async function loadCounts() {
    try {
      const token = await getPiAccessToken();

      console.log("TOKEN:", token);

      if (!token) return;

      const res = await fetch("/api/orders/count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("DATA:", data);

      setCounts(data);
    } catch (err) {
      console.log("ERROR:", err);
    }
  }

  loadCounts();
}, []);

  return (
    <section className="bg-white mx-4 mt-4 rounded-xl shadow border border-gray-100">
      {/* HEADER */}
     <div
  onClick={() => router.push("/customer/orders")}
  className="p-4 border-b flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
>
  <h2 className="text-lg font-semibold text-gray-800">
    {t.orders}
  </h2>

  <span className="text-lg text-orange-600 font-semibold">
  →
  </span>
</div>

      {/* ITEMS */}
      <div className="grid grid-cols-5 py-4">
  <Item
    icon={<Clock size={22} />}
    label={t.pending_orders}
    path="/customer/pending"
    count={counts.pending}
  />
  <Item
    icon={<Package size={22} />}
    label={t.pickup_orders}
    path="/customer/pickup"
    count={counts.pickup}
  />
  <Item
    icon={<Truck size={22} />}
    label={t.shipping_orders}
    path="/customer/shipping"
    count={counts.shipping}
  />
  <Item
    icon={<Star size={22} />}
    label={t.review_orders}
    path="/customer/review"
    count={counts.review}
  />
  <Item
    icon={<RotateCcw size={22} />}
    label={t.return_orders}
    path="/customer/returns"
    count={counts.returns}
  />
</div>
    </section>
  );
}

/* =========================
   ITEM
========================= */
function Item({
  icon,
  label,
  path,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  path: string;
  count?: number;
})
{
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(path)}
      className="flex flex-col items-center justify-start h-[88px] text-gray-700 hover:text-orange-500 transition"
    >
      {/* ICON */}
      <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-gray-100 shadow-sm mb-1">
  {icon}

  {typeof count === "number" && count > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-semibold shadow">
      {count > 99 ? "99+" : count}
    </span>
  )}
</div>

      {/* LABEL */}
      <span className="text-[11px] leading-snug text-center line-clamp-2 max-w-[64px]">
        {label}
      </span>
    </button>
  );
}
