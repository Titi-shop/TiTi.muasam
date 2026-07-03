// =====================================================
// lib/rpc/wallet.rpc.ts
// =====================================================

const PI_RPC_URL =
  process.env.PI_RPC_URL?.trim() ||
  "https://rpc.testnet.minepi.com";

/* =====================================================
   TYPES
===================================================== */

export type PiWalletVerification = {

  exists: boolean;

  address: string;

  sequence: string | null;

  balance: number | null;

  network: string;

  rpcReachable: boolean;

  raw: Record<string, unknown>;

};

/* =====================================================
   LOG
===================================================== */

function log(
  tag: string,
  data?: unknown
) {
  console.log(
    `[RPC WALLET] ${tag}`,
    data ?? ""
  );
}

function err(
  tag: string,
  data?: unknown
) {
  console.error(
    `[RPC WALLET] ${tag}`,
    data ?? ""
  );
}

/* =====================================================
   HELPERS
===================================================== */

function str(
  value: unknown
): string | null {

  return typeof value === "string"
    ? value.trim()
    : null;

}

function num(
  value: unknown
): number | null {

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;

}

/* =====================================================
   VERIFY WALLET
===================================================== */

export async function verifyPiWallet(
  address: string
): Promise<PiWalletVerification> {

  const wallet =
    address
      .trim()
      .toUpperCase();

  log(
    "VERIFY_START",
    {
      address: wallet,
    }
  );

  if (!wallet) {

    throw new Error(
      "INVALID_WALLET_ADDRESS"
    );

  }

  try {

    const response =
      await fetch(
        PI_RPC_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          cache: "no-store",

          body: JSON.stringify({

            jsonrpc: "2.0",

            id: Date.now(),

            method:
              "getAccount",

            params: {
              address: wallet,
            },

          }),

        }
      );

    if (!response.ok) {

      err(
        "HTTP_ERROR",
        response.status
      );

      return {

        exists: false,

        address: wallet,

        sequence: null,

        balance: null,

        network:
          "Pi Testnet",

        rpcReachable: false,

        raw: {},

      };

    }

    const json =
      await response.json();

    if (json.error) {

      err(
        "ACCOUNT_NOT_FOUND",
        json.error
      );

      return {

        exists: false,

        address: wallet,

        sequence: null,

        balance: null,

        network:
          "Pi Testnet",

        rpcReachable: true,

        raw: json,

      };

    }

    const result =
      json.result ?? {};

    const sequence =
      str(
        result.seqNum
      ) ??
      str(
        result.sequence
      );

    let balance:
      number | null = null;

    if (
      Array.isArray(
        result.balances
      ) &&
      result.balances.length
    ) {

      balance =
        num(
          result
            .balances[0]
            ?.balance
        );

    }

    log(
      "VERIFY_SUCCESS",
      {
        address: wallet,
        sequence,
        balance,
      }
    );

    return {

      exists: true,

      address: wallet,

      sequence,

      balance,

      network:
        "Pi Testnet",

      rpcReachable: true,

      raw: result,

    };

  } catch (error) {

    err(
      "VERIFY_FAILED",
      error
    );

    return {

      exists: false,

      address: wallet,

      sequence: null,

      balance: null,

      network:
        "Pi Testnet",

      rpcReachable: false,

      raw: {},

    };

  }

}
