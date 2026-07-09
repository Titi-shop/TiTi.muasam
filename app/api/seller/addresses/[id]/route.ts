import { NextResponse } from "next/server";

import {
  requireSeller,
} from "@/lib/auth/guard";

import {
  updateSellerAddress,
  deleteSellerAddress,
} from "@/lib/db/sellerAddresses";

import {
  logger,
} from "@/lib/logger";

export const runtime = "nodejs";

/* =====================================================
   PUT /api/seller/addresses/[id]
===================================================== */

export async function PUT(
  req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {

    const auth =
      await requireSeller();

    if (!auth.ok) {
      return auth.response;
    }

    const body =
      await req.json();

    logger.info(
      "SELLER.ADDRESS.UPDATE.START"
    );

    const data =
      await updateSellerAddress(
        params.id,
        {
          ...body,
          seller_id:
            auth.userId,
        }
      );

    logger.info(
      "SELLER.ADDRESS.UPDATE.SUCCESS"
    );

    return NextResponse.json(
      data
    );

  } catch (error) {

    logger.error(
      "SELLER.ADDRESS.UPDATE.ERROR",
      {
        message:
          error instanceof Error
            ? error.message
            : "UNKNOWN_ERROR",
      }
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
   DELETE /api/seller/addresses/[id]
===================================================== */

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {

    const auth =
      await requireSeller();

    if (!auth.ok) {
      return auth.response;
    }

    logger.info(
      "SELLER.ADDRESS.DELETE.START"
    );

    await deleteSellerAddress(
      params.id
    );

    logger.info(
      "SELLER.ADDRESS.DELETE.SUCCESS"
    );

    return NextResponse.json({
      ok: true,
    });

  } catch (error) {

    logger.error(
      "SELLER.ADDRESS.DELETE.ERROR",
      {
        message:
          error instanceof Error
            ? error.message
            : "UNKNOWN_ERROR",
      }
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
