/* =========================================================
   CHECKOUT TYPES (ONLY FOR CHECKOUT FLOW)
========================================================= */

export type Region =
  | "domestic"
  | "sea"
  | "asia"
  | "europe"
  | "north_america"
  | "rest_of_world";

/* =========================================================
   PRODUCT SNAPSHOT FOR CHECKOUT
   (IMPORTANT: NOT FULL ProductRecord)
========================================================= */

export type CheckoutProduct = {
  id: string;
  name: string;
  thumbnail?: string;

  price: number;
  sale_price?: number | null;
  final_price?: number;

  stock?: number;

  shipping_rates?: {
    zone: Region;
    price: number;
    domestic_country_code?: string | null;
  }[];

  selectedVariant?: {
    id: string;
    price?: number;
    sale_price?: number | null;
    final_price?: number | null;
    stock?: number;
  } | null;
};

/* =========================================================
   SHIPPING
========================================================= */

export type CheckoutShipping = {
  id: string;
  name: string;
  phone: string;

  address_line: string;
  ward?: string;
  district?: string;
  region?: string;
  country: string;
  postal_code?: string;
};

/* =========================================================
   ITEM SENT TO API
========================================================= */

export type CheckoutItem = {
  product_id: string;
  variant_id: string | null;
  quantity: number;
};

/* =========================================================
   VALIDATION PARAMS
========================================================= */

export type ValidateParams = {
  user: any;
  piReady: boolean;
  shipping: CheckoutShipping | null;
  zone: Region | null;
  item: {
    id: string;
    stock?: number;
  } | null;
  quantity: number;
  maxStock: number;
  pilogin?: () => void;
  showMessage: (text: string) => void;
  t: Record<string, string>;
};

/* =========================================================
   USE CHECKOUT PAY PARAMS
========================================================= */

export type UseCheckoutPayParams = {
  item: {
    id: string;
  } | null;

  quantity: number;
  total: number;
  unitPrice: number;

  shipping: CheckoutShipping | null;

  processing: boolean;
  setProcessing: (v: boolean) => void;
  processingRef: React.MutableRefObject<boolean>;
  t: Record<string, string>;
  user: any;

  router: any;
  onClose: () => void;

  zone: Region | null;

  product: CheckoutProduct | null;

  showMessage: (msg: string, type?: "error" | "success") => void;

  validate: () => boolean;
};
