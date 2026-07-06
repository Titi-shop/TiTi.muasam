export function isSaleActive(
  saleEnabled?: boolean,
  salePrice?: number | null,
  price?: number | null,
  saleStart?: string | Date | null,
  saleEnd?: string | Date | null
): boolean {
  console.log(
    "[SALE][CHECK]",
    {
      enabled: Boolean(saleEnabled),
    }
  );

  if (!saleEnabled) {
    console.log("[SALE][DISABLED]");
    return false;
  }

  if (
    salePrice == null ||
    price == null ||
    salePrice <= 0 ||
    salePrice >= price
  ) {
    console.log("[SALE][INVALID_PRICE]");
    return false;
  }

  if (!saleStart || !saleEnd) {
    console.log("[SALE][MISSING_WINDOW]");
    return false;
  }

  const start = new Date(saleStart).getTime();
  const end = new Date(saleEnd).getTime();

  if (
    Number.isNaN(start) ||
    Number.isNaN(end)
  ) {
    console.log("[SALE][INVALID_WINDOW]");
    return false;
  }

  if (start >= end) {
    console.log("[SALE][INVALID_RANGE]");
    return false;
  }

  const now = Date.now();

  if (now < start) {
    console.log("[SALE][NOT_STARTED]");
    return false;
  }

  if (now > end) {
    console.log("[SALE][EXPIRED]");
    return false;
  }

  console.log("[SALE][ACTIVE]");

  return true;
}
