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

  /* ===============================
     1️⃣ LẤY ORDER_ID TỪ order_items
  =============================== */
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

  /* ===============================
     2️⃣ LẤY ORDERS + BUYER INFO
  =============================== */
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=in.(${ids})&order=created_at.desc&select=
      id,
      status,
      total,
      created_at,
      buyer_name,
      buyer_phone,
      buyer_address,
      order_items(quantity,price,product_id,status,seller_pi_uid)
    `,
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

  /* ===============================
     3️⃣ LẤY PRODUCT DATA
  =============================== */
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

  /* ===============================
     4️⃣ FILTER CHỈ ITEM CỦA SELLER
  =============================== */
  return rawOrders
    .map((o): OrderRecord | null => {
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

        buyer: {
          name: o.buyer_name ?? "",
          phone: o.buyer_phone ?? "",
          address: o.buyer_address ?? "",
        },

        order_items: sellerItems.map((i): OrderItemRecord => ({
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

/* =====================================================
   GET SINGLE ORDER BY ID FOR SELLER
===================================================== */
export async function getOrderByIdForSeller(
  orderId: string,
  sellerPiUid: string
): Promise<OrderRecord | null> {
  const select =
    "id,status,total,created_at,buyer_name,buyer_phone,buyer_address,order_items(quantity,price,product_id,status,seller_pi_uid)";

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=${select}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = (await res.json()) as Array<{
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

  if (!data.length) return null;

  const o = data[0];

  const sellerItems = o.order_items.filter(
    (i) => i.seller_pi_uid === sellerPiUid
  );

  if (sellerItems.length === 0) return null;

  const productIds = Array.from(
    new Set(sellerItems.map((i) => i.product_id))
  );

  let productsMap: Record<
    string,
    { id: string; name: string; images: string[] }
  > = {};

  if (productIds.length > 0) {
    const ids = productIds.map((id) => `"${id}"`).join(",");

    const productRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=in.(${ids})&select=id,name,images`,
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
    order_items: sellerItems.map((i): OrderItemRecord => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
      status: i.status,
      product: productsMap[i.product_id],
    })),
  };
}

export async function getOrdersByBuyer(
  buyerPiUid: string
): Promise<OrderRecord[]> {
  const select =
    "id,status,total,created_at,buyer_name,buyer_phone,buyer_address,order_items(quantity,price,product_id,status)";

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?buyer_id=eq.${buyerPiUid}&select=${select}&order=created_at.desc`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) return [];

  const raw = (await res.json()) as Array<{
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
    }>;
  }>;

  return raw.map((o) => ({
    id: o.id,
    status: o.status,
    total: fromMicroPi(o.total),
    created_at: o.created_at,
    buyer: {
      name: o.buyer_name ?? "",
      phone: o.buyer_phone ?? "",
      address: o.buyer_address ?? "",
    },
    order_items: o.order_items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      price: fromMicroPi(i.price),
      status: i.status,
    })),
  }));
}
export async function createOrder(params: {
  buyerPiUid: string;
  items: {
    product_id: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  shipping: {
    name: string;
    phone: string;
    address: string;
  };
}): Promise<OrderRecord | null> {
  const { buyerPiUid, items, total, shipping } = params;

  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        buyer_id: buyerPiUid,
        buyer_name: shipping.name,
        buyer_phone: shipping.phone,
        buyer_address: shipping.address,
        total: toMicroPi(total),
        status: "pending",
      }),
    }
  );

  if (!orderRes.ok) return null;

  const [order] = await orderRes.json();

  for (const item of items) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/order_items`,
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: toMicroPi(item.price),
          status: "pending",
        }),
      }
    );
  }

  return order;
}
/* =====================================================
   UPDATE ORDER STATUS BY SELLER (ITEM LEVEL)
===================================================== */
export async function updateOrderStatusBySeller(
  sellerPiUid: string,
  orderId: string,
  status: string
): Promise<boolean> {

  /* 1️⃣ CẬP NHẬT CHỈ ITEM CỦA SELLER */
  const updateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&seller_pi_uid=eq.${sellerPiUid}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status }),
    }
  );

  if (!updateRes.ok) return false;

  /* 2️⃣ KIỂM TRA TOÀN BỘ ITEM TRONG ORDER */
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}&select=status`,
    { headers: headers(), cache: "no-store" }
  );

  if (!checkRes.ok) return true;

  const items = await checkRes.json() as Array<{ status: string }>;

  const allSameStatus = items.every(i => i.status === status);

  /* 3️⃣ NẾU TẤT CẢ ITEM CÙNG STATUS → UPDATE ORDER */
  if (allSameStatus) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
      {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ status }),
      }
    );
  }

  return true;
}

/* =====================================================
   UPDATE ORDER STATUS BY BUYER (FULL ORDER)
===================================================== */
export async function updateOrderStatusByBuyer(
  buyerPiUid: string,
  orderId: string,
  status: string
): Promise<boolean> {

  /* 1️⃣ Kiểm tra order có thuộc buyer */
  const checkRes = await fetch(
    `${SUPABASE_URL}//rest/v1/orders?id=eq.${orderId}&buyer_id=eq.${buyerPiUid}&select=id`,
    { headers: headers(), cache: "no-store" }
  );

  if (!checkRes.ok) return false;

  const orders = await checkRes.json() as Array<{ id: string }>;
  if (orders.length === 0) return false;

  /* 2️⃣ Update toàn bộ order_items */
  const updateItemsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/order_items?order_id=eq.${orderId}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status }),
    }
  );

  if (!updateItemsRes.ok) return false;

  /* 3️⃣ Update order */
  const updateOrderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status }),
    }
  );

  if (!updateOrderRes.ok) return false;

  return true;
}
