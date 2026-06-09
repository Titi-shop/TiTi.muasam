"use client";

import useSWR from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { countries } from "@/data/countries";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { getPiAccessToken } from "@/lib/piAuth";
import { useAuth } from "@/context/AuthContext";

import AddressForm, {
  AddressFormData,
} from "@/components/address/AddressForm";

/* ================= TYPES ================= */

interface Address {
  id: string;
  full_name: string;
  phone: string;

  country: string;
  region: string;
  district?: string;
  ward?: string;

  address_line: string;
  postal_code?: string;

  label: "home" | "office" | "other";

  is_default: boolean;
}

/* ================= FETCHER ================= */

const fetcher = async () => {
  const token = await getPiAccessToken();

  const res = await fetch("/api/address", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("FETCH_FAILED");

  return res.json();
};

/* ================= PAGE ================= */

export default function CustomerAddressPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const { data, mutate, isLoading } = useSWR(
    user ? "/api/address" : null,
    fetcher
  );

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<AddressFormData>({
    full_name: "",
    phone: "",

    country: "VN",
    region: "",
    district: "",
    ward: "",

    address_line: "",
    postal_code: "",
  });

  const addresses = data?.items ?? [];

  /* ================= HELPERS ================= */

  const getCountryDisplay = (code: string) => {
    const c = countries.find((x) => x.code === code);
    return c ? `${c.flag} ${c.name}` : code;
  };

  /* ================= EDIT ================= */

  const handleEdit = (a: Address) => {
    setForm({
      full_name: a.full_name,
      phone: a.phone,

      country: a.country,
      region: a.region || "",
      district: a.district || "",
      ward: a.ward || "",

      address_line: a.address_line,
      postal_code: a.postal_code || "",
    });

    setEditingId(a.id);
    setShowForm(true);
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    setSaving(true);

    try {
      const token = await getPiAccessToken();

      await fetch("/api/address", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          id: editingId,
        }),
      });

      await mutate();

      setShowForm(false);
      setEditingId(null);

      setForm({
        full_name: "",
        phone: "",
        country: "VN",
        region: "",
        district: "",
        ward: "",
        address_line: "",
        postal_code: "",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ================= DEFAULT ================= */

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

    mutate();
  };

  /* ================= DELETE ================= */

  const deleteAddress = async (id: string) => {
    if (!confirm(t.confirm_delete || "Delete?")) return;

    const token = await getPiAccessToken();

    await fetch(`/api/address?id=${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    mutate();
  };

  /* ================= UI ================= */

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-28">

      {/* LIST */}
      <div className="mx-auto max-w-md space-y-4 px-4 pt-20">

        {isLoading ? (
          <div className="p-6 text-center text-sm text-[var(--text-muted)]">
            {t.loading}
          </div>
        ) : addresses.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-muted)]">
            {t.no_address}
          </div>
        ) : (
          addresses.map((a) => (
            <div key={a.id} className="rounded-2xl border bg-[var(--card-bg)] p-4">

              <p className="font-semibold">{a.full_name}</p>

              <p className="text-sm text-[var(--text-muted)]">{a.phone}</p>

              <p className="mt-2 text-sm">{a.address_line}</p>

              <p className="text-sm text-[var(--text-muted)]">
                {[a.ward, a.district, a.region].filter(Boolean).join(", ")}
              </p>

              <p className="text-sm text-[var(--text-muted)]">
                {getCountryDisplay(a.country)}
              </p>

              <div className="mt-3 flex gap-2">
                <button onClick={() => handleEdit(a)}>Edit</button>

                {!a.is_default && (
                  <button onClick={() => setDefault(a.id)}>Set Default</button>
                )}

                <button onClick={() => deleteAddress(a.id)}>Delete</button>
              </div>
            </div>
          ))
        )}

        {/* ADD */}
        <button
          onClick={() => {
            setEditingId(null);
            setForm({
              full_name: "",
              phone: "",
              country: "VN",
              region: "",
              district: "",
              ward: "",
              address_line: "",
              postal_code: "",
            });
            setShowForm(true);
          }}
        >
          + {t.add_address}
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />

          <div className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[var(--card-bg)]">
            <AddressForm
              form={form}
              setForm={setForm}
              onSubmit={handleSave}
              saving={saving}
            />
          </div>
        </>
      )}
    </main>
  );
}
