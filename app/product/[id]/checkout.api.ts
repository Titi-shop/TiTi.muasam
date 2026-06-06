"use client";

import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

/* =========================
   PREVIEW FETCHER (NO TYPE)
========================= */

export const previewFetcher = async ([url, payload]) => {
  console.log("[API PREVIEW CALL]", { url, payload });

  const res = await apiAuthFetch(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log("[API PREVIEW STATUS]", res.status);

  let data;

  try {
    data = await res.json();
  } catch (e) {
    console.error("[API PREVIEW INVALID JSON]", e);
    throw new Error("INVALID_RESPONSE");
  }

  if (!res.ok) {
    console.error("[API PREVIEW FAILED]", data);

    const errorMessage =
      data &&
      typeof data === "object" &&
      typeof data.error === "string"
        ? data.error
        : "PREVIEW_FAILED";

    throw new Error(errorMessage);
  }

  if (!data || typeof data !== "object") {
    throw new Error("INVALID_PREVIEW_RESPONSE");
  }

  console.log("[API PREVIEW SUCCESS]", data);

  return data;
};

/* =========================
   FETCH DEFAULT ADDRESS (NO TYPE)
========================= */

export async function fetchDefaultAddress() {
  try {
    const res = await apiAuthFetch("/api/address");

    if (!res.ok) return null;

    const data = await res.json();

    const items = Array.isArray(data?.items)
      ? data.items
      : [];

    const def = items.find((a) => a.is_default);

    if (!def) return null;

    return {
      id: def.id,
      name: def.full_name,
      phone: def.phone,
      address_line: def.address_line,
      region: def.region,
      district: def.district || "",
      ward: def.ward || "",
      country: def.country || "",
      postal_code: def.postal_code ?? null,
    };
  } catch (err) {
    console.error("[ADDRESS LOAD ERROR]", err);
    return null;
  }
}

/* =========================
   HELPER
========================= */

export function getCountryDisplay(country) {
  if (!country) return "";
  return String(country).toUpperCase();
}
