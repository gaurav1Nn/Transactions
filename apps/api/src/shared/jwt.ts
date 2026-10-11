import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./app-error.js";
import { randomUUID } from "node:crypto";

export interface AccessTokenPayload {
  sub: string;
  exp: number;
  [key: string]: unknown;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    jwtid: randomUUID(),
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (
      typeof decoded !== "object" ||
      !decoded ||
      !("sub" in decoded) ||
      typeof decoded.sub !== "string" ||
      typeof decoded.exp !== "number" ||
      !Number.isFinite(decoded.exp)
    ) {
      throw new AppError("UNAUTHORIZED", "Invalid token payload", 401);
    }
    return decoded as AccessTokenPayload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("UNAUTHORIZED", "Invalid or expired token", 401);
  }
}
