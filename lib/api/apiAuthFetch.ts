import { NextRequest, NextResponse } from "next/server";
import { getOrderByIdForSeller } from "@/lib/db/orders";
import { getUserFromToken } from "@/lib/auth"; // ví dụ

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");

    /* ⚠️ bạn phải decode token ở đây */
    const user = await getUserFromToken(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await getOrderByIdForSeller(
      params.id,
      user.pi_uid
    );

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
