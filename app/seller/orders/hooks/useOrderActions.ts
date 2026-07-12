"use client";

import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

function check(res: Response) {
  if (!res.ok) {
    throw new Error("REQUEST_FAILED");
  }
}

export function useOrderActions() {
  async function confirm(
    orderId: string,
    sellerMessage: string
  ) {
    const res = await apiAuthFetch(
      `/api/seller/orders/${orderId}/confirm`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seller_message: sellerMessage,
        }),
      }
    );

    await check(res);
  }

  async function cancel(
    orderId: string,
    reason: string
  ) {
    const res = await apiAuthFetch(
      `/api/seller/orders/${orderId}/cancel`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancel_reason: reason,
        }),
      }
    );

    await check(res);
  }

  async function shipping(
    orderId: string
  ) {
    const res = await apiAuthFetch(
      `/api/seller/orders/${orderId}/shipping`,
      {
        method: "PATCH",
      }
    );

    await check(res);
  }

  return {
    confirm,
    cancel,
    shipping,
  };
}
