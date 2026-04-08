/**
 * Error Handling — Barrel Exports
 *
 * Centralizes all error-related exports for clean imports:
 * ```ts
 * import { AppError, globalErrorHandler } from "../errors/index.js";
 * ```
 */

export { AppError, type ErrorCode } from "./app-error.js";
export { globalErrorHandler } from "./error-handler.middleware.js";
