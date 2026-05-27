import type { CurrencyCode } from "../types/budget";

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
};

/**
 * Format cents as a currency string with proper grouping and 2 decimal places.
 * e.g. 123456 cents with USD -> "$1,234.56"
 */
export function formatCents(cents: number, currency: CurrencyCode): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const isNegative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const formatted = dollars.toLocaleString("en-US") + "." + String(remainder).padStart(2, "0");
  return (isNegative ? "-" : "") + symbol + formatted;
}

/**
 * Parse a user-entered dollar string into cents.
 * Returns null if the input is not a valid number.
 */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[,$\s€£A]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num) || !isFinite(num)) return null;
  return Math.round(num * 100);
}
