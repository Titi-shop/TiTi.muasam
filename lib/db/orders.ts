const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 1 Pi = 1_000_000 microPi
 */
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
function headers() {
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
  quantity: number;
  price: number; // Pi
  product_id: string;
};

export type OrderRecord = {
  id: string;
  status: string;
  total: number; // Pi
  created_at: string;
  order_items: OrderItemRecord[];
};

/* =====================================================
   GET ORDERS BY BUYER
===================================================== */
export async function getOrdersByBuyerSafe(
  piUid: string
): Promise<OrderRecord[]> {
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${piUid}&select=pi_uid`,
    { headers: headers(), cache: "no-store" }
  );

  if (!userRes.ok) return [];

  const users = await userRes.json();
  const buyerId = users[0]?.pi_uid;
  if (!buyerId) return [];

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerId}&order=created_at.desc&select=id,total,status,created_at,order_items(quantity,price,product_id)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders = await orderRes.json();

  return rawOrders.map((o: any) => ({
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i: any) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
    })),
  }));
}

/* =====================================================
   GET ORDER DETAIL
===================================================== */
export async function getOrderById(
  orderId: string
): Promise<OrderRecord | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=id,status,total,created_at,order_items(quantity,price,product_id)`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const o = data[0];
  if (!o) return null;

  return {
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i: any) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
    })),
  };
}

/* =====================================================
   CREATE ORDER
===================================================== */
export async function createOrderSafe({
  buyerPiUid,
  items,
  total,
}: {
  buyerPiUid: string;
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    seller_pi_uid: string;
  }>;
  total: number;
}) {
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders`,
    {
      method: "POST",
      headers: {
        ...headers(),
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        buyer_id: buyerPiUid,
        total: toMicroPi(total),
        status: "pending",
      }),
    }
  );

  if (!orderRes.ok) {
    const err = await orderRes.text();
    throw new Error("CREATE_ORDER_FAILED: " + err);
  }

  const orderData = await orderRes.json();
  const order = orderData[0];

  const orderItems = items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: toMicroPi(i.price),
    seller_pi_uid: i.seller_pi_uid,
    status: "pending",
  }));

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(orderItems),
    }
  );

  if (!itemsRes.ok) {
    const err = await itemsRes.text();
    throw new Error("CREATE_ORDER_ITEMS_FAILED: " + err);
  }

  return {
    id: order.id,
    status: order.status,
    total,
  };
}

/* =====================================================
   UPDATE ORDER STATUS (GLOBAL)
===================================================== */
export async function updateOrderStatus(
  orderId: string,
  status: string
) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status }),
    }
  );
}

/* =====================================================
   GET ORDERS BY SELLER (MARKETPLACE SAFE)
===================================================== */
export async function getOrdersBySeller(
  sellerPiUid: string
): Promise<OrderRecord[]> {
  /* 1️⃣ Lấy order_id từ order_items */
  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?select=order_id&seller_pi_uid=eq.${sellerPiUid}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items: Array<{ order_id: string }> =
    await itemsRes.json();

  const orderIds = Array.from(
    new Set(items.map((i) => i.order_id))
  );

  if (orderIds.length === 0) return [];

  /* 2️⃣ Fetch orders + full order_items */
  const ids = orderIds.map((id) => `"${id}"`).join(",");

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      order_items(
        quantity,
        price,
        product_id,
        status,
        seller_pi_uid
      )
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders = await orderRes.json();

  /* 3️⃣ Chỉ giữ item của seller */
  return rawOrders
    .map((o: any) => {
      const sellerItems = o.order_items.filter(
        (i: any) =>
          i.seller_pi_uid === sellerPiUid
      );

      if (sellerItems.length === 0) return null;

      return {
        id: o.id,
        status: o.status,
        created_at: o.created_at,
        total: fromMicroPi(o.total),
        order_items: sellerItems.map((i: any) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: fromMicroPi(i.price),
        })),
      };
    })
    .filter(Boolean) as OrderRecord[];
}
