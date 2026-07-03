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
  markWalletAddressVerified,
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
   HELPERS
===================================================== */

function parseCreateBody(
  body: unknown
) {

  const data =
    body as CreateBody;

  const address =
    typeof data.address ===
    "string"
      ? data.address.trim()
      : "";

  const label =
    typeof data.label ===
    "string"
      ? data.label.trim()
      : null;

  return {

    walletId:
      data.wallet_id,

    address,

    label,

  };

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

  try {

    log(
      "CREATE_START",
      {
        userId:
          input.userId,
      }
    );

    /* ===============================================
       BODY
    =============================================== */

    log(
      "BODY_PARSE_START"
    );

    const parsed =
      parseCreateBody(
        input.body
      );

    log(
      "BODY_PARSE_DONE",
      {
        hasAddress:
          !!parsed.address,

        hasLabel:
          !!parsed.label,
      }
    );

    if (
      !parsed.address
    ) {

      err(
        "INVALID_ADDRESS",
        {
          userId:
            input.userId,
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
          parsed.address.substring(
            0,
            8
          ),

        addressLength:
          parsed.address.length,
      }
    );

    /* ===============================================
       RPC VERIFY
    =============================================== */

    log(
      "RPC_VERIFY_START",
      {
        addressPrefix:
          parsed.address.substring(
            0,
            8
          ),
      }
    );

    const rpc =
      await verifyPiWallet(
        parsed.address
      );

    log(
      "RPC_VERIFY_DONE",
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

    if (
      !walletRecord
    ) {

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
       CREATE ADDRESS
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

        address:
          parsed.address,

        label:
          parsed.label,

        is_default:
          true,

        created_by:
          input.userId,

      });

    log(
      "DB_CREATE_DONE",
      {
        walletAddressId:
          wallet.id,
      }
    );

    let result =
      wallet;
    /* ===============================================
       UPDATE VALIDATION
    =============================================== */

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

      const valid =
        await markWalletAddressValid(
          wallet.id
        );

      log(
        "VALIDATION_VALID"
      );

      const verified =
        await markWalletAddressVerified(
          wallet.id
        );

      log(
        "VERIFICATION_DONE"
      );

      result =
        verified ??
        valid ??
        wallet;

    } else {

      const invalid =
        await markWalletAddressInvalid(
          wallet.id,
          "ACCOUNT_NOT_FOUND"
        );

      log(
        "VALIDATION_INVALID"
      );

      result =
        invalid ??
        wallet;

    }

    /* ===============================================
       SUCCESS
    =============================================== */

    log(
      "CREATE_SUCCESS",
      {
        walletAddressId:
          result.id,

        userId:
          input.userId,

        validationStatus:
          result.validation_status,

        verified:
          result.is_verified,
      }
    );

    return result;

  } catch (
    error
  ) {

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
  
