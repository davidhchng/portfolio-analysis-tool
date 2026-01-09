export function validateTicker(ticker: string): boolean {
  if (!ticker || typeof ticker !== "string") {
    return false;
  }
  const cleaned = ticker.trim().toUpperCase();
  if (cleaned.length < 1 || cleaned.length > 10) {
    return false;
  }
  return /^[A-Z0-9]+$/.test(cleaned);
}

export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

export function validateWeight(weight: number): boolean {
  return typeof weight === "number" && weight >= 0 && isFinite(weight);
}

export function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    return weights.map(() => 0);
  }
  return weights.map((w) => w / sum);
}

