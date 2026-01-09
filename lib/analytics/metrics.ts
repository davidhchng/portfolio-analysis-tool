import { ReturnPoint } from "./returns";
import { computeEquityCurve } from "./returns";

export interface RiskMetrics {
  annualizedVol: number;
  rollingVol20: number;
  maxDrawdown: number;
  beta: number | null;
  rSquared: number | null;
  hhi: number;
  nEffective: number;
  pcr: { [ticker: string]: number };
  top3Pcr: number;
}

export function computeAnnualizedVolatility(returns: ReturnPoint[]): number {
  if (returns.length < 2) {
    return 0;
  }
  const mean = returns.reduce((sum, r) => sum + r.return, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r.return - mean, 2), 0) /
    (returns.length - 1);
  return Math.sqrt(252 * variance);
}

export function computeRollingVolatility(
  returns: ReturnPoint[],
  window: number = 20
): number {
  if (returns.length < window) {
    return 0;
  }
  const recent = returns.slice(-window);
  return computeAnnualizedVolatility(recent);
}

export function computeMaxDrawdown(returns: ReturnPoint[]): number {
  if (returns.length === 0) {
    return 0;
  }
  const equity = computeEquityCurve(returns);
  let maxDD = 0;
  let peak = equity[0];

  for (let i = 1; i < equity.length; i++) {
    if (equity[i] > peak) {
      peak = equity[i];
    }
    const dd = (peak - equity[i]) / peak;
    if (dd > maxDD) {
      maxDD = dd;
    }
  }

  return maxDD;
}

export function computeBeta(
  portfolioReturns: ReturnPoint[],
  benchmarkReturns: ReturnPoint[]
): { beta: number | null; rSquared: number | null } {
  if (portfolioReturns.length < 2 || benchmarkReturns.length < 2) {
    return { beta: null, rSquared: null };
  }

  const dateMap = new Map<string, { p: number; b: number }>();
  for (const r of portfolioReturns) {
    const key = r.date.toISOString().split("T")[0];
    dateMap.set(key, { p: r.return, b: 0 });
  }

  for (const r of benchmarkReturns) {
    const key = r.date.toISOString().split("T")[0];
    const existing = dateMap.get(key);
    if (existing) {
      existing.b = r.return;
    }
  }

  const pairs = Array.from(dateMap.values()).filter((p) => p.b !== 0);
  if (pairs.length < 2) {
    return { beta: null, rSquared: null };
  }

  const pMean = pairs.reduce((sum, p) => sum + p.p, 0) / pairs.length;
  const bMean = pairs.reduce((sum, p) => sum + p.b, 0) / pairs.length;

  let cov = 0;
  let bVar = 0;
  for (const pair of pairs) {
    cov += (pair.p - pMean) * (pair.b - bMean);
    bVar += Math.pow(pair.b - bMean, 2);
  }

  if (bVar === 0) {
    return { beta: null, rSquared: null };
  }

  const beta = cov / bVar;
  const pVar = pairs.reduce((sum, p) => sum + Math.pow(p.p - pMean, 2), 0);
  const rSquared = bVar > 0 && pVar > 0 ? Math.pow(cov / Math.sqrt(bVar * pVar), 2) : null;

  return { beta, rSquared };
}

export function computeHHI(weights: { [ticker: string]: number }): number {
  return Object.values(weights).reduce((sum, w) => sum + w * w, 0);
}

export function computeNEffective(hhi: number): number {
  return hhi > 0 ? 1 / hhi : 0;
}

export function computePCR(
  weights: { [ticker: string]: number },
  covariance: { [ticker: string]: { [ticker: string]: number } },
  portfolioVariance: number
): { [ticker: string]: number } {
  const pcr: { [ticker: string]: number } = {};
  const tickers = Object.keys(weights);

  for (const ticker of tickers) {
    let marginalContribution = 0;
    for (const otherTicker of tickers) {
      marginalContribution += weights[otherTicker] * (covariance[ticker]?.[otherTicker] || 0);
    }
    pcr[ticker] = portfolioVariance > 0 ? (weights[ticker] * marginalContribution) / portfolioVariance : 0;
  }

  return pcr;
}

export function computeCovarianceMatrix(
  returns: { [ticker: string]: ReturnPoint[] },
  window: number = 252
): { [ticker: string]: { [ticker: string]: number } } {
  const tickers = Object.keys(returns);
  const covariance: { [ticker: string]: { [ticker: string]: number } } = {};

  const dateMap = new Map<string, { [ticker: string]: number }>();
  const dates = new Set<string>();

  for (const ticker of tickers) {
    const rets = returns[ticker] || [];
    for (const r of rets) {
      const dateKey = r.date.toISOString().split("T")[0];
      dates.add(dateKey);
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {});
      }
      const dateData = dateMap.get(dateKey);
      if (dateData) {
        dateData[ticker] = r.return;
      }
    }
  }

  const sortedDates = Array.from(dates).sort().slice(-window);

  for (const ticker1 of tickers) {
    covariance[ticker1] = {};
    for (const ticker2 of tickers) {
      const pairs: Array<{ v1: number; v2: number }> = [];
      for (const dateKey of sortedDates) {
        const data = dateMap.get(dateKey);
        if (data?.[ticker1] !== undefined && data?.[ticker2] !== undefined) {
          pairs.push({ v1: data[ticker1], v2: data[ticker2] });
        }
      }

      if (pairs.length < 2) {
        covariance[ticker1][ticker2] = 0;
        continue;
      }

      const mean1 = pairs.reduce((sum, p) => sum + p.v1, 0) / pairs.length;
      const mean2 = pairs.reduce((sum, p) => sum + p.v2, 0) / pairs.length;
      let cov = 0;
      for (const pair of pairs) {
        cov += (pair.v1 - mean1) * (pair.v2 - mean2);
      }
      covariance[ticker1][ticker2] = cov / (pairs.length - 1);
    }
  }

  return covariance;
}

export function computePortfolioVariance(
  weights: { [ticker: string]: number },
  covariance: { [ticker: string]: { [ticker: string]: number } }
): number {
  let variance = 0;
  const tickers = Object.keys(weights);

  for (const ticker1 of tickers) {
    for (const ticker2 of tickers) {
      variance += weights[ticker1] * weights[ticker2] * (covariance[ticker1]?.[ticker2] || 0);
    }
  }

  return variance * 252;
}

