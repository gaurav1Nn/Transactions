import { randomBytes } from "crypto";

export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `TXN-${timestamp}-${random}`;
}
