import { pgTable, text, timestamp, date, numeric, bigint, uuid, jsonb, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const assets = pgTable("assets", {
  ticker: text("ticker").primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastDailyFetch: timestamp("last_daily_fetch", { withTimezone: true }),
  lastIntradayFetch: timestamp("last_intraday_fetch", { withTimezone: true }),
});

export const priceDaily = pgTable("price_daily", {
  ticker: text("ticker").notNull().references(() => assets.ticker),
  date: date("date").notNull(),
  close: numeric("close", { precision: 12, scale: 4 }).notNull(),
  volume: bigint("volume", { mode: "number" }),
  source: text("source").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: { primaryKey: [table.ticker, table.date] },
}));

export const priceIntraday = pgTable("price_intraday", {
  ticker: text("ticker").notNull().references(() => assets.ticker),
  ts: timestamp("ts", { withTimezone: true }).notNull(),
  price: numeric("price", { precision: 12, scale: 4 }).notNull(),
  source: text("source").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: { primaryKey: [table.ticker, table.ts] },
}));

export const watchedTickers = pgTable("watched_tickers", {
  ticker: text("ticker").primaryKey().references(() => assets.ticker),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const computedRuns = pgTable("computed_runs", {
  runId: uuid("run_id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  portfolioJson: jsonb("portfolio_json").notNull(),
  resultsJson: jsonb("results_json").notNull(),
  regimeJson: jsonb("regime_json").notNull(),
  matchesJson: jsonb("matches_json").notNull(),
  metaJson: jsonb("meta_json"),
});

