// =====================================================
// app/account/wallet/page.tsx
// =====================================================

"use client";

export const dynamic =
  "force-dynamic";

import WalletHero
  from "./components/WalletHero";

import WalletStats
  from "./components/WalletStats";

import WalletSkeleton
  from "./components/WalletSkeleton";

import WalletTransactionList
  from "./components/WalletTransactionList";

import {
  useWallet,
} from "./wallet.hooks";

/* =====================================================
   PAGE
===================================================== */

export default function WalletPage() {

  const {

    loading,

    refreshing,

    balance,

    transactions,

    totalIn,

    totalOut,

    refresh,

  } = useWallet();

  /* ===================================================
     LOADING
  =================================================== */

  if (loading) {

    return (
      <WalletSkeleton />
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
        refreshing={
          refreshing
        }
        onRefresh={() => {
          void refresh();
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
