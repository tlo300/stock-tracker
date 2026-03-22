"use client";

import type { Stock } from "@/db/schema";
import type { QuoteResult } from "@/app/api/quotes/route";

interface Props {
  stock: Stock;
  quote: QuoteResult | null;
  onDelete: (ticker: string) => void;
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCurrency(n: number, currency = "USD") {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function StockCard({ stock, quote, onDelete }: Props) {
  const shares = parseFloat(stock.shares);
  const purchasePrice = parseFloat(stock.purchasePrice);
  const currentPrice = quote?.price ?? null;
  const currency = quote?.currency ?? "USD";

  const costBasis = shares * purchasePrice;
  const currentValue = currentPrice !== null ? shares * currentPrice : null;
  const gainLoss = currentValue !== null ? currentValue - costBasis : null;
  const gainLossPct = gainLoss !== null ? (gainLoss / costBasis) * 100 : null;

  const isPositive = gainLoss !== null ? gainLoss >= 0 : null;
  const gainColor =
    isPositive === null
      ? "text-gray-400"
      : isPositive
      ? "text-emerald-500"
      : "text-red-500";

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">{stock.ticker}</span>
            {quote?.change !== undefined && quote.change !== null && (
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  quote.change >= 0
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {quote.change >= 0 ? "+" : ""}
                {fmt(quote.changePercent ?? 0)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[180px]">
            {stock.name}
          </p>
        </div>

        <button
          onClick={() => onDelete(stock.ticker)}
          className="text-gray-400 hover:text-red-500 transition-colors text-sm p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
          aria-label="Remove stock"
        >
          ✕
        </button>
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Current price</p>
          <p className="text-xl font-semibold">
            {currentPrice !== null ? fmtCurrency(currentPrice, currency) : "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg cost</p>
          <p className="text-base font-medium">{fmtCurrency(purchasePrice, currency)}</p>
        </div>
      </div>

      {/* Holdings */}
      <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Shares</p>
          <p className="font-medium">{fmt(shares, shares % 1 === 0 ? 0 : 4)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Cost basis</p>
          <p className="font-medium">{fmtCurrency(costBasis, currency)}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Market value</p>
          <p className="font-medium">
            {currentValue !== null ? fmtCurrency(currentValue, currency) : "—"}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Gain / Loss</p>
          <p className={`font-semibold ${gainColor}`}>
            {gainLoss !== null
              ? `${gainLoss >= 0 ? "+" : ""}${fmtCurrency(gainLoss, currency)} (${gainLossPct !== null ? (gainLossPct >= 0 ? "+" : "") + fmt(gainLossPct) : ""}%)`
              : "—"}
          </p>
        </div>
      </div>

      {stock.notes && (
        <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-2">
          {stock.notes}
        </p>
      )}
    </div>
  );
}
