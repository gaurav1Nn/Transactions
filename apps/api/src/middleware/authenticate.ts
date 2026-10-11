import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../shared/jwt.js";
import { AppError } from "../shared/app-error.js";
import { isTokenRevoked } from "../shared/token-revocation.js";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new AppError("UNAUTHORIZED", "Missing or invalid authorization header", 401));
    return;
  }

  const token = authHeader.slice(7).trim();

  try {
    const payload = verifyAccessToken(token);
    if (await isTokenRevoked(token)) {
      throw new AppError("UNAUTHORIZED", "Invalid or expired token", 401);
    }
    req.user = { id: payload.sub };
    next();
  } catch (error) {
    next(error);
  }
}
