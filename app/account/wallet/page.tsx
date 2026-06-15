// =====================================================
// app/account/wallet/page.tsx
// =====================================================

"use client";

export const dynamic =
  "force-dynamic";

import {
  useEffect,
  useMemo,
} from "react";

import useSWR from "swr";

import {
  apiAuthFetch,
} from "@/lib/api/apiAuthFetch";

import {
  useAuth,
} from "@/context/AuthContext";

import type {
  WalletApiResponse,
} from "./wallet.api";

import {
  parseWalletResponse,
} from "./wallet.api";

import WalletHero
  from "./components/WalletHero";

import WalletStats
  from "./components/WalletStats";

import WalletSkeleton
  from "./components/WalletSkeleton";

import WalletTransactionList
  from "./components/WalletTransactionList";

/* =====================================================
   FETCHER
===================================================== */

async function walletFetcher(
  url: string
): Promise<WalletApiResponse> {

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

  const json: unknown =
    await response.json();

  return parseWalletResponse(
    json
  );
}

/* =====================================================
   PAGE
===================================================== */

export default function WalletPage() {

  const {
    loading: authLoading,
  } = useAuth();

  /* ===================================================
     SWR
  =================================================== */

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<
    WalletApiResponse
  >(
    authLoading
      ? null
      : "/api/wallet",

    walletFetcher,

    {
      revalidateOnFocus:
        true,

      revalidateOnReconnect:
        true,

      dedupingInterval:
        5000,

      focusThrottleInterval:
        10000,

      keepPreviousData:
        true,
    }
  );

  /* ===================================================
     AUTO REFRESH
  =================================================== */

  useEffect(() => {

    if (authLoading) {
      return;
    }

    const interval =
      setInterval(() => {

        void mutate();

      }, 15000);

    return () => {
      clearInterval(
        interval
      );
    };

  }, [
    authLoading,
    mutate,
  ]);

  /* ===================================================
     DERIVED
  =================================================== */

  const balance =
    data?.balance ?? 0;

  const transactions =
    data?.transactions ?? [];

  const totalIn =
    useMemo(() => {

      return transactions
        .filter(
          (item) =>
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

    }, [
      transactions,
    ]);

  const totalOut =
    useMemo(() => {

      return transactions
        .filter(
          (item) =>
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

    }, [
      transactions,
    ]);

  /* ===================================================
     LOADING
  =================================================== */

  if (
    authLoading ||
    isLoading
  ) {

    return (
      <WalletSkeleton />
    );
  }

  /* ===================================================
     ERROR
  =================================================== */

if (error) {

  return (
    <main
      className="
        min-h-screen
        bg-[var(--background)]
        px-4
        pt-24
        pb-40
      "
    >

      <div
        className="
          mx-auto
          w-full
          max-w-sm
          rounded-3xl
          border border-red-500/10
          bg-[var(--card-bg)]
          p-6
          text-center
          shadow-sm
        "
      >

        <h2
          className="
            text-lg
            font-bold
            text-red-500
          "
        >
          Wallet Load Failed
        </h2>

        <p
          className="
            mt-2
            text-sm
            text-[var(--text-muted)]
          "
        >
          Unable to load wallet data.
        </p>

        <button
          type="button"
          onClick={() => {
            void mutate();
          }}
          className="
            mt-5
            inline-flex
            items-center
            justify-center
            rounded-2xl
            bg-orange-500
            px-5
            py-3
            text-sm
            font-semibold
            text-white
            transition-all
            active:scale-95
          "
        >
          Retry
        </button>

      </div>

    </main>
  );
}
  /* ===================================================
     UI
  =================================================== */

  return (
    <main
      className="
        min-h-screen
        bg-[var(--background)]
        pb-40
        transition-colors
        duration-300
      "
    >

      {/* HERO */}
      <WalletHero
        balance={balance}
        refreshing={false}
        onRefresh={() => {
          void mutate();
        }}
      />

      {/* STATS */}
      <WalletStats
        totalIn={totalIn}
        totalOut={totalOut}
      />

      {/* TRANSACTIONS */}
      <WalletTransactionList
        transactions={
          transactions
        }
      />

    </main>
  );
}
