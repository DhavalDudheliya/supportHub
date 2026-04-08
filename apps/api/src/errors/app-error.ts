/**
 * AppError — Structured Application Error
 *
 * A proper Error subclass that carries HTTP status codes, machine-readable
 * error codes, and an operational flag. All service/controller errors should
 * use this class (or its factory methods) instead of throwing plain objects.
 *
 * Benefits over `throw { status, message }`:
 * - Real Error with stack trace for debugging
 * - `instanceof AppError` checks in the global error handler
 * - Machine-readable `code` field for frontend error handling
 * - `isOperational` flag to distinguish expected errors from bugs
 */

/** Machine-readable error codes for deterministic frontend handling */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>[];

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    options?: {
      isOperational?: boolean;
      details?: Record<string, unknown>[];
      cause?: Error;
    },
  ) {
    super(message, { cause: options?.cause });
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = options?.isOperational ?? true;
    this.details = options?.details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace, excluding the constructor from the trace
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Factory Methods (convenient shorthand) ──────────────────────────

  /** 400 — Invalid input or malformed request */
  static badRequest(
    message: string,
    details?: Record<string, unknown>[],
  ): AppError {
    return new AppError(message, 400, "BAD_REQUEST", { details });
  }

  /** 400 — Validation failure with field-level details */
  static validation(
    message: string,
    details: Record<string, unknown>[],
  ): AppError {
    return new AppError(message, 400, "VALIDATION_ERROR", { details });
  }

  /** 401 — Missing or invalid authentication */
  static unauthorized(message = "Authentication required"): AppError {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  /** 403 — Authenticated but not permitted */
  static forbidden(message = "Insufficient permissions"): AppError {
    return new AppError(message, 403, "FORBIDDEN");
  }

  /** 404 — Resource not found */
  static notFound(message = "Resource not found"): AppError {
    return new AppError(message, 404, "NOT_FOUND");
  }

  /** 409 — Resource conflict (duplicate, already exists) */
  static conflict(message: string): AppError {
    return new AppError(message, 409, "CONFLICT");
  }

  /** 429 — Rate limit exceeded */
  static rateLimited(message = "Too many requests"): AppError {
    return new AppError(message, 429, "RATE_LIMITED");
  }

  /** 500 — Unexpected internal error (non-operational) */
  static internal(message = "Internal server error", cause?: Error): AppError {
    return new AppError(message, 500, "INTERNAL_ERROR", {
      isOperational: false,
      cause,
    });
  }
}
