const fetch = require("node-fetch");

async function ingestIntraday() {
  const tickers = process.argv.slice(2);

  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";

  try {
    const response = await fetch(`${baseUrl}/api/ingest/intraday`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tickers.length > 0 ? { tickers } : {}),
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

ingestIntraday();

