import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guard";
import {
  payWithdrawal,
} from "@/lib/payments/a2u.orchestrator";
import {
  logger,
} from "@/lib/logger";
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

    const result =
      await payWithdrawal(id);
logger.info(
  "ADMIN_PAY_WITHDRAW.SUCCESS"
);
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error(
  "ADMIN_PAY_WITHDRAW.ERROR",
  {
    message:
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR",
  }
);

    return NextResponse.json(
      {
        error: "PAY_FAILED",
      },
      {
        status: 500,
      }
    );
  }
}
