
import { query } from "@/lib/db";
import { createHash, randomUUID } from "crypto";

/* =========================================================
   TYPES
========================================================= */

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export type AuditSeverity = "info" | "warn" | "error" | "critical";

export type AuditStage =
  | "INTENT"
  | "PI_VERIFY"
  | "RPC_VERIFY"
  | "PI_COMPLETE"
  | "ORDER"
  | "FULFILLMENT"
  | "SHIPMENT"
  | "LEDGER"
  | "FINALIZE"
  | "MANUAL";

export type AuditActorType =
  | "system"
  | "api"
  | "cron"
  | "admin"
  | "pi_api"
  | "rpc"
  | "ledger";

/* =========================================================
   WRITE PARAMS
========================================================= */

type WriteAuditParams = {
  paymentIntentId: string;

  eventCode: string;
  stage: AuditStage;

  severity?: AuditSeverity;

  actorType?: AuditActorType;
  actorId?: string | null;

  source?: string | null;
  requestId?: string | null;

  orderId?: string | null;
  escrowId?: string | null;

  piPaymentId?: string | null;
  txid?: string | null;

  oldPaymentStatus?: string | null;
  newPaymentStatus?: string | null;

  oldSettlementState?: string | null;
  newSettlementState?: string | null;

  reconcileAttempt?: number;

  note?: string | null;
  payload?: JsonValue | null;
};

/* =========================================================
   HELPERS (IMPORTANT FIX)
========================================================= */

function safeString(v: any): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function safeJson(v: any): JsonValue {
  if (v === undefined || v === null) return {};
  return v;
}

