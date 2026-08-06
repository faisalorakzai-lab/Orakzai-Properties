import { pgTable, text, serial, numeric, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type RoadmapPhase = {
  phase: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  date: string;
};

export const investmentProjectsTable = pgTable("investment_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  bannerImage: text("banner_image"),
  totalValue: numeric("total_value", { precision: 20, scale: 2 }).notNull(),
  minInvestment: numeric("min_investment", { precision: 20, scale: 2 }).notNull(),
  totalShares: integer("total_shares").notNull(),
  fundedShares: integer("funded_shares").notNull().default(0),
  roi: text("roi").notNull(),
  duration: text("duration").notNull(),
  status: text("status").notNull().default("funding"),
  type: text("type").notNull().default("plaza"),
  roadmap: json("roadmap").$type<RoadmapPhase[]>().notNull().default([]),
  features: json("features").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInvestmentProjectSchema = createInsertSchema(investmentProjectsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvestmentProject = z.infer<typeof insertInvestmentProjectSchema>;
export type InvestmentProject = typeof investmentProjectsTable.$inferSelect;
