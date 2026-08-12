import { pgTable, text, serial, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tradingOrdersTable = pgTable("trading_orders", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'buy' | 'sell'
  quantity: integer("quantity").notNull(),
  pricePerShare: numeric("price_per_share", { precision: 20, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'filled' | 'cancelled' | 'partial'
  filledQuantity: integer("filled_quantity").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTradingOrderSchema = createInsertSchema(tradingOrdersTable).omit({
  id: true, createdAt: true, updatedAt: true,
});

export type InsertTradingOrder = z.infer<typeof insertTradingOrderSchema>;
export type TradingOrder = typeof tradingOrdersTable.$inferSelect;
