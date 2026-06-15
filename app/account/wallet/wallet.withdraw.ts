// =====================================================
// app/account/wallet/wallet.withdraw.ts
// =====================================================

import {
  apiAuthFetch,
} from "@/lib/api/apiAuthFetch";

import {
  useTranslationClient as useTranslation,
} from "@/app/lib/i18n/client";

/* =====================================================
   TYPES
===================================================== */

export type WithdrawPayload = {
  amount: number;
  withdrawWallet: string;
};

export type WithdrawResponse = {
  success: boolean;
  withdrawalId?: string;
  error?: string;
};

/* =====================================================
   CREATE WITHDRAW
===================================================== */

export async function createWithdraw(
  payload: WithdrawPayload
): Promise<WithdrawResponse> {

  const { t } =
    useTranslation();

  /* ===================================================
     VALIDATE AMOUNT
  =================================================== */

  if (
    Number.isNaN(
      payload.amount
    ) ||
    payload.amount <= 0
  ) {

    return {
      success: false,

      error:
        t
          .wallet_invalid_amount ??
        "Invalid amount",
    };
  }

  /* ===================================================
     VALIDATE WALLET
  =================================================== */

  const wallet =
    payload.withdrawWallet
      .trim();

  if (!wallet) {

    return {
      success: false,

      error:
        t
          .wallet_invalid_wallet ??
        "Invalid wallet address",
    };
  }

  try {

    /* =================================================
       REQUEST
    ================================================= */

    const response =
      await apiAuthFetch(
        "/api/wallet/withdraw",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              amount:
                payload.amount,

              withdrawWallet:
                wallet,
            }),
        }
      );

    /* =================================================
       PARSE
    ================================================= */

    const json:
      unknown =
        await response.json();

    if (
      typeof json !==
        "object" ||
      json === null
    ) {

      return {
        success: false,

        error:
          t
            .wallet_invalid_response ??
          "Invalid server response",
      };
    }

    const data =
      json as Record<
        string,
        unknown
      >;

    /* =================================================
       FAILED
    ================================================= */

    if (
      !response.ok
    ) {

      let errorMessage =
        t
          .wallet_withdraw_failed ??
        "Withdraw failed";

      switch (
        data.error
      ) {

        case
          "INSUFFICIENT_BALANCE":

          errorMessage =
            t
              .wallet_insufficient_balance ??
            "Insufficient balance";

          break;

        case
          "WITHDRAW_DISABLED":

          errorMessage =
            t
              .wallet_withdraw_disabled ??
            "Withdraw is disabled";

          break;

        case
          "INVALID_ADDRESS":

          errorMessage =
            t
              .wallet_invalid_address ??
            "Invalid wallet address";

          break;
      }

      return {
        success: false,
        error:
          errorMessage,
      };
    }

    /* =================================================
       SUCCESS
    ================================================= */

    return {
      success: true,

      withdrawalId:
        typeof data.withdrawalId ===
        "string"
          ? data.withdrawalId
          : undefined,
    };

  } catch {

    return {
      success: false,

      error:
        t
          .wallet_network_error ??
        "Network error",
    };
  }
}
