// =====================================================
// lib/db/settlement/settlement.event.types.ts
// =====================================================

export const WithdrawalSettlementEvents = {

  /* ==============================================
     ADMIN
  ============================================== */

  APPROVED:
    "APPROVED",

  /* ==============================================
     PI A2U
  ============================================== */

  PAYMENT_CREATED:
    "PAYMENT_CREATED",

  PAYMENT_SUBMITTED:
    "PAYMENT_SUBMITTED",

  PAYMENT_COMPLETED:
    "PAYMENT_COMPLETED",

  /* ==============================================
     RPC
  ============================================== */

  RPC_VERIFIED:
    "RPC_VERIFIED",

  /* ==============================================
     WALLET
  ============================================== */

  BALANCE_RESERVED:
    "BALANCE_RESERVED",

  BALANCE_FINALIZED:
    "BALANCE_FINALIZED",

  BALANCE_RELEASED:
    "BALANCE_RELEASED",

  /* ==============================================
     JOURNAL
  ============================================== */

  JOURNAL_CREATED:
    "JOURNAL_CREATED",

  /* ==============================================
     FINAL
  ============================================== */

  WITHDRAW_COMPLETED:
    "WITHDRAW_COMPLETED",

  WITHDRAW_FAILED:
    "WITHDRAW_FAILED",

  RETRY_REQUESTED:
    "RETRY_REQUESTED",

} as const;

export type
WithdrawalSettlementEventType =
typeof WithdrawalSettlementEvents[
  keyof typeof WithdrawalSettlementEvents
];
