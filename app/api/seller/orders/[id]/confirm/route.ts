import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { createServerClient } from "@/lib/supabaseServer";

/* =========================================================
   PATCH /api/seller/orders/[id]/confirm
   - Seller xác nhận đơn (pending → shipping)
========================================================= */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  /* 1️⃣ AUTH */
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  /* 2️⃣ RBAC */
  const role = await resolveRole(user);
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const orderId = params.id;
  const supabase = createServerClient();

  try {
    /* 3️⃣ Lấy order */
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, status, seller_id")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    /* 4️⃣ Kiểm tra quyền sở hữu */
    if (role !== "admin" && order.seller_id !== user.pi_uid) {
      return NextResponse.json(
        { error: "NOT_YOUR_ORDER" },
        { status: 403 }
      );
    }

    /* 5️⃣ Chỉ cho phép pending → shipping */
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "INVALID_STATUS_TRANSITION" },
        { status: 400 }
      );
    }

    /* 6️⃣ Update status */
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "shipping" })
      .eq("id", orderId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ CONFIRM ORDER ERROR:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
