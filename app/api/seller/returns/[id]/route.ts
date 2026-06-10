import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";

import {
  getReturnByIdForSeller,
  updateReturnStatusBySeller,
  refundBuyerForReturn,
} from "@/lib/db/returns";

export const runtime = "nodejs";

/* ================= HELPERS ================= */

function errorJson(code: string, status = 400) {
  return NextResponse.json({ error: code }, { status });
}

/* ================= GET ================= */

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  const returnId = params.id;

  const data = await getReturnByIdForSeller(
    returnId,
    auth.userId
  );

  if (!data) return errorJson("NOT_FOUND", 404);

  return NextResponse.json(data);
}

/* ================= PATCH ================= */

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  const returnId = params.id;
  const { action } = await req.json();

  if (!["approve", "reject", "received"].includes(action)) {
    return errorJson("INVALID_ACTION");
  }

  const returnData = await getReturnByIdForSeller(
    returnId,
    auth.userId
  );

  if (!returnData) {
    return errorJson("NOT_FOUND", 404);
  }

  /* ================= BUSINESS FLOW ================= */

  if (action === "approve") {
    await updateReturnStatusBySeller(
      returnId,
      auth.userId,
      "approved"
    );
  }

  if (action === "reject") {
    await updateReturnStatusBySeller(
      returnId,
      auth.userId,
      "rejected"
    );
  }

  if (action === "received") {
    await updateReturnStatusBySeller(
      returnId,
      auth.userId,
      "received"
    );

    // 👇 refund logic moved to DB layer
    await refundBuyerForReturn({
      returnId,
      sellerId: auth.userId,
    });

    await updateReturnStatusBySeller(
      returnId,
      auth.userId,
      "refunded"
    );
  }

  return NextResponse.json({ success: true });
}
