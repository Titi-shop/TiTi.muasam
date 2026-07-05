// =====================================================
// lib/services/wallet.service.ts
// =====================================================

import {
  getWalletByUserId,
} from "@/lib/db/wallet";

/* =====================================================
   TYPES
===================================================== */

export type WalletResponse = {

  balance: number;

  availableBalance: number;

  pendingBalance: number;

  frozenBalance: number;

};

/* =====================================================
   GET WALLET
===================================================== */

export async function getWallet(
  userId: string
): Promise<WalletResponse> {

  const wallet =
    await getWalletByUserId(
      userId
    );

  return {

    balance:
      wallet.balance,

    availableBalance:
      wallet.availableBalance,

    pendingBalance:
      wallet.pendingBalance,

    frozenBalance:
      wallet.frozenBalance,

  };

}
