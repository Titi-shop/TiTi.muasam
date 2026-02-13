"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   TYPES (NO any)
========================= */
interface Product {
  id: string;
  name: string;
  images: string[];
}

interface OrderItem {
  quantity: number;
  price: number;
  product_id: string; // 👈 thêm
  product?: Product;  // 👈 optional
}


interface Order {
  id: string;
  total: number;
  status: string;
  order_items: OrderItem[];
}

/* =========================
   PAGE
========================= */
export default function PendingOrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

   function formatPi(value: number | string) {
  return Number(value).toFixed(6).replace(/\.?0+$/, "");
}

  /* =========================
     LOAD ORDERS (AUTH-CENTRIC)
  ========================= */
  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders(): Promise<void> {
  try {
    const token = await getPiAccessToken();

    /* 1️⃣ Lấy orders + order_items (CHƯA CÓ product) */
    const res = await fetch("/api/orders", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error("UNAUTHORIZED");

    const rawOrders: Order[] = await res.json();

    const pendingOrders = rawOrders.filter(
      (o) => o.status === "pending"
    );

    /* 2️⃣ Gom tất cả product_id */
    const productIds = Array.from(
  new Set(
    pendingOrders.flatMap((o) =>
      o.order_items?.map((i) => i.product_id) ?? []
    )
  )
);


    if (productIds.length === 0) {
      setOrders(pendingOrders);
      return;
    }

    /* 3️⃣ Fetch products 1 lần */
    const productRes = await fetch(
      `/api/products?ids=${productIds.join(",")}`,
      { cache: "no-store" }
    );

    if (!productRes.ok)
      throw new Error("FETCH_PRODUCTS_FAILED");

    const products: Product[] = await productRes.json();

    const productMap = Object.fromEntries(
      products.map((p) => [p.id, p])
    );

    /* 4️⃣ Gắn product vào từng order_item */
    const enrichedOrders = pendingOrders.map((o) => ({
  ...o,
  order_items: (o.order_items ?? []).map((i) => ({
    ...i,
    product: productMap[i.product_id],
  })),
}));


    setOrders(enrichedOrders);
  } catch (err) {
    console.error("❌ Load pending orders error:", err);
    setOrders([]);
  } finally {
    setLoading(false);
  }
}

  /* =========================
     SUMMARY
  ========================= */
  const totalPi = orders.reduce(
    (sum, o) => sum + Number(o.total),
    0
  );

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      {/* ===== HEADER ===== */}
      <header className="bg-orange-500 text-white px-4 py-4">
        <div className="bg-orange-400 rounded-lg p-4">
          <p className="text-sm opacity-90">
            {t.order_info}
          </p>
          <p className="text-xs opacity-80 mt-1">
            {t.orders}: {orders.length} · π{totalPi}
          </p>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <section className="mt-6 px-4">
        {loading ? (
          <p className="text-center text-gray-400">
            ⏳ {t.loading_orders}
          </p>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 opacity-40" />
            <p>{t.no_pending_orders}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-lg p-4 shadow-sm"
              >
                {/* ===== ORDER HEADER ===== */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold">
                    #{o.id.slice(0, 8)}
                  </span>
                  <span className="text-orange-500 text-sm font-medium">
                    {t[`status_${o.status}`] ?? o.status}
                  </span>
                </div>

                {/* ===== ORDER ITEMS ===== */}
                <div className="mt-3 space-y-2">
                  {(o.order_items ?? []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 items-center"
                    >
                      {/* IMAGE */}
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {item.product?.images?.length > 0 && (
  <img
    src={item.product.images[0]}
    alt={item.product.name}
    className="w-full h-full object-cover"
  />
)}

                      </div>

                      {/* INFO */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
  {item.product?.name ?? "—"}
</p>

                        <p className="text-xs text-gray-500">
                          x{item.quantity} · π{formatPi(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ===== TOTAL ===== */}
                <p className="mt-3 text-sm text-gray-700 font-medium">
                  {t.total}: π{formatPi(o.total)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
