"use client";

import { useCallback } from "react";
import { getPiAccessToken } from "@/lib/piAuth";
import type { UseCheckoutPayParams } from "./checkout.types";

/* =========================
   PREVIEW
========================= */

async function previewOrderDirect({ shipping, zone, item, quantity, variant_id }: any) {
  const token = await getPiAccessToken();

  const res = await fetch("/api/orders/preview", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      country: shipping.country.toUpperCase(),
      zone,
      shipping: {
        region: shipping.region,
        district: shipping.district,
        ward: shipping.ward,
      },
      items: [
        {
          product_id: item.id,
          variant_id: variant_id ?? null,
          quantity,
        },
      ],
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "PREVIEW_FAILED");
  }

  return data;
}

/* =========================
   ERROR MAP
========================= */

const getErrorKey = (code?: string) => {
  const map: Record<string, string> = {
    PREVIEW_FAILED: "order_preview_failed",
    PAYMENT_INTENT_FAILED: "payment_intent_failed",
    AUTHORIZE_FAILED: "payment_approve_failed",
    SUBMIT_FAILED: "payment_submit_failed",
  };

  return map[code || ""] || "unknown_error";
};

/* =========================
   MAIN HOOK
========================= */

export function useCheckoutPay({
  item,
  quantity,
  shipping,
  zone,
  product,
  preview,
  processing,
  setProcessing,
  processingRef,
  t,
  router,
  onClose,
  showMessage,
  validate,
}: UseCheckoutPayParams) {
  return useCallback(() => {
    if (processingRef.current || processing) return;
    if (!validate()) return;

    processingRef.current = true;
    setProcessing(true);

    let completionLocked = false;

    (async () => {
      try {
        /* =========================
           1. PREVIEW
        ========================= */
        if (!preview) {
          await previewOrderDirect({
            shipping,
            zone,
            item,
            quantity,
            variant_id: product.variant_id ?? null,
          });
        }

        const token = await getPiAccessToken();

        /* =========================
           2. CREATE INTENT
        ========================= */
        const intentRes = await fetch("/api/payments/pi/create-intent", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: item.id,
            variant_id: product.variant_id ?? null,
            quantity,
            country: shipping.country,
            zone,
            shipping,
          }),
        });

        const intent = await intentRes.json().catch(() => null);

        if (!intentRes.ok) {
          throw new Error(intent?.error || "PAYMENT_INTENT_FAILED");
        }

        const paymentIntentId = intent.payment_intent_id;
        const amount = Number(intent.amount);

        if (!paymentIntentId) throw new Error("NO_INTENT");

        /* =========================
           3. PI SDK
        ========================= */
        if (!window.Pi?.createPayment) {
          throw new Error("PI_NOT_READY");
        }

        window.Pi.createPayment(
          {
            amount,
            memo: intent.memo || "Order payment",
            metadata: { payment_intent_id: paymentIntentId },
          },
          {
            /* =========================
               APPROVAL
            ========================= */
            onReadyForServerApproval: async (paymentId, cb) => {
              try {
                const token = await getPiAccessToken();

                const res = await fetch("/api/payments/pi/authorize", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    payment_intent_id: paymentIntentId,
                    pi_payment_id: paymentId,
                  }),
                });

                const data = await res.json().catch(() => null);

                if (!res.ok || !data?.success) {
                  throw new Error("AUTHORIZE_FAILED");
                }

                cb();
              } catch (e) {
                processingRef.current = false;
                setProcessing(false);
                showMessage(t.payment_approve_failed ?? "approve_failed");
              }
            },

            /* =========================
               COMPLETION (CRITICAL FIX)
            ========================= */
            onReadyForServerCompletion: async (paymentId, txid, cb) => {
              if (completionLocked) return;
              completionLocked = true;

              try {
                const token = await getPiAccessToken();

                /* ⚡ FIRE AND FORGET SUBMIT (KHÔNG BLOCK UI) */
                fetch("/api/payments/pi/submit", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    payment_intent_id: paymentIntentId,
                    pi_payment_id: paymentId,
                    txid,
                  }),
                }).catch(() => {});

                /* ⚡ RELEASE PI SDK NGAY */
                cb?.();

                /* =========================
                   FAST NAVIGATION
                ========================= */
                onClose();

                setTimeout(() => {
                  router.replace(
                    "/customer/orders?tab=pending&ts=" + Date.now()
                  );
                }, 0);

                showMessage(t.payment_success ?? "success", "success");
              } catch (err) {
                showMessage(
                  t[getErrorKey((err as Error).message)] || "error"
                );
              } finally {
                processingRef.current = false;
                setProcessing(false);
              }
            },

            onCancel: () => {
              processingRef.current = false;
              setProcessing(false);
            },

            onError: () => {
              processingRef.current = false;
              setProcessing(false);
            },
          }
        );
      } catch (err) {
        processingRef.current = false;
        setProcessing(false);
        showMessage(t.transaction_failed ?? "failed");
      }
    })();
  }, [
    item,
    quantity,
    shipping,
    zone,
    product,
    preview,
    processing,
    setProcessing,
    processingRef,
    t,
    router,
    onClose,
    showMessage,
    validate,
  ]);
            }
