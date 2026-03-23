"use client";

import { useEffect, useState, useCallback } from "react";
import StockCard from "./StockCard";
import AddStockModal from "./AddStockModal";
import type { Stock } from "@/db/schema";
import type { QuoteResult } from "@/app/api/quotes/route";

function fmtCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

export default function StockTrackerApp() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [quotes, setQuotes] = useState<Record<string, QuoteResult>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [refreshingQuotes, setRefreshingQuotes] = useState(false);

  async function loadStocks() {
    const rows: Stock[] = await fetch("/api/stocks").then((r) => r.json());
    setStocks(rows);
    return rows;
  }

  const loadQuotes = useCallback(async (stockList: Stock[]) => {
    if (stockList.length === 0) return;
    setRefreshingQuotes(true);
    try {
      const tickers = stockList.map((s) => s.ticker).join(",");
      const results: QuoteResult[] = await fetch(`/api/quotes?tickers=${tickers}`).then((r) =>
        r.json()
      );
      const map: Record<string, QuoteResult> = {};
      for (const q of results) map[q.ticker] = q;
      setQuotes(map);
    } finally {
      setRefreshingQuotes(false);
    }
  }, []);

  useEffect(() => {
    loadStocks()
      .then(loadQuotes)
      .finally(() => setLoading(false));
  }, [loadQuotes]);

  async function handleSave(data: {
    ticker: string;
    name: string;
    shares: number;
    purchasePrice: number;
    purchaseDate: string | null;
    notes: string | null;
  }) {
    const saved: Stock = await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((r) => r.json());

    setStocks((prev) => {
      const without = prev.filter((s) => s.ticker !== saved.ticker);
      return [...without, saved].sort((a, b) => a.ticker.localeCompare(b.ticker));
    });

    // fetch quote for new stock
    const result: QuoteResult[] = await fetch(`/api/quotes?tickers=${saved.ticker}`).then((r) =>
      r.json()
    );
    if (result[0]) setQuotes((prev) => ({ ...prev, [result[0].ticker]: result[0] }));
  }

  async function handleDelete(ticker: string) {
    await fetch(`/api/stocks/${ticker}`, { method: "DELETE" });
    setStocks((prev) => prev.filter((s) => s.ticker !== ticker));
    setQuotes((prev) => {
      const next = { ...prev };
      delete next[ticker];
      return next;
    });
  }

  // Portfolio summary
  const totalCost = stocks.reduce(
    (sum, s) => sum + parseFloat(s.shares) * parseFloat(s.purchasePrice),
    0
  );
  const totalValue = stocks.reduce((sum, s) => {
    const q = quotes[s.ticker];
    if (!q?.price) return sum;
    return sum + parseFloat(s.shares) * q.price;
  }, 0);
  const hasQuotes = Object.keys(quotes).length > 0;
  const totalGain = hasQuotes ? totalValue - totalCost : null;
  const totalGainPct = totalGain !== null && totalCost > 0 ? (totalGain / totalCost) * 100 : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-foreground">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href={process.env.NEXT_PUBLIC_VERCEL_URL ? "https://hub-green-beta.vercel.app" : "http://localhost:3000"}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
              title="Back to Hub"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Stock Tracker</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stocks.length} position{stocks.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Stock
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Portfolio Summary */}
        {stocks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Invested</p>
              <p className="text-2xl font-bold mt-1">{fmtCurrency(totalCost)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Portfolio Value{" "}
                {refreshingQuotes && (
                  <span className="text-xs text-gray-400 dark:text-gray-600">updating…</span>
                )}
              </p>
              <p className="text-2xl font-bold mt-1">
                {hasQuotes ? fmtCurrency(totalValue) : "—"}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Gain / Loss</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  totalGain === null
                    ? ""
                    : totalGain >= 0
                    ? "text-emerald-500"
                    : "text-red-500"
                }`}
              >
                {totalGain !== null
                  ? `${totalGain >= 0 ? "+" : ""}${fmtCurrency(totalGain)} (${totalGainPct !== null ? (totalGainPct >= 0 ? "+" : "") + totalGainPct.toFixed(2) : ""}%)`
                  : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Stock grid */}
        {stocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <p className="text-4xl">📈</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              No positions yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add your first stock to start tracking your portfolio.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Stock
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocks.map((stock) => (
              <StockCard
                key={stock.ticker}
                stock={stock}
                quote={quotes[stock.ticker] ?? null}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Refresh quotes button */}
        {stocks.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={() => loadQuotes(stocks)}
              disabled={refreshingQuotes}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
            >
              {refreshingQuotes ? "Refreshing prices…" : "↻ Refresh prices"}
            </button>
          </div>
        )}
      </main>

      {showModal && (
        <AddStockModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
