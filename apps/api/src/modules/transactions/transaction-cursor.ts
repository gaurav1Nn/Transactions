export interface TransactionCursor {
  createdAt: Date;
  id: string;
}

export function encodeTransactionCursor(cursor: TransactionCursor): string {
  return Buffer.from(
    JSON.stringify({ createdAt: cursor.createdAt.toISOString(), id: cursor.id })
  ).toString("base64url");
}

export function decodeTransactionCursor(value: string): TransactionCursor {
  try {
    const decoded = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      createdAt?: unknown;
      id?: unknown;
    };
    const createdAt =
      typeof decoded.createdAt === "string" ? new Date(decoded.createdAt) : null;

    if (
      !createdAt ||
      Number.isNaN(createdAt.getTime()) ||
      typeof decoded.id !== "string" ||
      !isUuid(decoded.id)
    ) {
      throw new Error();
    }

    return { createdAt, id: decoded.id };
  } catch {
    throw new Error("Invalid transaction cursor");
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