function makeHash(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

/* =========================================================
   PREVIOUS HASH
========================================================= */

async function getPreviousHash(paymentIntentId: string): Promise<string | null> {
  const rs = await query<{ event_hash: string }>(
    `
    SELECT event_hash
    FROM payment_audit_logs
    WHERE payment_intent_id = $1
    ORDER BY event_index DESC
    LIMIT 1
    `,
    [paymentIntentId]
  );

  return rs.rows[0]?.event_hash ?? null;
}

/* =========================================================
   MAIN AUDIT WRITER (FIXED NULL ISSUE)
========================================================= */

export async function writePaymentAudit(params: WriteAuditParams): Promise<void> {
  const prevHash = await getPreviousHash(params.paymentIntentId);

  // 🔥 FORCE SAFE DEFAULTS (CRITICAL FIX)
  const normalized = {
    paymentIntentId: params.paymentIntentId,

    eventCode: params.eventCode,
    stage: params.stage,
    severity: params.severity ?? "info",

    actorType: params.actorType ?? "system",
    actorId: params.actorId ?? null,

    source: params.source ?? "unknown",
    requestId: params.requestId ?? params.paymentIntentId,

    orderId: params.orderId ?? null,
    escrowId: params.escrowId ?? null,

    piPaymentId: params.piPaymentId ?? null,
    txid: params.txid ?? null,

    oldPaymentStatus: params.oldPaymentStatus ?? null,
    newPaymentStatus: params.newPaymentStatus ?? null,

    oldSettlementState: params.oldSettlementState ?? null,
    newSettlementState: params.newSettlementState ?? null,

    reconcileAttempt: params.reconcileAttempt ?? 0,

    note: params.note ?? null,
    payload: safeJson(params.payload),

    prevHash,
  };

  const eventHash = makeHash({
    ...normalized,
    nonce: randomUUID(),
  });

  /* =========================================================
     DEBUG (IMPORTANT - KEEP IN PROD UNTIL STABLE)
  ========================================================= */
  console.log("[AUDIT][WRITE]", {
    paymentIntentId: normalized.paymentIntentId,
    orderId: normalized.orderId,
    escrowId: normalized.escrowId,
    piPaymentId: normalized.piPaymentId,
    txid: normalized.txid,
    source: normalized.source,
    requestId: normalized.requestId,
  });

  await query(
    `
    INSERT INTO payment_audit_logs (
      payment_intent_id,
      order_id,
      escrow_id,
      pi_payment_id,
      txid,

      event_code,
      stage,
      severity,

      actor_type,
      actor_id,
      source,
      request_id,

      old_payment_status,
      new_payment_status,

      old_settlement_state,
      new_settlement_state,

      reconcile_attempt,

      note,
      payload,

      prev_hash,
      event_hash
    )
    VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,
      $9,$10,$11,$12,
      $13,$14,
      $15,$16,
      $17,
      $18,$19,
      $20,$21
    )
    `,
    [
      normalized.paymentIntentId,
      normalized.orderId,
      normalized.escrowId,
      normalized.piPaymentId,
      normalized.txid,

      normalized.eventCode,
      normalized.stage,
      normalized.severity,

      normalized.actorType,
      normalized.actorId,
      normalized.source,
      normalized.requestId,

      normalized.oldPaymentStatus,
      normalized.newPaymentStatus,

      normalized.oldSettlementState,
      normalized.newSettlementState,

      normalized.reconcileAttempt,

      normalized.note,
      JSON.stringify(normalized.payload),

      prevHash,
      eventHash,
    ]
  );
}

/* =========================================================
   PRESET HELPERS (FIXED + CONSISTENT DATA)
========================================================= */

export const auditIntentCreated = (paymentIntentId: string, payload?: JsonValue) =>
  writePaymentAudit({
    paymentIntentId,
    eventCode: "INTENT_CREATED",
    stage: "INTENT",
    actorType: "api",
    newPaymentStatus: "pending",
    newSettlementState: "UNSETTLED",
    payload,
  });

export const auditPiVerified = (paymentIntentId: string, payload?: JsonValue) =>
  writePaymentAudit({
    paymentIntentId,
    eventCode: "PI_VERIFIED",
    stage: "PI_VERIFY",
    actorType: "pi_api",
    newSettlementState: "PI_VERIFIED",
    payload,
  });

export const auditRpcVerified = (paymentIntentId: string, payload?: JsonValue) =>
  writePaymentAudit({
    paymentIntentId,
    eventCode: "RPC_VERIFIED",
    stage: "RPC_VERIFY",
    actorType: "rpc",
    newSettlementState: "RPC_VERIFIED",
    payload,
  });

export const auditRpcFailed = (paymentIntentId: string, payload?: JsonValue) =>
  writePaymentAudit({
    paymentIntentId,
    eventCode: "RPC_FAILED",
    stage: "RPC_VERIFY",
    severity: "warn",
    actorType: "rpc",
    payload,
  });

export const auditPiCompleted = (paymentIntentId: string, payload?: JsonValue) =>
  writePaymentAudit({
    paymentIntentId,
    eventCode: "PI_COMPLETED",
    stage: "PI_COMPLETE",
    actorType: "pi_api",
    newPaymentStatus: "paid",
    newSettlementState: "PI_COMPLETED",
    payload,
  });

export const auditFinalizeDone = (paymentIntentId: string, payload?: JsonValue) =>
  writePaymentAudit({
    paymentIntentId,
    eventCode: "ORDER_FINALIZED",
    stage: "FINALIZE",
    actorType: "system",
    newPaymentStatus: "paid",
    newSettlementState: "ORDER_FINALIZED",
    payload,
  });

export const auditOrderFulfillment = (
  paymentIntentId: string,
  orderId: string,
  payload?: JsonValue
) =>
  writePaymentAudit({
    paymentIntentId,
    orderId,
    eventCode: "ORDER_FULFILLMENT",
    stage: "FULFILLMENT",
    actorType: "system",
    newSettlementState: "PENDING_FULFILLMENT",
    payload,
  });

export const auditOrderShipped = (
  paymentIntentId: string,
  orderId: string,
  payload?: JsonValue
) =>
  writePaymentAudit({
    paymentIntentId,
    orderId,
    eventCode: "ORDER_SHIPPED",
    stage: "SHIPMENT",
    actorType: "system",
    newSettlementState: "SHIPPED",
    payload,
  });

export const auditDuplicateSubmit = (
  paymentIntentId: string,
  payload?: JsonValue
) =>
  writePaymentAudit({
    paymentIntentId,
    eventCode: "DUPLICATE_SUBMIT",
    stage: "INTENT",
    severity: "warn",
    actorType: "api",
    payload,
  });

export const auditManualReview = (
  paymentIntentId: string,
  reason: string,
  payload?: JsonValue
) =>
  writePaymentAudit({
    paymentIntentId,
    eventCode: "MANUAL_REVIEW",
    stage: "MANUAL",
    severity: "critical",
    actorType: "system",
    note: reason,
    payload,
  });
