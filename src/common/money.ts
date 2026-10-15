/**
 * Shopify sends money as decimal strings ("125000.0"). Sums are done in whole
 * cents so thousands of amounts add up without floating-point drift.
 * (Two decimals covers PKR and every currency the store presents in.)
 */
export function toCents(amount: string | number | null | undefined): number {
  const value = Number(amount ?? 0);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

/** Cents → a decimal string in Shopify's style, e.g. 12500050 → "125000.5", 150000 → "1500.0". */
export function centsToAmount(cents: number): string {
  const text = String(Math.round(cents) / 100);
  return text.includes('.') ? text : `${text}.0`;
}

/** Cents → number with two places, for charts and KPI tiles. */
export function centsToNumber(cents: number): number {
  return Math.round(cents) / 100;
}
