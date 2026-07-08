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
import {
  logger,
  maskId,
} from "@/lib/logger";

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

  logger.info("WALLET_ADDRESS.LIST_START", {
  userId: maskId(userId),
});

  const rows =
    await getWalletAddressesByUser(
      userId
    );

  logger.info("WALLET_ADDRESS.LIST_DONE", {
  userId: maskId(userId),
  total: rows.length,
});

  return rows;

}

/* =====================================================
   CREATE
===================================================== */

export async function createWalletAddressFlow(
  input: CreateWalletAddressFlowInput
) {

  try {

    logger.info("WALLET_ADDRESS.CREATE_START", {
  userId: maskId(input.userId),
});

    /* ===============================================
       BODY
    =============================================== */

    logger.debug("WALLET_ADDRESS.BODY_PARSE_START");

    const parsed =
      parseCreateBody(
        input.body
      );

    logger.debug("WALLET_ADDRESS.BODY_PARSE_DONE", {
  hasAddress: !!parsed.address,
  hasLabel: !!parsed.label,
});

    if (
      !parsed.address
    ) {

      logger.warn("WALLET_ADDRESS.INVALID_ADDRESS", {
  userId: maskId(input.userId),
});

      throw new Error(
        "INVALID_ADDRESS"
      );

    }

    logger.debug("WALLET_ADDRESS.INPUT_OK");

    /* ===============================================
       RPC VERIFY
    =============================================== */

    logger.info("WALLET_ADDRESS.RPC_VERIFY_START");

    const rpc =
      await verifyPiWallet(
        parsed.address
      );

    logger.info("WALLET_ADDRESS.RPC_VERIFY_DONE", {
  exists: rpc.exists,
  rpcReachable: rpc.rpcReachable,
});

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

    logger.debug("WALLET_ADDRESS.LOAD_WALLET_START", {
  userId: maskId(input.userId),
});

    const walletRecord =
      await getWalletRecordByUserId(
        input.userId
      );

    if (
      !walletRecord
    ) {

      logger.error("WALLET_ADDRESS.WALLET_NOT_FOUND", {
  userId: maskId(input.userId),
});

      throw new Error(
        "WALLET_NOT_FOUND"
      );

    }

    logger.debug("WALLET_ADDRESS.LOAD_WALLET_DONE", {
  walletId: maskId(walletRecord.id),
});

    /* ===============================================
       CREATE ADDRESS
    =============================================== */

    logger.debug("WALLET_ADDRESS.DB_CREATE_START", {
  userId: maskId(input.userId),
});

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

    logger.info("WALLET_ADDRESS.DB_CREATE_DONE", {
  walletAddressId: maskId(wallet.id),
});

    let result =
      wallet;
    /* ===============================================
       UPDATE VALIDATION
    =============================================== */

    logger.debug("WALLET_ADDRESS.VALIDATION_START", {
  walletAddressId: maskId(wallet.id),
});

    if (
      rpc.exists
    ) {

      const valid =
        await markWalletAddressValid(
          wallet.id
        );

      logger.info("WALLET_ADDRESS.VALIDATION_VALID");

      const verified =
        await markWalletAddressVerified(
          wallet.id
        );

      logger.info("WALLET_ADDRESS.VERIFICATION_DONE");

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

  logger.warn(
    "WALLET_ADDRESS.VALIDATION_INVALID"
  );

  result =
    invalid ??
    wallet;

}

    /* ===============================================
       SUCCESS
    =============================================== */

    logger.info("WALLET_ADDRESS.CREATE_SUCCESS", {
  walletAddressId: maskId(result.id),
  userId: maskId(input.userId),
  verified: result.is_verified,
});

    return result;

  } catch (
    error
  ) {

    logger.error("WALLET_ADDRESS.CREATE_FAILED", {
  userId: maskId(input.userId),
  message:
    error instanceof Error
      ? error.message
      : "UNKNOWN_ERROR",
});

    throw error;

  }

}
  
