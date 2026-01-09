import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { assets, priceDaily } from "@/drizzle/schema";
import { eq, and, gte } from "drizzle-orm";
import { getMarketDataProvider } from "@/lib/providers/marketData";
import { normalizeTicker } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { tickers, force } = body;

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ ok: false, error: "tickers array required" }, { status: 400 });
    }

    const provider = getMarketDataProvider();
    if (!provider) {
      return NextResponse.json({ ok: false, error: "Market data provider not configured" }, { status: 500 });
    }

    const normalizedTickers = tickers.map(normalizeTicker);
    const results: Array<{
      ticker: string;
      rowsUpserted: number;
      lastDate: string | null;
      error?: string;
    }> = [];

    for (const ticker of normalizedTickers) {
      try {
        await db.insert(assets).values({
          ticker,
          lastDailyFetch: new Date(),
        }).onConflictDoUpdate({
          target: assets.ticker,
          set: {
            lastDailyFetch: new Date(),
          },
        });

        const existing = await db
          .select()
          .from(priceDaily)
          .where(eq(priceDaily.ticker, ticker))
          .orderBy(priceDaily.date);

        let fromDate = new Date();
        fromDate.setFullYear(fromDate.getFullYear() - 5);

        if (!force && existing.length > 0) {
          const sorted = existing.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const lastDate = new Date(sorted[0].date);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastDate >= yesterday) {
            results.push({
              ticker,
              rowsUpserted: 0,
              lastDate: lastDate.toISOString().split("T")[0],
            });
            continue;
          }
          fromDate = lastDate;
        }

        const toDate = new Date();
        const candles = await provider.getDailyCandles(ticker, fromDate, toDate);

        if (candles.length === 0) {
          results.push({
            ticker,
            rowsUpserted: 0,
            lastDate: null,
            error: "No data returned",
          });
          continue;
        }

        let upserted = 0;
        for (const candle of candles) {
          await db.insert(priceDaily).values({
            ticker,
            date: candle.date.toISOString().split("T")[0],
            close: candle.close.toString(),
            volume: candle.volume ? BigInt(candle.volume) : null,
            source: "finnhub",
          }).onConflictDoUpdate({
            target: [priceDaily.ticker, priceDaily.date],
            set: {
              close: candle.close.toString(),
              volume: candle.volume ? BigInt(candle.volume) : null,
            },
          });
          upserted++;
        }

        const lastDate = candles[candles.length - 1]?.date.toISOString().split("T")[0] || null;

        results.push({
          ticker,
          rowsUpserted: upserted,
          lastDate,
        });
      } catch (error) {
        results.push({
          ticker,
          rowsUpserted: 0,
          lastDate: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      tickersIngested: normalizedTickers.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

