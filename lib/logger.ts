/* =========================================================
   LOGGER
========================================================= */

export type LogData = unknown;

function print(
  level: "INFO" | "WARN" | "ERROR" | "DEBUG",
  scope: string,
  data?: LogData
) {
  const payload =
    data === undefined ? "" : data;

  switch (level) {
    case "ERROR":
      console.error(
        `[${level}][${scope}]`,
        payload
      );
      break;

    case "WARN":
      console.warn(
        `[${level}][${scope}]`,
        payload
      );
      break;

    case "DEBUG":
      console.debug(
        `[${level}][${scope}]`,
        payload
      );
      break;

    default:
      console.log(
        `[${level}][${scope}]`,
        payload
      );
  }
}

export const logger = {
  info(
    scope: string,
    data?: LogData
  ) {
    print(
      "INFO",
      scope,
      data
    );
  },

  warn(
    scope: string,
    data?: LogData
  ) {
    print(
      "WARN",
      scope,
      data
    );
  },

  error(
    scope: string,
    data?: LogData
  ) {
    print(
      "ERROR",
      scope,
      data
    );
  },

  debug(
    scope: string,
    data?: LogData
  ) {
    print(
      "DEBUG",
      scope,
      data
    );
  },
};
/* =========================================================
   MASK HELPERS
========================================================= */

export function maskId(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  if (value.length <= 8) {
    return value;
  }

  return (
    value.slice(0, 4) +
    "..." +
    value.slice(-4)
  );
}

export function maskWallet(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  if (value.length <= 12) {
    return value;
  }

  return (
    value.slice(0, 6) +
    "..." +
    value.slice(-6)
  );
}

export function maskToken(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  if (value.length <= 12) {
    return "***";
  }

  return (
    value.slice(0, 6) +
    "..." +
    value.slice(-6)
  );
}

export function maskEmail(
  value: string | null | undefined
): string {
  if (!value) {
    return "";
  }

  const at = value.indexOf("@");

  if (at <= 1) {
    return "***";
  }

  return (
    value.slice(0, 2) +
    "***" +
    value.slice(at)
  );
}
