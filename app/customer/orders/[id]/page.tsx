"use client";

export const dynamic = "force-dynamic";

import useSWR from "swr";
import Image from "next/image";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  PackageCheck,
  Truck,
  CircleX,
  Clock3,
  BadgeCheck,
  MapPin,
  Phone,
  User,
  RefreshCcw,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";

import { getPiAccessToken } from "@/lib/piAuth";
import { formatPi } from "@/lib/pi";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =======================================================
   TYPES
======================================================= */

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "cancelled"
  | "refunded";

interface OrderItem {
  id: string;
  product_name: string;
  product_id: string;
  thumbnail: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
}

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  created_at: string;

  seller_message?: string | null;
  seller_cancel_reason?: string | null;

  shipping_name: string;
  shipping_phone: string;
  shipping_address_line: string;

  shipping_ward?: string | null;
  shipping_district?: string | null;
  shipping_region?: string | null;
  shipping_country?: string | null;
  shipping_postal_code?: string | null;

  order_items: OrderItem[];
}

/* =======================================================
   FETCHER
======================================================= */

const fetcher = async (url: string): Promise<Order | null> => {
  try {
    const token = await getPiAccessToken();

    if (!token) return null;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();

    return {
      id: data.id,
      order_number: data.order_number,
      status: data.status,
      total: Number(data.total ?? 0),
      created_at: data.created_at,

      seller_message: data.seller_message ?? null,
      seller_cancel_reason: data.seller_cancel_reason ?? null,

      shipping_name: data.shipping_name ?? "",
      shipping_phone: data.shipping_phone ?? "",
      shipping_address_line:
        data.shipping_address_line ?? "",

      shipping_ward: data.shipping_ward ?? null,
      shipping_district:
        data.shipping_district ?? null,
      shipping_region:
        data.shipping_region ?? null,
      shipping_country:
        data.shipping_country ?? null,
      shipping_postal_code:
        data.shipping_postal_code ?? null,

      order_items: (data.order_items || []).map(
        (i: any) => ({
          id: i.id,
          product_id: i.product_id ?? "",
          product_name: i.product_name ?? "",
          thumbnail: i.thumbnail ?? "",
          quantity: Number(i.quantity ?? 0),
          unit_price: Number(i.unit_price ?? 0),
          total_price: Number(i.total_price ?? 0),
          status: i.status ?? "pending",
        })
      ),
    };
  } catch {
    return null;
  }
};

/* =======================================================
   STATUS UI
======================================================= */

function getStatusConfig(status: OrderStatus) {
  switch (status) {
    case "pending":
      return {
        icon: Clock3,
        text: "orange",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
      };

    case "confirmed":
      return {
        icon: BadgeCheck,
        text: "blue",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      };

    case "shipping":
      return {
        icon: Truck,
        text: "purple",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
      };

    case "completed":
      return {
        icon: PackageCheck,
        text: "emerald",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };

    case "cancelled":
    case "refunded":
      return {
        icon: CircleX,
        text: "red",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
      };

    default:
      return {
        icon: Clock3,
        text: "gray",
        bg: "bg-gray-500/10",
        border: "border-gray-500/20",
      };
  }
}

/* =======================================================
   PAGE
======================================================= */

