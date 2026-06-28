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
