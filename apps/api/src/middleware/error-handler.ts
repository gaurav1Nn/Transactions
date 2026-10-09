import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/app-error.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  const requestId = req.id || "unknown";

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
        requestId,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details,
        requestId,
      },
    });
    return;
  }

  // SyntaxError from body-parser for malformed JSON
  if (
    err instanceof SyntaxError &&
    "body" in (err as unknown as Record<string, unknown>)
  ) {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Malformed JSON payload",
        requestId,
      },
    });
    return;
  }

  // Unexpected internal error - safe 500 without stack or database leak
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
      requestId,
    },
  });
}
