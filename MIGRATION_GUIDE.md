# Database Migration Guide

## Running Migrations

After setting up your Supabase project and configuring DATABASE_URL:

1. Generate migrations from schema:
```bash
npm run db:generate
```

This creates SQL migration files in `drizzle/migrations/`.

2. Apply migrations:

Option A: Using Drizzle (if connection works):
```bash
npm run db:migrate
```

Option B: Manual (recommended for Supabase):
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of each migration file in `drizzle/migrations/`
3. Run them in order

## Initial Schema

The schema includes:
- `assets` table for ticker metadata
- `price_daily` table for daily price data
- `price_intraday` table for intraday data (optional)
- `watched_tickers` table for scheduled updates
- `computed_runs` table for analysis results cache

## Required Extensions

Ensure `pgcrypto` extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Connection String Format

For Supabase, use the connection string from:
Dashboard → Settings → Database → Connection string (URI mode)

Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

Replace `[PASSWORD]` with your database password and `[HOST]` with your Supabase host.

