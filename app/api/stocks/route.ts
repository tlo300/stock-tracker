import { NextResponse } from "next/server";
import { db } from "@/db";
import { stocks } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(stocks).orderBy(asc(stocks.ticker));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { ticker, name, shares, purchasePrice, purchaseDate, notes } = body;

  if (!ticker || !name || !shares || !purchasePrice) {
    return NextResponse.json(
      { error: "ticker, name, shares, and purchasePrice are required" },
      { status: 400 }
    );
  }

  const [item] = await db
    .insert(stocks)
    .values({
      ticker: ticker.toUpperCase(),
      name,
      shares: String(shares),
      purchasePrice: String(purchasePrice),
      purchaseDate: purchaseDate ?? null,
      notes: notes ?? null,
    })
    .onConflictDoUpdate({
      target: stocks.ticker,
      set: {
        name,
        shares: String(shares),
        purchasePrice: String(purchasePrice),
        purchaseDate: purchaseDate ?? null,
        notes: notes ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}
