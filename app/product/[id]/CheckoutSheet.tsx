"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { formatPi } from "@/lib/pi";

import type { ShippingRate } from "@/types/Product";
import type {
  CheckoutProps as Props,
  ShippingInfo,
  Message,
} from "@/types/checkout";

import {
  previewFetcher,
  fetchDefaultAddress,
  getCountryDisplay,
} from "./checkout.api";

import {
  validateBeforePay,
  useCheckoutPay,
} from "./checkout.logic";

/* =========================================================
   COMPONENT
========================================================= */

export default function CheckoutSheet({
  open,
  onClose,
  product,
}: Props) {
  const router = useRouter();

  const { t } =
    useTranslation();

  const {
    user,
    piReady,
    pilogin,
  } = useAuth();

  /* =========================================================
     REFS
  ========================================================= */

  const processingRef =
    useRef(false);

  const checkoutStartedRef =
    useRef(false);

  const paymentIntentIdRef =
    useRef<string | null>(null);

  const piPaymentIdRef =
    useRef<string | null>(null);

  const txidRef =
    useRef<string | null>(null);

  const shippingRef =
    useRef<ShippingInfo | null>(null);

  const userRef =
    useRef(user);

  /* =========================================================
     STATE
  ========================================================= */

  const [
    shipping,
    setShipping,
  ] =
    useState<ShippingInfo | null>(
      null
    );

  const [
    qty,
    setQty,
  ] =
    useState("1");

  const [
    processing,
    setProcessing,
  ] =
    useState(false);

  const [
    notification,
    setNotification,
  ] =
    useState<Message | null>(
      null
    );

  const [
    checkoutState,
    setCheckoutState,
  ] =
    useState("IDLE");

  const checkoutStateRef =
    useRef(checkoutState);

  /* =========================================================
     KEEP REFS UPDATED
  ========================================================= */

  useEffect(() => {
    shippingRef.current =
      shipping;
  }, [shipping]);

  useEffect(() => {
    userRef.current =
      user;
  }, [user]);

  useEffect(() => {
    checkoutStateRef.current =
      checkoutState;
  }, [checkoutState]);

  /* =========================================================
     ITEM
  ========================================================= */

  const item =
    useMemo(() => {
      if (!product)
        return null;

      const variant =
        product.selectedVariant;

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
        thumbnail:
          product.thumbnail ||
          "/placeholder.png",

        stock:
          variant?.stock ??
          product.stock ??
          0,

        is_unlimited:
          product.is_unlimited ??
          false,
      };
    }, [product]);

  const maxStock =
    Math.max(
      1,
      item?.stock ?? 0
    );

  const quantity =
    useMemo(() => {
      const n =
        Number(qty);

      return Number.isInteger(
        n
      ) &&
        n >= 1 &&
        n <= maxStock
        ? n
        : 1;
    }, [
      qty,
      maxStock,
    ]);

  /* =========================================================
     SHIPPING REGIONS
  ========================================================= */

  const regions =
    useMemo(() => {
      return Array.isArray(
        product?.shipping_rates
      )
        ? product.shipping_rates
        : [];
    }, [
      product?.shipping_rates,
    ]);

  /* =========================================================
     LOAD DEFAULT ADDRESS
  ========================================================= */

  useEffect(() => {
    if (!open)
      return;

    if (!user) {
      setShipping(null);
      return;
    }

    let cancelled =
      false;

    async function load() {
      try {
        const address =
          await fetchDefaultAddress();

        if (
          cancelled
        )
          return;

        setShipping(
          address ??
            null
        );
      } catch {
        if (
          cancelled
        )
          return;

        setShipping(
          null
        );
      }
    }

    load();

    return () => {
      cancelled =
        true;
    };
  }, [
    open,
    user,
  ]);

  /* =========================================================
     PREVIEW KEY
  ========================================================= */

  const previewKey =
    useMemo(() => {
      if (
        !open ||
        !shipping ||
        !item
      ) {
        return null;
      }

      return [
        "/api/orders/preview",
        shipping.id,
        quantity,
        item.id,
        product
          ?.selectedVariant
          ?.id ?? null,
      ];
    }, [
      open,
      shipping,
      quantity,
      item,
      product,
    ]);

  /* =========================================================
     ORDER PREVIEW
  ========================================================= */

  const {
    data: preview,
    isLoading,
    isValidating,
  } =
    useSWR(
      previewKey,
      previewFetcher,
      {
        revalidateOnFocus:
          false,

        dedupingInterval:
          2000,
      }
    );

  /* =========================================================
     PRICE
  ========================================================= */

  const unitPrice =
    item?.final_price ??
    0;

  const total =
    useMemo(() => {
      if (
        preview?.total !=
        null
      ) {
        return preview.total;
      }

      return (
        unitPrice *
        quantity
      );
    }, [
      preview?.total,
      unitPrice,
      quantity,
    ]);

  /* =========================================================
     SHIPPING REGION
  ========================================================= */

  const resolvedRegion =
    useMemo(() => {
      const zone =
        preview
          ?.shipping_zone ??
        preview
          ?.buyer_zone;

      if (!zone)
        return null;

      return (
        regions.find(
          (r) =>
            r.zone ===
            zone
        ) ?? null
      );
    }, [
      preview
        ?.shipping_zone,
      preview
        ?.buyer_zone,
      regions,
    ]);

  /* =========================================================
     PAY
     (PHẦN 2)
  ========================================================= */
