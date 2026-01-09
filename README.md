# Portfolio Risk & Regime Analyzer

Interactive Portfolio Risk & Regime Analyzer that uses near-real-time market data, a continuously-updating database, deterministic risk/regime analytics, and an optional AI explanation layer.

## Features

- Portfolio builder with ticker and weight inputs
- Deterministic risk metrics (volatility, beta, max drawdown, concentration)
- Market regime detection based on trend and volatility
- Similar historical conditions matching (KNN)
- Conditional forward return distributions
- Optional AI explanations (grounded, no predictions)
- Daily and intraday data ingestion with caching
- Scheduled updates via Vercel Cron

## Fast Start (Local)

### 1. Create the project

```bash
npx create-next-app@latest portfolio-regime --ts --app
cd portfolio-regime
```

### 2. Install dependencies

```bash
npm install drizzle-orm drizzle-kit @supabase/supabase-js zod recharts lucide-react date-fns date-fns-tz
npm install -D tailwindcss postcss autoprefixer tailwindcss-animate
```

### 3. Add shadcn/ui

```bash
npx shadcn@latest init
```

Choose:
- style: default
- base color: slate
- css variables: yes

### 4. Create Supabase project and get keys

Manual steps:
1. Go to [Supabase dashboard](https://supabase.com)
2. Create new project
3. Project settings → API:
   - Copy Project URL
   - Copy anon public key
   - Copy service role key (keep secret)
4. Project settings → Database:
   - Ensure extensions include `pgcrypto` (for gen_random_uuid)
   - If not enabled, run: `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`
   - Copy Connection string (URI mode) for DATABASE_URL

### 5. Create .env.local

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
MARKET_DATA_API_KEY=your_finnhub_api_key
AI_API_KEY=
EOF
```

Note: Replace `[PASSWORD]` and `[HOST]` in DATABASE_URL with values from Supabase Dashboard → Settings → Database → Connection string (URI mode).

### 6. Set up database

```bash
npm run db:generate
npm run db:migrate
```

Note: For Supabase, you may need to run migrations manually in the SQL editor, or use the connection string format in drizzle.config.ts.

### 7. Run dev server

```bash
npm run dev
```

## Finnhub API Key

1. Create an account at [finnhub.io](https://finnhub.io)
2. Generate an API key
3. Add it to `MARKET_DATA_API_KEY` in `.env.local`

The app will test the key on `/setup` by calling a lightweight endpoint server-side.

## Database Schema

The app uses the following tables:
- `assets`: Ticker metadata and last fetch timestamps
- `price_daily`: Daily closing prices
- `price_intraday`: Intraday prices (optional, for watched tickers)
- `watched_tickers`: Tickers to update on schedule
- `computed_runs`: Analysis results cache

## Consistently Updated Database (Local Dev)

For local development, use manual refresh buttons in the UI:
- "Refresh Daily Cache": Fetches daily data for portfolio tickers
- "Refresh Live Cache": Fetches intraday quotes for watched tickers

Alternatively, run ingestion scripts:
```bash
npm run ingest:daily
npm run ingest:intraday
```

## Deploy to Vercel + Cron

### 1. Push to GitHub

Create a repository and push your code.

### 2. Import in Vercel

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Follow the setup wizard

### 3. Set environment variables

In Vercel project settings → Environment Variables, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MARKET_DATA_API_KEY`
- `AI_API_KEY` (optional)
- `CRON_SECRET` (for cron endpoint authentication)

### 4. Add Vercel Cron jobs

The `vercel.json` file is already configured with:
- `/api/cron/intraday`: Every 5 minutes during market hours (13-21 UTC, Mon-Fri)
- `/api/cron/daily`: Daily at 2 AM UTC (Tue-Sat, after market close)

Market hours are gated in code using America/New_York timezone, so cron calls outside hours will no-op.

## Architecture

### Frontend
- Next.js 14+ App Router with TypeScript
- Tailwind CSS + shadcn/ui components
- Recharts for data visualization

### Backend
- Next.js Route Handlers (`/app/api/*`)
- Server-only analytics module (pure TypeScript, unit-testable)
- Drizzle ORM for database access

### Database
- Supabase Postgres
- Drizzle migrations

### Market Data
- Finnhub provider (default)
- Provider interface for easy swapping
- Rate limiting and error handling

### Analytics
- Returns computation (log and simple)
- Risk metrics (volatility, beta, drawdown, concentration)
- Regime detection (trend + volatility state)
- Similar conditions matching (KNN)

## Metric Definitions

All metrics are documented in `/logic` page and in `lib/docs/metricDocs.ts`. Key metrics:

- **Annualized Volatility**: σ = √(252) × stdev(r_p)
- **Max Drawdown**: Largest peak-to-trough decline
- **Beta**: OLS regression coefficient vs SPY
- **PCR**: Percent contribution to risk using covariance matrix
- **Regime**: Deterministic classification based on MA50/MA200 and vol20 quantiles

## AI Explanation (Optional)

If `AI_API_KEY` is set, the AI Explanation tab becomes available. The AI layer:
- Only explains computed outputs
- No predictions or "will" statements
- No trade recommendations
- Grounded in computed JSON data
- Hard guardrails enforced

## Development

### Project Structure

```
/app
  /api          # Route handlers
  /page.tsx     # Main UI
  /setup        # Setup instructions
  /logic        # Metric definitions
/lib
  /analytics    # Pure TypeScript analytics
  /db           # Database clients
  /providers    # Market data providers
  /docs         # Metric documentation
  /utils        # Utilities
/drizzle
  schema.ts     # Database schema
  migrations/   # Migration files
```

### Running Tests

Basic analytics functions can be unit tested. Example:

```typescript
import { computeAnnualizedVolatility } from "@/lib/analytics/metrics";
// ... test implementation
```

## License

MIT

## Disclaimer

This tool produces conditional historical summaries and risk diagnostics. It does NOT provide predictions or trading advice. All outputs are based on deterministic calculations of historical data.
