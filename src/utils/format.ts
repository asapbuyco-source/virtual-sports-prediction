export function formatNumber(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatCurrency(amount: number, currency = "XAF"): string {
  return `${amount.toLocaleString()} ${currency}`;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}