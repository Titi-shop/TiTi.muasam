const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PI_BASE = 1_000_000;

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
  };
}

/* =====================================================
   TYPES
===================================================== */

export type OrderRecord = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer?: {
    pi_uid: string;
  };
  order_items?: Array<{
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      images: string[];
      seller?: {
        pi_uid: string;
      };
    };
  }>;
};

/* =====================================================
   GET ORDER BY ID
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
      order_items(
        quantity,
        price,
        product:product_id(
          id,
          name,
          images,
          seller:seller_id(pi_uid)
        )
      )
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data[0] ?? null;
}

/* =====================================================
   GET ORDERS BY BUYER (FULL DATA FOR UI)
===================================================== */
export async function getOrdersByBuyerSafe(buyerId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerId}&select=
      id,
      status,
      total,
      created_at,
      order_items(
        id,
        product_id,
        quantity,
        price
      )
      &order=created_at.desc`,
    {
      headers: headers(),
      cache: "no-store",
    }
  );

  if (!res.ok) return [];
  return await res.json();
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
        total: Math.round(total * PI_BASE),
        status: "pending",
      }),
    }
  );

  if (!orderRes.ok) {
    const err = await orderRes.text();
    throw new Error("CREATE_ORDER_FAILED: " + err);
  }

  const orderData = await orderRes.json();
  if (!Array.isArray(orderData) || !orderData[0]) {
    throw new Error("ORDER_NOT_RETURNED");
  }

  const order = orderData[0];

  const orderItems = items.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: Math.round(i.price * PI_BASE),
    seller_pi_uid: i.seller_pi_uid,
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
