// =====================================================
// app/account/wallet/history/history.utils.ts
// =====================================================

/* =====================================================
   FORMAT PI
===================================================== */

export function formatPi(
  value: number
): string {

  return new Intl.NumberFormat(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }
  ).format(value);

}

/* =====================================================
   FORMAT DATE
===================================================== */

export function formatDateTime(
  value: string
): string {

  return new Intl.DateTimeFormat(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  );

}

/* =====================================================
   SHORT ADDRESS
===================================================== */

export function formatWalletAddress(
  address: string,
  start = 6,
  end = 6,
): string {

  if (
    address.length <=
    start + end
  ) {

    return address;

  }

  return (
    address.slice(
      0,
      start,
    ) +
    "..." +
    address.slice(
      -end,
    )
  );

}

/* =====================================================
   COPY
===================================================== */

export async function copyToClipboard(
  value: string,
): Promise<boolean> {

  try {

    await navigator.clipboard.writeText(
      value
    );

    return true;

  } catch {

    return false;

  }

}
