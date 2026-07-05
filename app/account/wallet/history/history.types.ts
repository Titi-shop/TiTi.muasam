// =====================================================
// app/account/wallet/history/history.types.ts
// =====================================================

/* =====================================================
   STATUS
===================================================== */

export type WithdrawStatus =
  | "pending"
  | "processing"
  | "completed"
  | "rejected"
  | "cancelled";

/* =====================================================
   WITHDRAW ITEM
===================================================== */

export type WithdrawHistoryItem = {

  id: string;

  amount: number;

  fee: number;

  receive_amount: number;

  currency: string;

  network: string;

  wallet_address: string;

  status: WithdrawStatus;

  tx_hash?: string | null;

  admin_note?: string | null;

  created_at: string;

  updated_at: string;

  processed_at?: string | null;

};

/* =====================================================
   API RESPONSE
===================================================== */

export type WithdrawHistoryResponse = {

  success: boolean;

  items: WithdrawHistoryItem[];

};

/* =====================================================
   FILTER
===================================================== */

export type WithdrawFilter =
  | "all"
  | "pending"
  | "processing"
  | "completed"
  | "rejected"
  | "cancelled";
