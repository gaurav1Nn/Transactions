import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "../shared/app-error.js";

export function validate(schema: AnyZodObject) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
      });

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        next(
          new AppError(
            "VALIDATION_ERROR",
            "Request validation failed",
            422,
            details
          )
        );
      } else {
        next(error);
      }
    }
  };
}
