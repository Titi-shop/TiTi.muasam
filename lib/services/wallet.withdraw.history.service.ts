// =====================================================
// lib/services/wallet.withdraw.history.service.ts
// =====================================================

import {
  getWalletWithdrawHistoryByUser,
  getWalletWithdrawHistoryDetail,
} from "@/lib/db/wallet/wallet.withdraw.history";

/* =====================================================
   TYPES
===================================================== */

export type WalletWithdrawHistoryItem = {

  id: string;

  amount: number;

  currency: string;

  wallet_address: string;

  wallet_address_id: string | null;

  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed";

  requested_at: string;

  completed_at: string | null;

  network: string | null;

  txid: string | null;

  payment_id: string | null;

  blockchain_ledger: number | null;

  blockchain_memo: string | null;

  admin_feedback: string | null;

  fail_reason: string | null;

};

/* =====================================================
   STATUS
===================================================== */

function normalizeStatus(
  status: string
): WalletWithdrawHistoryItem["status"] {

  switch (
    status.toUpperCase()
  ) {

    case "PENDING":

      return "pending";

    case "PROCESSING":

      return "processing";

    case "COMPLETED":

      return "completed";

    case "FAILED":

    case "REJECTED":

    case "CANCELLED":

      return "failed";

    default:

      return "pending";

  }

}

/* =====================================================
   MAP
===================================================== */

function mapWithdrawal(
  row: Awaited<
    ReturnType<
      typeof getWalletWithdrawHistoryDetail
    >
  > extends infer T
    ? T extends null
      ? never
      : NonNullable<T>
    : never
): WalletWithdrawHistoryItem {

  return {

    id:
      row.id,

    amount:
      Number(
        row.amount
      ),

    currency:
      row.currency,

    wallet_address:
      row.withdraw_wallet,

    wallet_address_id:
      row.wallet_address_id,

    status:
      normalizeStatus(
        row.status
      ),

    requested_at:
      row.requested_at,

    completed_at:
      row.completed_at,

    network:
      row.blockchain_network,

    txid:
      row.blockchain_txid ??
      row.txid,

    payment_id:
      row.pi_payment_id,

    blockchain_ledger:
      row.blockchain_ledger,

    blockchain_memo:
      row.blockchain_memo,

    admin_feedback:
      row.admin_feedback,

    fail_reason:
      row.fail_reason,

  };

}

/* =====================================================
   LIST
===================================================== */

export async function getUserWithdrawHistory(

  userId: string

): Promise<
  WalletWithdrawHistoryItem[]
> {

  const rows =
    await getWalletWithdrawHistoryByUser(
      userId
    );

  return rows.map(
    mapWithdrawal
  );

}

/* =====================================================
   DETAIL
===================================================== */

export async function getUserWithdrawHistoryDetail(

  withdrawalId: string,

  userId: string

): Promise<
  WalletWithdrawHistoryItem | null
> {

  const row =
    await getWalletWithdrawHistoryDetail(

      withdrawalId,

      userId

    );

  if (!row) {

    return null;

  }

  return mapWithdrawal(
    row
  );

}
