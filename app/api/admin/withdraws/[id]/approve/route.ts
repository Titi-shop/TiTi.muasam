import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guard";

import {
  approveWalletWithdrawal,
} from "@/lib/db/wallet/wallet.withdraw";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const auth =
      await requireAdmin();

    if (!auth.ok) {
      return auth.response;
    }

    const { id } =
      await context.params;

    if (
      typeof id !== "string" ||
      !id.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "INVALID_WITHDRAWAL_ID",
        },
        {
          status: 400,
        }
      );
    }

    await approveWalletWithdrawal(
      id,
      auth.userId
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "[ADMIN_APPROVE_WITHDRAW]",
      error
    );

    return NextResponse.json(
      {
        error:
          "APPROVE_FAILED",
      },
      {
        status: 500,
      }
    );
  }
}
