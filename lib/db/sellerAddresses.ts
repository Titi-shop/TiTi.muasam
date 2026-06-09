import { query } from "@/lib/db";

export async function getSellerAddresses(sellerId: string) {
  const res = await query(
    `SELECT *
     FROM seller_addresses
     WHERE seller_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [sellerId]
  );

  return res.rows;
}

export async function createSellerAddress(payload: any) {
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

  return res.rows[0];
}

export async function updateSellerAddress(id: string, payload: any) {
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

  return res.rows[0];
}

export async function deleteSellerAddress(id: string) {
  await query(
    `DELETE FROM seller_addresses WHERE id = $1`,
    [id]
  );

  return true;
}
