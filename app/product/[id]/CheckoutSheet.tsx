"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
   TYPES
========================= */
interface ShippingInfo {
  name: string;
  phone: string;
  address: string;
  country?: string;
}


interface Props {
  open: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    price: number;
    finalPrice?: number;
    image?: string;
    images?: string[];
  };
}
/* =========================
   COMPONENT
========================= */
export default function CheckoutSheet({ open, onClose, product }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, piReady } = useAuth();

  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [qtyDraft, setQtyDraft] = useState<string>("1");
  const quantity = useMemo(() => {
  const n = Number(qtyDraft);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}, [qtyDraft]);
   
  const item = useMemo(() => {
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    finalPrice: product.finalPrice,
    image: product.image,
    images: product.images,
    quantity: 1,
  };
}, [product]);

  /* =========================
     LOCK BODY SCROLL
  ========================= */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);



  /* =========================
     LOAD ADDRESS
  ========================= */
  useEffect(() => {
    async function loadAddress() {
      try {
        const token = await getPiAccessToken();
        if (!token) return;

        const res = await fetch("/api/address", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const data = await res.json();
        const def = data.items?.find(
          (a: { is_default: boolean }) => a.is_default
        );

        if (def) {
          setShipping({
            name: def.name,
            phone: def.phone,
            address: def.address,
            country: def.country,
          });
        }
      } catch {
        setShipping(null);
      }
    }

    if (open && user) loadAddress();
  }, [open, user]);

  /* =========================
     PRICE + TOTAL (SALE FIRST)
  ========================= */
  const unitPrice = useMemo(() => {
  if (!item) return 0;
  return typeof item.finalPrice === "number"
    ? item.finalPrice
    : item.price;
}, [item]);
   
  const total = useMemo(() => {
    return unitPrice * quantity;
  }, [unitPrice, quantity]);

  /* =========================
     PAY WITH PI
  ========================= */
  const handlePay = async () => {
    if (!window.Pi || !piReady || !user || !shipping || !item) {
      alert(t.transaction_failed);
      return;
    }

    if (processing) return;
    setProcessing(true);

    try {
       if (total < 0.0000001) {
  alert("Số Pi quá nhỏ để thanh toán");
  setProcessing(false);
  return;
}
      await window.Pi.createPayment(
        {
          amount: Number(total),
          memo: "Thanh toán đơn hàng TiTi",
          metadata: {
            shipping,
            item: {
              product_id: item.id,
              quantity,
              price: unitPrice,
            },
          },
        },
        {
          onReadyForServerApproval: async (paymentId) => {
  const token = await getPiAccessToken();
  if (!token) {
    setProcessing(false);
    return;
  }

  await fetch("/api/pi/approve", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentId }),
  });
},

          onReadyForServerCompletion: async (paymentId, txid) => {
            await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            });

            await apiAuthFetch("/api/orders", {
              method: "POST",
              body: JSON.stringify({
                items: [
                  {
                    product_id: item.id,
                    quantity,
                    price: unitPrice,
                  },
                ],
                total,
              }),
            });
            onClose();
            router.push("/customer/pending");
          },

          onCancel: () => setProcessing(false),
          onError: () => setProcessing(false),
        }
      );
    } catch {
      alert(t.transaction_failed);
      setProcessing(false);
    }
  };

  if (!open || !item) return null;

  /* =========================
     UI
  ========================= */
  return (
    <div className="fixed inset-0 z-[100]">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* SHEET */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl h-[45vh] flex flex-col">
        {/* HANDLE */}
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-2" />

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 py-3 pb-24">
          {/* ADDRESS */}
          <div
            className="border rounded-lg p-3 cursor-pointer mb-4"
            onClick={() => router.push("/customer/address")}
          >
            {shipping ? (
              <>
                <p className="font-medium">{shipping.name}</p>
                <p className="text-sm text-gray-600">{shipping.phone}</p>
                <p className="text-sm text-gray-500">{shipping.address}</p>
              </>
            ) : (
              <p className="text-gray-500">➕ {t.add_shipping}</p>
            )}
          </div>

          {/* PRODUCT (ONLY ONE) */}
          <div className="flex items-center gap-3 border-b pb-3">
            <img
              src={item.image || item.images?.[0] || "/placeholder.png"}
              className="w-16 h-16 rounded object-cover"
            />

            <div className="flex-1">
              <p className="text-sm font-medium line-clamp-2">
                {item.name}
              </p>

              <input
            type="text"
          inputMode="numeric"
       value={qtyDraft}
         onChange={(e) => {
          const v = e.target.value;
    // chỉ cho nhập số hoặc rỗng
    if (/^\d*$/.test(v)) {
      setQtyDraft(v);
       }
      }}
      onBlur={() => {
      if (qtyDraft === "" || Number(qtyDraft) < 1) {
      setQtyDraft("1");
      }
         }}
         className="mt-1 w-16 border rounded px-2 py-1 text-sm text-center"
        />
            </div>

            <p className="font-semibold text-orange-600">
  {total.toFixed(6)} π
</p>
             
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-4">
          <p className="text-center text-sm text-gray-1000 mb-2">
            {t.shop_confidence}
          </p>

          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold disabled:bg-gray-300"
          >
            {processing ? t.processing : t.pay_now}
          </button>
        </div>
      </div>
    </div>
  );
}
2)app/api/products/route.ts
/* app/api/products/route.ts */

import { NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/guard";
import {
  getAllProducts,
  createProduct,
  updateProductBySeller,
} from "@/lib/db/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   GET — PUBLIC PRODUCTS (NO AUTH)
========================================================= */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");

    let products;

    /* ===============================
       CASE 1 — /api/products?ids=...
    =============================== */
    if (ids) {
      const idArray = ids
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (idArray.length === 0) {
        return NextResponse.json([]);
      }

      const inFilter = idArray.map((id) => `"${id}"`).join(",");

      const res = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/products?id=in.(${inFilter})&select=id,name,images,price,sale_price,sale_start,sale_end`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const err = await res.text();
        console.error("❌ FETCH PRODUCTS BY IDS ERROR:", err);
        return NextResponse.json([]);
      }

      products = await res.json();
    }

    /* ===============================
       CASE 2 — /api/products (ALL)
    =============================== */
    else {
      products = await getAllProducts();
    }

    /* ===============================
       ENRICH (giữ nguyên logic bạn)
    =============================== */
    const now = new Date();

    const enriched = products.map((p: any) => {
      const start = p.sale_start ? new Date(p.sale_start) : null;
      const end = p.sale_end ? new Date(p.sale_end) : null;

      const isSale =
        !!p.sale_price &&
        !!start &&
        !!end &&
        now >= start &&
        now <= end;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        detail: p.detail ?? "",
        images: p.images ?? [],
        detailImages: p.detail_images ?? [],

        categoryId: p.category_id,
        price: p.price,
        salePrice: p.sale_price,
        isSale,
        finalPrice: isSale ? p.sale_price : p.price,

        views: p.views ?? 0,
        sold: p.sold ?? 0,
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("❌ GET PRODUCTS ERROR:", err);
    return NextResponse.json(
      { error: "FAILED_TO_FETCH_PRODUCTS" },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST — CREATE PRODUCT (SELLER ONLY)
========================================================= */
export async function POST(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const {
      name,
      price,
      description,
      detail,
      images,
      detailImages,
      categoryId,
      salePrice,
      saleStart,
      saleEnd,
    } = body as Record<string, unknown>;

    if (typeof name !== "string" || typeof price !== "number") {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const product = await createProduct(auth.user.pi_uid, {
      name: name.trim(),
      price, // Pi decimal nhỏ OK
      description: typeof description === "string" ? description : "",
      detail: typeof detail === "string" ? detail : "",

      images: Array.isArray(images)
        ? images.filter((i) => typeof i === "string")
        : [],

      detail_images: Array.isArray(detailImages)
        ? detailImages.filter((i) => typeof i === "string")
        : [],

      category_id: typeof categoryId === "number" ? categoryId : null,

      sale_price: typeof salePrice === "number" ? salePrice : null,
      sale_start: typeof saleStart === "string" ? saleStart : null,
      sale_end: typeof saleEnd === "string" ? saleEnd : null,

      views: 0,
      sold: 0,
    });

    return NextResponse.json({ success: true, product });
  } catch (err) {
    console.error("❌ CREATE PRODUCT ERROR:", err);
    return NextResponse.json(
      { error: "FAILED_TO_CREATE_PRODUCT" },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT — UPDATE PRODUCT (SELLER ONLY)
========================================================= */
export async function PUT(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const {
      id,
      name,
      price,
      description,
      detail,
      images,
      detailImages,
      categoryId,
      salePrice,
      saleStart,
      saleEnd,
    } = body as Record<string, unknown>;

    if (
      typeof id !== "string" &&
      typeof id !== "number"
    ) {
      return NextResponse.json(
        { error: "INVALID_PRODUCT_ID" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || typeof price !== "number") {
      return NextResponse.json(
        { error: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const updated = await updateProductBySeller(
      auth.user.pi_uid,
      String(id),
      {
        name: name.trim(),
        price,
        description: typeof description === "string" ? description : "",
        detail: typeof detail === "string" ? detail : "",

        images: Array.isArray(images)
          ? images.filter((i) => typeof i === "string")
          : [],

        detail_images: Array.isArray(detailImages)
          ? detailImages.filter((i) => typeof i === "string")
          : [],

        category_id: typeof categoryId === "number" ? categoryId : null,

        sale_price: typeof salePrice === "number" ? salePrice : null,
        sale_start: typeof saleStart === "string" ? saleStart : null,
        sale_end: typeof saleEnd === "string" ? saleEnd : null,
      }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND_OR_FORBIDDEN" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ UPDATE PRODUCT ERROR:", err);
    return NextResponse.json(
      { error: "FAILED_TO_UPDATE_PRODUCT" },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE — DELETE PRODUCT (SELLER ONLY)
========================================================= */
export async function DELETE(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "MISSING_PRODUCT_ID" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/products?id=eq.${id}&seller_id=eq.${auth.user.pi_uid}`,
      {
        method: "DELETE",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          Prefer: "return=representation",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ DELETE ERROR:", text);
      return NextResponse.json(
        { error: "FAILED_TO_DELETE_PRODUCT" },
        { status: 500 }
      );
    }

    const deleted = await res.json();

    if (!deleted.length) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND_OR_FORBIDDEN" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE PRODUCT ERROR:", err);
    return NextResponse.json(
      { error: "FAILED_TO_DELETE_PRODUCT" },
      { status: 500 }
    );
  }
}
3)app/api/products/view/route.ts
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ViewBody {
  id: string;
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("id" in body) ||
      typeof (body as ViewBody).id !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Thiếu hoặc sai id" },
        { status: 400 }
      );
    }

    const { id } = body as ViewBody;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/increment_product_view`,
      {
        method: "POST",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pid: id }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ VIEW RPC ERROR:", text);
      return NextResponse.json(
        { success: false },
        { status: 500 }
      );
    }

    const data: { views: number }[] = await res.json();

    return NextResponse.json({
      success: true,
      views: data[0]?.views ?? 0,
    });
  } catch (err) {
    console.error("❌ VIEW ERROR:", err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
