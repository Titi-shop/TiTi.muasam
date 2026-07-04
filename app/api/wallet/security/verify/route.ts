// =====================================================
// app/api/wallet/security/verify/route.ts
// =====================================================

export const runtime =
  "nodejs";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAuth,
} from "@/lib/auth/guard";

import {
  verifyWalletPin,
} from "@/lib/services/wallet-security.service";

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
   POST
===================================================== */

export async function POST(
  request: NextRequest
) {

  try {

    log(
      "VERIFY_START"
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

    const body =
      await request.json();

    const pin =
      typeof body?.pin ===
      "string"
        ? body.pin.trim()
        : "";

    log(
      "BODY_DONE",
      {
        hasPin:
          !!pin,
      }
    );

    const result =
      await verifyWalletPin({

        userId:
          auth.userId,

        pin,

      });

    log(
      "VERIFY_SUCCESS",
      result
    );

    return NextResponse.json({

      success:
        result.success,

      locked:
        result.locked,

      remainingAttempts:
        result.remainingAttempts,

    });

  } catch (
    error
  ) {

    err(
      "VERIFY_FAILED",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    return NextResponse.json(

      {

        success: false,

        error:
          message,

      },

      {

        status: 400,

      }

    );

  }

}
