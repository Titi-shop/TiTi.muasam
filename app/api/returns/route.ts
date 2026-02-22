import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { supabaseAdmin } from "@/lib/supabase/server";

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
        .select("*")
        .eq("id", orderId)
        .eq("buyer_pi_uid", user.pi_uid)
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

    /* INSERT RETURN */
    const { error: insertError } =
      await supabaseAdmin.from("returns").insert({
        order_id: orderId,
        buyer_pi_uid: user.pi_uid,
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
