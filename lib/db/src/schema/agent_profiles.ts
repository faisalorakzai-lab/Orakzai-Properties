import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentProfilesTable = pgTable("agent_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  agencyName: text("agency_name"),
  logoUrl: text("logo_url"),
  experienceYears: integer("experience_years").default(0),
  specialization: text("specialization"),
  bio: text("bio"),
  verificationStatus: text("verification_status").notNull().default("pending"), // pending | verified | rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAgentProfileSchema = createInsertSchema(agentProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAgentProfile = z.infer<typeof insertAgentProfileSchema>;
export type AgentProfile = typeof agentProfilesTable.$inferSelect;
