"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { countries } from "@/data/countries";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";

/* =========================
   TYPES
========================= */
interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  country: string;
  countryCode: string;
  is_default: boolean;
}

const emptyForm: Omit<Address, "id" | "is_default"> = {
  name: "",
  phone: "",
  address: "",
  country: "",
  countryCode: "",
};

export default function CustomerAddressPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /* =========================
     LOAD
  ========================= */
  const loadAddresses = async () => {
    const token = await getPiAccessToken();
    const res = await fetch("/api/address", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setAddresses(data.items || []);
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  /* =========================
     HANDLERS
  ========================= */
  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find((c) => c.code === e.target.value);
    if (!selected) return;
    setForm({
      ...form,
      country: selected.code,
      countryCode: selected.dial,
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) {
      setMessage("⚠️ " + t.fill_all_fields);
      return;
    }

    setSaving(true);
    try {
      const token = await getPiAccessToken();
      await fetch("/api/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      setShowForm(false);
      setForm(emptyForm);
      await loadAddresses();
      setMessage("✅ " + t.address_saved);
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id: string) => {
    const token = await getPiAccessToken();
    await fetch("/api/address", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    loadAddresses();
  };

  const deleteAddress = async (id: string) => {
    if (!confirm(t.confirm_delete || "Xoá địa chỉ này?")) return;

    const token = await getPiAccessToken();
    await fetch(`/api/address?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadAddresses();
  };

  /* =========================
     UI
  ========================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-28">
      {/* HEADER */}
      <div className="fixed top-0 inset-x-0 bg-white border-b z-20">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => router.back()}
            className="text-orange-600 font-bold"
          >
            ←
          </button>
          <h1 className="flex-1 text-center font-semibold">
            {t.shipping_address}
          </h1>
        </div>
      </div>

      {/* LIST */}
      <div className="max-w-md mx-auto px-4 pt-20 space-y-4">
        {addresses.map((a) => (
          <div
            key={a.id}
            className={`rounded-xl bg-white p-4 shadow border ${
              a.is_default ? "border-orange-500" : "border-gray-200"
            }`}
          >
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{a.name}</p>
                <p className="text-sm text-gray-600">
                  {a.countryCode} {a.phone}
                </p>
                <p className="text-sm text-gray-500 mt-1">{a.address}</p>
              </div>

              {a.is_default && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                  {t.default || "Mặc định"}
                </span>
              )}
            </div>

            <div className="flex gap-4 mt-3 text-sm">
              {!a.is_default && (
                <button
                  onClick={() => setDefault(a.id)}
                  className="text-orange-600 font-medium"
                >
                  ⭐ {t.set_default || "Đặt mặc định"}
                </button>
              )}

              <button
                onClick={() => deleteAddress(a.id)}
                className="text-red-500 font-medium"
              >
                 {t.delete || "Xoá"}
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-orange-400 rounded-xl text-orange-600 font-semibold bg-white"
        >
           {t.add_address || "Thêm địa chỉ"}
        </button>

        {message && (
          <p className="text-center text-sm text-gray-500">{message}</p>
        )}
      </div>

      {/* FORM SHEET */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-40" />
      )}

      <div
        className={`fixed bottom-0 inset-x-0 bg-white rounded-t-2xl z-50 transition-transform duration-300 ${
          showForm ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "70vh" }}
      >
        <div className="px-4 pt-4 pb-24 overflow-y-auto h-full">
          <h2 className="text-lg font-semibold text-center mb-4">
            {t.add_address || "Thêm địa chỉ"}
          </h2>

          <select
            className="w-full border rounded-lg p-2 mb-3"
            value={form.country}
            onChange={handleCountryChange}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.dial})
              </option>
            ))}
          </select>

          <input
            className="w-full border rounded-lg p-2 mb-3"
            placeholder={t.full_name}
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            className="w-full border rounded-lg p-2 mb-3"
            placeholder={t.phone_number}
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <textarea
            className="w-full border rounded-lg p-2"
            rows={3}
            placeholder={t.address}
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />
        </div>

        {/* SAVE */}
        <div className="absolute bottom-4 left-0 right-0 bg-white border-t p-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-orange-600 text-white font-semibold"
          >
            {saving ? t.saving : t.save_address}
          </button>
        </div>
      </div>
    </main>
  );
}
