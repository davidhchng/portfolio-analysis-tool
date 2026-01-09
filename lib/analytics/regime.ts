import { PricePoint } from "./returns";
import { ReturnPoint, computeLogReturns } from "./returns";
import { computeAnnualizedVolatility } from "./metrics";

export type Trend = "UP" | "DOWN";
export type VolState = "LOW" | "MID" | "HIGH";
export type RegimeLabel =
  | "Bull/LowVol"
  | "Bull/HighVol"
  | "Bear/HighVol"
  | "Bear/LowVol"
  | "Chop/MidVol";

export interface RegimeFeatures {
  ma50: number;
  ma200: number;
  vol20: number;
  trend: Trend;
  volState: VolState;
  stress: boolean;
}

export interface RegimeResult {
  label: RegimeLabel;
  features: RegimeFeatures;
  thresholds: {
    volQ33: number;
    volQ66: number;
  };
}

export function computeMA(prices: PricePoint[], window: number): number {
  if (prices.length < window) {
    return 0;
  }
  const recent = prices.slice(-window);
  return recent.reduce((sum, p) => sum + p.price, 0) / recent.length;
}

export function computeVol20(returns: ReturnPoint[]): number {
  if (returns.length < 20) {
    return 0;
  }
  const recent = returns.slice(-20);
  return computeAnnualizedVolatility(recent);
}

export function computeVolThresholds(vol20History: number[]): {
  q33: number;
  q66: number;
} {
  if (vol20History.length === 0) {
    return { q33: 0, q66: 0 };
  }
  const sorted = [...vol20History].sort((a, b) => a - b);
  const q33Idx = Math.floor(sorted.length * 0.33);
  const q66Idx = Math.floor(sorted.length * 0.66);
  return {
    q33: sorted[q33Idx] || 0,
    q66: sorted[q66Idx] || 0,
  };
}

export function detectRegime(
  prices: PricePoint[],
  returns: ReturnPoint[],
  vix?: number
): RegimeResult {
  if (prices.length < 200 || returns.length < 20) {
    return {
      label: "Chop/MidVol",
      features: {
        ma50: 0,
        ma200: 0,
        vol20: 0,
        trend: "UP",
        volState: "MID",
        stress: false,
      },
      thresholds: { volQ33: 0, volQ66: 0 },
    };
  }

  const ma50 = computeMA(prices, 50);
  const ma200 = computeMA(prices, 200);
  const vol20 = computeVol20(returns);

  const trend: Trend = ma50 > ma200 ? "UP" : "DOWN";

  const allVol20: number[] = [];
  for (let i = 20; i <= returns.length; i++) {
    const window = returns.slice(i - 20, i);
    allVol20.push(computeAnnualizedVolatility(window));
  }

  const thresholds = computeVolThresholds(allVol20);
  let volState: VolState;
  if (vol20 <= thresholds.q33) {
    volState = "LOW";
  } else if (vol20 <= thresholds.q66) {
    volState = "MID";
  } else {
    volState = "HIGH";
  }

  let stress = false;
  if (vix !== undefined) {
    const vixThreshold = 25;
    stress = vix > vixThreshold;
  }

  let label: RegimeLabel;
  if (stress && volState === "HIGH") {
    label = trend === "UP" ? "Bull/HighVol" : "Bear/HighVol";
  } else if (volState === "HIGH") {
    label = trend === "UP" ? "Bull/HighVol" : "Bear/HighVol";
  } else if (volState === "MID" && Math.abs(ma50 / ma200 - 1) < 0.01) {
    label = "Chop/MidVol";
  } else if (volState === "LOW") {
    label = trend === "UP" ? "Bull/LowVol" : "Bear/LowVol";
  } else {
    label = trend === "UP" ? "Bull/LowVol" : "Bear/LowVol";
  }

  return {
    label,
    features: {
      ma50,
      ma200,
      vol20,
      trend,
      volState,
      stress,
    },
    thresholds,
  };
}

