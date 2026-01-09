import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { watchedTickers, assets } from "@/drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { normalizeTicker } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { tickers, action } = body;

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ ok: false, error: "tickers array required" }, { status: 400 });
    }

    const normalizedTickers = tickers.map(normalizeTicker);

    if (action === "add") {
      for (const ticker of normalizedTickers) {
        await db.insert(assets).values({ ticker }).onConflictDoNothing();
        await db.insert(watchedTickers).values({ ticker }).onConflictDoNothing();
      }
    } else if (action === "remove") {
      await db.delete(watchedTickers).where(inArray(watchedTickers.ticker, normalizedTickers));
    }

    return NextResponse.json({ ok: true, tickers: normalizedTickers });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

