import { NextResponse } from "next/server";
import {
  updateSellerAddress,
  deleteSellerAddress,
} from "@/lib/db/sellerAddresses";

export async function PUT(req: Request, { params }: any) {
  const body = await req.json();

  const data = await updateSellerAddress(params.id, body);

  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: any) {
  await deleteSellerAddress(params.id);

  return NextResponse.json({ ok: true });
}
