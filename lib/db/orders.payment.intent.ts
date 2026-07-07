import type { PoolClient } from "pg";

import type {
  ExistingOrderRow,
  AlreadyPaidResult,
  FinalizeIntentInput,
  FindExistingOrderInput,
} from "./orders.payment.types";
import {
  logger,
  maskId,
} from "@/lib/logger";
/* =========================================================
   FIND EXISTING ORDER
========================================================= */

export async function findExistingOrder(
  client: PoolClient,
  input: FindExistingOrderInput
): Promise<AlreadyPaidResult | null> {
  const {
    piPaymentId,
    buyerId,
    sellerId,
    amount,
  } = input;

  const existingOrder =
    await client.query<
      ExistingOrderRow
    >(
      `
      SELECT id
      FROM orders
      WHERE pi_payment_id = $1
      LIMIT 1
      `,
      [piPaymentId]
    );

  if (
    existingOrder.rows.length === 0
  ) {
    return null;
  }

  return {
    ok: true,
    already: true,

    orderId:
      existingOrder.rows[0].id,

    buyerId,
    sellerId,

    amount,
  };
}

/* =========================================================
   FINALIZE PAYMENT INTENT
========================================================= */

export async function finalizePaymentIntent(
  client: PoolClient,
  input: FinalizeIntentInput
): Promise<void> {
  logger.info("PAYMENT.FINALIZE_INTENT.START", {
  paymentIntentId: maskId(input.paymentIntentId),
  piPaymentId: maskId(input.piPaymentId),
  txid: maskId(input.txid),
});
  const {
    paymentIntentId,
    piPaymentId,
    txid,
  } = input;

  const result =
    await client.query(
      `
      UPDATE payment_intents
      SET
        status = 'paid',

        payment_state = 'PAID',
        provider_status = 'COMPLETED',

        settlement_state =
          'LEDGER_POSTED',

        pi_payment_id = $2,
        txid = $3,

        paid_at = now(),
        finalized_at = now(),

        updated_at = now()

      WHERE id = $1
        AND status <> 'paid'
      `,
      [
        paymentIntentId,
        piPaymentId,
        txid,
      ]
    );

  if (result.rowCount) {
  logger.info("PAYMENT.FINALIZE_INTENT.UPDATED", {
  paymentIntentId: maskId(paymentIntentId),
  piPaymentId: maskId(piPaymentId),
  txid: maskId(txid),
});
} else {
  logger.info("PAYMENT.FINALIZE_INTENT.ALREADY_PAID", {
  paymentIntentId: maskId(paymentIntentId),
});
}
}
