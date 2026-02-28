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

type OrderCheckRow = {
  buyer_id: string;
  status: string;
};

/* =========================
   POST /api/reviews
========================= */
export async function POST(req: Request) {
  try {
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body: unknown = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
    }

    // ... toàn bộ logic POST của bạn ở đây ...

    return NextResponse.json({
      success: true,
      review,
    });

  } catch (error) {
    console.error("REVIEW ERROR:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

/* =========================
   GET /api/reviews
========================= */
export async function GET() {
  try {
    const user = await getUserFromBearer();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const result = await query<{
      order_id: string;
      product_id: string;
    }>(
      `
      select order_id, product_id
      from reviews
      where user_pi_uid = $1
      `,
      [user.pi_uid]
    );

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

    /* ========================
       CHECK ORDER + PRODUCT
    ========================== */

    const orderCheck = await query<OrderCheckRow>(
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

    if (orderCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_IN_ORDER" },
        { status: 404 }
      );
    }

    const order = orderCheck.rows[0];

    if (order.buyer_id !== user.pi_uid) {
      return NextResponse.json(
        { error: "FORBIDDEN_ORDER" },
        { status: 403 }
      );
    }

    const status = order.status.toLowerCase();

    if (status !== "completed" && status !== "received") {
      return NextResponse.json(
        { error: "ORDER_NOT_REVIEWABLE" },
        { status: 400 }
      );
    }

    /* =========================
       CHECK REVIEW EXISTS
    ========================== */

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

    /* =========================
       INSERT REVIEW
    ========================== */

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
        comment,
      ]
    );

    const review = insertResult.rows[0];

    /* =========================
       UPDATE PRODUCT AVG RATING
    ========================== */

    await query(
      `
      update products
      set rating_avg = (
        select avg(rating)
        from reviews
        where product_id = $1
      )
      where id = $1
      `,
      [productId]
    );

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
