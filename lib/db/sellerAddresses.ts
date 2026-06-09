import { query } from "@/lib/db";

/* =========================================================
   TYPES
========================================================= */

export interface SellerAddress {
  id: string;
  seller_id: string;

  full_name: string;
  phone: string;

  country: string;
  province: string | null;
  district: string | null;
  ward: string | null;

  address_line: string;
  postal_code: string | null;

  is_default: boolean;

  created_at?: string;
  updated_at?: string;
}

export type CreateSellerAddressInput = {
  seller_id: string;
  full_name: string;
  phone: string;

  country: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;

  address_line: string;
  postal_code?: string | null;

  is_default?: boolean;
};

export type UpdateSellerAddressInput = {
  full_name: string;
  phone: string;

  country: string;
  province?: string | null;
  district?: string | null;
  ward?: string | null;

  address_line: string;
  postal_code?: string | null;

  is_default?: boolean;
};

/* =========================================================
   LOG HELPERS
========================================================= */

const log = (action: string, data?: unknown) => {
  console.log(
    `[seller_addresses] ${action}`,
    data ? JSON.stringify(data) : ""
  );
};

const logError = (action: string, error: unknown) => {
  console.error(
    `[seller_addresses ERROR] ${action}`,
    error
  );
};

/* =========================================================
   GET
========================================================= */

export async function getSellerAddresses(
  sellerId: string
): Promise<SellerAddress[]> {
  try {
    log("GET_ADDRESSES_START", { sellerId });

    const res = await query<SellerAddress>(
      `SELECT *
       FROM seller_addresses
       WHERE seller_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [sellerId]
    );

    log("GET_ADDRESSES_SUCCESS", {
      count: res.rows.length,
    });

    return res.rows;
  } catch (error) {
    logError("GET_ADDRESSES_FAIL", error);
    throw error;
  }
}

/* =========================================================
   CREATE
========================================================= */

export async function createSellerAddress(
  payload: CreateSellerAddressInput
): Promise<SellerAddress> {
  try {
    log("CREATE_ADDRESS_START", {
      seller_id: payload.seller_id,
    });

    const res = await query<SellerAddress>(
      `INSERT INTO seller_addresses (
        seller_id,
        full_name,
        phone,
        country,
        province,
        district,
        ward,
        address_line,
        postal_code,
        is_default
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        payload.seller_id,
        payload.full_name,
        payload.phone,
        payload.country,
        payload.province ?? null,
        payload.district ?? null,
        payload.ward ?? null,
        payload.address_line,
        payload.postal_code ?? null,
        payload.is_default ?? false,
      ]
    );

    const created = res.rows[0];

    log("CREATE_ADDRESS_SUCCESS", {
      id: created.id,
    });

    return created;
  } catch (error) {
    logError("CREATE_ADDRESS_FAIL", error);
    throw error;
  }
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateSellerAddress(
  id: string,
  payload: UpdateSellerAddressInput
): Promise<SellerAddress> {
  try {
    log("UPDATE_ADDRESS_START", { id });

    const res = await query<SellerAddress>(
      `UPDATE seller_addresses
       SET full_name = $1,
           phone = $2,
           country = $3,
           province = $4,
           district = $5,
           ward = $6,
           address_line = $7,
           postal_code = $8,
           is_default = $9,
           updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        payload.full_name,
        payload.phone,
        payload.country,
        payload.province ?? null,
        payload.district ?? null,
        payload.ward ?? null,
        payload.address_line,
        payload.postal_code ?? null,
        payload.is_default ?? false,
        id,
      ]
    );

    const updated = res.rows[0];

    log("UPDATE_ADDRESS_SUCCESS", { id });

    return updated;
  } catch (error) {
    logError("UPDATE_ADDRESS_FAIL", error);
    throw error;
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function deleteSellerAddress(
  id: string
): Promise<boolean> {
  try {
    log("DELETE_ADDRESS_START", { id });

    await query(
      `DELETE FROM seller_addresses WHERE id = $1`,
      [id]
    );

    log("DELETE_ADDRESS_SUCCESS", { id });

    return true;
  } catch (error) {
    logError("DELETE_ADDRESS_FAIL", error);
    throw error;
  }
          }
