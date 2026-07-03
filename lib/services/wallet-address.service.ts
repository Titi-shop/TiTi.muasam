// =====================================================
// lib/services/wallet-address.service.ts
// =====================================================

import {
  createWalletAddress,
  getWalletAddressesByUser,
} from "@/lib/db/wallet-addresses";

/* =====================================================
   TYPES
===================================================== */

type CreateWalletAddressFlowInput = {
  userId: string;

  body: unknown;
};

type CreateBody = {
  wallet_id?: string;

  address?: string;

  label?: string;
};

/* =====================================================
   LOG
===================================================== */

function log(
  tag: string,
  data?: unknown
) {
  console.log(
    `[WALLET_ADDRESS] ${tag}`,
    data ?? ""
  );
}

function err(
  tag: string,
  data?: unknown
) {
  console.error(
    `[WALLET_ADDRESS] ${tag}`,
    data ?? ""
  );
}

/* =====================================================
   LIST
===================================================== */

export async function listWalletAddressesFlow(
  userId: string
) {

  log(
    "LIST_START",
    {
      userId,
    }
  );

  const rows =
    await getWalletAddressesByUser(
      userId
    );

  log(
    "LIST_DONE",
    {
      userId,
      total:
        rows.length,
    }
  );

  return rows;
}

/* =====================================================
   CREATE
===================================================== */

export async function createWalletAddressFlow(
  input: CreateWalletAddressFlowInput
) {

  log(
    "CREATE_START",
    {
      userId:
        input.userId,
    }
  );

  /* ===================================================
     BODY
  =================================================== */

  const body =
    input.body as CreateBody;

  const address =
    typeof body.address ===
    "string"
      ? body.address.trim()
      : "";

  const label =
    typeof body.label ===
    "string"
      ? body.label.trim()
      : null;

  if (!address) {

    log(
      "INVALID_ADDRESS"
    );

    throw new Error(
      "INVALID_ADDRESS"
    );
  }

  log(
    "INPUT_OK",
    {
      address,
    }
  );

  /* ===================================================
     RPC VALIDATE
     (next step)
  =================================================== */

  log(
    "RPC_VALIDATE_SKIP"
  );

  /*
  Sau sẽ thay bằng

  log("RPC_VALIDATE_START");

  await validatePiWalletAddress(
      address
  );

  log("RPC_VALIDATE_DONE");
  */

  /* ===================================================
     DB
  =================================================== */

  log(
    "DB_CREATE_START"
  );

  const wallet =
    await createWalletAddress({

      wallet_id:
        body.wallet_id,

      user_id:
        input.userId,

      network:
        "PI",

      address,

      label,

      is_default:
        true,

      created_by:
        input.userId,

    });

  log(
    "DB_CREATE_DONE",
    {
      id:
        wallet.id,
    }
  );

  log(
    "CREATE_SUCCESS",
    {
      id:
        wallet.id,
    }
  );

  return wallet;

}
