import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId, reason, images } = await req.json();

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    /* CHECK ORDER */
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .select("id, status, buyer_id, seller_id")
        .eq("id", orderId)
        .eq("buyer_id", user.pi_uid)
        .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!["completed", "delivered"].includes(order.status)) {
      return NextResponse.json(
        { error: "Not returnable" },
        { status: 400 }
      );
    }

    /* CHECK ALREADY REQUESTED */
    const { data: existing } = await supabaseAdmin
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

    /* INSERT RETURN */
    const { error: insertError } =
      await supabaseAdmin.from("returns").insert({
        order_id: orderId,
        user_pi_uid: user.pi_uid,          // ✅ đúng cột
        seller_pi_uid: order.seller_id,   // ✅ bắt buộc phải có
        reason,
        images: images ?? [],
        status: "pending",
      });

    if (insertError) {
      console.error("INSERT RETURN ERROR:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    /* UPDATE ORDER */
    await supabaseAdmin
      .from("orders")
      .update({ status: "return_requested" })
      .eq("id", orderId);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("RETURN API ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const user = await getUserFromBearer();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
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

    return NextResponse.json(data);

  } catch (err) {
    console.error("GET RETURNS ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
