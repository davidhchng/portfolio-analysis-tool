const fetch = require("node-fetch");

async function ingestDaily() {
  const tickers = process.argv.slice(2);
  if (tickers.length === 0) {
    console.error("Usage: node scripts/ingest-daily.js TICKER1 TICKER2 ...");
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/ingest/daily`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers, force: false }),
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

ingestDaily();

