import { pgTable, text, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  txnId: text("txn_id").notNull().unique(),
  userId: text("user_id").notNull(),
  counterpartyId: text("counterparty_id"),
  amount: numeric("amount", { precision: 24, scale: 2 }).notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  note: text("note"),
  balanceAfter: numeric("balance_after", { precision: 24, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
