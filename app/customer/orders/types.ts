export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type OrderItem = {
  product_id: string;
  product_name?: string | null;
  thumbnail?: string | null;
  quantity?: number;
};

export type Order = {
  id: string;
  order_number: string;
  payment_status?: PaymentStatus;
  fulfillment_status?: string;
  total: number | string;
  currency: string;
  created_at: string;
  order_items?: OrderItem[];
};

export type OrdersResponse = {
  orders?: Order[];
};

export const CANCEL_REASON_KEYS = [
  "cancel_reason_change_mind",
  "cancel_reason_wrong_product",
  "cancel_reason_change_variant",
  "cancel_reason_better_price",
  "cancel_reason_delivery_slow",
  "cancel_reason_update_address",
  "cancel_reason_other",
] as const;

export type CancelReasonKey =
  (typeof CANCEL_REASON_KEYS)[number];

export type ReviewedMap =
  Record<string, boolean>;
