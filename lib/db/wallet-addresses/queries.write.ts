import { query } from "@/lib/db";

import { mapWalletAddress } from "./mapper";
import type { CreateWalletAddressInput } from "./types";

/* =========================
   CREATE WALLET ADDRESS
========================= */

export async function createWalletAddress(
  data: CreateWalletAddressInput
) {
  if (data.is_default) {
    await query(
      `
      UPDATE wallet_addresses
      SET
        is_default = false,
        updated_at = NOW()
      WHERE user_id = $1
        AND status = 'active'
      `,
      [data.user_id]
    );
  }

  const res = await query(
    `
    INSERT INTO wallet_addresses (
      wallet_id,
      user_id,
      network,
      address,
      label,
      status,
      is_default,
      validation_status,
      is_verified,
      created_by
    )
    VALUES (
      $1,$2,$3,$4,$5,
      'active',
      $6,
      'pending',
      false,
      $7
    )
    RETURNING *
    `,
    [
      data.wallet_id,
      data.user_id,
      data.network ?? "pi",
      data.address,
      data.label ?? null,
      data.is_default ?? true,
      data.created_by ?? null,
    ]
  );

  return mapWalletAddress(res.rows[0]);
}
