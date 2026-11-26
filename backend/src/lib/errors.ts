import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";

// Each code has exactly one HTTP status. Services throw by code and never pick a status,
// so business logic stays free of HTTP; only this file knows how a code maps to a response.
const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  INVALID_PIN: 403,
  ROOM_NOT_FOUND: 404,
  BOOKING_NOT_FOUND: 404,
  NOT_FOUND: 404,
  BOOKING_CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof STATUS_BY_CODE;

/** An expected failure the client should hear about (not found, conflict, wrong PIN...). */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  get status(): number {
    return STATUS_BY_CODE[this.code];
  }
}

export const notFoundRoute: RequestHandler = (req, _res, next) => {
  next(new AppError("NOT_FOUND", `ไม่พบ ${req.method} ${req.path}`));
};

// Express 5 forwards errors thrown in async handlers here automatically.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
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
