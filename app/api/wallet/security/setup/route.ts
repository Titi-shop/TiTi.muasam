// =====================================================
// app/api/wallet/security/setup/route.ts
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
  setupWalletPin,
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
      "SETUP_START"
    );

    const auth =
      await requireAuth(
        request
      );

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

    await setupWalletPin({

      userId:
        auth.userId,

      pin,

    });

    log(
      "SETUP_SUCCESS",
      {
        userId:
          auth.userId,
      }
    );

    return NextResponse.json({

      success: true,

    });

  } catch (
    error
  ) {

    err(
      "SETUP_FAILED",
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
