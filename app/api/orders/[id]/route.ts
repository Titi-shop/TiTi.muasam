import { NextRequest, NextResponse } from "next/server";
import { getOrderByIdForBuyer } from "@/lib/db/orders";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Lấy buyer id từ header Authorization
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const buyerPiUid = authHeader.replace("Bearer ", "");

    const order = await getOrderByIdForBuyer(
      params.id,
      buyerPiUid
    );

    if (!order) {
      return NextResponse.json(
        { error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (err) {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
