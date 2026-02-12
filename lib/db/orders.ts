const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PI_BASE = 1_000_000; // hỗ trợ tới 0.000001 Pi
function toMicroPi(value: number): number {
  return Math.round(value * PI_BASE);
}

function fromMicroPi(value: number): number {
  return value / PI_BASE;
}

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =====================================================
   TYPES (CHO API /orders/[id])
===================================================== */

export type OrderRecord = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer: {
    pi_uid: string;
  };
  items: Array<{
    quantity: number;
    price: number;
    product: {
      seller: {
        pi_uid: string;
      };
    };
  }>;
};

/* =====================================================
   GET ORDER BY ID (FULL JOIN)
===================================================== */
export async function getOrderById(
  orderId: string
): Promise<OrderRecord | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=
      id,
      status,
      total,
      created_at,
      buyer:buyer_id(pi_uid),
      items:order_items(
        quantity,
        price,
        product:product_id(
          seller:seller_id(pi_uid)
        )
      )
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const order = data[0];
if (!order) return null;

order.total = fromMicroPi(order.total);

order.items = order.items.map((item: {
  quantity: number;
  price: number;
  product: {
    seller: { pi_uid: string };
  };
}) => ({
  ...item,
  price: fromMicroPi(item.price),
}));

return order;
}
/* =====================================================
   GET ORDERS BY SELLER
   - Chỉ lấy đơn có sản phẩm của seller
===================================================== */

export async function getOrdersBySeller(
  sellerPiUid: string,
  status?: string
) {
  // 1️⃣ Lấy order_id theo seller_pi_uid (ĐÚNG)
  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?select=order_id&seller_pi_uid=eq.${sellerPiUid}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items = await itemsRes.json();
  const orderIds = Array.from(
    new Set(items.map((i: { order_id: string }) => i.order_id))
  );

  if (orderIds.length === 0) return [];

  // 2️⃣ Lấy orders theo status
  const ids = orderIds.map((id) => `"${id}"`).join(",");
  const statusFilter = status ? `&status=eq.${status}` : "";

  const ordersRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})${statusFilter}&order=created_at.desc`,
    { headers: headers(), cache: "no-store" }
  );

  if (!ordersRes.ok) return [];

  return await ordersRes.json();
}

  

/* =====================================================
   UPDATE ORDER STATUS
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
   EXISTING FUNCTIONS (GIỮ NGUYÊN)
===================================================== */

export async function getOrdersByBuyerSafe(piUid: string) {
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?pi_uid=eq.${piUid}&select=pi_uid`,
    { headers: headers(), cache: "no-store" }
  );

  if (!userRes.ok) return [];

  const users = await userRes.json();
  const buyerId = users[0]?.pi_uid;
  if (!buyerId) return [];

  const orderRes = await fetch(
  `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerId}&order=created_at.desc&select=id,total,status,order_items(quantity,price,product_id)`,
  { headers: headers(), cache: "no-store" }
);

  if (!orderRes.ok) return [];

const orders: Array<{
  id: string;
  total: number;
  status: string;
  order_items: Array<{
    quantity: number;
    price: number;
    product_id: string;
  }>;
}> = await orderRes.json();

return orders.map((o) => ({
  ...o,
  total: fromMicroPi(o.total),
  order_items: o.order_items.map((i) => ({
    ...i,
    price: fromMicroPi(i.price),
  })),
}));
  /* 1️⃣ CREATE ORDER */
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

  // ✅ FIX CHÍNH Ở ĐÂY
  if (!Array.isArray(orderData) || !orderData[0]) {
    throw new Error("ORDER_NOT_RETURNED");
  }

  const order = orderData[0];

  /* 2️⃣ CREATE ORDER ITEMS */
  
const orderItems = items.map((i) => ({
  order_id: order.id,
  product_id: i.product_id,
  quantity: i.quantity,
  price: toMicroPi(i.price),
  seller_pi_uid: i.seller_pi_uid, // 🔥 DÒNG QUYẾT ĐỊNH
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

  return order;
}
