"use client";

import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

import type {
  ShippingInfo,
} from "@/types/checkout";

/* =========================================================
   TYPES
========================================================= */

export type PreviewKey = [
  url: string,
  addressId: string,
  quantity: number,
  productId: string,
  variantId: string | null,
];

export type OrderPreview = {
  buyer_zone?: string;
  shipping_zone?: string;

  subtotal: number;
  shipping_fee: number;
  total: number;
};

type AddressRow = {
  id: string;

  full_name: string;

  phone: string;

  address_line: string;

  region: string;

  district?: string | null;

  ward?: string | null;

  country?: string | null;

  postal_code?: string | null;

  is_default: boolean;
};

type AddressResponse = {
  items?: AddressRow[];
};

/* =========================================================
   ORDER PREVIEW
========================================================= */

export async function previewFetcher(
  key: PreviewKey
): Promise<OrderPreview> {
  const [
    url,
    addressId,
    quantity,
    productId,
    variantId,
  ] = key;

  const res =
    await apiAuthFetch(url, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        address_id: addressId,

        items: [
          {
            product_id:
              productId,

            variant_id:
              variantId,

            quantity,
          },
        ],
      }),
    });

  const data =
    await res
      .json()
      .catch(() => null);

  if (!res.ok || !data) {
    throw new Error(
      "PREVIEW_FAILED"
    );
  }

  return data;
}

/* =========================================================
   DEFAULT ADDRESS
========================================================= */

export async function fetchDefaultAddress(): Promise<ShippingInfo | null> {
  const res =
    await apiAuthFetch(
      "/api/address"
    );

  if (!res.ok) {
    return null;
  }

  const data: AddressResponse =
    await res.json();

  const address =
    (data.items ?? []).find(
      (x) => x.is_default
    );

  if (!address) {
    return null;
  }

  return {
    id: address.id,

    name:
      address.full_name,

    phone:
      address.phone,

    address_line:
      address.address_line,

    region:
      address.region,

    district:
      address.district ??
      "",

    ward:
      address.ward ??
      "",

    country:
      address.country ??
      "",

    postal_code:
      address.postal_code ??
      null,
  };
}

/* =========================================================
   COUNTRY
========================================================= */

export function getCountryDisplay(
  country?: string | null
): string {
  return String(
    country ?? ""
  ).toUpperCase();
}
