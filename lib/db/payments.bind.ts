import { withTransaction } from "@/lib/db";

/* =========================================================
   TYPES
========================================================= */

type BindParams = {
  paymentIntentId: string;

  piPaymentId: string;

  piUid: string;

  verifiedAmount: number;

  piPayload: unknown;
};

type LockedIntentRow = {
  id: string;

  pi_payment_id: string | null;

  status: string | null;
};

/* =========================================================
   HELPERS
========================================================= */

function vlog(
  step: string,
  data?: unknown
) {
  console.log(
    `[PAYMENTS_BIND_V7][${step}]`,
    data ?? ""
  );
}

function isUUID(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function safeAmount(
  value: unknown
): number {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    throw new Error(
      "INVALID_AMOUNT"
    );
  }

  return n;
}

/* =========================================================
   MAIN
========================================================= */

export async function bindPiPaymentToIntent({
  paymentIntentId,
  piPaymentId,
  piUid,
  verifiedAmount,
  piPayload,
}: BindParams): Promise<void> {
  vlog("START", {
    paymentIntentId,
    piPaymentId,
  });

  /* =====================================================
     FAST FAIL VALIDATION
  ===================================================== */

  if (!isUUID(paymentIntentId)) {
    throw new Error(
      "INVALID_PAYMENT_INTENT_ID"
    );
  }

  if (!piPaymentId) {
    throw new Error(
      "INVALID_PI_PAYMENT_ID"
    );
  }

  if (!piUid) {
    throw new Error(
      "INVALID_PI_UID"
    );
  }

  const amount =
    safeAmount(
      verifiedAmount
    );

  /* =====================================================
     TX
  ===================================================== */

  return withTransaction(
    async (client) => {
      /* =================================================
         LOCK ROW
      ================================================= */

      vlog("LOCK_START");

      const lockRes =
        await client.query<LockedIntentRow>(
          `
          SELECT
            id,
            pi_payment_id,
            status
          FROM payment_intents
          WHERE id = $1
          FOR UPDATE
          `,
          [paymentIntentId]
        );

      if (
        !lockRes.rows.length
      ) {
        throw new Error(
          "PAYMENT_INTENT_NOT_FOUND"
        );
      }

      const intent =
        lockRes.rows[0];

      vlog("LOCK_OK", {
        id: intent.id,
        status:
          intent.status,
        existing:
          intent.pi_payment_id,
      });

      /* ================================================
         IDEMPOTENT RE-BIND
      ================================================ */

      if (
        intent.pi_payment_id ===
        piPaymentId
      ) {
        vlog(
          "ALREADY_BOUND_SAME_PAYMENT"
        );

        return;
      }

      /* ================================================
         CONFLICT GUARD
      ================================================ */

      if (
        intent.pi_payment_id &&
        intent.pi_payment_id !==
          piPaymentId
      ) {
        throw new Error(
          "PI_PAYMENT_ALREADY_BOUND"
        );
      }

      /* ================================================
         UPDATE
      ================================================ */

      vlog("UPDATE_START");

      await client.query(
        `
        UPDATE payment_intents
        SET
          pi_payment_id = $2,
          pi_user_uid = $3,
          pi_verified_amount = $4,
          pi_payment_payload = $5,

          status = 'authorized',

          updated_at = now()
        WHERE id = $1
        `,
        [
          paymentIntentId,
          piPaymentId,
          piUid,
          amount,
          JSON.stringify(
            piPayload ?? {}
          ),
        ]
      );

      vlog("UPDATE_DONE", {
        paymentIntentId,
        piPaymentId,
      });
    }
  );
}
