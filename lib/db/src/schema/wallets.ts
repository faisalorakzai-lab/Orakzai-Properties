import { pgTable, text, uuid, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const walletsTable = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  balance: numeric("balance", { precision: 24, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("PKR"),
  pinHash: text("pin_hash"),
  isPinSet: boolean("is_pin_set").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWalletSchema = createInsertSchema(walletsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof walletsTable.$inferSelect;
