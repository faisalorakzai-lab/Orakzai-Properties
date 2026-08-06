import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const agentSettingsTable = pgTable("agent_settings", {
  id:             serial("id").primaryKey(),
  userId:         text("user_id").notNull().unique(),
  awayEnabled:    boolean("away_enabled").notNull().default(false),
  awayMessage:    text("away_message").notNull().default("Thank you for your inquiry! I am currently unavailable but will get back to you within 24 hours. — Orakzai Properties"),
  updatedAt:      timestamp("updated_at").notNull().defaultNow(),
});
