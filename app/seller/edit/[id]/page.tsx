"use client";

import { useEffect, useState, FormEvent } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
   TYPES
========================= */
interface ProductData {
  id: string | number;
  name: string;
  price: number;
  description: string;
  detail?: string | null;
  categoryId: number | null;
  salePrice?: number | null;
  saleStart?: string | null;
  saleEnd?: string | null;
  images: string[];
  detailImages?: string[];
}

interface Category {
  id: number;
  key: string;
}

interface MessageState {
  text: string;
  type: "success" | "error" | "";
}

/* =========================
   PAGE
========================= */
export default function EditProductPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [detail, setDetail] = useState("");

  const [salePrice, setSalePrice] = useState<number | "">("");
  const [saleStart, setSaleStart] = useState("");
  const [saleEnd, setSaleEnd] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>({
    text: "",
    type: "",
  });

  /* =========================
     AUTH GUARD
  ========================= */
  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "seller" && user.role !== "admin")) {
      router.replace("/account");
    }
  }, [authLoading, user, router]);

  /* =========================
     LOAD CATEGORIES
  ========================= */
  useEffect(() => {
    apiAuthFetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, []);

  /* =========================
     LOAD PRODUCT
  ========================= */
  useEffect(() => {
    if (!id) return;

    apiAuthFetch("/api/products")
      .then((r) => r.json())
      .then((list: ProductData[]) => {
        const p = list.find((x) => String(x.id) === String(id));
        if (!p) {
          setMessage({ text: t.product_not_found, type: "error" });
          return;
        }

        setProduct(p);
        setImages(p.images || []);
        setDetailImages(p.detailImages || []);
        setDetail(p.detail || "");
        setSalePrice(p.salePrice ?? "");
        setSaleStart(p.saleStart || "");
        setSaleEnd(p.saleEnd || "");
      });
  }, [id, t]);

  /* =========================
     IMAGE UPLOAD
  ========================= */
  async function uploadImages(
    files: File[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);

      const res = await apiAuthFetch("/api/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (data?.url) setter((prev) => [...prev, data.url]);
    }
  }

  function removeImage(
    index: number,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  /* =========================
     SAVE
  ========================= */
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;

    if (salePrice && (!saleStart || !saleEnd)) {
      setMessage({
        text: t.need_sale_date,
        type: "error",
      });
      return;
    }

    const form = e.currentTarget;

    const payload = {
      id: product.id,
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      price: Number(
        (form.elements.namedItem("price") as HTMLInputElement).value
      ),
      salePrice: salePrice || null,
      saleStart: salePrice ? saleStart : null,
      saleEnd: salePrice ? saleEnd : null,
      description: (
        form.elements.namedItem("description") as HTMLTextAreaElement
      ).value,
      detail,
      images,
      detailImages,
      categoryId: Number(
        (form.elements.namedItem("categoryId") as HTMLSelectElement).value
      ),
    };

    setSaving(true);
    await apiAuthFetch("/api/products", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    router.push("/seller/stock");
  }

  if (!product) {
    return <p className="text-center mt-10">⏳ {t.loading}</p>;
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="max-w-2xl mx-auto p-4 pb-32">
      <h1 className="text-xl font-bold text-center mb-4 text-[#ff6600]">
        ✏️ {t.edit_product}
      </h1>

      {message.text && (
        <p className="text-center text-red-600 mb-3">{message.text}</p>
      )}

      {/* IMAGES */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {images.map((url, i) => (
          <div key={url} className="relative h-28">
            <Image src={url} alt="" fill className="object-cover rounded" />
            <button
              type="button"
              onClick={() => removeImage(i, setImages)}
              className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 rounded"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <select
          name="categoryId"
          defaultValue={product.categoryId || ""}
          className="w-full border p-2 rounded"
        >
          <option value="">{t.select_category}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t[c.key] ?? c.key}
            </option>
          ))}
        </select>

        <input
          name="name"
          defaultValue={product.name}
          className="w-full border p-2 rounded"
        />

        <input
          name="price"
          type="number"
          step="any"
          defaultValue={product.price}
          placeholder={t.price_pi}
          className="w-full border p-2 rounded"
        />

        {/* SALE PRICE */}
        <input
          type="number"
          step="any"
          placeholder={t.sale_price_optional}
          value={salePrice}
          onChange={(e) =>
            setSalePrice(e.target.value ? Number(e.target.value) : "")
          }
          className="w-full border p-2 rounded"
        />

        {/* SALE TIME (NGANG – NGẮN) */}
        {salePrice && (
          <div className="space-y-1">
            <p className="text-sm text-gray-600 font-medium">
              📅 {t.sale_time}
            </p>
            <div className="flex gap-3">
              <input
                type="datetime-local"
                value={saleStart}
                onChange={(e) => setSaleStart(e.target.value)}
                className="border p-2 rounded w-auto max-w-[220px]"
              />
              <input
                type="datetime-local"
                value={saleEnd}
                onChange={(e) => setSaleEnd(e.target.value)}
                className="border p-2 rounded w-auto max-w-[220px]"
              />
            </div>
          </div>
        )}

        <textarea
          name="description"
          defaultValue={product.description}
          placeholder={t.description}
          className="w-full border p-2 rounded min-h-[80px]"
        />

        <textarea
          placeholder={t.product_detail}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className="w-full border p-2 rounded min-h-[120px]"
        />

        <button
          disabled={saving}
          className="w-full bg-[#ff6600] text-white py-3 rounded-lg font-semibold"
        >
          {saving ? t.saving : t.save_changes}
        </button>
      </form>
    </main>
  );
}
