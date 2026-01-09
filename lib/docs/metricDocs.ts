export interface MetricDoc {
  name: string;
  formula: string;
  description: string;
  unit?: string;
}

export const METRIC_DOCS: { [key: string]: MetricDoc } = {
  annualizedVol: {
    name: "Annualized Volatility",
    formula: "σ = √(252) × stdev(r_p)",
    description: "Standard deviation of portfolio log returns, annualized by multiplying by √252 (trading days per year).",
    unit: "decimal (e.g., 0.15 = 15%)",
  },
  rollingVol20: {
    name: "Rolling 20-Day Volatility",
    formula: "σ_20 = √(252) × stdev(last 20 returns)",
    description: "Annualized volatility computed over the most recent 20 trading days.",
    unit: "decimal",
  },
  maxDrawdown: {
    name: "Maximum Drawdown",
    formula: "MDD = max((peak - trough) / peak)",
    description: "Largest peak-to-trough decline in the portfolio equity curve over the analysis period.",
    unit: "decimal (e.g., 0.25 = 25% drawdown)",
  },
  beta: {
    name: "Beta to SPY",
    formula: "β = Cov(r_p, r_SPY) / Var(r_SPY)",
    description: "OLS regression coefficient from regressing portfolio returns on SPY returns over 252 trading days. Measures sensitivity to market movements.",
    unit: "dimensionless",
  },
  rSquared: {
    name: "R-squared",
    formula: "R² = (Cov(r_p, r_SPY) / (σ_p × σ_SPY))²",
    description: "Proportion of portfolio return variance explained by SPY returns. Higher values indicate stronger market correlation.",
    unit: "decimal (0 to 1)",
  },
  hhi: {
    name: "Herfindahl-Hirschman Index",
    formula: "HHI = Σ w_i²",
    description: "Sum of squared portfolio weights. Higher values indicate greater concentration.",
    unit: "decimal (0 to 1)",
  },
  nEffective: {
    name: "Effective Number of Assets",
    formula: "N_eff = 1 / HHI",
    description: "Diversification metric. Equal-weighted portfolio of N assets has N_eff = N.",
    unit: "dimensionless",
  },
  pcr: {
    name: "Percent Contribution to Risk",
    formula: "PCR_i = (w_i × (Σw)_i) / (w'Σw)",
    description: "Each asset's contribution to total portfolio variance, computed using the covariance matrix over 252 days.",
    unit: "decimal (sums to 1.0)",
  },
  regime: {
    name: "Market Regime",
    formula: "Deterministic classification based on trend (MA50 vs MA200) and volatility state (vol20 vs historical quantiles).",
    description: "Current market regime label: Bull/LowVol, Bull/HighVol, Bear/HighVol, Bear/LowVol, or Chop/MidVol.",
    unit: "label",
  },
  similarConditions: {
    name: "Similar Historical Conditions",
    formula: "KNN with K=50, features: [z(vol20), z(last20d return), trend indicator], distance: Euclidean on standardized features.",
    description: "Finds K=50 historical windows with the same regime label and similar feature values. Shows conditional forward return distributions at 5, 20, and 60 trading day horizons.",
    unit: "historical matches",
  },
};

export function getMetricDoc(key: string): MetricDoc | null {
  return METRIC_DOCS[key] || null;
}

