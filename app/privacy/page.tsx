import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <Card>
        <CardHeader>
          <CardTitle>Data Collection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This application processes portfolio data you provide for analysis purposes. Market data is fetched from third-party providers (Finnhub) and cached in the database.
          </p>
          <p className="text-sm text-muted-foreground">
            No personal information is collected or stored beyond what is necessary to provide the analysis functionality.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Data Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Portfolio configurations and analysis results may be stored in the database for performance optimization. You can clear this data by contacting the administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

