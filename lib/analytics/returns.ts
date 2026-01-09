export interface PricePoint {
  date: Date;
  price: number;
}

export interface ReturnPoint {
  date: Date;
  return: number;
}

export function computeLogReturns(prices: PricePoint[]): ReturnPoint[] {
  const returns: ReturnPoint[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prevPrice = prices[i - 1].price;
    const currPrice = prices[i].price;
    if (prevPrice > 0) {
      returns.push({
        date: prices[i].date,
        return: Math.log(currPrice / prevPrice),
      });
    }
  }
  return returns;
}

export function computeSimpleReturns(prices: PricePoint[]): ReturnPoint[] {
  const returns: ReturnPoint[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prevPrice = prices[i - 1].price;
    const currPrice = prices[i].price;
    if (prevPrice > 0) {
      returns.push({
        date: prices[i].date,
        return: (currPrice - prevPrice) / prevPrice,
      });
    }
  }
  return returns;
}

export function computePortfolioReturns(
  assetReturns: { [ticker: string]: ReturnPoint[] },
  weights: { [ticker: string]: number }
): ReturnPoint[] {
  const tickers = Object.keys(weights);
  if (tickers.length === 0) {
    return [];
  }

  const dateMap = new Map<string, number>();
  const dates = new Set<string>();

  for (const ticker of tickers) {
    const returns = assetReturns[ticker] || [];
    for (const ret of returns) {
      const dateKey = ret.date.toISOString().split("T")[0];
      dates.add(dateKey);
      const existing = dateMap.get(dateKey) || 0;
      dateMap.set(dateKey, existing + weights[ticker] * ret.return);
    }
  }

  const sortedDates = Array.from(dates).sort();
  return sortedDates.map((dateKey) => ({
    date: new Date(dateKey),
    return: dateMap.get(dateKey) || 0,
  }));
}

export function computeEquityCurve(returns: ReturnPoint[]): number[] {
  let equity = 1.0;
  const curve: number[] = [equity];
  for (const ret of returns) {
    equity *= 1 + ret.return;
    curve.push(equity);
  }
  return curve;
}

