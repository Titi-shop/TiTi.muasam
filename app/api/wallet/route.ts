// =====================================================
// app/api/wallet/route.ts
// =====================================================

import {
  NextResponse,
} from "next/server";

import {
  requireAuth,
} from "@/lib/auth/guard";

import {
  getWallet,
} from "@/lib/services/wallet.service";

export const runtime =
  "nodejs";

/* =====================================================
   GET
===================================================== */

export async function GET() {

  try {

    const auth =
      await requireAuth();

    if (!auth.ok) {

      return auth.response;

    }

    const wallet =
      await getWallet(
        auth.userId
      );

    return NextResponse.json(
      wallet
    );

  } catch (
    error
  ) {

    console.error(
      "[WALLET][GET]",
      error
    );

    return NextResponse.json(
      {
        error:
          "INTERNAL_ERROR",
      },
      {
        status: 500,
      }
    );

  }

}
