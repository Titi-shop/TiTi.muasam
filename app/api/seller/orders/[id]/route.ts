import { NextRequest, NextResponse } from "next/server";
import { getOrderByIdForSeller } from "@/lib/db/orders";

/* =====================================================
   GET SINGLE ORDER FOR SELLER
===================================================== */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    /* ⚠️ LẤY sellerPiUid từ token hoặc session của bạn */
    /* Ở đây mình giả sử bạn gửi qua header */
    const sellerPiUid = req.headers.get("x-seller-pi-uid");

    if (!sellerPiUid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const order = await getOrderByIdForSeller(
      params.id,
      sellerPiUid
    );

    if (!order) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
