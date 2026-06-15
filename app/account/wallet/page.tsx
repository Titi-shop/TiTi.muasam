"use client";

export const dynamic = "force-dynamic";

import useSWR from "swr";

import {
  useMemo,
  useState,
} from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  RefreshCcw,
  Wallet,
} from "lucide-react";

import { apiAuthFetch } from "@/lib/api/apiAuthFetch";

import { useAuth } from "@/context/AuthContext";

import {
  useTranslationClient as useTranslation,
} from "@/app/lib/i18n/client";

/* =======================================================
   TYPES
======================================================= */

type TransactionType =
  | "CREDIT"
  | "DEBIT";

type EntryType =
  | "ESCROW_HOLD"
  | "BUYER_REFUND"
  | "BUYER_PARTIAL_REFUND"
  | "SELLER_CREDIT"
  | "SELLER_ESCROW_RELEASE"
  | "SELLER_WITHDRAW"
  | "SELLER_WITHDRAW_REVERT"
  | "ESCROW_RELEASE"
  | "ESCROW_REVERT"
  | "DISPUTE_LOCK"
  | "DISPUTE_RELEASE"
  | "DISPUTE_REFUND"
  | "ADMIN_ADJUST"
  | "ADMIN_REVERSE"
  | "SYSTEM_COMPENSATION";

type Tx = {
  id: string;
  direction: TransactionType;
  amount: number;
  entry_type: EntryType;
  created_at: string;
};

type WalletResponse = {
  balance: number;
  transactions: Tx[];
};

/* =======================================================
   FETCHER
======================================================= */

async function walletFetcher(
  url: string
): Promise<WalletResponse> {

  const response =
    await apiAuthFetch(
      url,
      {
        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      "WALLET_FETCH_FAILED"
    );
  }

  const json =
    await response.json();

  const balance =
    Number(
      json?.balance ?? 0
    );

  const transactions =
    Array.isArray(
      json?.transactions
    )
      ? json.transactions
          .map(
            (
              item: unknown
            ): Tx | null => {

              if (
                typeof item !==
                  "object" ||
                item === null
              ) {
                return null;
              }

              const tx =
                item as Record<
                  string,
                  unknown
                >;

              return {
                id:
                  String(
                    tx.id ?? ""
                  ),

                direction:
                  tx.direction ===
                  "DEBIT"
                    ? "DEBIT"
                    : "CREDIT",

                amount:
                  Number(
                    tx.amount ??
                      0
                  ),

                entry_type:
                  String(
                    tx.entry_type ??
                      ""
                  ) as EntryType,

                created_at:
                  String(
                    tx.created_at ??
                      ""
                  ),
              };
            }
          )
          .filter(
            (
              item
            ): item is Tx =>
              item !== null
          )
      : [];

  return {
    balance:
      Number.isNaN(balance)
        ? 0
        : balance,

    transactions,
  };
}

/* =======================================================
   UTILS
======================================================= */

function formatPi(
  value: number
): string {

  return value.toFixed(2);
}

function formatTime(
  date: string
): string {

  return new Date(
    date
  ).toLocaleString();
}

function getRefLabel(
  type: EntryType
): string {

  switch (type) {

    case "ESCROW_HOLD":
      return "Escrow Hold";

    case "BUYER_REFUND":
      return "Buyer Refund";

    case "BUYER_PARTIAL_REFUND":
      return "Partial Refund";

    case "SELLER_CREDIT":
      return "Seller Credit";

    case "SELLER_ESCROW_RELEASE":
      return "Escrow Released";

    case "SELLER_WITHDRAW":
      return "Withdraw";

    case "SELLER_WITHDRAW_REVERT":
      return "Withdraw Reverted";

    case "DISPUTE_LOCK":
      return "Dispute Locked";

    case "DISPUTE_RELEASE":
      return "Dispute Released";

    case "DISPUTE_REFUND":
      return "Dispute Refund";

    case "ADMIN_ADJUST":
      return "Admin Adjust";

    case "ADMIN_REVERSE":
      return "Admin Reverse";

    case "SYSTEM_COMPENSATION":
      return "System Compensation";

    default:
      return type;
  }
}

/* =======================================================
   PAGE
======================================================= */

