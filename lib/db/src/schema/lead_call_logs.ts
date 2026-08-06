import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const leadCallLogsTable = pgTable("lead_call_logs", {
  id:       serial("id").primaryKey(),
  leadId:   integer("lead_id").notNull(),
  agentId:  text("agent_id").notNull(),
  note:     text("note").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
