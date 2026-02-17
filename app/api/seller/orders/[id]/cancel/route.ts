import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { cancelOrderBySeller } from "@/lib/db/orders";

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

  /* 3️⃣ CANCEL ORDER ITEMS (SELLER SCOPE) */
  try {
    await cancelOrderBySeller(user.pi_uid, params.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ CANCEL ERROR:", err);
    return NextResponse.json(
      { error: "FAILED" },
      { status: 500 }
    );
  }
}
