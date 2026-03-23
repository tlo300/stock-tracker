import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export interface QuoteResult {
  ticker: string;
  price: number | null;
  currency: string | null;
  change: number | null;
  changePercent: number | null;
  shortName: string | null;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get("tickers");

  if (!tickers) {
    return NextResponse.json({ error: "tickers query param required" }, { status: 400 });
  }

  const symbols = tickers.toUpperCase();

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
        next: { revalidate: 60 }, // cache 60 seconds
      }
    );

    if (!res.ok) {
      throw new Error(`Yahoo Finance returned ${res.status}`);
    }

    const data = await res.json();
    const quoteList = data?.quoteResponse?.result ?? [];

    const results: QuoteResult[] = quoteList.map((q: Record<string, unknown>) => ({
      ticker: q.symbol as string,
      price: (q.regularMarketPrice as number) ?? null,
      currency: (q.currency as string) ?? null,
      change: (q.regularMarketChange as number) ?? null,
      changePercent: (q.regularMarketChangePercent as number) ?? null,
      shortName: (q.shortName as string) ?? null,
    }));

    return NextResponse.json(results);
  } catch (err) {
    console.error("Failed to fetch quotes:", err);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 502 });
  }
}
