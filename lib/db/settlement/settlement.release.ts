// =====================================================
// lib/db/settlement/settlement.release.ts
// =====================================================

import type {
  EscrowReleaseRow,
  ReleaseEscrowFlowInput,
} from "@/lib/payments/types";

import {
  createSettlementEventOnce,
} from "./settlement.event";

import {
  createSettlementJournalOnce,
} from "./settlement.journal";

import {
  ensureWallet,
  creditWallet,
} from "@/lib/db/wallet";

/* =====================================================
   FIND RELEASABLE ESCROWS
===================================================== */

export async function findReleasableEscrows(
  client: {
    query: <T>(
      sql: string,
      params?: unknown[]
    ) => Promise<{
      rows: T[];
    }>;
  }
): Promise<EscrowReleaseRow[]> {

  const { rows } =
    await client.query<EscrowReleaseRow>(
      `
      SELECT
        id,
        order_id,
        seller_id,
        amount,
        status,
        release_status,
        release_after

      FROM escrow_entries

      WHERE
        release_status = 'HOLD'

        AND status = 'PAID'

        AND release_after IS NOT NULL

        AND release_after <= NOW()

      FOR UPDATE SKIP LOCKED
      `
    );

  return rows;
}

/* =====================================================
   RELEASE ESCROW FLOW
===================================================== */

export async function releaseEscrowFlow(
  input: ReleaseEscrowFlowInput
): Promise<void> {

  const {
    client,
    escrow,
  } = input;

  const amount =
    Number(escrow.amount);

  if (
    Number.isNaN(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "INVALID_ESCROW_AMOUNT"
    );
  }

  /* ===================================================
     1. RELEASE ESCROW
  =================================================== */

  await client.query(
    `
    UPDATE escrow_entries

    SET
      status = 'SETTLED',

      release_status =
        'RELEASED',

      released_amount =
        amount,

      released_at =
        NOW(),

      updated_at =
        NOW(),

      escrow_version =
        escrow_version + 1

    WHERE id = $1
      AND release_status = 'HOLD'
    `,
    [
      escrow.id,
    ]
  );

  /* ===================================================
     2. RELEASE SELLER CREDIT
  =================================================== */

  await client.query(
    `
    UPDATE seller_credits

    SET
      status = 'AVAILABLE',

      available_amount =
        amount,

      frozen_amount = 0,

      released_at =
        NOW(),

      updated_at =
        NOW(),

      ledger_version =
        ledger_version + 1

    WHERE escrow_id = $1
      AND status = 'FROZEN'
    `,
    [
      escrow.id,
    ]
  );

  /* ===================================================
     3. ENSURE WALLET
  =================================================== */

  await ensureWallet(
    escrow.seller_id
  );

  /* ===================================================
     4. CREDIT WALLET
  =================================================== */

  await creditWallet({
    userId:
      escrow.seller_id,

    amount,
  });

  /* ===================================================
     5. JOURNAL
  =================================================== */

  await createSettlementJournalOnce({
    ownerId:
      escrow.seller_id,

    ownerType:
      "SELLER",

    refId:
      escrow.id,

    refTable:
      "escrow_entries",

    entryType:
      "SELLER_ESCROW_RELEASE",

    direction:
      "CREDIT",

    amount,

    note:
      "Escrow released to seller wallet",
  });

  /* ===================================================
     6. COMPLETE ORDER
  =================================================== */

  await client.query(
    `
    UPDATE orders

    SET
      fulfillment_status =
        'completed',

      completed_at =
        NOW(),

      updated_at =
        NOW()

    WHERE id = $1
    `,
    [
      escrow.order_id,
    ]
  );

  /* ===================================================
     7. COMPLETE ORDER ITEMS
  =================================================== */

  await client.query(
    `
    UPDATE order_items

    SET
      fulfillment_status =
        'completed',

      completed_at =
        NOW(),

      updated_at =
        NOW()

    WHERE order_id = $1
      AND fulfillment_status IN (
        'shipped',
        'delivered'
      )
    `,
    [
      escrow.order_id,
    ]
  );

  /* ===================================================
     8. EVENT
  =================================================== */

  await createSettlementEventOnce({
    escrowId:
      escrow.id,

    type:
      "AUTO_RELEASE",

    source:
      "system",

    reason:
      "ESCROW_AUTO_RELEASED",

    metadata: {
      orderId:
        escrow.order_id,

      sellerId:
        escrow.seller_id,

      amount,
    },
  });
}