export default function WalletPage() {

  const { t } =
    useTranslation();

  const {
    loading: authLoading,
  } = useAuth();

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  /* ===================================================
     SWR
  =================================================== */

  const {
    data,
    isLoading,
    mutate,
  } = useSWR<WalletResponse>(
    authLoading
      ? null
      : "/api/wallet",

    walletFetcher,

    {
      revalidateOnFocus:
        false,

      revalidateIfStale:
        false,

      dedupingInterval:
        15000,

      keepPreviousData:
        true,
    }
  );

  /* ===================================================
     DATA
  =================================================== */

  const balance =
    useMemo(() => {
      return Number(
        data?.balance ?? 0
      );
    }, [data]);

  const txs =
    useMemo(() => {
      return (
        data?.transactions ??
        []
      );
    }, [data]);

  /* ===================================================
     STATS
  =================================================== */

  const totalIn =
    useMemo(() => {

      return txs
        .filter(
          (
            item
          ) =>
            item.direction ===
            "CREDIT"
        )
        .reduce(
          (
            acc,
            item
          ) =>
            acc +
            item.amount,

          0
        );

    }, [txs]);

  const totalOut =
    useMemo(() => {

      return txs
        .filter(
          (
            item
          ) =>
            item.direction ===
            "DEBIT"
        )
        .reduce(
          (
            acc,
            item
          ) =>
            acc +
            item.amount,

          0
        );

    }, [txs]);

  /* ===================================================
     REFRESH
  =================================================== */

  async function refresh() {

    if (refreshing) {
      return;
    }

    try {

      setRefreshing(true);

      await mutate();

    } finally {

      setRefreshing(false);
    }
  }

  /* ===================================================
     LOADING
  =================================================== */

  if (
    isLoading &&
    !data
  ) {

    return (
      <main className="min-h-screen bg-[var(--background)] p-4">

        <div
          className="
            h-52 animate-pulse rounded-3xl
            bg-[var(--card-secondary)]
          "
        />

        <div className="mt-4 space-y-3">

          {[1, 2, 3, 4].map(
            (i) => (
              <div
                key={i}
                className="
                  h-20 animate-pulse rounded-2xl
                  bg-[var(--card-secondary)]
                "
              />
            )
          )}

        </div>

      </main>
    );
  }

  /* ===================================================
     UI
  =================================================== */

  return (
    <main className="min-h-screen bg-[var(--background)] pb-28 transition-colors duration-300">

      {/* HERO */}

      <section
        className="
          relative overflow-hidden
          rounded-b-[2.5rem]
          border-b border-orange-500/10
          bg-gradient-to-br
          from-orange-500
          via-orange-500
          to-amber-500
          px-5 pb-8 pt-8
          text-white
          shadow-xl
        "
      >

        <div
          className="
            absolute -right-10 -top-10
            h-40 w-40 rounded-full
            bg-white/10 blur-3xl
          "
        />

        <div
          className="
            absolute bottom-0 left-0
            h-32 w-32 rounded-full
            bg-yellow-300/10 blur-3xl
          "
        />

        <div className="relative z-10 flex items-start justify-between gap-4">

          <div>

            <p className="text-sm text-white/80">
              {t.wallet_balance ??
                "Wallet Balance"}
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight">
              π {formatPi(balance)}
            </h1>

          </div>

          <button
            type="button"
            onClick={() => {
              void refresh();
            }}
            className="
              flex h-11 w-11 items-center justify-center
              rounded-2xl
              border border-white/20
              bg-white/10
              backdrop-blur-md
              transition-all duration-200
              active:scale-95
            "
          >

            <RefreshCcw
              size={18}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

          </button>

        </div>

        {/* ACTIONS */}

        <div className="relative z-10 mt-8 grid grid-cols-3 gap-3">

          {/* DEPOSIT */}

          <button
            type="button"
            className="
              rounded-2xl
              border border-white/15
              bg-white/10
              p-3
              backdrop-blur-md
              transition-all duration-200
              active:scale-95
            "
          >

            <div
              className="
                mx-auto flex h-11 w-11
                items-center justify-center
                rounded-xl bg-white/15
              "
            >
              <ArrowDownLeft size={20} />
            </div>

            <p className="mt-2 text-xs font-semibold">
              {t.wallet_deposit ??
                "Deposit"}
            </p>

          </button>

          {/* WITHDRAW */}

          <button
            type="button"
            className="
              rounded-2xl
              border border-white/15
              bg-white/10
              p-3
              backdrop-blur-md
              transition-all duration-200
              active:scale-95
            "
          >

            <div
              className="
                mx-auto flex h-11 w-11
                items-center justify-center
                rounded-xl bg-white/15
              "
            >
              <ArrowUpRight size={20} />
            </div>

            <p className="mt-2 text-xs font-semibold">
              {t.wallet_withdraw ??
                "Withdraw"}
            </p>

          </button>

          {/* PAY */}

          <button
            type="button"
            className="
              rounded-2xl
              border border-white/15
              bg-white/10
              p-3
              backdrop-blur-md
              transition-all duration-200
              active:scale-95
            "
          >

            <div
              className="
                mx-auto flex h-11 w-11
                items-center justify-center
                rounded-xl bg-white/15
              "
            >
              <CreditCard size={20} />
            </div>

            <p className="mt-2 text-xs font-semibold">
              {t.wallet_pay ??
                "Pay"}
            </p>

          </button>

        </div>

      </section>

      {/* STATS */}

      <section className="px-4 pt-5">

        <div className="grid grid-cols-2 gap-4">

          <div
            className="
              rounded-3xl
              border border-green-500/10
              bg-[var(--card-bg)]
              p-5
              shadow-sm
            "
          >

            <div
              className="
                flex h-12 w-12 items-center justify-center
                rounded-2xl
                bg-green-500/10
                text-green-500
              "
            >
              <PiggyBank size={22} />
            </div>

            <p className="mt-4 text-xs text-[var(--text-muted)]">
              {t.wallet_total_in ??
                "Total In"}
            </p>

            <p className="mt-1 text-2xl font-bold text-green-500">
              +π {formatPi(totalIn)}
            </p>

          </div>

          <div
            className="
              rounded-3xl
              border border-red-500/10
              bg-[var(--card-bg)]
              p-5
              shadow-sm
            "
          >

            <div
              className="
                flex h-12 w-12 items-center justify-center
                rounded-2xl
                bg-red-500/10
                text-red-500
              "
            >
              <Wallet size={22} />
            </div>

            <p className="mt-4 text-xs text-[var(--text-muted)]">
              {t.wallet_total_out ??
                "Total Out"}
            </p>

            <p className="mt-1 text-2xl font-bold text-red-500">
              -π {formatPi(totalOut)}
            </p>

          </div>

        </div>

      </section>

      {/* TRANSACTIONS */}

      <section className="mt-6 px-4">

        <div className="mb-3 flex items-center justify-between">

          <h2 className="text-base font-bold text-[var(--foreground)]">
            {t.wallet_transactions ??
              "Transactions"}
          </h2>

          <span className="text-xs text-[var(--text-muted)]">
            {txs.length}
          </span>

        </div>

        <div
          className="
            overflow-hidden rounded-3xl
            border border-orange-500/10
            bg-[var(--card-bg)]
            shadow-sm
          "
        >

          {txs.length === 0 && (

            <div className="p-10 text-center">

              <div
                className="
                  mx-auto flex h-16 w-16
                  items-center justify-center
                  rounded-full
                  bg-orange-500/10
                  text-orange-500
                "
              >
                <Wallet size={28} />
              </div>

              <p className="mt-4 text-sm text-[var(--text-muted)]">
                {t.wallet_no_transactions ??
                  "No transactions yet"}
              </p>

            </div>
          )}

          {txs.map((item) => {

            const isCredit =
              item.direction ===
              "CREDIT";

            return (
              <div
                key={item.id}
                className="
                  flex items-center justify-between gap-4
                  border-b border-orange-500/5
                  p-4 last:border-b-0
                "
              >

                <div className="flex min-w-0 items-center gap-3">

                  <div
                    className={`
                      flex h-12 w-12 shrink-0 items-center justify-center
                      rounded-2xl
                      ${
                        isCredit
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }
                    `}
                  >

                    {isCredit ? (
                      <ArrowDownLeft size={20} />
                    ) : (
                      <ArrowUpRight size={20} />
                    )}

                  </div>

                  <div className="min-w-0">

                    <p
                      className="
                        truncate text-sm font-semibold
                        text-[var(--foreground)]
                      "
                    >
                      {getRefLabel(
                        item.entry_type
                      )}
                    </p>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {formatTime(
                        item.created_at
                      )}
                    </p>

                  </div>

                </div>

                <div className="text-right">

                  <p
                    className={`
                      text-sm font-bold
                      ${
                        isCredit
                          ? "text-green-500"
                          : "text-red-500"
                      }
                    `}
                  >

                    {isCredit
                      ? "+"
                      : "-"}

                    π
                    {formatPi(
                      item.amount
                    )}

                  </p>

                </div>

              </div>
            );
          })}

        </div>

      </section>

    </main>
  );
}
