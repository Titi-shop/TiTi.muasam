// =====================================================
// lib/db/settlement/settlement.journal.ts
// =====================================================
import {
  query,
} from "@/lib/db";
import {
  randomUUID,
} from "crypto";
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
  }
): Promise<void> {
  const existed =
    await query<{ id: string }>(
      `
      SELECT id
      FROM wallet_journal
      WHERE owner_id = $1
        AND ref_id = $2
        AND entry_type = $3
      LIMIT 1
      `,
      [
        params.ownerId,
        params.refId,
        params.entryType,
      ]
    );
  if (existed.rows.length) {
    return;
  }
  await query(
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
      NOW()
    )
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
    ]
  );
}
