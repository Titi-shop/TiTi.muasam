/* app/api/orders/[id]/route.ts */

import { NextResponse } from "next/server";

import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import {
  getOrderByIdForSeller,
  getOrdersByBuyer,
  updateOrderStatusBySeller,
  OrderRecord,
} from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */

type UpdateOrderBody = {
  status: string;
};

/* =========================
   RUNTIME GUARDS
========================= */

function isUpdateOrderBody(value: unknown): value is UpdateOrderBody {
  if (typeof value !== "object" || value === null) return false;

  const v = value as Record<string, unknown>;
  return typeof v.status === "string" && v.status.length > 0;
}

/* =========================
   GET /api/orders/[id]
========================= */

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const role = await resolveRole(user);

  let order: OrderRecord | null = null;

if (role === "customer") {
  const orders = await getOrdersByBuyer(user.pi_uid);
  order = orders.find((o) => o.id === params.id) || null;
}

if (role === "seller") {
  order = await getOrderByIdForSeller(user.pi_uid, params.id);
}

  if (!order) {
    return NextResponse.json(
      { error: "ORDER_NOT_FOUND" },
      { status: 404 }
    );
  }

  // CUSTOMER: chỉ xem đơn của mình
  if (
    role === "customer" &&
    order.buyer.pi_uid !== user.pi_uid
  ) {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  // SELLER: chỉ xem đơn có sản phẩm của mình
  if (
    role === "seller" &&
    !order.items.some(
      (item) =>
        item.product.seller.pi_uid === user.pi_uid
    )
  ) {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  return NextResponse.json(order);
}

/* =========================
   PATCH /api/orders/[id]
========================= */

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const role = await resolveRole(user);
  if (role !== "seller") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const body: unknown = await req.json();
  if (!isUpdateOrderBody(body)) {
    return NextResponse.json(
      { error: "INVALID_STATUS" },
      { status: 400 }
    );
  }

  const order =
  await getOrderByIdForSeller(user.pi_uid, params.id);

  if (!order) {
    return NextResponse.json(
      { error: "ORDER_NOT_FOUND" },
      { status: 404 }
    );
  }

  // SELLER chỉ được cập nhật đơn có sản phẩm của mình
  const isOwner = order.items.some(
    (item) =>
      item.product.seller.pi_uid === user.pi_uid
  );

  if (!isOwner) {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  await updateOrderStatusBySeller(
  user.pi_uid,
  params.id,
  body.status
);

  return NextResponse.json({ success: true });
}
