import { NextRequest, NextResponse } from "next/server";
import { isMarketHours } from "@/lib/utils/time";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isMarketHours()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Outside market hours" });
  }

  try {
    const response = await fetch(`${request.nextUrl.origin}/api/ingest/intraday`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
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

