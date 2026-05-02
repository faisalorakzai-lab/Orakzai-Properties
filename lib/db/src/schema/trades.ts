import { pgTable, text, serial, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  buyOrderId: integer("buy_order_id").notNull(),
  sellOrderId: integer("sell_order_id").notNull(),
  buyerId: text("buyer_id").notNull(),
  sellerId: text("seller_id").notNull(),
  quantity: integer("quantity").notNull(),
  pricePerShare: numeric("price_per_share", { precision: 20, scale: 2 }).notNull(),
  tradingFee: numeric("trading_fee", { precision: 20, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({ id: true, createdAt: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
