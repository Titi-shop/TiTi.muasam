"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { formatPi } from "@/lib/pi";

import type { ShippingRate } from "@/types/Product";
import type {
  CheckoutProps as Props,
  Region,
  ShippingInfo,
  Message,
} from "@/types/checkout";

import {
  previewFetcher,
  fetchDefaultAddress,
  getCountryDisplay,
} from "./checkout.api";

import {
  getErrorKey,
  validateBeforePay,
  useCheckoutPay,
} from "./checkout.logic";

/* =========================
HELPER
========================= */

function detectZone(country: string, rates: ShippingRate[]): Region | null {
  if (!country || !rates?.length) return null;

  const c = country.toUpperCase();

  const match = rates.find(
    (r) =>
      r.zone === "domestic" &&
      r.domestic_country_code?.toUpperCase() === c
  );

  return (match?.zone as Region) ?? null;
}

/* =========================
COMPONENT
========================= */

export default function CheckoutSheet({
  open,
  onClose,
  product,
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, piReady, pilogin } = useAuth();

  const processingRef = useRef(false);

  /* =========================
  STATE
  ========================= */

  const [shipping, setShipping] = useState<ShippingInfo | null>(null);
  const [zone, setZone] = useState<Region | null>(null);
  const [qty, setQty] = useState<string>("1");
  const [message, setMessage] = useState<Message | null>(null);
  const [processing, setProcessing] = useState(false);

  /* =========================
  ITEM
  ========================= */

  const item = useMemo(() => {
    if (!product) return null;

    const variant = product.selectedVariant;

    const price =
      variant?.final_price ??
      variant?.sale_price ??
      variant?.price ??
      product.final_price ??
      product.price;

    return {
      id: product.id,
      name: product.name,
      price,
      final_price: price,
      thumbnail: product.thumbnail || "/placeholder.png",
      stock: variant?.stock ?? product.stock ?? 0,
    };
  }, [product]);

  const maxStock = Math.max(1, item?.stock ?? 0);

  const quantity = useMemo(() => {
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1 || n > maxStock) return 1;
    return n;
  }, [qty, maxStock]);

  /* =========================
  SHIPPING
  ========================= */

  const regions = useMemo(() => {
    return Array.isArray(product?.shipping_rates)
      ? product.shipping_rates
      : [];
  }, [product?.shipping_rates]);

  /* =========================
  LOAD ADDRESS
  ========================= */

  useEffect(() => {
    if (!open || !user) return;

    (async () => {
      const def = await fetchDefaultAddress();
      if (!def) return;

      setShipping(def);

      const z = detectZone(def.country, regions);
      setZone(z ?? regions[0]?.zone ?? null);
    })();
  }, [open, user, regions]);

  /* =========================
  SWR PREVIEW
  ========================= */

  const previewKey = useMemo(() => {
    if (!open || !shipping || !zone || !item) return null;

    return [
      "/api/orders/preview",
      shipping.id,
      zone,
      quantity,
      item.id,
      product?.selectedVariant?.id ?? null,
    ];
  }, [open, shipping, zone, quantity, item, product]);

  const { data: preview, isLoading, isValidating } = useSWR(
    previewKey,
    previewFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  /* =========================
  PRICE
  ========================= */

  const unitPrice = item?.final_price ?? 0;

  const total = useMemo(() => {
    if (preview?.total != null) return preview.total;
    return unitPrice * quantity;
  }, [preview?.total, unitPrice, quantity]);

  /* =========================
  MESSAGE
  ========================= */

  const showMessage = (text: string, type: "error" | "success" = "error") => {
    setMessage({ text, type });

    setTimeout(() => setMessage(null), 3000);
  };

  /* =========================
  PAY
  ========================= */

  const handlePay = useCheckoutPay({
    item,
    quantity,
    total,
    shipping,
    unitPrice,
    processing,
    setProcessing,
    processingRef,
    t,
    user,
    router,
    onClose,
    zone,
    product,
    showMessage,
    validate: () =>
      validateBeforePay({
        user,
        piReady,
        shipping,
        zone,
        item,
        quantity,
        maxStock,
        pilogin,
        showMessage,
        t,
      }),
  });

  /* =========================
  GUARD
  ========================= */

  if (!open || !item) return null;

  /* =========================
  RENDER
  ========================= */

  return (
    <div className="fixed inset-0 z-[100]">
      {/* MESSAGE */}
      {message && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-white z-[120]
          ${message.type === "success" ? "bg-green-600" : "bg-red-500"}`}
        >
          {message.text}
        </div>
      )}

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* SHEET */}
      <div className="absolute bottom-0 left-0 right-0 h-[65vh] rounded-t-2xl flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ADDRESS */}
          <div
            className="border rounded-xl p-3 cursor-pointer"
            onClick={() => router.push("/customer/address")}
          >
            {shipping ? (
              <>
                <p className="font-medium">{shipping.name}</p>
                <p className="text-sm text-gray-500">{shipping.phone}</p>
                <p className="text-sm text-gray-500">
                  {shipping.address_line}
                </p>
                <p className="text-sm text-gray-500">
                  {[shipping.ward, shipping.district, shipping.region]
                    .filter(Boolean)
                    .join(", ")}{" "}
                  – {getCountryDisplay(shipping.country)}
                </p>
              </>
            ) : (
              <p className="text-gray-400">➕ {t.add_shipping}</p>
            )}
          </div>

          {/* SHIPPING */}
          <div className="border rounded-xl p-3">
            <p className="font-medium mb-2">🌍 Zone</p>

            {!zone ? (
              <p className="text-red-500 text-sm">
                No shipping zone available
              </p>
            ) : (
              <div className="text-sm">
                {zone} · {formatPi(total)} π
              </div>
            )}
          </div>

          {/* PRODUCT */}
          <div className="flex gap-3 items-center">
            <img
              src={item.thumbnail}
              className="w-16 h-16 rounded-lg object-cover"
            />

            <div className="flex-1">
              <p className="font-medium">{item.name}</p>

              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => setQty(String(Math.max(1, quantity - 1)))}>
                  -
                </button>

                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
                  className="w-12 text-center border"
                />

                <button
                  onClick={() =>
                    setQty(String(Math.min(maxStock, quantity + 1)))
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div className="text-right font-bold text-red-500">
              {formatPi(total)} π
              {(isLoading || isValidating) && (
                <p className="text-xs text-gray-400">Updating...</p>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-4">
          <button
            onClick={() => handlePay?.()}
            disabled={processing}
            className="w-full py-3 rounded-xl text-white font-bold bg-orange-500 disabled:opacity-50"
          >
            {processing ? t.processing : t.pay_now}
          </button>
        </div>
      </div>
    </div>
  );
                }
