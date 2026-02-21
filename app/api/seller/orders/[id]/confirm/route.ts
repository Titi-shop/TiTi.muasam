import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { updateOrderStatusBySeller } from "@/lib/db/orders";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const role = await resolveRole(user);
  if (role !== "seller" && role !== "admin") {
    return NextResponse.json(
      { error: "FORBIDDEN" },
      { status: 403 }
    );
  }

  try {
    const ok = await updateOrderStatusBySeller(
      user.pi_uid,
      params.id,
      "confirmed"
    );

    if (!ok) {
      return NextResponse.json(
        { error: "UPDATE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ CONFIRM ORDER ERROR:", err);
    return NextResponse.json(
      { error: "FAILED" },
      { status: 500 }
    );
  }
}
