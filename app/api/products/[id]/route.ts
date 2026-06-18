import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";

import {
  getProductService,
  updateProductService,
  deleteProductService,
} from "@/lib/services/products.by-id.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================= GET ================= */
export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  console.log(
    "🚀 PRODUCT_ROUTE_GET",
    {
      id: ctx.params.id,
    }
  );

  const result =
    await getProductService(
      ctx.params.id
    );

  console.log(
    "📦 PRODUCT_ROUTE_RESPONSE",
    {
      success: result?.success,

      id:
        result?.data?.id,

      category_id:
        result?.data?.category_id,

      has_variants:
        result?.data?.has_variants,

      price:
        result?.data?.price,

      sale_price:
        result?.data?.sale_price,

      final_price:
        result?.data?.final_price,

      stock:
        result?.data?.stock,

      sale_stock:
        result?.data?.sale_stock,

      sale_enabled:
        result?.data?.sale_enabled,

      sale_start:
        result?.data?.sale_start,

      sale_end:
        result?.data?.sale_end,

      variantCount:
        result?.data?.variants?.length ?? 0,

      shippingCount:
        result?.data?.shipping_rates?.length ?? 0,
    }
  );

  return NextResponse.json(result);
}
/* ================= PATCH ================= */
export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  const result = await updateProductService(
    ctx.params.id,
    auth.userId,
    await req.json()
  );

  return NextResponse.json(result);
}

/* ================= DELETE ================= */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: { id: string } }
) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  const result = await deleteProductService(
    ctx.params.id,
    auth.userId
  );

  return NextResponse.json(result);
}
