import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseServer";
import { verifyPiToken } from "@/lib/piAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = req.headers.get("authorization");

    if (!auth?.startsWith("Bearer "))
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );

    const token = auth.split(" ")[1];

    const user = await verifyPiToken(token);
    if (!user)
      return NextResponse.json(
        { error: "INVALID_TOKEN" },
        { status: 401 }
      );

    if (user.role !== "seller")
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );

    const supabase = createServerClient();

    /* 🔎 Kiểm tra đơn thuộc seller */
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, seller_id")
      .eq("id", params.id)
      .single();

    if (!order)
      return NextResponse.json(
        { error: "NOT_FOUND" },
        { status: 404 }
      );

    if (order.seller_id !== user.pi_uid)
      return NextResponse.json(
        { error: "NOT_YOUR_ORDER" },
        { status: 403 }
      );

    if (order.status !== "pending")
      return NextResponse.json(
        { error: "INVALID_STATUS" },
        { status: 400 }
      );

    /* ✅ UPDATE */
    const { error } = await supabase
      .from("orders")
      .update({ status: "shipping" })
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Confirm order error:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
