export const MAX_AMOUNT_CENTS = 999999999999; // 9,999,999,999.99

export function sanitizeAmountInput(raw: string): string {
  if (!raw) return "";

  // Strip anything that is not a digit or decimal point
  let clean = raw.replace(/[^0-9.]/g, "");

  // Allow at most one decimal point
  const parts = clean.split(".");
  if (parts.length > 2) {
    clean = `${parts[0]}.${parts.slice(1).join("")}`;
  }

  const [intPart = "", decPart] = clean.split(".");

  // Limit integer part to 10 digits
  const cappedInt = intPart.slice(0, 10);

  if (decPart !== undefined) {
    // Limit decimal part to 2 digits
    const cappedDec = decPart.slice(0, 2);
    return `${cappedInt}.${cappedDec}`;
  }

  return cappedInt;
}

export function padAmountOnBlur(val: string): string {
  if (!val || val.trim().length === 0) return "";

  const trimmed = val.trim();
  const parts = trimmed.split(".");

  if (parts.length === 1) {
    return `${parts[0]}.00`;
  }

  const intPart = parts[0] || "0";
  let decPart = parts[1] || "";

  if (decPart.length === 0) {
    decPart = "00";
  } else if (decPart.length === 1) {
    decPart = `${decPart}0`;
  } else if (decPart.length > 2) {
    decPart = decPart.slice(0, 2);
  }

  return `${intPart}.${decPart}`;
}

export function amountToCents(amountStr: string): number {
  if (!amountStr || !amountStr.trim()) return 0;

  const parts = amountStr.trim().split(".");
  const intPart = parseInt(parts[0] || "0", 10) || 0;
  const decPartStr = (parts[1] || "").padEnd(2, "0").slice(0, 2);
  const decPart = parseInt(decPartStr || "0", 10) || 0;

  return intPart * 100 + decPart;
}

export function centsToAmount(cents: number): string {
  const safeCents = Math.max(0, Math.min(cents, MAX_AMOUNT_CENTS));
  const intVal = Math.floor(safeCents / 100);
  const decVal = String(safeCents % 100).padStart(2, "0");
  return `${intVal}.${decVal}`;
}

export function addIntegerCents(currentAmountStr: string, addCents: number): string {
  const currentCents = amountToCents(currentAmountStr);
  const nextCents = currentCents + addCents;
  return centsToAmount(nextCents);
}
