import { withTransaction } from "@/lib/db";
import {
  logger,
  maskId,
} from "@/lib/logger";
/* =========================================================
   TYPES
========================================================= */

type MarkPaymentVerifyingInput = {
  paymentIntentId: string;
  userId: string;
  piPaymentId: string;
  txid: string;
};

type PaymentIntentRow = {
  id: string;
  buyer_id: string;
  status: string;
  payment_state: string | null;
  provider_status: string | null;
  pi_user_uid: string | null;
  pi_payment_id: string | null;
  txid: string | null;
};

/* =========================================================
   MAIN
========================================================= */

export async function markPaymentVerifying({
  paymentIntentId,
  userId,
  piPaymentId,
  txid,
}: MarkPaymentVerifyingInput): Promise<{
  ok: true;
  already: boolean;
  status: string;
  paymentIntentId: string;
}> {
  return withTransaction(async (client) => {
    logger.info(
  "PAYMENT.SUBMIT.START",
  {
    paymentIntentId:
      maskId(paymentIntentId),
  }
);

    /* =====================================================
       1. LOCK INTENT
    ===================================================== */

    const rs =
  await client.query<PaymentIntentRow>(
    `
    SELECT
      id,
      buyer_id,

      status,
      payment_state,
      provider_status,

      pi_user_uid,
      pi_payment_id,
      txid

    FROM payment_intents
    WHERE id = $1
    FOR UPDATE
    `,
    [paymentIntentId]
  );

    if (!rs.rows.length) {
      throw new Error("INTENT_NOT_FOUND");
    }

    const intent = rs.rows[0];
logger.debug("PAYMENT.SUBMIT.CURRENT_STATE", {
  status: intent.status,
  paymentState: intent.payment_state,
  providerStatus: intent.provider_status,
  piPaymentId: maskId(intent.pi_payment_id),
  txid: maskId(intent.txid),
});
    if (intent.buyer_id !== userId) {
      throw new Error("FORBIDDEN");
    }

    logger.info("PAYMENT.SUBMIT.INTENT_OK", {
  status: intent.status,
  existingPiPaymentId: maskId(intent.pi_payment_id),
  existingTxid: maskId(intent.txid),
});

    /* =====================================================
       2. TERMINAL STATES
    ===================================================== */

    if (intent.status === "paid") {
      return {
        ok: true,
        already: true,
        status: "paid",
        paymentIntentId,
      };
    }

    if (intent.status === "failed" || intent.status === "expired") {
      throw new Error("INVALID_STATUS");
    }

    /* =====================================================
       3. VERIFYING IDEMPOTENT / REPLAY SAFE
    ===================================================== */

    if (intent.status === "verifying") {
      const samePi =
        (intent.pi_payment_id || "").trim() === piPaymentId.trim();

      const sameTx =
        (intent.txid || "").trim() === txid.trim();

      if (samePi && sameTx) {
        return {
          ok: true,
          already: true,
          status: "verifying",
          paymentIntentId,
        };
      }

      throw new Error("REPLAY_DETECTED");
    }

    /* =====================================================
       4. ALLOWED ENTRY STATES
    ===================================================== */

    const allowedStatus = [
      "created",
      "wallet_opened",
      "submitted",
    ];

    if (!allowedStatus.includes(intent.status)) {
      throw new Error("INVALID_STATUS");
    }

    /* =====================================================
       5. PI UID REQUIRED
    ===================================================== */

    if (!intent.pi_user_uid || typeof intent.pi_user_uid !== "string") {
      throw new Error("PI_UID_NOT_BOUND");
    }
if (
  intent.pi_payment_id &&
  intent.pi_payment_id !== piPaymentId
) {
  logger.warn("PAYMENT.SUBMIT.PI_PAYMENT_MISMATCH", {
  expected: maskId(intent.pi_payment_id),
  received: maskId(piPaymentId),
});
  throw new Error(
    "PI_PAYMENT_MISMATCH"
  );
}

if (
  intent.txid &&
  intent.txid !== txid
) {
  logger.warn("PAYMENT.SUBMIT.TXID_MISMATCH", {
  expected: maskId(intent.txid),
  received: maskId(txid),
});

  throw new Error(
    "TXID_MISMATCH"
  );
}
    /* =====================================================
       6. GLOBAL REPLAY PROTECTION
    ===================================================== */

    const dup = await client.query(
      `
      SELECT id
      FROM payment_intents
      WHERE (pi_payment_id = $1 OR txid = $2)
        AND id <> $3
      LIMIT 1
      `,
      [piPaymentId, txid, paymentIntentId]
    );

    if (dup.rows.length) {
  logger.error("PAYMENT.SUBMIT.GLOBAL_REPLAY", {
  paymentIntentId: maskId(paymentIntentId),
  piPaymentId: maskId(piPaymentId),
  txid: maskId(txid),
});

  throw new Error(
    "REPLAY_DETECTED"
  );
}

    /* =====================================================
       7. UPDATE ONLY SUBMIT SNAPSHOT
       NOTE:
       submit layer MUST NOT create settlement execution lock.
       orchestrator reconcile owns settlement locking.
    ===================================================== */

    const update =
  await client.query(
    `
    UPDATE payment_intents
    SET
      status = 'verifying',

      payment_state =
        'SUBMITTED',

      provider_status =
        'TX_BROADCASTED',

      settlement_state =
        'UNSETTLED',

      pi_payment_id = $2,
      txid = $3,

      reconcile_attempts =
        reconcile_attempts + 1,

      last_reconcile_at =
        now(),

      updated_at = now()

    WHERE id = $1
      AND status IN (
        'created',
        'wallet_opened',
        'submitted'
      )
    `,
    [
      paymentIntentId,
      piPaymentId,
      txid,
    ]
  );

if (!update.rowCount) {
  logger.warn("PAYMENT.SUBMIT.STATUS_CHANGED", {
  paymentIntentId: maskId(paymentIntentId),
});

  throw new Error(
    "STATUS_CHANGED"
  );
}

logger.info("PAYMENT.SUBMIT.UPDATE_OK", {
  paymentIntentId: maskId(paymentIntentId),
  status: "verifying",
  paymentState: "SUBMITTED",
  providerStatus: "TX_BROADCASTED",
});

    logger.info("PAYMENT.SUBMIT.VERIFYING_SET", {
  paymentIntentId: maskId(paymentIntentId),
  piPaymentId: maskId(piPaymentId),
  txid: maskId(txid),
});

    return {
      ok: true,
      already: false,
      status: "verifying",
      paymentIntentId,
    };
  });
}
