import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { stocks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/stocks/[ticker]">
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticker } = await ctx.params;
  const body = await request.json();
  const { shares, purchasePrice, purchaseDate, notes, name } = body;

  const [item] = await db
    .update(stocks)
    .set({
      ...(name !== undefined && { name }),
      ...(shares !== undefined && { shares: String(shares) }),
      ...(purchasePrice !== undefined && { purchasePrice: String(purchasePrice) }),
      ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ?? null }),
      ...(notes !== undefined && { notes: notes ?? null }),
      updatedAt: new Date(),
    })
    .where(eq(stocks.ticker, ticker.toUpperCase()))
    .returning();

  if (!item) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/stocks/[ticker]">
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticker } = await ctx.params;
  await db.delete(stocks).where(eq(stocks.ticker, ticker.toUpperCase()));
  return new Response(null, { status: 204 });
}
