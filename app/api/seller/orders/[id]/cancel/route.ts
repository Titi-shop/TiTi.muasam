import { NextResponse } from "next/server";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";
import { resolveRole } from "@/lib/auth/resolveRole";
import { updateOrderStatusBySeller } from "@/lib/db/orders";

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

  const body = await req.json();
const cancelReason: string | null =
  typeof body?.cancel_reason === "string"
    ? body.cancel_reason.trim()
    : null;

  /* 3️⃣ CANCEL ITEMS */
  try {
   const ok = await updateOrderStatusBySeller(
  params.id,
  user.pi_uid,
  "cancelled",
  {
    sellerCancelReason: cancelReason,
  }
);

    if (!ok) {
      return NextResponse.json(
        { error: "UPDATE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ CANCEL ERROR:", err);
    return NextResponse.json(
      { error: "FAILED" },
      { status: 500 }
    );
  }
}
