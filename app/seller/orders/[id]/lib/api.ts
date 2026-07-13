import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

import type {
  Order,
  OrderItem,
  RawItem,
} from "../types";

function safeNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n)
    ? n
    : 0;
}

function safeString(v: unknown): string {
  return typeof v === "string"
    ? v
    : "";
}

export async function getOrder(
  url: string
): Promise<Order | null> {
  try {
    const res =
      await apiAuthFetch(url);

    if (!res.ok) {
      return null;
    }

    const data =
      await res.json();

    const items: OrderItem[] =
      (data.order_items ?? []).map(
        (item: RawItem) => ({
          id: safeString(item.id),

          product_id:
            item.product_id ?? null,

          product_name:
            safeString(
              item.product_name
            ),

          thumbnail:
            safeString(
              item.thumbnail
            ),

          variant_name:
            safeString(
              item.variant_name
            ),

          variant_value:
            safeString(
              item.variant_value
            ),

          quantity:
            safeNumber(
              item.quantity
            ),

          unit_price:
            safeNumber(
              item.unit_price
            ),

          total_price:
            safeNumber(
              item.total_price
            ),

          status:
            safeString(
              item.status
            ),
        })
      );

    return {
      id: safeString(data.id),

      order_number:
        safeString(
          data.order_number
        ),

      created_at:
        safeString(
          data.created_at
        ),

      confirmed_at:
        data.confirmed_at ??
        null,

      shipped_at:
        data.shipped_at ??
        null,

      delivered_at:
        data.delivered_at ??
        null,

      cancelled_at:
        data.cancelled_at ??
        null,

      shipping_name:
        safeString(
          data.shipping_name
        ),

      shipping_phone:
        safeString(
          data.shipping_phone
        ),

      shipping_address_line:
        safeString(
          data.shipping_address_line
        ),

      shipping_ward:
        safeString(
          data.shipping_ward
        ),

      shipping_district:
        safeString(
          data.shipping_district
        ),

      shipping_region:
        safeString(
          data.shipping_region
        ),

      shipping_country:
        safeString(
          data.shipping_country
        ),

      shipping_postal_code:
        safeString(
          data.shipping_postal_code
        ),

      total:
        safeNumber(
          data.total
        ),

      order_items:
        items,
    };

  } catch {
    return null;
  }
}
