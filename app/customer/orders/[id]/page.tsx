"use client";
export const dynamic = "force-dynamic";
import Image from "next/image";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { getPiAccessToken } from "@/lib/piAuth";
import { formatPi } from "@/lib/pi";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =====================================================
   TYPES
===================================================== */

type OrderStatus =
  | "pending_fulfillment"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled"
  | "refunded";

interface ApiOrderItem {
  id: string;
  product_id: string | null;
  product_name: string | null;
  thumbnail: string | null;

  quantity: number | string | null;

  unit_price: number | string | null;
  total_price: number | string | null;
  fulfillment_status: string | null;
}

interface ApiOrder {
  id: string;
  order_number: string;

  fulfillment_status: OrderStatus;

  total: number | string;

  created_at: string;

  seller_message?: string | null;
  seller_cancel_reason?: string | null;

  shipping_name?: string | null;
  shipping_phone?: string | null;

  shipping_address_line?: string | null;
  shipping_ward?: string | null;
  shipping_district?: string | null;
  shipping_region?: string | null;

  shipping_country?: string | null;
  shipping_postal_code?: string | null;

  order_items?: ApiOrderItem[] | null;
}

interface OrderItem {
  id: string;

  product_id: string;

  product_name: string;

  thumbnail: string;

  quantity: number;

  unit_price: number;
  total_price: number;

  fulfillment_status: string;
}

interface Order {
  id: string;

  order_number: string;

  fulfillment_status: OrderStatus;

  total: number;

  created_at: string;

  seller_message: string | null;
  seller_cancel_reason: string | null;

  shipping_name: string;
  shipping_phone: string;

  shipping_address_line: string;

  shipping_ward: string | null;
  shipping_district: string | null;
  shipping_region: string | null;

  shipping_country: string | null;
  shipping_postal_code: string | null;

  order_items: OrderItem[];
}

interface OrderApiResponse {
  ok: boolean;
  order?: ApiOrder;
  error?: string;
}

/* =====================================================
   HELPERS
===================================================== */

function parseNumber(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);

  return Number.isFinite(n) ? n : 0;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "pending_fulfillment":
      return "text-orange-500";

    case "processing":
      return "text-blue-500";

    case "shipping":
      return "text-purple-500";

    case "completed":
      return "text-green-600";

    case "cancelled":
      return "text-red-500";

    case "refunded":
      return "text-gray-500";

    default:
      return "text-gray-400";
  }
}

/* =====================================================
   FETCHER
===================================================== */

