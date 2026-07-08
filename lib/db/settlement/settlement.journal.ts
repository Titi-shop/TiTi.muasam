// =====================================================
// lib/db/settlement/settlement.journal.ts
// =====================================================

import {
  query,
} from "@/lib/db";

import {
  randomUUID,
} from "crypto";
import {
  logger,
  maskId,
} from "@/lib/logger";
/* =====================================================
   TYPES
===================================================== */

type DbClient = {
  query: <T>(
    sql: string,
    params?: unknown[]
  ) => Promise<{
    rows: T[];
    rowCount?: number;
  }>;
};

/* =====================================================
   CREATE JOURNAL ONCE
===================================================== */

export async function createSettlementJournalOnce(
params: {
  ownerId: string;
  ownerType: string;
  refId: string;
  refTable: string;
  entryType: string;
  direction: string;
  amount: number;
  note?: string;

  metadata?: Record<
    string,
    unknown
  >;

  eventHash?: string;

  createdBy?: string;
},

  client?: DbClient
): Promise<void> {

  const db =
    client ?? { query };

  logger.info("SETTLEMENT.JOURNAL.START", {
  ownerId: maskId(params.ownerId),
  refId: maskId(params.refId),
  entryType: params.entryType,
});

  /* ===================================================
     INSERT JOURNAL
  =================================================== */
try {

  const result = await db.query(
    `
    INSERT INTO wallet_journal (

      id,
      owner_id,
      owner_type,
      ref_id,
      ref_table,
      entry_type,
      direction,
      amount,
      currency,
      note,
      metadata,
      event_hash,
      created_by,
      created_at

    )
    VALUES (

      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      'PI',
      $9,
      $10,
      $11,
      $12,
      NOW()
    )
    ON CONFLICT (event_hash)
DO NOTHING
    `,
    [
      randomUUID(),
      params.ownerId,
      params.ownerType,
      params.refId,
      params.refTable,
      params.entryType,
      params.direction,
      params.amount,
      params.note ?? null,

      JSON.stringify(
        params.metadata ?? {}
      ),
      params.eventHash ?? null,
      params.createdBy ?? null,
    ]
  );
if ((result.rowCount ?? 0) === 0) {
  logger.info("SETTLEMENT.JOURNAL.DUPLICATE_SKIP", {
  ownerId: maskId(params.ownerId),
  refId: maskId(params.refId),
  entryType: params.entryType,
});

  return;
}
  logger.info("SETTLEMENT.JOURNAL.DONE", {
  ownerId: maskId(params.ownerId),
  refId: maskId(params.refId),
  entryType: params.entryType,
});

} catch (error) {
  logger.error("SETTLEMENT.JOURNAL.INSERT_FAILED", {
  ownerId: maskId(params.ownerId),
  refId: maskId(params.refId),
  entryType: params.entryType,
  message:
    error instanceof Error
      ? error.message
      : String(error),
});
  throw error;
}
}
