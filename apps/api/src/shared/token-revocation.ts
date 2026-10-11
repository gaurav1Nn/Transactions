import { createHash } from "node:crypto";
import { prisma } from "./prisma.js";
import { verifyAccessToken } from "./jwt.js";
import { logger } from "../config/logger.js";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function isTokenRevoked(token: string): Promise<boolean> {
  const record = await prisma.revokedToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { tokenHash: true },
  });
  return record !== null;
}

export async function revokeToken(token: string): Promise<void> {
  const payload = verifyAccessToken(token);
  const expiresAt = new Date(payload.exp * 1000);
  const tokenHash = hashToken(token);

  await prisma.revokedToken.upsert({
    where: { tokenHash },
    create: { tokenHash, expiresAt },
    update: {},
  });

  try {
    await prisma.revokedToken.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
  } catch (error) {
    // Cleanup is housekeeping; the token was already revoked above.
    logger.warn({ err: error }, "Expired revoked-token cleanup failed");
  }
}
