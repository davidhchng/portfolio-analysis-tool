import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    marketData: !!process.env.MARKET_DATA_API_KEY,
    ai: !!process.env.AI_API_KEY,
  });
}

