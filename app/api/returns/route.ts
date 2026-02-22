import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, reason, images } = await req.json();

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    /* CHECK ORDER */
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("buyer_id", user.id)
      .single();

    if (!order) {
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
    await supabase.from("returns").insert({
      order_id: orderId,
      buyer_id: user.id,
      reason,
      images,
      status: "pending",
    });

    /* UPDATE ORDER */
    await supabase
      .from("orders")
      .update({ status: "return_requested" })
      .eq("id", orderId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
