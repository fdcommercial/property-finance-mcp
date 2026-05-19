/**
 * Number formatting helpers. Used in markdown text content (the human-
 * readable part of each tool response). The structured JSON content uses
 * raw numbers so AI clients and downstream systems can compute on them
 * directly.
 */

/**
 * Format a number as GBP, no decimals, with thousands separators.
 * 123456.78 -> "£123,457"
 */
export function gbp(n: number): string {
  if (!isFinite(n)) return "—";
  return (
    "£" +
    Math.round(n).toLocaleString("en-GB", { useGrouping: true })
  );
}

/**
 * Format a number as a percentage with one decimal place.
 * 0.123 -> "12.3%"
 * Pass `alreadyPercent: true` if the input is already in percent form
 * (e.g. 12.3 means 12.3%).
 */
export function pct(n: number, alreadyPercent = false): string {
  if (!isFinite(n)) return "—";
  const value = alreadyPercent ? n : n * 100;
  return value.toFixed(1) + "%";
}

/**
 * Format an ICR-style multiplier.
 * 1.45 -> "1.45x"
 */
export function multiple(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toFixed(2) + "x";
}
