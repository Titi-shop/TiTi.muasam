import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guard";

import {
  getWalletWithdrawals,
} from "@/lib/db/wallet/wallet.withdraw";
import {
  logger,
} from "@/lib/logger";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    logger.info(
  "ADMIN_WITHDRAWS_API.START"
);

    /* =========================
       ADMIN GUARD
    ========================= */

    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    /* =========================
       LOAD WITHDRAWALS
    ========================= */

    logger.debug(
  "ADMIN_WITHDRAWS_API.LOAD_START"
);

    const rows =
      await getWalletWithdrawals();

    logger.info(
  "ADMIN_WITHDRAWS_API.LOAD_DONE"
);

    /* =========================
       RESPONSE
    ========================= */

    return NextResponse.json({
      success: true,
      rows,
    });

  } catch (error) {
    logger.error(
  "ADMIN_WITHDRAWS_API.ERROR",
  {
    message:
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR",
  }
);

    return NextResponse.json(
      {
        error:
          "WITHDRAW_LIST_FAILED",
      },
      {
        status: 500,
      }
    );
  }
}
