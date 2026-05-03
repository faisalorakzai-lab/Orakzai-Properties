import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const leadMessagesTable = pgTable("lead_messages", {
  id:        serial("id").primaryKey(),
  leadId:    integer("lead_id").notNull(),
  senderId:  text("sender_id").notNull(),   // agentId or leadUserId
  role:      text("role").notNull(),         // "agent" | "buyer"
  body:      text("body").notNull(),
  isRead:    boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
