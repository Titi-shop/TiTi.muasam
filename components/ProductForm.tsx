
"use client";

import { FormEvent, useState } from "react";
import { toUTCFromInput } from "@/lib/utils/time";
import { compressImage } from "@/lib/upload/imageUtils";
import { getPiAccessToken } from "@/lib/piAuth";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";

import { useProductForm } from "./product/useProductForm";
import ShippingRates from "./product/ShippingRates";
import VariantEditor from "./product/VariantEditor";

import type { ProductVariant } from "./product/types";

/* =========================
   TYPES
========================= */

interface Category {
  id: string;
  key: string;
}

interface ProductFormProps {
  categories: Category[];
  initialData?: Record<string, unknown>;
  onSubmit: (payload: any) => Promise<void>;
}

interface ShippingRatePayload {
  zone: string;
  price: number;
  domestic_country_code?: string | null;
}

/* =========================
   COMPONENT
========================= */

export default function ProductForm({
  categories,
  initialData,
  onSubmit,
}: ProductFormProps) {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const form = useProductForm(initialData);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const generateKey = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const toNumber = (v: any) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };

  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);

    try {
      const hasVariants = form.variants.length > 0;

      const hasSaleTime =
        Boolean(form.saleStart) && Boolean(form.saleEnd);

      const hasSalePrice =
        form.salePrice !== "" &&
        form.salePrice !== null &&
        form.salePrice !== undefined &&
        !Number.isNaN(Number(form.salePrice));

      /* ================= VALIDATION ================= */

      if (!form.name.trim()) {
        alert(t.invalid_product_name);
        return;
      }

      if (!form.images.length) {
        alert(t.product_need_image);
        return;
      }

      /* ================= SHIPPING ================= */

      const shippingRatesPayload: ShippingRatePayload[] =
        Object.entries(form.shippingRates).map(([zone, price]) => ({
          zone,
          price: Number(price || 0),
          domestic_country_code:
            zone === "domestic"
              ? form.primaryShippingCountry || null
              : null,
        }));

      /* ================= VARIANTS ================= */

      const normalizedVariants: ProductVariant[] =
        form.variants.map((v) => ({
          ...v,
          saleEnabled: Boolean(v.saleEnabled),
          salePrice:
            v.saleEnabled && v.salePrice !== null
              ? Number(v.salePrice)
              : null,
          saleStock: v.saleEnabled ? Number(v.saleStock || 0) : 0,
        }));

      const hasVariantSale = normalizedVariants.some(
        (v) => v.saleEnabled && Number(v.salePrice) > 0
      );

      /* ================= PAYLOAD ================= */

      const payload = {
        id: typeof form.id === "string" ? form.id : undefined,
        name: form.name,

        categoryId:
          form.categoryId !== "" ? Number(form.categoryId) : null,

        description: form.description,
        detail: form.detail,
        images: form.images,
        thumbnail: form.images[0] || "",

        isActive: form.isActive,

        shippingRates: shippingRatesPayload,

        price: hasVariants ? undefined : Number(form.price),
        stock: hasVariants ? undefined : Number(form.stock || 0),

        saleEnabled: hasVariants
          ? hasVariantSale
          : form.saleEnabled && hasSaleTime && hasSalePrice,

        salePrice:
          hasVariants
            ? null
            : form.salePrice !== ""
              ? Number(form.salePrice)
              : null,

        saleStock:
          hasVariants || !form.saleEnabled
            ? 0
            : Number(form.saleStock || 0),

        saleStart: hasSaleTime
          ? toUTCFromInput(form.saleStart)
          : null,

        saleEnd: hasSaleTime
          ? toUTCFromInput(form.saleEnd)
          : null,

        variants: normalizedVariants,

        idempotencyKey: generateKey(),
      };

      await onSubmit(payload);
    } catch (err) {
      console.error(err);
      alert(t.submit_failed);
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     UI GUARD
  ========================= */

  if (loading || !user) {
    return <div className="p-8 text-center">{t.loading}</div>;
  }

  /* =========================
     UI
  ========================= */

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* CATEGORY */}
      <select
        value={form.categoryId ?? ""}
        onChange={(e) => form.setCategoryId(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">{t.select_category}</option>

        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {t[c.key as keyof typeof t] || c.key}
          </option>
        ))}
      </select>

      {/* NAME */}
      <input
        value={form.name}
        onChange={(e) => form.setName(e.target.value)}
        className="w-full border p-2 rounded"
      />

      {/* PRICE */}
      {form.variants.length === 0 && (
        <>
          <input
            type="number"
            value={form.price}
            onChange={(e) =>
              form.setPrice(
                e.target.value ? Number(e.target.value) : ""
              )
            }
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            value={form.stock}
            onChange={(e) =>
              form.setStock(toNumber(e.target.value))
            }
            className="w-full border p-2 rounded"
          />

          {/* SALE TOGGLE */}
          <label className="flex justify-between border p-2 rounded">
            <span>{t.enable_sale}</span>

            <input
              type="checkbox"
              checked={form.saleEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                form.setSaleEnabled(checked);

                if (!checked) {
                  form.setSalePrice("");
                  form.setSaleStock(0);
                  form.setSaleStart("");
                  form.setSaleEnd("");
                }
              }}
            />
          </label>

          {/* SALE PRICE */}
          {form.saleEnabled && (
            <input
              type="number"
              value={form.salePrice ?? ""}
              onChange={(e) =>
                form.setSalePrice(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              className="w-full border p-2 rounded"
            />
          )}

          {/* SALE STOCK */}
          {form.saleEnabled && (
            <input
              type="number"
              value={form.saleStock}
              onChange={(e) =>
                form.setSaleStock(Number(e.target.value))
              }
              className="w-full border p-2 rounded"
            />
          )}
        </>
      )}

      {/* ✅ FIX: ALWAYS SHOW SALE TIME */}
      <div className="grid grid-cols-2 gap-2">
        <input
          type="datetime-local"
          value={form.saleStart}
          onChange={(e) => form.setSaleStart(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="datetime-local"
          value={form.saleEnd}
          onChange={(e) => form.setSaleEnd(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {/* SHIPPING */}
      <ShippingRates
        shippingRates={form.shippingRates}
        setShippingRates={form.setShippingRates}
        primaryShippingCountry={form.primaryShippingCountry}
        setPrimaryShippingCountry={form.setPrimaryShippingCountry}
      />

      {/* ACTIVE */}
      <label className="flex justify-between border p-3 rounded">
        <span>{t.active}</span>
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => form.setIsActive(e.target.checked)}
        />
      </label>

      {/* VARIANTS */}
      <VariantEditor
        variants={form.variants}
        setVariants={form.setVariants}
      />

      {/* DESCRIPTION */}
      <textarea
        value={form.description}
        onChange={(e) => form.setDescription(e.target.value)}
        className="w-full border p-2 rounded"
      />

      {/* DETAIL */}
      <textarea
        value={form.detail}
        onChange={(e) => form.setDetail(e.target.value)}
        className="w-full border p-2 rounded"
      />

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-orange-500 text-white rounded"
      >
        {submitting ? t.submitting : t.submit_product}
      </button>
    </form>
  );
}
