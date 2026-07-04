// =====================================================
// lib/db/wallet-security/types.ts
// =====================================================

/* =====================================================
   WALLET SECURITY
===================================================== */

export type WalletSecurity = {

  id: string;

  user_id: string;

  /* ===================================================
     PIN
  =================================================== */

  pin_hash: string | null;

  pin_enabled: boolean;

  pin_created_at: Date | null;

  pin_changed_at: Date | null;

  /* ===================================================
     PIN LOCK
  =================================================== */

  failed_attempts: number;

  locked_until: Date | null;

  last_verified_at: Date | null;

  /* ===================================================
     GOOGLE AUTHENTICATOR
  =================================================== */

  totp_enabled: boolean;

  totp_secret: string | null;

  totp_created_at: Date | null;

  /* ===================================================
     PASSKEY
  =================================================== */

  passkey_enabled: boolean;

  /* ===================================================
     BIOMETRIC
  =================================================== */

  biometric_enabled: boolean;

  /* ===================================================
     RECOVERY
  =================================================== */

  recovery_code_hash: string | null;

  recovery_generated_at: Date | null;

  /* ===================================================
     AUDIT
  =================================================== */

  created_at: Date;

  updated_at: Date;

  created_by: string | null;

  updated_by: string | null;

};

/* =====================================================
   CREATE
===================================================== */

export type CreateWalletSecurityInput = {

  user_id: string;

  created_by?: string | null;

};

/* =====================================================
   SET PIN
===================================================== */

export type SetWalletPinInput = {

  user_id: string;

  pin_hash: string;

  updated_by?: string | null;

};

/* =====================================================
   VERIFY PIN
===================================================== */

export type VerifyWalletPinInput = {

  user_id: string;

  pin_hash: string;

};

/* =====================================================
   CHANGE PIN
===================================================== */

export type ChangeWalletPinInput = {

  user_id: string;

  pin_hash: string;

  updated_by?: string | null;

};

/* =====================================================
   LOCK
===================================================== */

export type LockWalletSecurityInput = {

  user_id: string;

  locked_until: Date;

};

/* =====================================================
   FAILED ATTEMPTS
===================================================== */

export type FailedAttemptInput = {

  user_id: string;

};

/* =====================================================
   RESET FAILED ATTEMPTS
===================================================== */

export type ResetFailedAttemptsInput = {

  user_id: string;

};

/* =====================================================
   ENABLE TOTP
===================================================== */

export type EnableTotpInput = {

  user_id: string;

  secret: string;

};

/* =====================================================
   ENABLE BIOMETRIC
===================================================== */

export type EnableBiometricInput = {

  user_id: string;

  enabled: boolean;

};

/* =====================================================
   ENABLE PASSKEY
===================================================== */

export type EnablePasskeyInput = {

  user_id: string;

  enabled: boolean;

};
