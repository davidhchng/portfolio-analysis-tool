import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { watchedTickers } from "@/drizzle/schema";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!db) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 500 });
  }

  try {
    const watched = await db.select().from(watchedTickers);
    const tickers = watched.map((w) => w.ticker);

    if (tickers.length === 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: "No watched tickers" });
    }

    const response = await fetch(`${request.nextUrl.origin}/api/ingest/daily`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers, force: false }),
    });

    const data = await response.json();
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

