import { query } from "@/lib/db";

import { mapWalletAddress } from "./mapper";

/* =========================
   GET WALLET ADDRESSES
========================= */

export async function getWalletAddressesByUser(
  userId: string
) {
  const res = await query(
    `
    SELECT *
    FROM wallet_addresses
    WHERE user_id = $1
      AND status <> 'deleted'
    ORDER BY
      is_default DESC,
      created_at DESC
    `,
    [userId]
  );

  return res.rows.map(mapWalletAddress);
}

/* =========================
   GET WALLET ADDRESS
========================= */

export async function getWalletAddressById(
  userId: string,
  walletAddressId: string
) {
  const res = await query(
    `
    SELECT *
    FROM wallet_addresses
    WHERE id = $1
      AND user_id = $2
      AND status <> 'deleted'
    LIMIT 1
    `,
    [walletAddressId, userId]
  );

  return res.rows[0]
    ? mapWalletAddress(res.rows[0])
    : null;
}

/* =========================
   GET DEFAULT WALLET
========================= */

export async function getDefaultWalletAddress(
  userId: string
) {
  const res = await query(
    `
    SELECT *
    FROM wallet_addresses
    WHERE user_id = $1
      AND is_default = true
      AND status = 'active'
    LIMIT 1
    `,
    [userId]
  );

  return res.rows[0]
    ? mapWalletAddress(res.rows[0])
    : null;
}

/* =========================
   GET BY ADDRESS
========================= */

export async function getWalletAddressByAddress(
  userId: string,
  address: string
) {
  const res = await query(
    `
    SELECT *
    FROM wallet_addresses
    WHERE user_id = $1
      AND address = $2
      AND status <> 'deleted'
    LIMIT 1
    `,
    [userId, address]
  );

  return res.rows[0]
    ? mapWalletAddress(res.rows[0])
    : null;
}
