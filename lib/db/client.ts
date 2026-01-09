import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  console.warn("DATABASE_URL not set. Database features will not work.");
}

let client: ReturnType<typeof postgres> | null = null;
try {
  client = connectionString ? postgres(connectionString) : null;
} catch (e) {
  console.error("Failed to create database client", e);
  client = null;
}

export const db = client ? drizzle(client, { schema }) : null as any;

