import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { getOrdersByBuyer, createOrder } from "@/lib/db/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */
type OrderItemInput = {
  product_id: string;
  quantity: number;
  price: number;
};

type ShippingInput = {
  name: string;
  phone: string;
  address: string;
};

type CreateOrderBody = {
  items: OrderItemInput[];
  total: number;
  shipping: ShippingInput;
};

/* =========================
   GET /api/orders
========================= */
export async function GET() {
  const user = await getUserFromBearer();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const orders = await getOrdersByBuyer(user.pi_uid);
  return NextResponse.json(orders);
}

/* =========================
   POST /api/orders
========================= */
export async function POST(req: Request) {
  const user = await getUserFromBearer();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  /* 1️⃣ Parse JSON an toàn */
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "EMPTY_OR_INVALID_JSON" },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "INVALID_BODY" },
      { status: 400 }
    );
  }

  const { items, total, shipping } = body as CreateOrderBody;

  /* 2️⃣ Validate items */
  if (!Array.isArray(items) || typeof total !== "number") {
    return NextResponse.json(
      { error: "INVALID_BODY_STRUCTURE" },
      { status: 400 }
    );
  }

  for (const item of items) {
    if (
      typeof item.product_id !== "string" ||
      typeof item.quantity !== "number" ||
      typeof item.price !== "number"
    ) {
      return NextResponse.json(
        { error: "INVALID_ORDER_ITEM", item },
        { status: 400 }
      );
    }
  }

  /* 3️⃣ Validate shipping */
  if (
    !shipping ||
    typeof shipping.name !== "string" ||
    typeof shipping.phone !== "string" ||
    typeof shipping.address !== "string"
  ) {
    return NextResponse.json(
      { error: "INVALID_SHIPPING_INFO" },
      { status: 400 }
    );
  }

  /* 4️⃣ Create Order */
  const order = await createOrder({
    buyerPiUid: user.pi_uid,
    items,
    total,
    shipping,
  });

  if (!order) {
    return NextResponse.json(
      { error: "FAILED_TO_CREATE_ORDER" },
      { status: 500 }
    );
  }

  return NextResponse.json(order, { status: 201 });
}
