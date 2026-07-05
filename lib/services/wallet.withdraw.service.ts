// =====================================================
// lib/services/wallet.withdraw.service.ts
// =====================================================

import {
  createWalletWithdrawal,
} from "@/lib/db/wallet/wallet.withdraw";

import {
  getWalletAddressById,
} from "@/lib/db/wallet-addresses";

/* =====================================================
   TYPES
===================================================== */

export type CreateWithdrawalInput = {

  userId: string;

  amount: number;

  walletAddressId: string;

};

export type CreateWithdrawalResult = {

  id: string;

};

/* =====================================================
   CREATE WITHDRAWAL
===================================================== */

export async function createWithdrawal(

  params: CreateWithdrawalInput

): Promise<
  CreateWithdrawalResult
> {

  /* ===============================================
     USER
  =============================================== */

  if (
    !params.userId.trim()
  ) {

    throw new Error(
      "INVALID_USER"
    );

  }

  /* ===============================================
     AMOUNT
  =============================================== */

  if (

    Number.isNaN(
      params.amount
    ) ||

    params.amount <= 0

  ) {

    throw new Error(
      "INVALID_AMOUNT"
    );

  }

  /* ===============================================
     WALLET
  =============================================== */

  if (
    !params.walletAddressId.trim()
  ) {

    throw new Error(
      "INVALID_WALLET"
    );

  }

  const wallet =
    await getWalletAddressById(

      params.userId,

      params.walletAddressId

    );

  if (!wallet) {

    throw new Error(
      "INVALID_WALLET"
    );

  }

  /* ===============================================
     CREATE
  =============================================== */

  const withdrawal =
    await createWalletWithdrawal({

      userId:
        params.userId,

      amount:
        params.amount,

      walletAddressId:
        params.walletAddressId,

      withdrawWallet:
        wallet.address,

    });

  return {

    id:
      withdrawal.id,

  };

}
