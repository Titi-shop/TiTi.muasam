import { NextRequest, NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

import {
  toggleProductFavorite,
  getFavoriteProductsByUser,
} from "@/lib/db/product-favorites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   POST /api/products/[id]/favorite
   Toggle favorite
========================================================= */

export async function POST(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const auth = await getUserFromBearer();

    if (!auth) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const productId = params.id;

    if (!productId) {
      return NextResponse.json(
        { error: "INVALID_PRODUCT_ID" },
        { status: 400 }
      );
    }

    const result =
      await toggleProductFavorite(
        auth.userId,
        productId
      );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "[PRODUCT_FAVORITE][POST]",
      error
    );

    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/* =========================================================
   GET /api/products/[id]/favorite
   Current user's favorite products
========================================================= */

export async function GET() {
  try {
    const auth = await getUserFromBearer();

    if (!auth) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const products =
      await getFavoriteProductsByUser(
        auth.userId
      );

    return NextResponse.json({
      products,
    });
  } catch (error) {
    console.error(
      "[PRODUCT_FAVORITE][GET]",
      error
    );

    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
