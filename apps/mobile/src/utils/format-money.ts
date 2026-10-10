export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export interface FormattedMoneyParts {
  symbol: string;
  currency: string;
  integerPart: string;
  decimalPart: string;
  formatted: string;
  speechText: string;
}

export function formatMoneyParts(
  amount: string,
  currency = "USD"
): FormattedMoneyParts {
  if (!amount || typeof amount !== "string") {
    return {
      symbol: CURRENCY_SYMBOLS[currency] || `${currency} `,
      currency,
      integerPart: "0",
      decimalPart: "00",
      formatted: `${CURRENCY_SYMBOLS[currency] || `${currency} `}0.00`,
      speechText: `0 ${currency} and 00 cents`,
    };
  }

  const clean = amount.trim();
  const parts = clean.split(".");

  let integerStr = parts[0].replace(/^0+(?=\d)/, "") || "0";
  let decimalStr = parts.length > 1 ? parts[1] : "00";

  // Normalize decimal part to exactly 2 digits
  if (decimalStr.length === 1) {
    decimalStr = `${decimalStr}0`;
  } else if (decimalStr.length > 2) {
    decimalStr = decimalStr.slice(0, 2);
  }

  // Insert thousands grouping via string regex without using Number
  const groupedInteger = integerStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;

  const formatted = `${symbol}${groupedInteger}.${decimalStr}`;

  // Natural speech text for accessibility
  const currencyName =
    currency === "USD"
      ? "dollars"
      : currency === "EUR"
      ? "euros"
      : currency === "GBP"
      ? "pounds"
      : currency;

  const speechText = `${groupedInteger} ${currencyName} and ${decimalStr} cents`;

  return {
    symbol,
    currency,
    integerPart: groupedInteger,
    decimalPart: decimalStr,
    formatted,
    speechText,
  };
}

export function formatMoney(amount: string, currency = "USD"): string {
  return formatMoneyParts(amount, currency).formatted;
}
