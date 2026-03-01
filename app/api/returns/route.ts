import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* =========================
   TYPES
========================= */

type ReturnPayload = {
  orderId?: unknown;
  order_id?: unknown;
  reason?: unknown;
  images?: unknown;
};

type OrderRow = {
  id: string;
  status: string;
  buyer_id: string;
  seller_id: string;
};

/* =========================
   POST – CREATE RETURN
========================= */

export async function POST(req: Request) {
  try {
    /* 1️⃣ AUTH */
    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* 2️⃣ PARSE BODY SAFELY */
    const raw = (await req.json()) as ReturnPayload;

    const orderId =
      typeof raw.orderId === "string"
        ? raw.orderId
        : typeof raw.order_id === "string"
        ? raw.order_id
        : null;

    const reason =
      typeof raw.reason === "string"
        ? raw.reason.trim()
        : null;

    const images =
      Array.isArray(raw.images) &&
      raw.images.every((i) => typeof i === "string")
        ? raw.images
        : [];

    if (!orderId || !reason || reason.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    /* 3️⃣ CHECK ORDER OWNERSHIP */
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select("id,status,buyer_id,seller_id")
        .eq("id", orderId)
        .eq("buyer_id", user.pi_uid)
        .single<OrderRow>();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    /* 4️⃣ CHECK RETURNABLE STATUS */
    if (!["completed", "delivered"].includes(order.status)) {
      return NextResponse.json(
        { error: "Not returnable" },
        { status: 400 }
      );
    }

    /* 5️⃣ CHECK ALREADY REQUESTED */
    const { data: existing } =
      await supabaseAdmin
        .from("returns")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Return already requested" },
        { status: 400 }
      );
    }

    /* 6️⃣ INSERT RETURN */
    const { error: insertError } =
      await supabaseAdmin
        .from("returns")
        .insert({
          order_id: orderId,
          user_pi_uid: user.pi_uid,
          seller_pi_uid: order.seller_id,
          reason,
          images,
          status: "pending",
        });

    if (insertError) {
      console.error("INSERT RETURN ERROR:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    /* 7️⃣ UPDATE ORDER STATUS */
    const { error: updateError } =
      await supabaseAdmin
        .from("orders")
        .update({ status: "return_requested" })
        .eq("id", orderId);

    if (updateError) {
      console.error("ORDER UPDATE ERROR:", updateError);

      await supabaseAdmin
        .from("returns")
        .delete()
        .eq("order_id", orderId);

      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("RETURN API ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

/* =========================
   GET – LIST RETURNS
========================= */

export async function GET() {
  try {
    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("returns")
        .select(`
          id,
          order_id,
          status,
          reason,
          images,
          return_tracking_code,
          refunded_at,
          created_at
        `)
        .eq("user_pi_uid", user.pi_uid)
        .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);

  } catch (err) {
    console.error("GET RETURNS ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
