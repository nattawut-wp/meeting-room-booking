import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "ROOM_NOT_FOUND"
  | "BOOKING_NOT_FOUND"
  | "BOOKING_CONFLICT"
  | "INVALID_PIN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFoundRoute: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, "NOT_FOUND", `ไม่พบ ${req.method} ${req.path}`));
};

// Express 5 forwards errors thrown in async handlers here automatically.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "ข้อมูลไม่ถูกต้อง",
        details: { fields: z.flattenError(err).fieldErrors },
      },
    });
    return;
  }

  // Body that is not valid JSON (thrown by express.json()).
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "รูปแบบ JSON ไม่ถูกต้อง" },
    });
    return;
  }

  console.error(err);
  // Never send the stack trace or internal message to the client.
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาดในระบบ" },
  });
};

/** True when a database error is the bookings_no_overlap exclusion violation (SQLSTATE 23P01). */
export function isOverlapViolation(err: unknown): boolean {
  const seen = new Set<unknown>();
  const walk = (value: unknown): boolean => {
    if (!value || typeof value !== "object" || seen.has(value)) return false;
    seen.add(value);
    const obj = value as Record<string, unknown>;
    if (obj.code === "23P01" || obj.originalCode === "23P01") return true;
    if (typeof obj.message === "string" && obj.message.includes("bookings_no_overlap")) return true;
    return walk(obj.cause) || walk(obj.meta) || walk(obj.driverAdapterError);
  };
  return walk(err);
}
