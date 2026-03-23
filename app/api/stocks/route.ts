import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { stocks } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(stocks).where(eq(stocks.userId, userId)).orderBy(asc(stocks.ticker));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      userId,
      ticker: ticker.toUpperCase(),
      name,
      shares: String(shares),
      purchasePrice: String(purchasePrice),
      purchaseDate: purchaseDate ?? null,
      notes: notes ?? null,
    })
    .onConflictDoUpdate({
      target: [stocks.userId, stocks.ticker],
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
