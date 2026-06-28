// =====================================================
// app/account/wallet/wallet.types.ts
// =====================================================

/* =====================================================
   WALLET
===================================================== */

export type WalletBalance = {
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  frozenBalance: number;
};

/* =====================================================
   TRANSACTION
===================================================== */

export type WalletTransaction = {
  id: string;

  direction:
    | "CREDIT"
    | "DEBIT";

  amount: number;

  entryType: string;

  createdAt: string;
};

/* =====================================================
   ADDRESS
===================================================== */

export type WalletAddress = {
  id: string;

  address: string;

  network: string;

  label: string | null;

  isDefault: boolean;

  isVerified: boolean;
};

/* =====================================================
   API RESPONSE
===================================================== */

export type WalletResponse = {
  balance: WalletBalance;

  transactions:
    WalletTransaction[];

  wallets:
    WalletAddress[];

  defaultWallet:
    WalletAddress | null;
};

/* =====================================================
   WITHDRAW
===================================================== */

export type WithdrawPayload = {
  amount: number;

  walletAddressId: string;
};

export type WithdrawResponse = {
  success: boolean;

  withdrawalId?: string;

  error?: string;
};
export type JournalDirection =
  | "CREDIT"
  | "DEBIT";
export type JournalEntryType =
  | "ESCROW_HOLD"
  | "BUYER_REFUND"
  | "BUYER_PARTIAL_REFUND"
  | "SELLER_CREDIT"
  | "SELLER_ESCROW_RELEASE"
  | "SELLER_WITHDRAW"
  | "SELLER_WITHDRAW_REVERT"
  | "ESCROW_RELEASE"
  | "ESCROW_REVERT"
  | "DISPUTE_LOCK"
  | "DISPUTE_RELEASE"
  | "DISPUTE_REFUND"
  | "ADMIN_ADJUST"
  | "ADMIN_REVERSE"
  | "SYSTEM_COMPENSATION";
