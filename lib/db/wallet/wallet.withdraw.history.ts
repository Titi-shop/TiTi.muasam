// =====================================================
// lib/db/wallet/wallet.withdraw.history.ts
// =====================================================

import {
  query,
} from "@/lib/db";

/* =====================================================
   LOG
===================================================== */

function vlog(
  step: string,
  data?: unknown
) {

  console.log(
    `[WALLET_WITHDRAW_HISTORY][${step}]`,
    data ?? ""
  );

}

/* =====================================================
   TYPES
===================================================== */

export type WalletWithdrawalHistoryRow = {

  id: string;

  user_id: string;

  amount: string;

  currency: string;

  withdraw_wallet: string;

  status: string;

  requested_at: string;

  completed_at: string | null;

  fail_reason: string | null;

  approved_by: string | null;

  approved_at: string | null;

  txid: string | null;

  blockchain_txid: string | null;

  blockchain_network: string | null;

  blockchain_ledger: number | null;

  blockchain_memo: string | null;

  blockchain_fee: string | null;

  blockchain_from_address: string | null;

  blockchain_to_address: string | null;

  pi_payment_id: string | null;

  pi_payment_memo: string | null;

  paid_at: string | null;

  admin_feedback: string | null;

  retry_count: number | null;

  wallet_address_id: string | null;

  pi_uid: string | null;

};

/* =====================================================
   GET USER HISTORY
===================================================== */

export async function getWalletWithdrawHistoryByUser(

  userId: string

): Promise<WalletWithdrawalHistoryRow[]> {

  vlog(
    "LIST_START",
    {
      userId,
    }
  );

  const rs =
    await query<WalletWithdrawalHistoryRow>(
      `
      SELECT
        *
      FROM wallet_withdrawals
      WHERE user_id = $1
      ORDER BY requested_at DESC
      `,
      [
        userId,
      ]
    );

  vlog(
    "LIST_DONE",
    {
      count:
        rs.rowCount,
    }
  );

  return rs.rows;

}

/* =====================================================
   GET DETAIL
===================================================== */

export async function getWalletWithdrawHistoryDetail(

  withdrawalId: string,

  userId: string

): Promise<
  WalletWithdrawalHistoryRow | null
> {

  vlog(
    "DETAIL_START",
    {
      withdrawalId,
      userId,
    }
  );

  const rs =
    await query<WalletWithdrawalHistoryRow>(
      `
      SELECT
        *
      FROM wallet_withdrawals
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
      `,
      [
        withdrawalId,
        userId,
      ]
    );

  vlog(
    "DETAIL_DONE",
    {
      found:
        rs.rowCount === 1,
    }
  );

  return (
    rs.rows[0] ??
    null
  );

}

/* =====================================================
   GET BY STATUS
===================================================== */

export async function getWalletWithdrawHistoryByStatus(

  userId: string,

  status: string

): Promise<
  WalletWithdrawalHistoryRow[]
> {

  vlog(
    "STATUS_START",
    {
      userId,
      status,
    }
  );

  const rs =
    await query<WalletWithdrawalHistoryRow>(
      `
      SELECT
        *
      FROM wallet_withdrawals
      WHERE user_id = $1
        AND status = $2
      ORDER BY requested_at DESC
      `,
      [
        userId,
        status,
      ]
    );

  vlog(
    "STATUS_DONE",
    {
      count:
        rs.rowCount,
    }
  );

  return rs.rows;

}
