/**
 * Express Type Augmentation
 *
 * Extends the Express Request interface to include custom properties
 * added by our middlewares:
 * - `requestId`: Unique identifier assigned by request-id.middleware.ts
 */

declare global {
  namespace Express {
    interface Request {
      /** Unique request identifier for log correlation */
      requestId: string;
    }
  }
}

export {};
