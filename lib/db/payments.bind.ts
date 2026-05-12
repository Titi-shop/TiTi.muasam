
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

  status: string | null;

  pi_payment_id: string | null;

  pi_user_uid: string | null;

  pi_verified_amount: number | null;
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
      "INVALID_VERIFIED_AMOUNT"
    );
  }

  if (n <= 0) {
    throw new Error(
      "INVALID_VERIFIED_AMOUNT"
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
     VALIDATION
  ===================================================== */

  if (
    !isUUID(
      paymentIntentId
    )
  ) {
    vlog(
      "INVALID_PAYMENT_INTENT_ID",
      paymentIntentId
    );

    throw new Error(
      "INVALID_PAYMENT_INTENT_ID"
    );
  }

  if (
    typeof piPaymentId !==
      "string" ||
    !piPaymentId.trim()
  ) {
    vlog(
      "INVALID_PI_PAYMENT_ID"
    );

    throw new Error(
      "INVALID_PI_PAYMENT_ID"
    );
  }

  if (
    typeof piUid !==
      "string" ||
    !piUid.trim()
  ) {
    vlog("INVALID_PI_UID");

    throw new Error(
      "INVALID_PI_UID"
    );
  }

  const amount =
    safeAmount(
      verifiedAmount
    );

  vlog("VALIDATION_OK", {
    amount,
  });

  /* =====================================================
     TX
  ===================================================== */

  return withTransaction(
    async (client) => {
      vlog("TX_BEGIN");

      /* =================================================
         LOCK
      ================================================= */

      vlog("LOCK_START", {
        paymentIntentId,
      });

      const lockRes =
        await client.query<LockedIntentRow>(
          `
          SELECT
            id,
            status,
            pi_payment_id,
            pi_user_uid,
            pi_verified_amount
          FROM payment_intents
          WHERE id = $1
          FOR UPDATE
          `,
          [paymentIntentId]
        );

      if (
        !lockRes.rows.length
      ) {
        vlog(
          "INTENT_NOT_FOUND",
          {
            paymentIntentId,
          }
        );

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
        existing_pi_payment_id:
          intent.pi_payment_id,
        existing_pi_uid:
          intent.pi_user_uid,
        existing_verified_amount:
          intent.pi_verified_amount,
      });

      /* =================================================
         IDEMPOTENT SAME PAYMENT
      ================================================= */

      if (
        intent.pi_payment_id ===
        piPaymentId
      ) {
        vlog(
          "IDEMPOTENT_REPLAY_DETECTED",
          {
            paymentIntentId,
            piPaymentId,
          }
        );

        return;
      }

      /* =================================================
         CONFLICT
      ================================================= */

      if (
        intent.pi_payment_id &&
        intent.pi_payment_id !==
          piPaymentId
      ) {
        vlog(
          "PAYMENT_CONFLICT",
          {
            paymentIntentId,
            existing:
              intent.pi_payment_id,
            incoming:
              piPaymentId,
          }
        );

        throw new Error(
          "PI_PAYMENT_ALREADY_BOUND"
        );
      }

      /* =================================================
         UPDATE
      ================================================= */

      vlog("UPDATE_START", {
        paymentIntentId,
      });

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

      vlog("UPDATE_OK", {
        paymentIntentId,
        piPaymentId,
        amount,
      });

      /* =================================================
         COMPLETE
      ================================================= */

      vlog("SUCCESS", {
        paymentIntentId,
        piPaymentId,
      });
    }
  );
}
