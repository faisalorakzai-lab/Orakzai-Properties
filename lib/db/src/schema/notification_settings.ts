import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationSettingsTable = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  marketAlerts: boolean("market_alerts").notNull().default(true),
  pricePulse: boolean("price_pulse").notNull().default(true),
  wealthAlerts: boolean("wealth_alerts").notNull().default(true),
  systemUpdates: boolean("system_updates").notNull().default(true),
  pushEnabled: boolean("push_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettingsTable.$inferSelect;
