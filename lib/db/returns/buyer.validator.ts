/* =====================================================
   VALIDATORS
===================================================== */

export function isValidUuid(
  value: string
): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
}

export function error(
  message: string
): never {
  throw new Error(message);
}
