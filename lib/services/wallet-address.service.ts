// =====================================================
// lib/services/wallet-address.service.ts
// =====================================================
import {
  verifyPiWallet,
} from "@/lib/rpc/wallet.rpc";

import {
  createWalletAddress,
  getWalletAddressesByUser,
  markWalletAddressValid,
  markWalletAddressInvalid,
} from "@/lib/db/wallet-addresses";
import {
  getWalletRecordByUserId,
} from "@/lib/db/wallet";
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
log(
  "DB_LIST_START",
  {
    userId,
  }
);
  const rows =
    await getWalletAddressesByUser(
      userId
    );
log(
  "DB_LIST_DONE",
  {
    userId,
    total: rows.length,
  }
);

log(
  "LIST_SUCCESS",
  {
    userId,
    total: rows.length,
  }
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

  try {

    log(
      "CREATE_START",
      {
        userId: input.userId,
      }
    );

    log("BODY_PARSE_START");

    const body =
      input.body as CreateBody;

    const address =
      typeof body.address === "string"
        ? body.address.trim()
        : "";

    const label =
      typeof body.label === "string"
        ? body.label.trim()
        : null;

    log(
      "BODY_PARSE_DONE",
      {
        hasAddress: !!address,
        hasLabel: !!label,
      }
    );

    if (!address) {

      err(
        "INVALID_ADDRESS",
        {
          userId: input.userId,
        }
      );

      throw new Error(
        "INVALID_ADDRESS"
      );

    }

    log(
      "INPUT_OK",
      {
        addressPrefix:
          address.substring(0, 8),

        addressLength:
          address.length,
      }
    );

    /* ===============================================
       RPC (NEXT STEP)
    =============================================== */

    log(
  "RPC_VALIDATE_START",
  {
    addressPrefix:
      address.substring(0, 8),
  }
);

const rpc =
  await verifyPiWallet(
    address
  );

log(
  "RPC_VALIDATE_DONE",
  {
    exists:
      rpc.exists,

    rpcReachable:
      rpc.rpcReachable,

    balance:
      rpc.balance,

    sequence:
      rpc.sequence,
  }
);

if (
  !rpc.rpcReachable
) {

  throw new Error(
    "RPC_UNREACHABLE"
  );

}
/* ===============================================
   LOAD USER WALLET
=============================================== */

log(
  "LOAD_WALLET_START",
  {
    userId:
      input.userId,
  }
);

const walletRecord =
  await getWalletRecordByUserId(
    input.userId
  );

if (!walletRecord) {

  err(
    "WALLET_NOT_FOUND",
    {
      userId:
        input.userId,
    }
  );

  throw new Error(
    "WALLET_NOT_FOUND"
  );

}

log(
  "LOAD_WALLET_DONE",
  {
    walletId:
      walletRecord.id,
  }
);
    /* ===============================================
       DB
    =============================================== */

    log(
      "DB_CREATE_START",
      {
        userId:
          input.userId,
      }
    );

    const wallet =
      await createWalletAddress({

        wallet_id:
      walletRecord.id,

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
  "VALIDATION_START",
  {
    walletAddressId:
      wallet.id,
  }
);

if (
  rpc.exists
) {

  await markWalletAddressValid(
    wallet.id
  );

  log(
    "VALIDATION_VALID"
  );

} else {

  await markWalletAddressInvalid(
    wallet.id,
    "ACCOUNT_NOT_FOUND"
  );

  log(
    "VALIDATION_INVALID"
  );

}
    log(
      "DB_CREATE_DONE",
      {
        walletAddressId:
          wallet.id,
      }
    );

    log(
      "CREATE_SUCCESS",
      {
        walletAddressId:
          wallet.id,

        userId:
          input.userId,

        validationStatus:
          wallet.validation_status,

        verified:
          wallet.is_verified,
      }
    );

    return wallet;

  } catch (error) {

    err(
      "CREATE_FAILED",
      {
        userId:
          input.userId,

        error,
      }
    );

    throw error;

  }

}
