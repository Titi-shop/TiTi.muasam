// =====================================================
// lib/db/settlement/settlement.credit.ts
// =====================================================
import type { PoolClient } from "pg";
import { getRpcVerificationLog } from "@/lib/db/payments.rpc";
import {
  query,
} from "@/lib/db";

import {
  randomUUID,
} from "crypto";

import type {
  CreditSellerInput,
} from "@/lib/payments/types";

import {
  makeEventHash,
} from "./settlement.utils";

import {
  createSettlementEventOnce,
} from "./settlement.event";

import {
  createSettlementJournalOnce,
} from "./settlement.journal";
import {
  logger,
  maskId,
} from "@/lib/logger";

/* =====================================================
   CREDIT SELLER
===================================================== */

export async function creditSeller(
    client: PoolClient,
    input: CreditSellerInput
): Promise<string> {
const rpc =
  await getRpcVerificationLog(
    input.paymentIntentId
  );

if (!rpc) {
  throw new Error("RPC_LOG_NOT_FOUND");
}
if (!rpc.verified) {
    throw new Error("RPC_NOT_VERIFIED");
}
if (!rpc.confirmed) {
  throw new Error("RPC_NOT_CONFIRMED");
}

if (rpc.txStatus !== "SUCCESS") {
  throw new Error("RPC_TX_FAILED");
}
  logger.info("SETTLEMENT.CREDIT.START", {
  escrowId: maskId(input.escrowId),
  sellerId: maskId(input.sellerId),
  amount: rpc.amount,
});

  try {

    /* ===================================================
       CHECK EXISTED
    =================================================== */

    const existed =
      await query<{ id: string }>(
        `
        SELECT id
        FROM seller_credits
        WHERE escrow_id = $1
        LIMIT 1
        `,
        [
          input.escrowId,
        ]
      );

    if (existed.rows.length) {

      logger.info("SETTLEMENT.CREDIT.EXISTS", {
  escrowId: maskId(input.escrowId),
  creditId: maskId(existed.rows[0].id),
});

      return existed.rows[0].id;
    }

    /* ===================================================
       CREATE CREDIT
    =================================================== */

    const creditId =
      randomUUID();

    const auditHash =
      makeEventHash({
        escrowId:
          input.escrowId,

        sellerId:
          input.sellerId,

        amount:
          rpc.amount!,

        paymentIntentId:
          input.paymentIntentId,

        orderId:
          input.orderId,

        piPaymentId:
          input.piPaymentId,
      });

    logger.debug("SETTLEMENT.CREDIT.INSERT_START", {
  creditId: maskId(creditId),
  escrowId: maskId(input.escrowId),
});

    await client.query(
      `
      INSERT INTO seller_credits (

        id,

        seller_id,
        escrow_id,

        payment_intent_id,
order_id,
amount,

withdrawn_amount,
        reversed_amount,

        frozen_amount,
        available_amount,

        currency,

        status,

        pi_payment_id,
        chain_txid,

        credit_source,

        ledger_version,

        audit_hash,

        lock_id,
        locked_at,
        lock_source,

        hold_reason,
        release_note,
        manual_review_reason,

        withdraw_count,
        last_withdraw_at,

        frozen_at,
        released_at,
        reversed_at,

        created_at,
        updated_at

      )
      VALUES (

        $1,

        $2,
        $3,

        $4,
        $5,

        $6,

        0,
        0,

        $6,
        0,

        'PI',

        'FROZEN',

        $7,
        NULL,

        'ORDER_PAYMENT',

        1,

        $8,

        NULL,
        NULL,
        NULL,

        'ESCROW_PENDING',
        NULL,
        NULL,

        0,
        NULL,

        NOW(),
        NULL,
        NULL,

        NOW(),
        NOW()
      )
      `,
      [
        creditId,

        input.sellerId,
        input.escrowId,

        input.paymentIntentId ??
          null,

        input.orderId ??
          null,

        rpc.amount!,

        input.piPaymentId ??
          null,

        auditHash,
      ]
    );

    logger.info("SETTLEMENT.CREDIT.INSERT_DONE", {
  creditId: maskId(creditId),
  escrowId: maskId(input.escrowId),
});

    /* ===================================================
       EVENT
    =================================================== */

    await createSettlementEventOnce({
      escrowId:
        input.escrowId,

      type:
        "SELLER_CREDITED",

      source:
        "ledger",

      reason:
        "SELLER_BALANCE_GRANTED",

      metadata:
        input,
    },
      client                             
     );

    logger.debug("SETTLEMENT.CREDIT.EVENT_DONE", {
  escrowId: maskId(input.escrowId),
});

    /* ===================================================
       JOURNAL
    =================================================== */
await createSettlementJournalOnce({
  ownerId: input.sellerId,
  ownerType: "SELLER",

  refId: creditId,
  refTable: "seller_credits",

  entryType: "SELLER_CREDIT",
  direction: "CREDIT",

  amount: rpc.amount!,
  note: "Seller escrow balance frozen",
  eventHash: auditHash,

  metadata: {
    escrowId: input.escrowId,
    paymentIntentId: input.paymentIntentId,
    orderId: input.orderId,
    piPaymentId: input.piPaymentId,
    sellerId: input.sellerId,
    amount: rpc.amount,
  },

  createdBy: input.sellerId,
},
     client                         
  );
    logger.debug("SETTLEMENT.CREDIT.JOURNAL_DONE", {
  creditId: maskId(creditId),
});

    logger.info("SETTLEMENT.CREDIT.SUCCESS", {
  creditId: maskId(creditId),
});

    return creditId;

  } catch (error) {

    logger.error("SETTLEMENT.CREDIT.FATAL", {
  escrowId: maskId(input.escrowId),
  sellerId: maskId(input.sellerId),
  message:
    error instanceof Error
      ? error.message
      : String(error),
});

    throw error;
  }
}
