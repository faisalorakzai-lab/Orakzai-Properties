import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertyLeadsTable = pgTable("property_leads", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  propertyTitle: text("property_title").notNull(),
  agentId: text("agent_id").notNull(),
  leadUserId: text("lead_user_id"),
  leadName: text("lead_name"),
  leadPhone: text("lead_phone"),
  source: text("source").notNull().default("whatsapp"), // whatsapp | contact
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPropertyLeadSchema = createInsertSchema(propertyLeadsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPropertyLead = z.infer<typeof insertPropertyLeadSchema>;
export type PropertyLead = typeof propertyLeadsTable.$inferSelect;
