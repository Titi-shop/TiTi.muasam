export const ORDER_STATUS = {
  PENDING: "pending",
  PENDING_FULFILLMENT: "pending_fulfillment",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  RETURNS: "returns",
} as const;

export type OrderStatus =
  (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/**
 * Optional: giúp UI / API mapping an toàn hơn
 */
export const ORDER_ACTIVE_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.PENDING_FULFILLMENT,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
] as const;

export const ORDER_FINISHED_STATUSES = [
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
] as const;
