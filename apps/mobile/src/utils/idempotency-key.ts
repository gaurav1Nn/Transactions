export function generateIdempotencyKey(): string {
  // UUID v4 format
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getTransactionPayloadFingerprint({
  amount,
  currency,
  description,
}: {
  amount: string;
  currency: string;
  description: string;
}): string {
  return JSON.stringify([amount.trim(), currency, description.trim()]);
}

export function shouldRotateIdempotencyKey(
  previousFingerprint: string | null,
  nextFingerprint: string
): boolean {
  return previousFingerprint !== null && previousFingerprint !== nextFingerprint;
}
