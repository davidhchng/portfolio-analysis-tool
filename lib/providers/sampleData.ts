import { MarketDataProvider, DailyCandle, Quote } from "./marketData";

export class SampleDataProvider implements MarketDataProvider {
  private sampleData: { [ticker: string]: DailyCandle[] } = {};

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const tickers = ["SPY", "AAPL", "MSFT"];
    const baseDate = new Date();
    baseDate.setFullYear(baseDate.getFullYear() - 2);

    for (const ticker of tickers) {
      const candles: DailyCandle[] = [];
      let price = ticker === "SPY" ? 400 : ticker === "AAPL" ? 150 : 300;
      const currentDate = new Date(baseDate);

      for (let i = 0; i < 500; i++) {
        const randomChange = (Math.random() - 0.5) * 0.02;
        price = price * (1 + randomChange);
        candles.push({
          date: new Date(currentDate),
          close: price,
          volume: Math.floor(Math.random() * 10000000) + 1000000,
        });
        currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate.getDay() === 0) currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate.getDay() === 6) currentDate.setDate(currentDate.getDate() + 2);
      }

      this.sampleData[ticker] = candles;
    }
  }

  async getDailyCandles(ticker: string, from: Date, to: Date): Promise<DailyCandle[]> {
    const candles = this.sampleData[ticker.toUpperCase()] || [];
    return candles.filter((c) => c.date >= from && c.date <= to);
  }

  async getQuote(ticker: string): Promise<Quote | null> {
    const candles = this.sampleData[ticker.toUpperCase()];
    if (!candles || candles.length === 0) {
      return null;
    }
    const last = candles[candles.length - 1];
    return {
      price: last.close,
      timestamp: new Date(),
    };
  }
}

