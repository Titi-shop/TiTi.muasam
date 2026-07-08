// =====================================================
// lib/db/settlement/settlement.withdraw.ts
// =====================================================

import {
  query,
} from "@/lib/db";

import {
  randomUUID,
} from "crypto";

import type {
  WithdrawSellerInput,
} from "@/lib/payments/types";
import {
  createSettlementJournalOnce,
} from "./settlement.journal";

import {
  createSettlementEventOnce,
} from "./settlement.event";

import {
  makeEventHash,
} from "./settlement.utils";
import {
  logger,
  maskId,
  maskWallet,
} from "@/lib/logger";

/* =====================================================
   SELLER WITHDRAW
===================================================== */

export async function withdrawSeller(
  input: WithdrawSellerInput
): Promise<void> {
  logger.info("SETTLEMENT.WITHDRAW.START", {
  sellerId: maskId(input.sellerId),
  sellerCreditId: maskId(input.sellerCreditId),
});
if (!input.sellerCreditId) {
  throw new Error("SELLER_CREDIT_ID_REQUIRED");
}

if (!input.sellerId) {
  throw new Error("SELLER_ID_REQUIRED");
}

if (!input.withdrawWallet) {
  throw new Error("WITHDRAW_WALLET_REQUIRED");
}

if (input.amount <= 0) {
  throw new Error("INVALID_WITHDRAW_AMOUNT");
}
  /* ===================================================
     1. LOAD CREDIT
  =================================================== */

  const rs =
    await query<{
      available_amount: string;
      withdrawn_amount: string;
      withdraw_count: number;
    }>(
      `
      SELECT
        available_amount,
        withdrawn_amount,
        withdraw_count
      FROM seller_credits
      WHERE id = $1
      LIMIT 1
      `,
      [
        input.sellerCreditId,
      ]
    );

  if (!rs.rows.length) {
    throw new Error(
      "SELLER_CREDIT_NOT_FOUND"
    );
  }
logger.debug("SETTLEMENT.WITHDRAW.CREDIT_FOUND", {
  sellerCreditId: maskId(input.sellerCreditId),
});
  const available =
    Number(
      rs.rows[0]
        .available_amount
    );

  if (
  available < input.amount
) {

  logger.warn(
    "SETTLEMENT.WITHDRAW.INSUFFICIENT_BALANCE",
    {
      sellerId: maskId(input.sellerId),
      sellerCreditId: maskId(input.sellerCreditId),
    }
  );

  throw new Error(
    "INSUFFICIENT_SELLER_BALANCE"
  );
}

  /* ===================================================
     2. CREATE WITHDRAWAL
  =================================================== */

  const insertResult = await query(
  `
  INSERT INTO seller_withdrawals(

      id,

      seller_id,
      seller_credit_id,

      amount,
      currency,

      withdraw_wallet,

      txid,

      status,

      requested_at,
      completed_at

    )
    VALUES (

      $1,

      $2,
      $3,

      $4,
      'PI',

      $5,

      $6,

      'SENT',

      NOW(),
      NOW()
    )
    `,
    [
      randomUUID(),

      input.sellerId,
      input.sellerCreditId,

      input.amount,

      input.withdrawWallet,

      input.txid ??
        null,
    ]
  );
if (insertResult.rowCount !== 1) {
  throw new Error("WITHDRAW_CREATE_FAILED");
}
  logger.info("SETTLEMENT.WITHDRAW.CREATED", {
  sellerId: maskId(input.sellerId),
  sellerCreditId: maskId(input.sellerCreditId),
});
  /* ===================================================
     3. UPDATE CREDIT
  =================================================== */

  const updateResult = await query(
  `
  UPDATE seller_credits

    SET

      withdrawn_amount =
        withdrawn_amount + $2,

      available_amount =
        available_amount - $2,

      withdraw_count =
        withdraw_count + 1,

      last_withdraw_at =
        NOW(),

      chain_txid =
        COALESCE(
          $3,
          chain_txid
        ),

      status =
        CASE
          WHEN available_amount - $2 <= 0
          THEN 'WITHDRAWN'

          ELSE 'PARTIAL_WITHDRAWN'
        END,

      ledger_version =
        ledger_version + 1,

      updated_at =
        NOW()

    WHERE id = $1
  AND available_amount >= $2
    `,
    [
      input.sellerCreditId,

      input.amount,

      input.txid ??
        null,
    ]
  );
if (updateResult.rowCount !== 1) {
  throw new Error("SELLER_CREDIT_UPDATE_FAILED");
}
  logger.info("SETTLEMENT.WITHDRAW.CREDIT_UPDATED", {
  sellerCreditId: maskId(input.sellerCreditId),
});
  const walletUpdate = await query(
  `
  UPDATE wallets
  SET
    balance = balance - $1,
    available_balance = available_balance - $1,
    wallet_version = wallet_version + 1,
    updated_at = NOW()
  WHERE user_id = $2
    AND available_balance >= $1
  `,
  [
    input.amount,
    input.sellerId,
  ]
);

if (walletUpdate.rowCount !== 1) {
  throw new Error("WALLET_DEBIT_FAILED");
}
  logger.info("SETTLEMENT.WITHDRAW.WALLET_UPDATED", {
  sellerId: maskId(input.sellerId),
});
  /* ===================================================
     4. JOURNAL
  =================================================== */
const eventHash = makeEventHash({
  sellerCreditId: input.sellerCreditId,
  sellerId: input.sellerId,
  amount: input.amount,
  txid: input.txid,
});
  await createSettlementJournalOnce({
    ownerId:
      input.sellerId,

    ownerType:
      "SELLER",

    refId:
      input.sellerCreditId,

    refTable:
      "seller_withdrawals",

    entryType:
      "SELLER_WITHDRAW",

    direction:
      "DEBIT",

    amount:
      input.amount,

    note:
      "Seller withdrawal processed",
    eventHash,

metadata: {
  sellerId: input.sellerId,
  sellerCreditId: input.sellerCreditId,
  amount: input.amount,
  withdrawWallet: input.withdrawWallet,
  txid: input.txid,
},

createdBy: input.sellerId,
  });
  logger.debug("SETTLEMENT.WITHDRAW.JOURNAL_CREATED", {
  sellerId: maskId(input.sellerId),
});
  await createSettlementEventOnce({
  type: "SELLER_WITHDRAWN",
  source: "wallet",
  reason: "SELLER_WITHDRAW",

  metadata: {
  sellerId: input.sellerId,
  sellerCreditId: input.sellerCreditId,
  amount: input.amount,

  withdrawWallet: maskWallet(
    input.withdrawWallet
  ),

  txid: input.txid
    ? maskId(input.txid)
    : null,
}
});
  logger.info("SETTLEMENT.WITHDRAW.SUCCESS", {
  sellerId: maskId(input.sellerId),
  sellerCreditId: maskId(input.sellerCreditId),
});
  logger.debug("SETTLEMENT.WITHDRAW.EVENT_CREATED", {
  sellerId: maskId(input.sellerId),
});
  
}
