"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, Edit3, Save, X } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";
import { getPiAccessToken } from "@/lib/piAuth";

/* ================= TYPES ================= */

interface ProfileData {
  display_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  province: string | null;
  country: string | null;
  avatar: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<ProfileData | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ================= LOAD PROFILE ================= */

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const loadProfile = async () => {
      try {
        const token = await getPiAccessToken();

        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) throw new Error("LOAD_FAILED");

        const raw: unknown = await res.json();
        const data =
          typeof raw === "object" && raw !== null && "profile" in raw
            ? (raw as { profile: ProfileData }).profile
            : (raw as ProfileData);

        const normalized: ProfileData = {
          display_name: data.display_name ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          address: data.address ?? null,
          province: data.province ?? null,
          country: data.country ?? null,
          avatar: data.avatar ?? null,
        };

        setProfile(normalized);
        setForm(normalized);
      } catch {
        setError(t.profile_error_loading);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authLoading, user, t]);

  /* ================= AVATAR UPLOAD ================= */

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    setSuccess(null);
    setError(null);

    try {
      const token = await getPiAccessToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data: unknown = await res.json();
      if (!res.ok) throw new Error("UPLOAD_FAILED");

      if (
        typeof data === "object" &&
        data !== null &&
        "avatar" in data &&
        typeof (data as { avatar: unknown }).avatar === "string"
      ) {
        const newAvatar = (data as { avatar: string }).avatar;

        setProfile((prev) =>
          prev ? { ...prev, avatar: newAvatar } : prev
        );

        setForm((prev) =>
          prev ? { ...prev, avatar: newAvatar } : prev
        );

        setPreview(null);
        setSuccess(t.profile_avatar_updated);
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch {
      setError(t.upload_failed);
    } finally {
      URL.revokeObjectURL(objectUrl);
      setUploading(false);
    }
  };

  /* ================= SAVE PROFILE ================= */

  const handleSave = async () => {
    if (!form) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await getPiAccessToken();

      const res = await fetch("/api/profile", {
  method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("SAVE_FAILED");

      setProfile(form);
      setEditMode(false);
      setSuccess(t.saved_successfully);
      setTimeout(() => setSuccess(null), 2000);
    } catch {
      setError(t.save_failed);
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */

  if (loading || authLoading) {
    return <p className="p-4 text-center">{t.loading_profile}</p>;
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-28">
      <div className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow p-6">

        {/* ===== AVATAR ===== */}
        <div className="relative w-28 h-28 mx-auto mb-4">
          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              fill
              className="rounded-full object-cover border-4 border-orange-500"
            />
          ) : profile?.avatar ? (
            <Image
              src={profile.avatar}
              alt="Avatar"
              fill
              className="rounded-full object-cover border-4 border-orange-500"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-orange-200 flex items-center justify-center text-4xl font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}

          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer">
            <Upload size={16} className="text-white" />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        <h2 className="text-center font-semibold mb-4">
          @{user?.username}
        </h2>

        {uploading && (
          <p className="text-center text-sm text-gray-500">
            {t.uploading}
          </p>
        )}
        {success && (
          <p className="text-center text-sm text-green-600">
            ✓ {success}
          </p>
        )}
        {error && (
          <p className="text-center text-sm text-red-500">
            {error}
          </p>
        )}

        {/* ===== INFO ===== */}
        <div className="space-y-3 mt-4">

          {(
            [
              ["display_name", t.app_name],
              ["email", t.email],
              ["phone", t.phone],
              ["address", t.address],
              ["province", t.province],
              ["country", t.country],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex justify-between border-b pb-2">
              <span className="text-gray-500">{label}</span>

              {editMode ? (
                <input
                  className="text-right outline-none"
                  value={form?.[key] ?? ""}
                  onChange={(e) =>
                    setForm((prev) =>
                      prev
                        ? { ...prev, [key]: e.target.value }
                        : prev
                    )
                  }
                />
              ) : (
                <span>
                  {profile?.[key] && profile[key] !== ""
                    ? profile[key]
                    : t.not_set}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div className="flex justify-center mt-6 gap-3">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-orange flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? t.saving : t.save}
              </button>

              <button
                onClick={() => {
                  setForm(profile);
                  setEditMode(false);
                }}
                className="bg-gray-300 px-4 py-2 rounded flex items-center gap-2"
              >
                <X size={16} /> {t.cancel}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="btn-orange flex items-center gap-2"
            >
              <Edit3 size={16} /> {t.edit}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
