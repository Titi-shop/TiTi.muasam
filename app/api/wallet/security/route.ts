// =====================================================
// app/api/wallet/security/route.ts
// =====================================================

import {
  NextResponse,
} from "next/server";

import {
  requireAuth,
} from "@/lib/auth/guard";

import {
  getWalletSecurity,
} from "@/lib/services/wallet-security.service";

export const runtime =
  "nodejs";

/* =====================================================
   LOG
===================================================== */

function log(
  tag: string,
  data?: unknown
) {
  console.log(
    `[API][WALLET_SECURITY] ${tag}`,
    data ?? ""
  );
}

function err(
  tag: string,
  data?: unknown
) {
  console.error(
    `[API][WALLET_SECURITY] ${tag}`,
    data ?? ""
  );
}

/* =====================================================
   GET
===================================================== */

export async function GET() {

  try {

    log(
      "GET_START"
    );

    const auth =
      await requireAuth();

    if (!auth.ok) {

      log(
        "AUTH_FAILED"
      );

      return auth.response;

    }

    log(
      "AUTH_SUCCESS",
      {
        userId:
          auth.userId,
      }
    );

    const security =
      await getWalletSecurity(
        auth.userId
      );

    log(
      "SERVICE_DONE",
      {
        found:
          !!security,
      }
    );

    return NextResponse.json({

      success: true,

      security,

    });

  } catch (error) {

    err(
      "GET_FAILED",
      error
    );

    return NextResponse.json(

      {

        success: false,

        error:
          "INTERNAL_ERROR",

      },

      {

        status: 500,

      }

    );

  }

}
