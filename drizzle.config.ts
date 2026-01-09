import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  console.warn("DATABASE_URL not set. You can get the connection string from Supabase Dashboard → Settings → Database → Connection string (URI mode)");
}

export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
} satisfies Config;

