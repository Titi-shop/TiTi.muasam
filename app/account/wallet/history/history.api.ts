// =====================================================
// app/account/wallet/history/history.api.ts
// =====================================================

import type {
  WithdrawHistoryResponse,
} from "./history.types";

/* =====================================================
   GET WITHDRAW HISTORY
===================================================== */

export async function getWithdrawHistory(): Promise<WithdrawHistoryResponse> {

  const res = await fetch(
    "/api/wallet/withdraw",
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  if (!res.ok) {

    throw new Error(
      "FAILED_TO_LOAD_WITHDRAW_HISTORY"
    );

  }

  return res.json();

}
