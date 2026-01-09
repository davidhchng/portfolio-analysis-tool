import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { priceDaily } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { normalizeTicker, normalizeWeights } from "@/lib/utils/validation";
import { computeLogReturns, computePortfolioReturns, PricePoint, ReturnPoint } from "@/lib/analytics/returns";
import {
  computeAnnualizedVolatility,
  computeRollingVolatility,
  computeMaxDrawdown,
  computeBeta,
  computeHHI,
  computeNEffective,
  computeCovarianceMatrix,
  computePortfolioVariance,
  computePCR,
} from "@/lib/analytics/metrics";
import { detectRegime, computeMA } from "@/lib/analytics/regime";
import { findSimilarConditions } from "@/lib/analytics/similar";

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { portfolio } = body;

    if (!portfolio || typeof portfolio !== "object") {
      return NextResponse.json({ ok: false, error: "portfolio object required" }, { status: 400 });
    }

    const tickers = Object.keys(portfolio).map(normalizeTicker);
    const rawWeights = tickers.map((t) => portfolio[t] || 0);
    const weights = normalizeWeights(rawWeights);
    const weightMap: { [ticker: string]: number } = {};
    tickers.forEach((t, i) => {
      weightMap[t] = weights[i];
    });

    if (tickers.length === 0) {
      return NextResponse.json({ ok: false, error: "At least one ticker required" }, { status: 400 });
    }

    const assetPrices: { [ticker: string]: PricePoint[] } = {};
    const assetReturns: { [ticker: string]: ReturnPoint[] } = {};

    for (const ticker of tickers) {
      const prices = await db
        .select()
        .from(priceDaily)
        .where(eq(priceDaily.ticker, ticker))
        .orderBy(priceDaily.date);

      if (prices.length === 0) {
        return NextResponse.json({ ok: false, error: `No price data for ${ticker}` }, { status: 400 });
      }

      assetPrices[ticker] = prices.map((p: { date: string | Date; close: string }) => ({
        date: new Date(p.date),
        price: parseFloat(p.close),
      }));

      assetReturns[ticker] = computeLogReturns(assetPrices[ticker]);
    }

    const portfolioReturns = computePortfolioReturns(assetReturns, weightMap);

    if (portfolioReturns.length < 2) {
      return NextResponse.json({ ok: false, error: "Insufficient data for analysis" }, { status: 400 });
    }

    const annualizedVol = computeAnnualizedVolatility(portfolioReturns);
    const rollingVol20 = computeRollingVolatility(portfolioReturns, 20);
    const maxDrawdown = computeMaxDrawdown(portfolioReturns);

    const spyPrices = await db
      .select()
      .from(priceDaily)
      .where(eq(priceDaily.ticker, "SPY"))
      .orderBy(priceDaily.date);

    let beta = null;
    let rSquared = null;

    if (spyPrices.length > 0) {
      const spyPricePoints: PricePoint[] = spyPrices.map((p: { date: string | Date; close: string }) => ({
        date: new Date(p.date),
        price: parseFloat(p.close),
      }));
      const spyReturns = computeLogReturns(spyPricePoints);
      const betaResult = computeBeta(portfolioReturns, spyReturns);
      beta = betaResult.beta;
      rSquared = betaResult.rSquared;
    }

    const hhi = computeHHI(weightMap);
    const nEffective = computeNEffective(hhi);

    const covariance = computeCovarianceMatrix(assetReturns, 252);
    const portfolioVariance = computePortfolioVariance(weightMap, covariance);
    const pcr = computePCR(weightMap, covariance, portfolioVariance);

    const pcrEntries = Object.entries(pcr).sort((a, b) => b[1] - a[1]);
    const top3Pcr = pcrEntries.slice(0, 3).reduce((sum, [, val]) => sum + val, 0);

    const spyPricePoints: PricePoint[] = spyPrices.map((p: { date: string | Date; close: string }) => ({
      date: new Date(p.date),
      price: parseFloat(p.close),
    }));

    const spyReturns = computeLogReturns(spyPricePoints);
    const regime = detectRegime(spyPricePoints, spyReturns);

    const currentFeatures = {
      vol20: regime.features.vol20,
      last20Return: spyPricePoints.length >= 20
        ? Math.log(
            spyPricePoints[spyPricePoints.length - 1].price /
            spyPricePoints[spyPricePoints.length - 20].price
          )
        : 0,
      trend: regime.features.trend === "UP" ? 1 : 0,
    };

    const portfolioForwardReturns: { [dateKey: string]: { h5: number; h20: number; h60: number } } = {};

    for (let i = 20; i < Math.min(portfolioReturns.length - 60, portfolioReturns.length - 1); i++) {
      const dateKey = portfolioReturns[i].date.toISOString().split("T")[0];
      const h5 = portfolioReturns.slice(i + 1, Math.min(i + 6, portfolioReturns.length)).reduce((sum, r) => sum + r.return, 0);
      const h20 = portfolioReturns.slice(i + 1, Math.min(i + 21, portfolioReturns.length)).reduce((sum, r) => sum + r.return, 0);
      const h60 = portfolioReturns.slice(i + 1, Math.min(i + 61, portfolioReturns.length)).reduce((sum, r) => sum + r.return, 0);
      portfolioForwardReturns[dateKey] = { h5, h20, h60 };
    }

    const similar = findSimilarConditions(
      regime.label,
      currentFeatures,
      spyPricePoints,
      spyReturns,
      portfolioForwardReturns,
      50
    );

    return NextResponse.json({
      ok: true,
      metrics: {
        annualizedVol,
        rollingVol20,
        maxDrawdown,
        beta,
        rSquared,
        hhi,
        nEffective,
        pcr,
        top3Pcr,
      },
      regime,
      similar,
      portfolio: weightMap,
      lastUpdate: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

