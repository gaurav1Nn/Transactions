import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const inboundId = req.headers["x-request-id"];
  const requestId =
    typeof inboundId === "string" && inboundId.trim().length > 0
      ? inboundId.trim()
      : uuidv4();

  req.id = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
}
