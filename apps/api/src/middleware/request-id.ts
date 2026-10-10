import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const inboundId = req.headers["x-request-id"];
  const isValidInbound =
    typeof inboundId === "string" &&
    /^[a-zA-Z0-9_-]{1,128}$/.test(inboundId.trim());

  const requestId = isValidInbound ? inboundId.trim() : uuidv4();

  req.id = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
}
