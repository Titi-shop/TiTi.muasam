import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guard";
import { getBuyerOrderCounts } from "@/lib/db/orders.buyer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =======================================================
   GET
======================================================= */

export async function GET() {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.userId;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json(
      {
        error: "INVALID_USER_ID",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const data =
      await getBuyerOrderCounts(
        userId
      );

    /**
     * pending
     * = pending payment
     * + pending fulfillment
     */
    const pending =
      Number(
        data?.pending ?? 0
      ) +
      Number(
        data?.pending_fulfillment ??
          0
      );

    /**
     * confirmed
     * = processing
     */
    const confirmed =
      Number(
        data?.processing ?? 0
      );

    /**
     * shipping
     * = shipped
     */
    const shipping =
      Number(
        data?.shipped ?? 0
      );

    /**
     * completed
     * ⚠ chỉ hiện đơn completed
     * CHƯA review
     */
    const completed =
      Number(
        data?.completed_unreviewed ??
          data?.completed ??
          0
      );

    /**
     * cancelled
     * = cancelled + refunded
     */
    const cancelled =
      Number(
        data?.cancelled ?? 0
      ) +
      Number(
        data?.refunded ?? 0
      );

    return NextResponse.json({
      pending,
      confirmed,
      shipping,
      completed,
      cancelled,
    });
  } catch (error) {
    console.error(
      "GET /api/orders/count error:",
      error
    );

    return NextResponse.json(
      {
        pending: 0,
        confirmed: 0,
        shipping: 0,
        completed: 0,
        cancelled: 0,
      },
      {
        status: 200,
      }
    );
  }
}
