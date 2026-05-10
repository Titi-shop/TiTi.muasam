// app/api/cart/route.ts

import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/guard";

import {
  getCart,
  upsertCartItems,
  deleteCartItem,
  updateCartItemQuantity,
  type CartItemInput,
} from "@/lib/db/cart";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

/* =========================================================
   HELPERS
========================================================= */

function badRequest(code: string) {
  return NextResponse.json(
    { error: code },
    { status: 400 }
  );
}

function serverError(code: string) {
  return NextResponse.json(
    { error: code },
    { status: 500 }
  );
}

/* =========================================================
   GET
========================================================= */

export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    const cart = await getCart(auth.userId);

    return NextResponse.json(cart);
  } catch (err) {
    console.error("[CART][GET]", err);

    return serverError("GET_CART_FAILED");
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  req: NextRequest
) {
  try {
    const auth = await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    const body: unknown = await req.json();

    const rawItems: unknown[] =
      Array.isArray(body)
        ? body
        : [body];

    const items: CartItemInput[] =
      rawItems
        .filter(
          (
            item
          ): item is Record<
            string,
            unknown
          > =>
            typeof item === "object" &&
            item !== null
        )
        .map((item) => ({
          product_id:
            typeof item.product_id ===
            "string"
              ? item.product_id
              : "",

          variant_id:
            typeof item.variant_id ===
            "string"
              ? item.variant_id
              : null,

          quantity:
            typeof item.quantity ===
            "number"
              ? item.quantity
              : 1,
        }));

    if (items.length === 0) {
      return badRequest(
        "INVALID_ITEMS"
      );
    }

    await upsertCartItems(
      auth.userId,
      items
    );

    const updated = await getCart(
      auth.userId
    );

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[CART][POST]", err);

    return serverError(
      "UPSERT_CART_FAILED"
    );
  }
}

/* =========================================================
   PATCH
========================================================= */

export async function PATCH(
  req: NextRequest
) {
  try {
    const auth = await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return badRequest(
        "INVALID_BODY"
      );
    }

    const data =
      body as Record<string, unknown>;

    const productId =
      typeof data.product_id ===
      "string"
        ? data.product_id
        : null;

    const variantId =
      typeof data.variant_id ===
      "string"
        ? data.variant_id
        : null;

    const quantity =
      typeof data.quantity ===
        "number" &&
      Number.isFinite(data.quantity)
        ? data.quantity
        : null;

    if (
      !productId ||
      quantity === null
    ) {
      return badRequest(
        "INVALID_INPUT"
      );
    }

    await updateCartItemQuantity(
      auth.userId,
      productId,
      variantId,
      quantity
    );

    const updated = await getCart(
      auth.userId
    );

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[CART][PATCH]", err);

    return serverError(
      "UPDATE_CART_FAILED"
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(
  req: NextRequest
) {
  try {
    const auth = await requireAuth();

    if (!auth.ok) {
      return auth.response;
    }

    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null
    ) {
      return badRequest(
        "INVALID_BODY"
      );
    }

    const data =
      body as Record<string, unknown>;

    const productId =
      typeof data.product_id ===
      "string"
        ? data.product_id
        : null;

    const variantId =
      typeof data.variant_id ===
      "string"
        ? data.variant_id
        : null;

    if (!productId) {
      return badRequest(
        "INVALID_PRODUCT_ID"
      );
    }

    await deleteCartItem(
      auth.userId,
      productId,
      variantId
    );

    const updated = await getCart(
      auth.userId
    );

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[CART][DELETE]", err);

    return serverError(
      "DELETE_CART_FAILED"
    );
  }
}
