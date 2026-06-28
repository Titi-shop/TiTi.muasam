// =====================================================
// app/account/wallet/wallet.utils.ts
// =====================================================

import {
  ENTRY_LABELS,
} from "./wallet.constants";

import type {
  JournalEntryType,
} from "./wallet.types";

/* =====================================================
   FORMAT PI
===================================================== */

export function formatPi(
  value: number
): string {

  return value.toFixed(2);

}

/* =====================================================
   SAFE NUMBER
===================================================== */

export function toSafeNumber(
  value: unknown
): number {

  const number =
    Number(value);

  return Number.isNaN(number)
    ? 0
    : number;

}

/* =====================================================
   FORMAT TIME
===================================================== */

export function formatTime(
  value: string
): string {

  if (!value) {
    return "";
  }

  return new Date(
    value
  ).toLocaleString();

}

/* =====================================================
   FORMAT WALLET ADDRESS
===================================================== */

export function formatWalletAddress(
  address: string
): string {

  if (
    address.length <= 16
  ) {
    return address;
  }

  return (
    address.slice(0, 8) +
    "..." +
    address.slice(-8)
  );

}

/* =====================================================
   ENTRY LABEL
===================================================== */

export function getEntryLabel(
  type: JournalEntryType
): string {

  return (
    ENTRY_LABELS[type] ??
    type
  );

}
