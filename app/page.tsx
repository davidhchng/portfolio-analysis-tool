"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validateTicker, normalizeTicker, normalizeWeights } from "@/lib/utils/validation";
import { X, Plus, TrendingUp, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface PortfolioRow {
  ticker: string;
  weight: number;
}

export default function Home() {
  const [portfolio, setPortfolio] = useState<PortfolioRow[]>([
    { ticker: "AAPL", weight: 0.3 },
    { ticker: "MSFT", weight: 0.3 },
    { ticker: "GOOGL", weight: 0.4 },
  ]);
  const [watchLive, setWatchLive] = useState(false);

  useEffect(() => {
    if (watchLive && portfolio.length > 0) {
      const tickers = portfolio.filter((r) => r.ticker).map((r) => r.ticker);
      if (tickers.length > 0) {
        fetch("/api/watched", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers, action: "add" }),
        }).catch(console.error);
      }
    }
  }, [watchLive, portfolio]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const addRow = () => {
    setPortfolio([...portfolio, { ticker: "", weight: 0 }]);
  };

  const removeRow = (index: number) => {
    setPortfolio(portfolio.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: "ticker" | "weight", value: string | number) => {
    const newPortfolio = [...portfolio];
    if (field === "ticker") {
      const normalized = normalizeTicker(value as string);
      if (normalized && validateTicker(normalized)) {
        newPortfolio[index].ticker = normalized;
      } else if (value === "") {
        newPortfolio[index].ticker = "";
      }
    } else {
      newPortfolio[index].weight = typeof value === "number" ? value : parseFloat(value as string) || 0;
    }
    setPortfolio(newPortfolio);
  };

  const normalizePortfolioWeights = () => {
    const weights = portfolio.map((r) => r.weight);
    const normalized = normalizeWeights(weights);
    setPortfolio(portfolio.map((r, i) => ({ ...r, weight: normalized[i] })));
  };

  const loadExample = () => {
    setPortfolio([
      { ticker: "AAPL", weight: 0.25 },
      { ticker: "MSFT", weight: 0.25 },
      { ticker: "GOOGL", weight: 0.25 },
      { ticker: "AMZN", weight: 0.25 },
    ]);
  };

  const refreshDaily = async () => {
    setRefreshing(true);
    try {
      const tickers = portfolio.filter((r) => r.ticker).map((r) => r.ticker);
      const response = await fetch("/api/ingest/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers, force: false }),
      });
      const data = await response.json();
      if (!data.ok) {
        setError(data.error || "Failed to refresh data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRefreshing(false);
    }
  };

  const refreshIntraday = async () => {
    setRefreshing(true);
    try {
      const tickers = portfolio.filter((r) => r.ticker).map((r) => r.ticker);
      const response = await fetch("/api/ingest/intraday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      });
      const data = await response.json();
      if (!data.ok) {
        setError(data.error || "Failed to refresh data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRefreshing(false);
    }
  };

  const analyze = async () => {
    if (validRows.length === 0) {
      setError("Please add at least one ticker with a positive weight");
      return;
    }

    const portfolioObj: { [ticker: string]: number } = {};
    validRows.forEach((r) => {
      portfolioObj[r.ticker] = r.weight;
    });

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio: portfolioObj }),
      });

      const data = await response.json();
      if (!data.ok) {
        setError(data.error || "Analysis failed");
        setResults(null);
      } else {
        setResults(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResults(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const sumWeights = portfolio.reduce((sum, r) => sum + r.weight, 0);
  const needsNormalization = Math.abs(sumWeights - 1) > 0.001 && sumWeights > 0;
  const validRows = portfolio.filter((r) => r.ticker && r.weight > 0);

  return (
    <div className="container mx-auto px-4 py-6">
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Builder</CardTitle>
              <CardDescription>Enter tickers and weights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                  <div className="col-span-6">Ticker</div>
                  <div className="col-span-4">Weight</div>
                  <div className="col-span-2"></div>
                </div>
                {portfolio.map((row, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-6"
                      value={row.ticker}
                      onChange={(e) => updateRow(index, "ticker", e.target.value)}
                      placeholder="AAPL"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      className="col-span-4"
                      value={row.weight}
                      onChange={(e) => updateRow(index, "weight", e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="col-span-2"
                      onClick={() => removeRow(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {needsNormalization && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  Weights sum to {(sumWeights * 100).toFixed(1)}%.{" "}
                  <Button variant="link" className="p-0 h-auto" onClick={normalizePortfolioWeights}>
                    Normalize to 100%
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={addRow} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Row
                </Button>
                <Button onClick={normalizePortfolioWeights} variant="outline" size="sm">
                  Normalize Weights
                </Button>
                <Button onClick={loadExample} variant="outline" size="sm">
                  Example Portfolio
                </Button>
                <Button onClick={analyze} disabled={analyzing || validRows.length === 0}>
                  {analyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="watch"
                  checked={watchLive}
                  onChange={(e) => setWatchLive(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="watch" className="text-sm text-muted-foreground">
                  Watch tickers (live updates)
                </label>
              </div>

              <div className="flex gap-2">
                <Button onClick={refreshDaily} variant="outline" size="sm" disabled={refreshing}>
                  Refresh Daily Cache
                </Button>
                <Button onClick={refreshIntraday} variant="outline" size="sm" disabled={refreshing}>
                  Refresh Live Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          {results ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
                <TabsTrigger value="similar">Similar Conditions</TabsTrigger>
                <TabsTrigger value="ai">AI Explanation</TabsTrigger>
                <TabsTrigger value="logic">Logic</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Regime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">{results.regime.label}</div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Trend: {results.regime.features.trend}</div>
                      <div>Vol State: {results.regime.features.volState}</div>
                      <div>Vol20: {(results.regime.features.vol20 * 100).toFixed(2)}%</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annualized Vol:</span>
                      <span className="font-mono tabular-nums">{(results.metrics.annualizedVol * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Drawdown (1Y):</span>
                      <span className="font-mono tabular-nums">{(results.metrics.maxDrawdown * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beta to SPY:</span>
                      <span className="font-mono tabular-nums">
                        {results.metrics.beta !== null ? results.metrics.beta.toFixed(2) : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Top 3 PCR:</span>
                      <span className="font-mono tabular-nums">{(results.metrics.top3Pcr * 100).toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Similar Windows Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>Matches: {results.similar.windows.length}</div>
                      <div className="space-y-1">
                        <div>5d forward: median {(results.similar.summaries.h5.median * 100).toFixed(2)}%</div>
                        <div>20d forward: median {(results.similar.summaries.h20.median * 100).toFixed(2)}%</div>
                        <div>60d forward: median {(results.similar.summaries.h60.median * 100).toFixed(2)}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Metrics Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Annualized Volatility:</span>
                        <span className="font-mono tabular-nums">{(results.metrics.annualizedVol * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rolling 20d Vol:</span>
                        <span className="font-mono tabular-nums">{(results.metrics.rollingVol20 * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Drawdown:</span>
                        <span className="font-mono tabular-nums">{(results.metrics.maxDrawdown * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Beta:</span>
                        <span className="font-mono tabular-nums">
                          {results.metrics.beta !== null ? results.metrics.beta.toFixed(3) : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>R²:</span>
                        <span className="font-mono tabular-nums">
                          {results.metrics.rSquared !== null ? (results.metrics.rSquared * 100).toFixed(1) : "N/A"}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>HHI:</span>
                        <span className="font-mono tabular-nums">{results.metrics.hhi.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>N_eff:</span>
                        <span className="font-mono tabular-nums">{results.metrics.nEffective.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Contribution (PCR)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      {Object.entries(results.metrics.pcr)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([ticker, pcr]) => (
                          <div key={ticker} className="flex justify-between">
                            <span>{ticker}:</span>
                            <span className="font-mono tabular-nums">{((pcr as number) * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="similar" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Similar Historical Conditions</CardTitle>
                    <CardDescription>Conditional historical distribution; not a forecast.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm space-y-2">
                        <div>5d: median {(results.similar.summaries.h5.median * 100).toFixed(2)}%, p10 {(results.similar.summaries.h5.p10 * 100).toFixed(2)}%, p90 {(results.similar.summaries.h5.p90 * 100).toFixed(2)}%</div>
                        <div>20d: median {(results.similar.summaries.h20.median * 100).toFixed(2)}%, p10 {(results.similar.summaries.h20.p10 * 100).toFixed(2)}%, p90 {(results.similar.summaries.h20.p90 * 100).toFixed(2)}%</div>
                        <div>60d: median {(results.similar.summaries.h60.median * 100).toFixed(2)}%, p10 {(results.similar.summaries.h60.p10 * 100).toFixed(2)}%, p90 {(results.similar.summaries.h60.p90 * 100).toFixed(2)}%</div>
                      </div>
                      <div className="text-xs text-muted-foreground max-h-64 overflow-y-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Date</th>
                              <th className="text-right p-2">Distance</th>
                              <th className="text-right p-2">5d</th>
                              <th className="text-right p-2">20d</th>
                              <th className="text-right p-2">60d</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.similar.windows.slice(0, 20).map((w: any, i: number) => (
                              <tr key={i} className="border-b">
                                <td className="p-2">{new Date(w.startDate).toLocaleDateString()}</td>
                                <td className="text-right font-mono tabular-nums p-2">{w.distance.toFixed(3)}</td>
                                <td className="text-right font-mono tabular-nums p-2">{(w.forwardReturns.h5 * 100).toFixed(2)}%</td>
                                <td className="text-right font-mono tabular-nums p-2">{(w.forwardReturns.h20 * 100).toFixed(2)}%</td>
                                <td className="text-right font-mono tabular-nums p-2">{(w.forwardReturns.h60 * 100).toFixed(2)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Explanation</CardTitle>
                    <CardDescription>Grounded explanation of computed metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      AI explanation feature requires AI_API_KEY to be set. This feature provides grounded interpretations of the computed metrics without predictions or trading advice.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Logic & Formulas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-4">
                      <div>
                        <div className="font-semibold">Annualized Volatility</div>
                        <div className="text-muted-foreground">σ = √(252) × stdev(r_p)</div>
                      </div>
                      <div>
                        <div className="font-semibold">Max Drawdown</div>
                        <div className="text-muted-foreground">MDD = max((peak - trough) / peak)</div>
                      </div>
                      <div>
                        <div className="font-semibold">Beta</div>
                        <div className="text-muted-foreground">β = Cov(r_p, r_SPY) / Var(r_SPY)</div>
                      </div>
                      <div>
                        <div className="font-semibold">Regime Detection</div>
                        <div className="text-muted-foreground">
                          Based on MA50 vs MA200 (trend) and vol20 vs historical quantiles (vol state)
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Run analysis to see results</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

