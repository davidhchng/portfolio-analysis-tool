"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function SetupPage() {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean;
    supabaseAnon: boolean;
    supabaseService: boolean;
    marketData: boolean;
    ai: boolean;
  }>({
    supabaseUrl: false,
    supabaseAnon: false,
    supabaseService: false,
    marketData: false,
    ai: false,
  });

  useEffect(() => {
    const checkEnv = async () => {
      try {
        const response = await fetch("/api/setup/check");
        const data = await response.json();
        setEnvStatus(data);
      } catch (err) {
        console.error("Failed to check environment", err);
      }
    };
    checkEnv();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Setup Instructions</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment Variables Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {envStatus.supabaseUrl ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span>NEXT_PUBLIC_SUPABASE_URL</span>
              </div>
              <div className="flex items-center gap-2">
                {envStatus.supabaseAnon ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              </div>
              <div className="flex items-center gap-2">
                {envStatus.supabaseService ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span>SUPABASE_SERVICE_ROLE_KEY</span>
              </div>
              <div className="flex items-center gap-2">
                {envStatus.marketData ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span>MARKET_DATA_API_KEY</span>
              </div>
              <div className="flex items-center gap-2">
                {envStatus.ai ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <span>AI_API_KEY (optional)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fast Start (Local)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Create the project</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`npx create-next-app@latest portfolio-regime --ts --app
cd portfolio-regime`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Install dependencies</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`npm install drizzle-orm drizzle-kit @supabase/supabase-js zod recharts lucide-react
npm install -D tailwindcss postcss autoprefixer`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Add shadcn/ui</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`npx shadcn@latest init`}
              </pre>
              <p className="text-sm text-muted-foreground mt-1">
                Choose: style: default, base color: slate, css variables: yes
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Create Supabase project</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to Supabase dashboard</li>
                <li>Create new project</li>
                <li>Project settings → API: copy Project URL and anon public key</li>
                <li>Project settings → API: copy service role key (keep secret)</li>
                <li>Project settings → Database: ensure pgcrypto extension is enabled</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Create .env.local</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
MARKET_DATA_API_KEY=your_finnhub_api_key
AI_API_KEY=`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">6. Set up database</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`npm run db:generate
npm run db:migrate`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">7. Run dev server</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`npm run dev`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Finnhub API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Create an account at finnhub.io</li>
              <li>Generate an API key</li>
              <li>Add it to MARKET_DATA_API_KEY in .env.local</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deploy to Vercel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Push to GitHub</h3>
              <p className="text-sm text-muted-foreground">Create a repository and push your code</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Import in Vercel</h3>
              <p className="text-sm text-muted-foreground">Import your GitHub repository in Vercel</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Set environment variables</h3>
              <p className="text-sm text-muted-foreground">
                Add all environment variables in Vercel project settings
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Add Vercel Cron jobs</h3>
              <p className="text-sm text-muted-foreground mb-2">Create vercel.json:</p>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`{
  "crons": [
    {
      "path": "/api/cron/intraday",
      "schedule": "*/5 13-21 * * 1-5"
    },
    {
      "path": "/api/cron/daily",
      "schedule": "0 2 * * 2-6"
    }
  ]
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

