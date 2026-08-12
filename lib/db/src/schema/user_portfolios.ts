import { pgTable, text, serial, numeric, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userPortfoliosTable = pgTable("user_portfolios", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  totalShares: integer("total_shares").notNull().default(0),
  totalInvested: numeric("total_invested", { precision: 20, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  userProjectUnique: unique("user_project_unique").on(t.userId, t.projectId),
}));

export const insertUserPortfolioSchema = createInsertSchema(userPortfoliosTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertUserPortfolio = z.infer<typeof insertUserPortfolioSchema>;
export type UserPortfolio = typeof userPortfoliosTable.$inferSelect;
