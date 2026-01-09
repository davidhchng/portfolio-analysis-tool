export interface MarketDataProvider {
  getDailyCandles(ticker: string, from: Date, to: Date): Promise<DailyCandle[]>;
  getQuote(ticker: string): Promise<Quote | null>;
}

export interface DailyCandle {
  date: Date;
  close: number;
  volume?: number;
}

export interface Quote {
  price: number;
  timestamp: Date;
}

export class FinnhubProvider implements MarketDataProvider {
  private apiKey: string;
  private baseUrl = "https://finnhub.io/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getDailyCandles(ticker: string, from: Date, to: Date): Promise<DailyCandle[]> {
    const fromUnix = Math.floor(from.getTime() / 1000);
    const toUnix = Math.floor(to.getTime() / 1000);

    const url = `${this.baseUrl}/stock/candle?symbol=${ticker}&resolution=D&from=${fromUnix}&to=${toUnix}&token=${this.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("RATE_LIMIT");
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.s !== "ok") {
        throw new Error(`API error: ${data.s}`);
      }

      const candles: DailyCandle[] = [];
      if (data.t && data.c) {
        for (let i = 0; i < data.t.length; i++) {
          candles.push({
            date: new Date(data.t[i] * 1000),
            close: data.c[i],
            volume: data.v ? data.v[i] : undefined,
          });
        }
      }

      return candles;
    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMIT") {
        throw error;
      }
      throw new Error(`Failed to fetch daily candles for ${ticker}: ${error}`);
    }
  }

  async getQuote(ticker: string): Promise<Quote | null> {
    const url = `${this.baseUrl}/quote?symbol=${ticker}&token=${this.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("RATE_LIMIT");
        }
        return null;
      }

      const data = await response.json();
      if (!data.c || data.c === 0) {
        return null;
      }

      return {
        price: data.c,
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof Error && error.message === "RATE_LIMIT") {
        throw error;
      }
      return null;
    }
  }
}

export function getMarketDataProvider(): MarketDataProvider | null {
  const apiKey = process.env.MARKET_DATA_API_KEY;
  if (apiKey) {
    return new FinnhubProvider(apiKey);
  }
  if (process.env.NODE_ENV === "development") {
    try {
      const { SampleDataProvider } = require("./sampleData");
      return new SampleDataProvider();
    } catch (e) {
      console.warn("Sample data provider not available", e);
    }
  }
  return null;
}

