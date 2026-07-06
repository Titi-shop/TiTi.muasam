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
