import { NextRequest, NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   PATCH /api/orders/[id]
========================= */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromBearer();

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const orderId = params.id;
  const body = await req.json();
  const { status, cancel_reason } = body;

  if (typeof status !== "string") {
    return NextResponse.json(
      { error: "INVALID_STATUS" },
      { status: 400 }
    );
  }

  try {
    // chỉ cho phép buyer của đơn được cập nhật
    const result = await query(
      `
      UPDATE orders
      SET status = $1
      WHERE id = $2
        AND buyer_id = $3
      RETURNING *
      `,
      [status, orderId, user.pi_uid]
    );

    if (!result.rows.length) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH ORDER ERROR:", err);
    return NextResponse.json(
      { error: "UPDATE_FAILED" },
      { status: 500 }
    );
  }
}
