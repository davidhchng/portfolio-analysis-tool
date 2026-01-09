import { METRIC_DOCS } from "@/lib/docs/metricDocs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogicPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Logic & Metric Definitions</h1>

      <div className="space-y-6">
        {Object.entries(METRIC_DOCS).map(([key, doc]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{doc.name}</CardTitle>
              {doc.unit && <CardDescription>Unit: {doc.unit}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="font-semibold text-sm">Formula:</div>
                <div className="font-mono text-sm bg-muted p-2 rounded">{doc.formula}</div>
              </div>
              <div>
                <div className="font-semibold text-sm">Description:</div>
                <div className="text-sm text-muted-foreground">{doc.description}</div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Regime Detection Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-semibold mb-2">Input Features (computed on SPY):</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>MA50: 50-day moving average of closing prices</li>
                <li>MA200: 200-day moving average of closing prices</li>
                <li>vol20: Annualized volatility over last 20 trading days</li>
                <li>vol thresholds: Q33 and Q66 computed from last 5 years of vol20 values</li>
              </ul>
            </div>

            <div>
              <div className="font-semibold mb-2">Trend Classification:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>UP: MA50 &gt; MA200</li>
                <li>DOWN: MA50 ≤ MA200</li>
              </ul>
            </div>

            <div>
              <div className="font-semibold mb-2">Volatility State:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>LOW: vol20 ≤ Q33</li>
                <li>MID: Q33 &lt; vol20 ≤ Q66</li>
                <li>HIGH: vol20 &gt; Q66</li>
              </ul>
            </div>

            <div>
              <div className="font-semibold mb-2">Regime Mapping:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Bull/LowVol: Trend=UP, Vol=LOW</li>
                <li>Bull/HighVol: Trend=UP, Vol=HIGH (or Stress)</li>
                <li>Bear/HighVol: Trend=DOWN, Vol=HIGH (or Stress)</li>
                <li>Bear/LowVol: Trend=DOWN, Vol=LOW</li>
                <li>Chop/MidVol: Vol=MID AND abs(MA50/MA200 - 1) &lt; 0.01</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Similar Conditions Matching</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-semibold mb-2">Method:</div>
              <div className="text-sm text-muted-foreground">
                K-nearest neighbors (KNN) with K=50
              </div>
            </div>

            <div>
              <div className="font-semibold mb-2">Window Length:</div>
              <div className="text-sm text-muted-foreground">L = 20 trading days</div>
            </div>

            <div>
              <div className="font-semibold mb-2">Features (at each candidate date t):</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>f1 = vol20(t) - annualized volatility over 20 days ending at t</li>
                <li>f2 = last20d cumulative return of SPY at t</li>
                <li>f3 = trend indicator (UP=1, DOWN=0)</li>
              </ul>
            </div>

            <div>
              <div className="font-semibold mb-2">Standardization:</div>
              <div className="text-sm text-muted-foreground">
                Numeric features (f1, f2) are z-scored across all candidates: z = (x - mean) / stdev
              </div>
            </div>

            <div>
              <div className="font-semibold mb-2">Distance:</div>
              <div className="text-sm text-muted-foreground">
                Euclidean distance on [z(f1), z(f2), f3]
              </div>
            </div>

            <div>
              <div className="font-semibold mb-2">Filtering:</div>
              <div className="text-sm text-muted-foreground">
                Only consider historical windows with the same regime label as today
              </div>
            </div>

            <div>
              <div className="font-semibold mb-2">Forward Returns:</div>
              <div className="text-sm text-muted-foreground">
                For each matched window start date t, compute portfolio forward returns over horizons: 5, 20, and 60 trading days
              </div>
            </div>

            <div>
              <div className="font-semibold mb-2">Summaries:</div>
              <div className="text-sm text-muted-foreground">
                For each horizon, compute median, p10, p90, and hit rate (proportion of positive returns)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