export default function OrderDetailPage() {
  const { t } = useTranslation();

  const router = useRouter();
  const params = useParams();

  const { user, loading: authLoading } = useAuth();

  const orderId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const {
    data: order,
    isLoading,
    mutate,
  } = useSWR(
    user && orderId
      ? `/api/orders/${orderId}`
      : null,
    fetcher
  );

  /* ================= LOADING ================= */

  if (isLoading || authLoading) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-3xl bg-[var(--card-bg)]"
            />
          ))}
        </div>
      </main>
    );
  }

  /* ================= EMPTY ================= */

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <CircleX className="h-8 w-8 text-red-500" />
          </div>

          <h1 className="text-lg font-bold text-[var(--foreground)]">
            {t.order_not_found ??
              "Order not found"}
          </h1>

          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {t.order_not_found_desc ??
              "This order may have been deleted or unavailable."}
          </p>

          <button
            onClick={() => router.back()}
            className="
              mt-6 w-full rounded-2xl
              bg-orange-500 px-4 py-3
              text-sm font-semibold text-white
              transition active:scale-95
            "
          >
            {t.back ?? "Back"}
          </button>
        </div>
      </main>
    );
  }

  /* ================= STATUS ================= */

  const statusConfig = getStatusConfig(
    order.status
  );

  const StatusIcon = statusConfig.icon;

  /* ================= ADDRESS ================= */

  const fullAddress = [
    order.shipping_address_line,
    order.shipping_ward,
    order.shipping_district,
    order.shipping_region,
  ]
    .filter(Boolean)
    .join(", ");

  /* ================= TOTAL ITEMS ================= */

  const totalItems = useMemo(() => {
    return order.order_items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }, [order.order_items]);

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-[var(--background)] pb-40 text-[var(--foreground)] transition-colors duration-300">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div
        className="
          sticky top-0 z-40
          border-b border-[var(--border)]
          bg-[var(--nav-bg)]/90
          backdrop-blur-xl
        "
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="
              flex h-10 w-10 items-center justify-center
              rounded-xl border border-[var(--border)]
              bg-[var(--card-bg)]
              transition active:scale-95
            "
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold">
              #{order.order_number}
            </h1>

            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {new Date(
                order.created_at
              ).toLocaleString()}
            </p>
          </div>

          <div
            className={`
              flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold
              ${statusConfig.bg}
              ${statusConfig.border}
            `}
          >
            <StatusIcon
              className={`h-4 w-4 text-${statusConfig.text}-500`}
            />

            <span
              className={`text-${statusConfig.text}-500`}
            >
              {t[`order_${order.status}`] ??
                order.status}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div className="mx-auto mt-4 flex max-w-3xl flex-col gap-4 px-4">
        {/* STATUS CARD */}

        <section
          className="
            overflow-hidden rounded-3xl
            border border-orange-500/20
            bg-[var(--card-bg)]
          "
        >
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/20 p-3 backdrop-blur">
                <StatusIcon className="h-7 w-7" />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  {t[`order_${order.status}`] ??
                    order.status}
                </h2>

                <p className="mt-1 text-sm text-white/90">
                  {order.status === "pending" &&
                    (t.order_pending_desc ??
                      "Waiting for confirmation")}

                  {order.status === "confirmed" &&
                    (t.order_confirmed_desc ??
                      "Seller has confirmed your order")}

                  {order.status === "shipping" &&
                    (t.order_shipping_desc ??
                      "Your order is on the way")}

                  {order.status === "completed" &&
                    (t.order_completed_desc ??
                      "Order delivered successfully")}

                  {(order.status === "cancelled" ||
                    order.status ===
                      "refunded") &&
                    (t.order_cancelled_desc ??
                      "Order cancelled")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-[var(--card-secondary)] p-4">
              <p className="text-xs text-[var(--text-muted)]">
                {t.items ?? "Items"}
              </p>

              <p className="mt-1 text-lg font-bold">
                {totalItems}
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--card-secondary)] p-4">
              <p className="text-xs text-[var(--text-muted)]">
                {t.total ?? "Total"}
              </p>

              <p className="mt-1 text-lg font-bold text-orange-500">
                π{formatPi(order.total)}
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--card-secondary)] p-4">
              <p className="text-xs text-[var(--text-muted)]">
                {t.payment ?? "Payment"}
              </p>

              <p className="mt-1 text-sm font-semibold">
                Pi Network
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--card-secondary)] p-4">
              <p className="text-xs text-[var(--text-muted)]">
                {t.order_id ?? "Order ID"}
              </p>

              <p className="mt-1 truncate text-sm font-semibold">
                {order.id.slice(0, 10)}
              </p>
            </div>
          </div>
        </section>

        {/* SHIPPING */}

        <section
          className="
            rounded-3xl border border-[var(--border)]
            bg-[var(--card-bg)] p-5
          "
        >
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-500" />

            <h2 className="text-base font-bold">
              {t.shipping_address ??
                "Shipping Address"}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-orange-500/10 p-2">
                <User className="h-4 w-4 text-orange-500" />
              </div>

              <div>
                <p className="font-semibold">
                  {order.shipping_name}
                </p>

                <div className="mt-1 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Phone className="h-4 w-4" />

                  {order.shipping_phone}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--card-secondary)] p-4 text-sm leading-6 text-[var(--foreground)]">
              {fullAddress}

              {(order.shipping_country ||
                order.shipping_postal_code) && (
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {order.shipping_country}

                  {order.shipping_postal_code &&
                    ` · ${order.shipping_postal_code}`}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* SELLER MESSAGE */}

        {order.seller_message && (
          <section
            className="
              rounded-3xl border border-emerald-500/20
              bg-emerald-500/10 p-5
            "
          >
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-500/20 p-2">
                <BadgeCheck className="h-5 w-5 text-emerald-500" />
              </div>

              <div>
                <p className="font-semibold text-emerald-500">
                  {t.seller_message ??
                    "Seller Message"}
                </p>

                <p className="mt-1 text-sm text-[var(--foreground)]">
                  {order.seller_message}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* CANCEL REASON */}

        {order.seller_cancel_reason && (
          <section
            className="
              rounded-3xl border border-red-500/20
              bg-red-500/10 p-5
            "
          >
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-red-500/20 p-2">
                <CircleX className="h-5 w-5 text-red-500" />
              </div>

              <div>
                <p className="font-semibold text-red-500">
                  {t.cancel_reason ??
                    "Cancel Reason"}
                </p>

                <p className="mt-1 text-sm text-[var(--foreground)]">
                  {order.seller_cancel_reason}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* PRODUCTS */}

        <section
          className="
            overflow-hidden rounded-3xl
            border border-[var(--border)]
            bg-[var(--card-bg)]
          "
        >
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-base font-bold">
              {t.products ?? "Products"}
            </h2>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {order.order_items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  router.push(
                    `/product/${item.product_id}`
                  )
                }
                className="
                  flex w-full gap-4 p-4 text-left
                  transition hover:bg-[var(--card-secondary)]
                "
              >
                <div
                  className="
                    relative h-24 w-24 shrink-0
                    overflow-hidden rounded-2xl
                    border border-[var(--border)]
                    bg-[var(--card-secondary)]
                  "
                >
                  <Image
                    src={
                      item.thumbnail ||
                      "/placeholder.png"
                    }
                    alt={item.product_name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">
                    {item.product_name}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>
                      x{item.quantity}
                    </span>

                    <span>•</span>

                    <span>
                      π
                      {formatPi(
                        item.unit_price
                      )}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {t.subtotal ??
                          "Subtotal"}
                      </p>

                      <p className="text-base font-bold text-orange-500">
                        π
                        {formatPi(
                          item.total_price
                        )}
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-[var(--text-muted)]" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ===================================================
          BOTTOM ACTIONS
      =================================================== */}

      <div
        className="
          fixed bottom-0 left-0 right-0 z-50
          border-t border-[var(--border)]
          bg-[var(--nav-bg)]/95
          p-4 backdrop-blur-xl
        "
      >
        <div className="mx-auto flex max-w-3xl gap-3">
          {/* COMPLETED */}

          {order.status === "completed" && (
            <>
              <button
                onClick={() =>
                  router.push(
                    `/customer/orders/${order.id}/return`
                  )
                }
                className="
                  flex-1 rounded-2xl
                  border border-orange-500/20
                  bg-orange-500/10
                  px-4 py-3
                  text-sm font-semibold text-orange-500
                  transition active:scale-95
                "
              >
                <span className="flex items-center justify-center gap-2">
                  <RefreshCcw className="h-4 w-4" />

                  {t.request_return ??
                    "Return / Refund"}
                </span>
              </button>

              {order.order_items?.[0] && (
                <button
                  onClick={() =>
                    router.push(
                      `/product/${order.order_items[0].product_id}`
                    )
                  }
                  className="
                    flex-1 rounded-2xl
                    bg-orange-500 px-4 py-3
                    text-sm font-semibold text-white
                    transition active:scale-95
                  "
                >
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingBag className="h-4 w-4" />

                    {t.buy_again ??
                      "Buy Again"}
                  </span>
                </button>
              )}
            </>
          )}

          {/* CANCELLED */}

          {(order.status === "cancelled" ||
            order.status === "refunded") && (
            <>
              <button
                className="
                  flex-1 rounded-2xl
                  border border-[var(--border)]
                  bg-[var(--card-bg)]
                  px-4 py-3
                  text-sm font-semibold
                  transition active:scale-95
                "
              >
                {t.view_cancel_detail ??
                  "View Detail"}
              </button>

              {order.order_items?.[0] && (
                <button
                  onClick={() =>
                    router.push(
                      `/product/${order.order_items[0].product_id}`
                    )
                  }
                  className="
                    flex-1 rounded-2xl
                    bg-orange-500 px-4 py-3
                    text-sm font-semibold text-white
                    transition active:scale-95
                  "
                >
                  {t.buy_again ??
                    "Buy Again"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
