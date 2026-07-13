/* =========================================================
   ORDER ITEM
========================================================= */

export interface RawItem {
  id?: string;

  product_id?: string | null;

  product_name?: string;
  product_slug?: string;

  thumbnail?: string;

  variant_name?: string;
  variant_value?: string;

  quantity?: number;

  unit_price?: number | string;
  total_price?: number | string;

  fulfillment_status?: string;

  tracking_code?: string | null;
  shipping_provider?: string | null;

  created_at?: string;

  status?: string;
}

/* =========================================================
   ORDER ITEM
========================================================= */

export interface OrderItem {
  id: string;

  product_id: string | null;

  product_name: string;
  product_slug: string;

  thumbnail: string;

  variant_name: string;
  variant_value: string;

  quantity: number;

  unit_price: number;
  total_price: number;

  fulfillment_status: string;

  tracking_code: string | null;
  shipping_provider: string | null;

  created_at: string;
}

/* =========================================================
   ORDER
========================================================= */

export interface Order {
  id: string;

  order_number: string;

  created_at: string;

  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;

  shipping_name: string;
  shipping_phone: string;

  shipping_address_line: string;

  shipping_ward: string | null;
  shipping_district: string | null;
  shipping_region: string | null;

  shipping_country: string | null;
  shipping_postal_code: string | null;

  total: number;

  order_items: OrderItem[];
}
