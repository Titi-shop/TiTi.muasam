
import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { submitPiPaymentFromRequest } from "@/lib/payments/payment.submit.service";
import { runPaymentSettlementFromRequest } from "@/lib/payments/payment.orchestrator";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  try {
    const auth = await getUserFromBearer();
    if (!auth?.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "UNAUTHORIZED",
          requestId,
        },
        { status: 401 }
      );
    }
    const raw = await req.json().catch(() => null);
    await submitPiPaymentFromRequest({
      userId: auth.userId,
      raw,
      requestId,
    });
    const result =
      await runPaymentSettlementFromRequest({
        rawBody: raw,
        userId: auth.userId,
        source: "submit-api",
      });
    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "SETTLEMENT_FAILED",
          requestId,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: result.ok,
      requestId,
      order_id: result.orderId,
      amount: result.amount,
      pi_completed: result.piCompleted,
      rpc_audited: result.rpcAudited,
      source: result.source,
    });
  } catch (e) {
    console.error("[PAYMENT][SUBMIT_ROUTE_CRASH]", e);
    return NextResponse.json(
      {
        success: false,
        error:
          e instanceof Error
            ? e.message
            : "SUBMIT_FAILED",
        requestId,
      },
      { status: 400 }
    );
  }
}
