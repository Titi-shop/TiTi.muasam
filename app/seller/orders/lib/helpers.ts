import type {
  Order,
  OrderItem,
  OrderStatus,
  RawOrder,
  RawOrderItem,
} from "../types";

/* =========================================================
   STATUS
========================================================= */

export function normalizeStatus(
  value?: string
): OrderStatus {
  switch ((value ?? "").toLowerCase().trim()) {
    case "pending":
    case "processing":
    case "shipped":
    case "delivered":
    case "completed":
    case "returned":
    case "cancelled":
      return value.toLowerCase().trim() as OrderStatus;

    default:
      return "pending";
  }
}

/* =========================================================
   ORDER STATUS
========================================================= */

export function getOrderStatus(
  items: RawOrderItem[]
): OrderStatus {
  const statuses = items.map((i) =>
    normalizeStatus(i.fulfillment_status)
  );

  if (statuses.includes("processing")) return "processing";
  if (statuses.includes("shipped")) return "shipped";
  if (statuses.includes("delivered")) return "delivered";
  if (statuses.includes("completed")) return "completed";
  if (statuses.includes("returned")) return "returned";
  if (statuses.includes("cancelled")) return "cancelled";

  return "pending";
}

/* =========================================================
   NORMALIZE ITEM
========================================================= */

export function normalizeItem(
  item: RawOrderItem
): OrderItem {
  return {
    id: String(item.id ?? ""),
    product_name: String(item.product_name ?? ""),
    thumbnail: String(item.thumbnail ?? ""),
    quantity: Number(item.quantity ?? 0),
    unit_price: Number(item.unit_price ?? 0),
  };
}

/* =========================================================
   NORMALIZE ORDER
========================================================= */

export function normalizeOrder(
  raw: RawOrder
): Order {
  const items = raw.order_items ?? [];

  return {
    id: String(raw.id ?? ""),
    order_number: String(raw.order_number ?? ""),
    status: getOrderStatus(items),
    total: Number(raw.total ?? 0),
    created_at: String(raw.created_at ?? ""),
    shipping_name: String(raw.shipping_name ?? ""),
    shipping_phone: String(raw.shipping_phone ?? ""),
    order_items: items.map(normalizeItem),
  };
}

/* =========================================================
   FILTER
========================================================= */

export function filterOrders(
  orders: Order[],
  keyword: string
) {
  const q = keyword.trim().toLowerCase();

  if (!q) return orders;

  return orders.filter(
    (o) =>
      o.order_number.toLowerCase().includes(q) ||
      o.shipping_name.toLowerCase().includes(q)
  );
}
