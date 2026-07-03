export const runtime = "nodejs";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAuth,
} from "@/lib/auth/guard";

import {
  createWalletAddressFlow,
  listWalletAddressesFlow,
} from "@/lib/services/wallet-address.service";

export async function GET(
  request: NextRequest
) {
  try {

    const auth =
      await requireAuth(request);

    const data =
      await listWalletAddressesFlow(
        auth.userId
      );

    return NextResponse.json(data);

  } catch {

    return NextResponse.json(
      {
        error:
          "UNAUTHORIZED",
      },
      {
        status:401,
      }
    );

  }
}

export async function POST(
  request: NextRequest
) {

  try {

    const auth =
      await requireAuth(request);

    const body =
      await request.json();

    const data =
      await createWalletAddressFlow({

        userId:
          auth.userId,

        body,

      });

    return NextResponse.json(data);

  } catch (
    error
  ) {

    console.error(
      "[WALLET_ADDRESS][API]",
      error
    );

    return NextResponse.json(
      {
        error:
          "CREATE_FAILED",
      },
      {
        status:500,
      }
    );

  }

}
