export function isValidUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
}
