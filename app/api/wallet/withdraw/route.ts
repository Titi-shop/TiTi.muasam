// =====================================================
// app/api/wallet/withdraw/route.ts
// =====================================================

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getUserFromBearer,
} from "@/lib/auth/getUserFromBearer";

import {
  createWithdrawal,
} from "@/lib/services/wallet.withdraw.service";

import {
  getUserWithdrawHistory,
  getUserWithdrawHistoryDetail,
} from "@/lib/services/wallet.withdraw.history.service";

export const runtime =
  "nodejs";

/* =====================================================
   TYPES
===================================================== */

type RequestBody = {

  amount?: unknown;

  walletAddressId?: unknown;

};

/* =====================================================
   AUTH
===================================================== */

async function authenticate() {

  return getUserFromBearer();

}
/* =====================================================
   GET
===================================================== */

export async function GET(
  request: NextRequest
) {

  try {

    console.log(
      "[WALLET][WITHDRAW][GET][START]"
    );

    /* ===============================================
       AUTH
    =============================================== */

    const auth =
      await getUserFromBearer();

    if (!auth) {

      console.warn(
        "[WALLET][WITHDRAW][GET][UNAUTHORIZED]"
      );

      return NextResponse.json(
        {
          error:
            "UNAUTHORIZED",
        },
        {
          status: 401,
        }
      );

    }

    console.log(
      "[WALLET][WITHDRAW][GET][AUTH_OK]",
      {
        userId:
          auth.userId,
      }
    );

    /* ===============================================
       QUERY
    =============================================== */

    const id =
      request.nextUrl.searchParams.get(
        "id"
      );

    /* ===============================================
       DETAIL
    =============================================== */

    if (
      typeof id === "string" &&
      id.trim() !== ""
    ) {

      console.log(
        "[WALLET][WITHDRAW][GET][DETAIL]",
        {
          withdrawalId:
            id,
        }
      );

      const item =
        await getUserWithdrawHistoryDetail(
          id,
          auth.userId
        );

      if (!item) {

        console.warn(
          "[WALLET][WITHDRAW][GET][NOT_FOUND]",
          {
            withdrawalId:
              id,
          }
        );

        return NextResponse.json(
          {
            error:
              "NOT_FOUND",
          },
          {
            status: 404,
          }
        );

      }

      console.log(
        "[WALLET][WITHDRAW][GET][DETAIL_OK]"
      );

      return NextResponse.json({

        success: true,

        item,

      });

    }

    /* ===============================================
       LIST
    =============================================== */

    console.log(
      "[WALLET][WITHDRAW][GET][LIST]"
    );

    const items =
      await getUserWithdrawHistory(
        auth.userId
      );

    console.log(
      "[WALLET][WITHDRAW][GET][LIST_OK]",
      {
        total:
          items.length,
      }
    );

    return NextResponse.json({

      success: true,

      items,

    });

  } catch (
    error
  ) {

    console.error(
      "[WALLET][WITHDRAW][GET][ERROR]",
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR"
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

/* =====================================================
   POST
===================================================== */

export async function POST(
  request: NextRequest
) {

  try {

    const auth =
      await authenticate();

    if (!auth) {

      return NextResponse.json(
        {
          error:
            "UNAUTHORIZED",
        },
        {
          status: 401,
        }
      );

    }

    const body:
      unknown =
        await request.json();

    if (

      typeof body !==
        "object" ||

      body === null

    ) {

      return NextResponse.json(
        {
          error:
            "INVALID_BODY",
        },
        {
          status: 400,
        }
      );

    }

    const data =
      body as RequestBody;

    const withdrawal =
      await createWithdrawal({

        userId:
          auth.userId,

        amount:
          Number(
            data.amount
          ),

        walletAddressId:
          typeof data.walletAddressId ===
          "string"
            ? data.walletAddressId.trim()
            : "",

      });

    return NextResponse.json({

      success: true,

      withdrawalId:
        withdrawal.id,

    });

  } catch (
    error
  ) {

    console.error(
      "[WALLET][WITHDRAW][POST]",
      error
    );

    if (
      error instanceof Error
    ) {

      switch (
        error.message
      ) {

        case "INVALID_AMOUNT":

        case "INVALID_WALLET":

        case "INVALID_USER":

          return NextResponse.json(
            {
              error:
                error.message,
            },
            {
              status: 400,
            }
          );

      }

    }

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
