
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 1 Pi = 1_000_000 microPi
 * DB lưu INTEGER (microPi)
 * App hiển thị NUMBER (Pi)
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
  status: string; // ✅ thêm dòng này
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

  const users = (await userRes.json()) as Array<{ pi_uid: string }>;
  const buyerId = users[0]?.pi_uid;
  if (!buyerId) return [];

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerId}&order=created_at.desc&select=
      id,
      total,
      status,
      created_at,
      order_items(quantity,price,product_id)
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const rawOrders = (await orderRes.json()) as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
    }>;
  }>;

  return rawOrders.map((o) => ({
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
    })),
  }));
}

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
      order_items(quantity,price,product_id)
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
    }>;
  }>;

  const o = data[0];
  if (!o) return null;

  return {
    id: o.id,
    status: o.status,
    created_at: o.created_at,
    total: fromMicroPi(o.total),
    order_items: o.order_items.map((i) => ({
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
  shipping,
}: {
  buyerPiUid: string;
  items: Array<{
  product_id: string;
  quantity: number;
  price: number;
}>;
  total: number;
  shipping: {
    name: string;
    phone: string;
    address: string;
  };
}): Promise<{ id: string; status: string; total: number }> {
  const orderRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
    method: "POST",
    headers: {
      ...headers(),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      buyer_id: buyerPiUid,
      total: toMicroPi(total),
      status: "pending",
      buyer_name: shipping.name,
      buyer_phone: shipping.phone,
      buyer_address: shipping.address,
    }),
  });

  if (!orderRes.ok) throw new Error(await orderRes.text());

  const orderData = (await orderRes.json()) as Array<{
    id: string;
    status: string;
  }>;

  const order = orderData[0];
  if (!order) throw new Error("ORDER_NOT_RETURNED");

  const orderItemsPayload = [];

for (const i of items) {
  const productRes = await fetch(
    `${SUPABASE_URL}/rest/v1/products?id=eq.${i.product_id}&select=seller_id`,
    { headers: headers() }
  );

  if (!productRes.ok) throw new Error("PRODUCT_NOT_FOUND");

  const productData = await productRes.json();
  const product = productData[0];

  if (!product?.seller_id) throw new Error("SELLER_NOT_FOUND");

  orderItemsPayload.push({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: toMicroPi(i.price),
    seller_pi_uid: product.seller_id, // ✅ LẤY TỪ products
    status: "pending",
  });
}

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(orderItemsPayload),
    }
  );

  if (!itemsRes.ok) throw new Error(await itemsRes.text());

  return {
    id: order.id,
    status: order.status,
    total,
  };
}

/* =====================================================
   UPDATE ORDER STATUS
===================================================== */
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status }),
    }
  );

  if (!res.ok) throw new Error(await res.text());
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

  const sellerItems = o.order_items.filter(
  (i) => i.seller_pi_uid === sellerPiUid
);

  const itemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?${itemQuery.toString()}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!itemsRes.ok) return [];

  const items: Array<{ order_id: string }> = await itemsRes.json();
  const orderIds = Array.from(new Set(items.map((i) => i.order_id)));

  if (orderIds.length === 0) return [];

  const ids = orderIds.map((id) => `"${id}"`).join(",");

  // ✅ THÊM LEFT JOIN PRODUCTS Ở ĐÂY
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      buyer_name,
      buyer_phone,
      buyer_address,
      order_items(
        quantity,
        price,
        product_id,
        status,
        seller_pi_uid,
        product:products!left(
          id,
          name,
          images
        )
      )
    `,
    { headers: headers(), cache: "no-store" }
  );

  if (!orderRes.ok) return [];

  const raw = (await orderRes.json()) as Array<{
    id: string;
    status: string;
    total: number;
    created_at: string;
    buyer_name?: string;
    buyer_phone?: string;
    buyer_address?: string;
    order_items: Array<{
      quantity: number;
      price: number;
      product_id: string;
      status: string;
      seller_pi_uid: string;
      product: {
        id: string;
        name: string;
        images: string[] | null;
      } | null;
    }>;
  }>;

  return raw
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
        buyer_name: o.buyer_name ?? undefined,
        buyer_phone: o.buyer_phone ?? undefined,
        buyer_address: o.buyer_address ?? undefined,
        order_items: sellerItems.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: fromMicroPi(i.price),
          product: i.product
            ? {
                id: i.product.id,
                name: i.product.name,
                images: i.product.images ?? [],
              }
            : undefined,
        })),
      };
    })
    .filter((o): o is OrderRecord => o !== null);
}


/* =====================================================
   CONFIRM / CANCEL / SHIPPING / COMPLETE
===================================================== */
export async function confirmOrderBySeller(
  sellerPiUid: string,
  orderId: string
): Promise<void> {
  await updateSellerOrderItemsStatus(
    sellerPiUid,
    orderId,
    "confirmed"
  );
}

export async function cancelOrderBySeller(
  sellerPiUid: string,
  orderId: string
): Promise<void> {
  await updateSellerOrderItemsStatus(
    sellerPiUid,
    orderId,
    "cancelled"
  );
}

export async function startShippingBySeller(
  sellerPiUid: string,
  orderId: string
): Promise<void> {
  await updateSellerOrderItemsToShipping(
    sellerPiUid,
    orderId
  );
}

export async function completeOrderBySeller(
  sellerPiUid: string,
  orderId: string
): Promise<void> {
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=id,status`,
    { headers: headers(), cache: "no-store" }
  );

  if (!checkRes.ok) throw new Error(await checkRes.text());

  const items = (await checkRes.json()) as Array<{
    id: string;
    status: string;
  }>;

  const shippingIds = items
    .filter((i) => i.status === "shipping")
    .map((i) => i.id);

  if (shippingIds.length === 0)
    throw new Error("NO_SHIPPING_ITEMS");

  const ids = shippingIds.map((id) => `"${id}"`).join(",");

  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?id=in.(${ids})`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: "completed" }),
    }
  );

  if (!updateRes.ok) throw new Error(await updateRes.text());
}

/* =====================================================
   INTERNAL LOGIC
===================================================== */
async function updateSellerOrderItemsToShipping(
  sellerPiUid: string,
  orderId: string
): Promise<void> {
  await updateSellerOrderItemsStatus(
    sellerPiUid,
    orderId,
    "shipping"
  );
}

async function updateSellerOrderItemsStatus(
  sellerPiUid: string,
  orderId: string,
  newStatus: string
): Promise<void> {
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}&select=id,status`,
    { headers: headers(), cache: "no-store" }
  );

  if (!checkRes.ok) throw new Error(await checkRes.text());

  const items = (await checkRes.json()) as Array<{
    id: string;
    status: string;
  }>;

  const validIds = items
    .filter((i) => i.status !== newStatus)
    .map((i) => i.id);

  if (validIds.length === 0)
    throw new Error("NO_VALID_ITEMS");

  const ids = validIds.map((id) => `"${id}"`).join(",");

  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?id=in.(${ids})`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status: newStatus }),
    }
  );

  if (!updateRes.ok) throw new Error(await updateRes.text());
}


export async function getOrderDetailBySeller(
  sellerPiUid: string,
  orderId: string
) {
  const orders = await getOrdersBySeller(sellerPiUid);
  return orders.find((o) => o.id === orderId) ?? null;
}
