import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/guard";

import {
  getWalletWithdrawals,
} from "@/lib/db/wallet/wallet.withdraw";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const rows =
      await getWalletWithdrawals();

    return NextResponse.json({
      success: true,
      rows,
    });
  } catch {
    return NextResponse.json(
      {
        error: "FORBIDDEN",
      },
      {
        status: 403,
      }
    );
  }
}
