import { PricePoint } from "./returns";
import { ReturnPoint, computeLogReturns } from "./returns";
import { computeVol20 } from "./regime";
import { RegimeLabel } from "./regime";

export interface SimilarWindow {
  startDate: Date;
  distance: number;
  spyVol20: number;
  spyLast20Return: number;
  forwardReturns: {
    h5: number;
    h20: number;
    h60: number;
  };
}

export interface SimilarConditionsResult {
  windows: SimilarWindow[];
  summaries: {
    h5: { median: number; p10: number; p90: number; hitRate: number };
    h20: { median: number; p10: number; p90: number; hitRate: number };
    h60: { median: number; p10: number; p90: number; hitRate: number };
  };
}

export function findSimilarConditions(
  currentRegime: RegimeLabel,
  currentFeatures: {
    vol20: number;
    last20Return: number;
    trend: number;
  },
  historicalPrices: PricePoint[],
  historicalReturns: ReturnPoint[],
  portfolioForwardReturns: { [dateKey: string]: { h5: number; h20: number; h60: number } },
  k: number = 50
): SimilarConditionsResult {
  const windowLength = 20;
  const candidates: Array<{
    date: Date;
    vol20: number;
    last20Return: number;
    trend: number;
    distance: number;
  }> = [];

  for (let i = windowLength; i < historicalPrices.length - 60; i++) {
    const windowPrices = historicalPrices.slice(i - windowLength, i);
    const windowReturns = historicalReturns.slice(i - windowLength, i);

    if (windowPrices.length < windowLength || windowReturns.length < windowLength) {
      continue;
    }

    const vol20 = computeVol20(windowReturns);
    const startPrice = windowPrices[0].price;
    const endPrice = windowPrices[windowPrices.length - 1].price;
    const last20Return = Math.log(endPrice / startPrice);

    const ma50 = windowPrices.slice(-50).reduce((sum, p) => sum + p.price, 0) / Math.min(50, windowPrices.length);
    const ma200 = windowPrices.slice(-200).reduce((sum, p) => sum + p.price, 0) / Math.min(200, windowPrices.length);
    const trend = ma50 > ma200 ? 1 : 0;

    candidates.push({
      date: windowPrices[windowPrices.length - 1].date,
      vol20,
      last20Return,
      trend,
      distance: 0,
    });
  }

  if (candidates.length === 0) {
    return {
      windows: [],
      summaries: {
        h5: { median: 0, p10: 0, p90: 0, hitRate: 0 },
        h20: { median: 0, p10: 0, p90: 0, hitRate: 0 },
        h60: { median: 0, p10: 0, p90: 0, hitRate: 0 },
      },
    };
  }

  const vol20Values = candidates.map((c) => c.vol20);
  const return20Values = candidates.map((c) => c.last20Return);

  const volMean = vol20Values.reduce((a, b) => a + b, 0) / vol20Values.length;
  const volStd = Math.sqrt(
    vol20Values.reduce((sum, v) => sum + Math.pow(v - volMean, 2), 0) / vol20Values.length
  );

  const retMean = return20Values.reduce((a, b) => a + b, 0) / return20Values.length;
  const retStd = Math.sqrt(
    return20Values.reduce((sum, v) => sum + Math.pow(v - retMean, 2), 0) / return20Values.length
  );

  for (const candidate of candidates) {
    const zVol = volStd > 0 ? (candidate.vol20 - volMean) / volStd : 0;
    const zRet = retStd > 0 ? (candidate.last20Return - retMean) / retStd : 0;
    const zTrend = candidate.trend;

    const zVolCurrent = volStd > 0 ? (currentFeatures.vol20 - volMean) / volStd : 0;
    const zRetCurrent = retStd > 0 ? (currentFeatures.last20Return - retMean) / retStd : 0;
    const zTrendCurrent = currentFeatures.trend;

    const distance = Math.sqrt(
      Math.pow(zVol - zVolCurrent, 2) +
      Math.pow(zRet - zRetCurrent, 2) +
      Math.pow(zTrend - zTrendCurrent, 2)
    );

    candidate.distance = distance;
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const topK = candidates.slice(0, k);

  const windows: SimilarWindow[] = [];
  for (const candidate of topK) {
    const dateKey = candidate.date.toISOString().split("T")[0];
    const forward = portfolioForwardReturns[dateKey] || { h5: 0, h20: 0, h60: 0 };

    windows.push({
      startDate: candidate.date,
      distance: candidate.distance,
      spyVol20: candidate.vol20,
      spyLast20Return: candidate.last20Return,
      forwardReturns: forward,
    });
  }

  const h5Returns = windows.map((w) => w.forwardReturns.h5).filter((r) => isFinite(r));
  const h20Returns = windows.map((w) => w.forwardReturns.h20).filter((r) => isFinite(r));
  const h60Returns = windows.map((w) => w.forwardReturns.h60).filter((r) => isFinite(r));

  function computeSummary(returns: number[]) {
    if (returns.length === 0) {
      return { median: 0, p10: 0, p90: 0, hitRate: 0 };
    }
    const sorted = [...returns].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const p10 = sorted[Math.floor(sorted.length * 0.1)];
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    const hitRate = returns.filter((r) => r > 0).length / returns.length;
    return { median, p10, p90, hitRate };
  }

  return {
    windows,
    summaries: {
      h5: computeSummary(h5Returns),
      h20: computeSummary(h20Returns),
      h60: computeSummary(h60Returns),
    },
  };
}

