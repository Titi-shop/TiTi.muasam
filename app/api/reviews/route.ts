import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";

/* =========================
   Types
========================= */

type ReviewRow = {
  id: string;
  order_id: string;
   product_id: string;
  user_pi_uid: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

/* =========================
   POST /api/reviews
========================= */

export async function POST(req: Request) {
  try {
    /* 🔐 AUTH */
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const role = await resolveRole(user);
    if (!role) {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    /* 📦 BODY */
    const body: unknown = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "INVALID_BODY" },
        { status: 400 }
      );
    }

    const b = body as Record<string, unknown>;

    const orderId =
      typeof b.order_id === "string" ? b.order_id : null;

    const rating =
      typeof b.rating === "number" ? b.rating : null;

    const comment =
      typeof b.comment === "string" ? b.comment : "";

    const productId =
  typeof b.product_id === "string" ? b.product_id : null;

if (
  !orderId ||
  !productId ||
  rating === null ||
  rating < 1 ||
  rating > 5
) {
  return NextResponse.json(
    { error: "INVALID_REVIEW_DATA" },
    { status: 400 }
  );
}
    

    /* ✅ CHECK ORDER */
    
     
    const productCheck = await query<{
  buyer_id: string;
  status: string;
}>(
  `
  select o.buyer_id, o.status
  from orders o
  join order_items oi on oi.order_id = o.id
  where o.id = $1
  and oi.product_id = $2
  limit 1
  `,
  [orderId, productId]
);

if (productCheck.rows.length === 0) {
  return NextResponse.json(
    { error: "PRODUCT_NOT_IN_ORDER" },
    { status: 404 }
  );
}

const order = productCheck.rows[0];

if (order.buyer_id !== user.pi_uid) {
  return NextResponse.json(
    { error: "FORBIDDEN_ORDER" },
    { status: 403 }
  );
}

if (
  order.status !== "completed" &&
  order.status !== "received"
) {
  return NextResponse.json(
    { error: "ORDER_NOT_REVIEWABLE" },
    { status: 400 }
  );
}

    /* ✅ CHECK REVIEW EXISTS */
    const existing = await query(
  `
  select 1
  from reviews
  where order_id = $1
  and product_id = $2
  and user_pi_uid = $3
  limit 1
  `,
  [orderId, productId, user.pi_uid]
);

if (existing.rows.length > 0) {
  return NextResponse.json(
    { error: "ALREADY_REVIEWED" },
    { status: 400 }
  );
}
    /* ✅ INSERT REVIEW */
    const insertResult = await query<ReviewRow>(
      `
      insert into reviews (
  order_id,
  product_id,
  user_pi_uid,
  rating,
  comment
)
values ($1, $2, $3, $4, $5)
returning *
      `,
  [
  orderId,
  productId,
  user.pi_uid,
  rating,
  comment

]
    );

    const review = insertResult.rows[0];

    return NextResponse.json({
      success: true,
      review,
    });

  } catch (error) {
    console.error("REVIEW ERROR:", error);

    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
