// =====================================================
// app/api/wallet-addresses/route.ts
// =====================================================

export const runtime = "nodejs";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAuth,
} from "@/lib/auth/guard";

import {
  getWalletAddressesByUser,
  createWalletAddress,
} from "@/lib/db/wallet-addresses";

/* =====================================================
   GET
===================================================== */

export async function GET(
  request: NextRequest
) {
  try {

    const auth =
      await requireAuth(request);

    const wallets =
      await getWalletAddressesByUser(
        auth.userId
      );

    return NextResponse.json(wallets);

  } catch {

    return NextResponse.json(
      {
        error: "UNAUTHORIZED",
      },
      {
        status: 401,
      }
    );

  }
}

/* =====================================================
   POST
===================================================== */

export async function POST(
  request: NextRequest
) {

  try {

    const auth =
      await requireAuth(request);

    const body =
      await request.json();

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    const label =
      typeof body.label === "string"
        ? body.label.trim()
        : null;

    if (!address) {

      return NextResponse.json(
        {
          error: "INVALID_ADDRESS",
        },
        {
          status: 400,
        }
      );

    }

    const wallet =
      await createWalletAddress({

        wallet_id:
          body.wallet_id,

        user_id:
          auth.userId,

        network:
          "pi",

        address,

        label,

        is_default:
          true,

        created_by:
          auth.userId,

      });

    return NextResponse.json(wallet);

  } catch {

    return NextResponse.json(
      {
        error: "CREATE_FAILED",
      },
      {
        status: 500,
      }
    );

  }

}
