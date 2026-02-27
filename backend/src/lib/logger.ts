/**
 * Central Logger — Pino
 *
 * Structured JSON logger for production, pretty-printed in development.
 *
 * Configuration:
 * - LOG_LEVEL env var overrides the default level
 * - In development (NODE_ENV !== "production"), uses pino-pretty transport
 * - In production, outputs raw JSON to stdout for log aggregators
 */

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
});

export default logger;

/** ANSI color codes for terminal output */
export const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
};

/** Returns the ANSI color code for an HTTP status code range */
export function statusColor(code: number): string {
  if (code < 300) return colors.green;
  if (code < 400) return colors.yellow;
  return colors.red;
}
