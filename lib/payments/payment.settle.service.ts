import { submitPiPaymentFromRequest } from "./payment.submit.service";
import { runPaymentSettlementFromRequest } from "./payment.orchestrator";
type Input = {
  raw: unknown;
  userId: string;
  requestId: string;
};
export async function settlePiPayment({
  raw,
  userId,
  requestId,
}: Input) {
  await submitPiPaymentFromRequest({
    raw,
    userId,
    requestId,
  });
  const result =
    await runPaymentSettlementFromRequest({
      rawBody: raw,
      userId,
      source: "submit-api",
    });
  if (!result) {
    throw new Error("SETTLEMENT_FAILED");
  }
  return {
    success: result.ok,
    requestId,
    order_id: result.orderId,
    amount: result.amount,
    pi_completed: result.piCompleted,
    rpc_audited: result.rpcAudited,
    source: result.source,
  };
}
