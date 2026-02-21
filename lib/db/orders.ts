const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const PI_BASE = 1_000_000;

/* =========================
   PI CONVERTERS
========================= */
function toMicroPi(value: number): number {
  return Math.round(value * PI_BASE);
}

function fromMicroPi(value: number): number {
  return value / PI_BASE;
}

/* =========================
   HEADERS
========================= */
function headers(): HeadersInit {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =========================
   TYPES
========================= */
export type OrderItemRecord = {
  product_id: string;
  quantity: number;
  price: number;
  status: string;
  product?: {
    id: string;
    name: string;
    images: string[];
  };
};

export type OrderRecord = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer?: {
    name: string;
    phone: string;
    address: string;
  };
  order_items: OrderItemRecord[];
};

/* =====================================================
   GET ORDERS BY SELLER
===================================================== */
export async function getOrdersBySeller(
  sellerPiUid: string,
  status?: "pending" | "confirmed" | "shipping" | "cancelled" | "completed"
): Promise<OrderRecord[]> {

  const itemQuery = new URLSearchParams({
    select: "order_id",
    seller_pi_uid: `eq.${sellerPiUid}`,
  });

  if (status) {
    itemQuery.append("status", `eq.${status}`);
  }

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?${itemQuery.toString()}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items = (await itemsRes.json()) as Array<{
    order_id: string;
  }>;

  const orderIds = Array.from(new Set(items.map((i) => i.order_id)));
  if (orderIds.length === 0) return [];

  const ids = orderIds.map((id) => `"${id}"`).join(",");

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=id,status,total,created_at,buyer_name,buyer_phone,buyer_address,order_items(quantity,price,product_id,status,seller_pi_uid)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders = (await orderRes.json()) as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    buyer_name: string | null;
    buyer_phone: string | null;
    buyer_address: string | null;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
      status: string;
      seller_pi_uid: string;
    }>;
  }>;

  // 🔥 LẤY TẤT CẢ PRODUCT ID
  const productIds = Array.from(
    new Set(
      rawOrders.flatMap((o) =>
        o.order_items.map((i) => i.product_id)
      )
    )
  );

  let productsMap: Record<
    string,
    { id: string; name: string; images: string[] }
  > = {};

  if (productIds.length > 0) {
    const productIdsString = productIds.map((id) => `"${id}"`).join(",");

    const productRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=in.(${productIdsString})&select=id,name,images`,
      { headers: headers(), cache: "no-store" }
    );

    if (productRes.ok) {
      const products = (await productRes.json()) as Array<{
        id: string;
        name: string;
        images: string[] | null;
      }>;

      productsMap = Object.fromEntries(
        products.map((p) => [
          p.id,
          {
            id: p.id,
            name: p.name,
            images: p.images ?? [],
          },
        ])
      );
    }
  }

  return rawOrders
    .map((o) => {
      const sellerItems = o.order_items.filter(
        (i) =>
          i.seller_pi_uid === sellerPiUid &&
          (!status || i.status === status)
      );

      if (sellerItems.length === 0) return null;

      return {
  id: o.id,
  status: status ?? o.status,
  created_at: o.created_at,
  total: fromMicroPi(o.total),

  buyer_name: o.buyer_name ?? "",
  buyer_phone: o.buyer_phone ?? "",
  buyer_address: o.buyer_address ?? "",
        },
        order_items: sellerItems.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: fromMicroPi(i.price),
          status: i.status,
          product: productsMap[i.product_id],
        })),
      };
    })
    .filter((o): o is OrderRecord => o !== null);
}
