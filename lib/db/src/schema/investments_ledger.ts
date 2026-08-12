import { pgTable, text, serial, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const investmentsLedgerTable = pgTable("investments_ledger", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  userId: text("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  sharesBought: integer("shares_bought").notNull(),
  amountPaid: numeric("amount_paid", { precision: 20, scale: 2 }).notNull(),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInvestmentsLedgerSchema = createInsertSchema(investmentsLedgerTable).omit({
  id: true,
  createdAt: true,
});

export type InsertInvestmentsLedger = z.infer<typeof insertInvestmentsLedgerSchema>;
export type InvestmentsLedger = typeof investmentsLedgerTable.$inferSelect;
