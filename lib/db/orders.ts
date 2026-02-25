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
   INTERNAL: FETCH PRODUCTS MAP
===================================================== */
async function fetchProductsMap(
  productIds: string[]
): Promise<Record<string, { id: string; name: string; images: string[] }>> {

  if (productIds.length === 0) return {};

  const ids = productIds.map((id) => `"${id}"`).join(",");

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=in.(${ids})&select=id,name,images`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return {};

  const products = await res.json() as Array<{
    id: string;
    name: string;
    images: string[] | null;
  }>;

  return Object.fromEntries(
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

/* =====================================================
   GET ORDERS BY BUYER
===================================================== */
export async function getOrdersByBuyer(
  buyerPiUid: string
): Promise<OrderRecord[]> {

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerPiUid}&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      order_items(quantity,price,product_id,status)
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return [];

  const raw = await res.json() as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
      status: string;
    }>;
  }>;

  const productIds = Array.from(
    new Set(
      raw.flatMap((o) =>
        o.order_items.map((i) => i.product_id)
      )
    )
  );

  const productsMap = await fetchProductsMap(productIds);

  return raw.map((o): OrderRecord => ({
    id: o.id,
    status: o.status,
    total: fromMicroPi(o.total),
    created_at: o.created_at,
    order_items: o.order_items.map((i): OrderItemRecord => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
      status: i.status,
      product: productsMap[i.product_id],
    })),
  }));
}

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

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?${itemQuery.toString()}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items = await itemsRes.json() as Array<{ order_id: string }>;

  const orderIds = Array.from(new Set(items.map(i => i.order_id)));
  if (orderIds.length === 0) return [];

  const ids = orderIds.map(id => `"${id}"`).join(",");

  const orderRes = await fetch(
  `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=id,status,total,created_at,buyer_name,buyer_phone,buyer_address,order_items(quantity,price,product_id,status,seller_pi_uid,cancel_reason)`,
  { headers: headers(), cache: "no-store" }
);

  if (!orderRes.ok) return [];

  const rawOrders = await orderRes.json() as Array<{
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
       cancel_reason: string | null;
    }>;
  }>;

  const productIds = Array.from(
    new Set(
      rawOrders.flatMap(o =>
        o.order_items.map(i => i.product_id)
      )
    )
  );

  const productsMap = await fetchProductsMap(productIds);

  return rawOrders
    .map((o): OrderRecord | null => {

      if (status && o.status !== status) return null;

const sellerItems = o.order_items.filter(
  i => i.seller_pi_uid === sellerPiUid
);

      if (sellerItems.length === 0) return null;

      return {
        id: o.id,
        status: o.status,
        total: fromMicroPi(o.total),
        created_at: o.created_at,
        buyer: {
          name: o.buyer_name ?? "",
          phone: o.buyer_phone ?? "",
          address: o.buyer_address ?? "",
        },
        order_items: sellerItems.map(i => ({
  product_id: i.product_id,
  quantity: i.quantity,
  price: fromMicroPi(i.price),
  status: i.status,
  cancel_reason:
    o.status === "cancelled"
      ? i.cancel_reason ?? null
      : null,
  product: productsMap[i.product_id],
})),
      };
    })
    .filter((o): o is OrderRecord => o !== null);
}


/* =====================================================
   UPDATE ORDER STATUS BY SELLER
===================================================== */
export async function updateOrderStatusBySeller(
  orderId: string,
  sellerPiUid: string,
  newStatus: "confirmed" | "shipping" | "cancelled" | "completed",
  extra?: {
    sellerMessage?: string | null;
    sellerCancelReason?: string | null;
  }
): Promise<boolean> {
  /* =========================
     1️⃣ VERIFY SELLER HAS ITEMS
  ========================= */
  const verifyRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=id`,
    { headers: headers(), cache: "no-store" }
  );

  if (!verifyRes.ok) return false;

  const sellerItems = await verifyRes.json() as Array<{ id: string }>;

  if (sellerItems.length === 0) {
    return false;
  }

  /* =========================
     2️⃣ UPDATE SELLER ITEMS STATUS
  ========================= */
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({
  status: newStatus,
  ...(extra && "sellerMessage" in extra
    ? { seller_message: extra.sellerMessage }
    : {}),
  ...(extra && "sellerCancelReason" in extra
    ? { seller_cancel_reason: extra.sellerCancelReason }
    : {}),
}),
    }
  );

  if (!updateRes.ok) {
    console.error(await updateRes.text());
    return false;
  }

  /* =========================
     3️⃣ OPTIONAL: CHECK IF ALL ITEMS SAME STATUS
     THEN UPDATE ORDER STATUS
  ========================= */

  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&select=status`,
    { headers: headers(), cache: "no-store" }
  );

  if (!checkRes.ok) return true;

  const allItems = await checkRes.json() as Array<{ status: string }>;

  const allSame = allItems.every(i => i.status === newStatus);

  if (allSame) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );
  }

  return true;
}
