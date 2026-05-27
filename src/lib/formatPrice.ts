/**
 * Format a number as Algerian Dinar (DA/DZD).
 * Uses local formatting with "DA" suffix for readability.
 */
export function formatPrice(amount: number | string | undefined | null): string {
  const num = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  if (Number.isNaN(num)) return "0 DA";
  return `${Math.round(num).toLocaleString("fr-DZ")} DA`;
}

/**
 * Parse a price string like "1 500 DA" or "1500" back to a number.
 */
export function parsePrice(raw: string): number {
  return Number(String(raw).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
}
