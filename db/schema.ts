import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull().unique(),
  name: text("name").notNull(),
  shares: numeric("shares", { precision: 14, scale: 6 }).notNull(),
  purchasePrice: numeric("purchase_price", { precision: 14, scale: 4 }).notNull(),
  purchaseDate: text("purchase_date"), // stored as YYYY-MM-DD string
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Stock = typeof stocks.$inferSelect;
export type NewStock = typeof stocks.$inferInsert;
