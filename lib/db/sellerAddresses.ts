      import { query } from "@/lib/db";

/* =========================================================
   LOG HELPER
========================================================= */

const log = (action: string, data?: any) => {
  console.log(
    `[seller_addresses] ${action}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
};

const logError = (action: string, error: any) => {
  console.error(
    `[seller_addresses ERROR] ${action}`,
    error?.message || error,
    error
  );
};

/* =========================================================
   GET ADDRESSES
========================================================= */

export async function getSellerAddresses(sellerId: string) {
  try {
    log("GET_ADDRESSES_START", { sellerId });

    const res = await query(
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
   CREATE ADDRESS
========================================================= */

export async function createSellerAddress(payload: any) {
  try {
    log("CREATE_ADDRESS_START", {
      seller_id: payload?.seller_id,
    });

    const res = await query(
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
        payload.province,
        payload.district,
        payload.ward,
        payload.address_line,
        payload.postal_code,
        payload.is_default ?? false,
      ]
    );

    log("CREATE_ADDRESS_SUCCESS", {
      id: res.rows?.[0]?.id,
    });

    return res.rows[0];
  } catch (error) {
    logError("CREATE_ADDRESS_FAIL", error);
    throw error;
  }
}

/* =========================================================
   UPDATE ADDRESS
========================================================= */

export async function updateSellerAddress(
  id: string,
  payload: any
) {
  try {
    log("UPDATE_ADDRESS_START", { id });

    const res = await query(
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
        payload.province,
        payload.district,
        payload.ward,
        payload.address_line,
        payload.postal_code,
        payload.is_default ?? false,
        id,
      ]
    );

    log("UPDATE_ADDRESS_SUCCESS", { id });

    return res.rows[0];
  } catch (error) {
    logError("UPDATE_ADDRESS_FAIL", error);
    throw error;
  }
}

/* =========================================================
   DELETE ADDRESS
========================================================= */

export async function deleteSellerAddress(id: string) {
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