const fetcher = async (url: string): Promise<Order | null> => {
  try {
    console.log("[ORDER_DETAIL][FETCH_START]", {
      url,
    });

    const token = await getPiAccessToken();

    if (!token) {
      console.warn("[ORDER_DETAIL][NO_TOKEN]");

      return null;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    console.log("[ORDER_DETAIL][FETCH_RESPONSE]", {
      status: res.status,
      ok: res.ok,
    });

    if (!res.ok) {
      return null;
    }

    const json: OrderApiResponse = await res.json();

    console.log("[ORDER_DETAIL][FETCH_JSON]", {
      ok: json?.ok,
      hasOrder: !!json?.order,
    });

    if (!json?.ok || !json.order) {
      return null;
    }

    const data = json.order;

    const order: Order = {
      id: data.id,

      order_number: data.order_number,

      fulfillment_status: data.fulfillment_status,

      total: parseNumber(data.total),

      created_at: data.created_at,

      seller_message: data.seller_message ?? null,
      seller_cancel_reason: data.seller_cancel_reason ?? null,

      shipping_name: data.shipping_name ?? "",
      shipping_phone: data.shipping_phone ?? "",

      shipping_address_line: data.shipping_address_line ?? "",

      shipping_ward: data.shipping_ward ?? null,
      shipping_district: data.shipping_district ?? null,
      shipping_region: data.shipping_region ?? null,

      shipping_country: data.shipping_country ?? null,
      shipping_postal_code: data.shipping_postal_code ?? null,

      order_items: (data.order_items ?? []).map(
        (item): OrderItem => ({
          id: item.id,

          product_id: item.product_id ?? "",

          product_name: item.product_name ?? "",

          thumbnail: item.thumbnail ?? "",

          quantity: parseNumber(item.quantity),

          unit_price: parseNumber(item.unit_price),

          total_price: parseNumber(item.total_price),

          fulfillment_status:
            item.fulfillment_status ??
            "pending_fulfillment",
        })
      ),
    };

    console.log("[ORDER_DETAIL][FETCH_SUCCESS]", {
      orderId: order.id,
      itemsCount: order.order_items.length,
    });

    return order;

  } catch (err) {
    console.error("[ORDER_DETAIL][FETCH_ERROR]", {
      message:
        err instanceof Error
          ? err.message
          : "UNKNOWN_ERROR",

      stack:
        err instanceof Error
          ? err.stack
          : undefined,
    });

    return null;
  }
};

/* =====================================================
   PAGE
===================================================== */

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
  } = useSWR<Order | null>(
    user && orderId
      ? `/api/orders/${orderId}`
      : null,
    fetcher
  );

  /* =====================================================
     LOADING
  ===================================================== */

  if (isLoading || authLoading) {
    return (
      <p className="mt-10 text-center text-gray-400">
        {t.loading_order ?? "Đang tải đơn hàng..."}
      </p>
    );
  }

  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (!order) {
    return (
      <p className="mt-10 text-center text-red-500">
        {t.order_not_found ??
          "Không tìm thấy đơn hàng"}
      </p>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <main className="min-h-screen bg-gray-100 pb-20">

      {/* HEADER */}
      <div className="border-b bg-white p-4">

        <button
          onClick={() => router.back()}
          className="mb-2 text-sm"
        >
          ← {t.back ?? "Quay lại"}
        </button>

        <div className="flex items-center justify-between">

          <p className="font-semibold">
            #{order.order_number}
          </p>

          <span
            className={`text-sm font-medium ${getStatusColor(
              order.fulfillment_status
            )}`}
          >
            {t[
              `order_fulfillment_status_${order.fulfillment_status}`
            ] ?? order.fulfillment_status}
          </span>

        </div>

        <p className="mt-1 text-xs text-gray-400">
          {new Date(order.created_at).toLocaleString()}
        </p>

      </div>

      {/* SHIPPING */}
      <div className="mt-3 border-b bg-white p-4">

        <p className="mb-2 text-sm font-semibold">
          📍{" "}
          {t.shipping_address ??
            "Địa chỉ nhận hàng"}
        </p>

        <p className="text-sm">
          {order.shipping_name} ·{" "}
          {order.shipping_phone}
        </p>

        <p className="mt-1 text-xs text-gray-600">
          {[
            order.shipping_address_line,
            order.shipping_ward,
            order.shipping_district,
            order.shipping_region,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>

        {(order.shipping_country ||
          order.shipping_postal_code) && (
          <p className="text-xs text-gray-400">
            {order.shipping_country}

            {order.shipping_postal_code &&
              ` · ${order.shipping_postal_code}`}
          </p>
        )}

      </div>

      {/* SELLER MESSAGE */}
      {order.seller_message && (
        <div className="border-b bg-green-50 px-4 py-3 text-sm text-green-700">
          ✔ {order.seller_message}
        </div>
      )}

      {order.seller_cancel_reason && (
        <div className="border-b bg-red-50 px-4 py-3 text-sm text-red-600">
          ✖ {order.seller_cancel_reason}
        </div>
      )}

      {/* PRODUCTS */}
      <div className="mt-3 divide-y bg-white">

        {order.order_items.map((item) => (
          <div
            key={item.id}
            className="flex gap-3 p-4"
          >

            <Image
              src={
                item.thumbnail ||
                "/placeholder.png"
              }
              alt={item.product_name}
              width={80}
              height={80}
              className="h-20 w-20 rounded border object-cover"
            />

            <div className="flex-1">

              <p className="line-clamp-2 text-sm font-medium">
                {item.product_name}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                x{item.quantity}
              </p>

              <p className="mt-1 text-xs">
                Status:{" "}
                <span
                  className={getStatusColor(
                    item.fulfillment_status
                  )}
                >
                  {item.fulfillment_status}
                </span>
              </p>

              <p className="mt-2 text-sm font-semibold">
                π
                {formatPi(item.total_price)}
              </p>

            </div>

          </div>
        ))}

      </div>

      {/* ACTION */}
      <div className="space-y-3 p-4">

        {/* COMPLETED */}
        {order.fulfillment_status ===
          "completed" && (
          <div className="space-y-2">

            <button
              onClick={() =>
                router.push(
                  `/customer/orders/${order.id}/return`
                )
              }
              className="w-full rounded-lg border border-orange-500 py-2 font-medium text-orange-500 transition active:scale-95"
            >
              ↩{" "}
              {t.request_return ??
                "Trả hàng / Hoàn tiền"}
            </button>

            {order.order_items.length > 0 && (
              <button
                onClick={() =>
                  router.push(
                    `/product/${order.order_items[0]?.product_id}`
                  )
                }
                className="w-full rounded-lg border border-gray-300 py-2 text-gray-700 transition active:scale-95"
              >
                {t.buy_again ?? "Mua lại"}
              </button>
            )}

          </div>
        )}

        {/* CANCELLED */}
        {order.fulfillment_status ===
          "cancelled" && (
          <div className="space-y-2">

            <button className="w-full rounded-lg border py-2">
              {t.view_cancel_detail ??
                "Xem chi tiết huỷ"}
            </button>

            {order.order_items.length > 0 && (
              <button
                onClick={() =>
                  router.push(
                    `/product/${order.order_items[0]?.product_id}`
                  )
                }
                className="w-full rounded-lg border border-orange-500 py-2 text-orange-500"
              >
                {t.buy_again ?? "Mua lại"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
