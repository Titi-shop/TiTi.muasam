export interface ProductVariant {
  id?: string;

  optionName?: string;

  optionValue: string;

  stock: number;

  sku?: string | null;

  sortOrder?: number;

  isActive?: boolean;

  price?: number;

  salePrice?: number | null;

  saleEnabled?: boolean;

  saleStock?: number;

  saleSold?: number;

  finalPrice?: number;
}

export interface ShippingRate {
  zone: string;

  price: number;
}
export interface Product {
  id: string;

  sellerId: string;

  name: string;

  slug: string;

  shortDescription: string;

  description: string;

  detail: string;

  thumbnail: string;

  images: string[];

  detailImages: string[];

  videoUrl: string;

  price: number;

  salePrice: number | null;

  finalPrice: number;

  currency: string;

  stock: number;

  isUnlimited: boolean;

  sold: number;

  views: number;

  ratingAvg: number;

  ratingCount: number;

  isActive: boolean;

  isFeatured: boolean;

  isDigital: boolean;

  status: string;

  categoryId: number | null;

  saleStart: string | null;

  saleEnd: string | null;

  saleEnabled: boolean;

  saleStock: number;

  metaTitle: string;

  metaDescription: string;

  createdAt: string;

  updatedAt: string;

  deletedAt: string | null;

  variants: ProductVariant[];

  shippingRates: ShippingRate[];

  hasVariants: boolean;

  domestic_country_code?: string | null;
}

export interface ProductPayload {
  id?: string;

  name: string;

  categoryId?: string | null;

  description: string;

  detail: string;

  images: string[];

  thumbnail: string | null;

  isActive: boolean;

  shippingRates: ShippingRate[];

  domestic_country_code?: string | null;

  price?: number;

  stock?: number;

  salePrice?: number | null;

  saleEnabled?: boolean;

  saleStock?: number;

  saleStart?: string | null;

  saleEnd?: string | null;

  variants: ProductVariant[];

  idempotencyKey?: string;
}
