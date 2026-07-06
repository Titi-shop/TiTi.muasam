
  import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";
import {
  listProductsService,
  createProductService,
  updateProductService,
  deleteProductService,
} from "@/lib/services/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================= GET ================= */

export async function GET(req: Request) {
  const t0 = performance.now();

  const result =
    await listProductsService(req);

  console.log(
    "[API][PRODUCTS][GET_DONE]",
    {
      duration_ms:
        Math.round(
          performance.now() - t0
        ),
    }
  );

  return NextResponse.json(result);
}

/* ================= POST ================= */

export async function POST(req: Request) {
  const auth = await requireSeller();

  if (!auth.ok) {
    return auth.response;
  }

  const result =
    await createProductService(
      req,
      auth.userId
    );

  console.log(
    "[API][PRODUCTS][CREATE_DONE]"
  );

  return NextResponse.json(result);
}

/* ================= PUT ================= */

export async function PUT(req: Request) {
  const auth = await requireSeller();

  if (!auth.ok) {
    return auth.response;
  }

  const result =
    await updateProductService(
      req,
      auth.userId
    );

  console.log(
    "[API][PRODUCTS][UPDATE_DONE]"
  );

  return NextResponse.json(result);
}

/* ================= DELETE ================= */

export async function DELETE(req: Request) {
  const auth = await requireSeller();

  if (!auth.ok) {
    return auth.response;
  }

  const result =
    await deleteProductService(
      req,
      auth.userId
    );

  console.log(
    "[API][PRODUCTS][DELETE_DONE]"
  );

  return NextResponse.json(result);
}
