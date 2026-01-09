import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { assets, priceIntraday, watchedTickers } from "@/drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { getMarketDataProvider } from "@/lib/providers/marketData";
import { normalizeTicker } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { tickers } = body;

    const provider = getMarketDataProvider();
    if (!provider) {
      return NextResponse.json({ ok: false, error: "Market data provider not configured" }, { status: 500 });
    }

    let targetTickers: string[];
    if (tickers && Array.isArray(tickers) && tickers.length > 0) {
      targetTickers = tickers.map(normalizeTicker);
    } else {
      const watched = await db.select().from(watchedTickers);
      targetTickers = watched.map((w) => w.ticker);
    }

    if (targetTickers.length === 0) {
      return NextResponse.json({ ok: true, tickers: [], pointsUpserted: 0 });
    }

    let totalUpserted = 0;
    const results: Array<{ ticker: string; pointsUpserted: number; error?: string }> = [];

    for (const ticker of targetTickers) {
      try {
        const quote = await provider.getQuote(ticker);
        if (!quote) {
          results.push({ ticker, pointsUpserted: 0, error: "No quote available" });
          continue;
        }

        await db.insert(priceIntraday).values({
          ticker,
          ts: quote.timestamp,
          price: quote.price.toString(),
          source: "finnhub",
        }).onConflictDoUpdate({
          target: [priceIntraday.ticker, priceIntraday.ts],
          set: {
            price: quote.price.toString(),
            source: "finnhub",
          },
        });

        await db.update(assets).set({ lastIntradayFetch: new Date() }).where(eq(assets.ticker, ticker));

        totalUpserted++;
        results.push({ ticker, pointsUpserted: 1 });
      } catch (error) {
        results.push({
          ticker,
          pointsUpserted: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      tickers: targetTickers,
      pointsUpserted: totalUpserted,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

