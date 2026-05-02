import { pgTable, text, serial, numeric, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 15, scale: 2 }).notNull(),
  city: text("city").notNull(),
  area: text("area"),
  category: text("category").notNull(), // buy | rent | sell
  type: text("type").notNull(), // plot | house | commercial
  images: json("images").$type<string[]>().notNull().default([]),
  ownerId: text("owner_id").notNull(),
  ownerName: text("owner_name"),
  ownerPhone: text("owner_phone"),
  whatsappNumber: text("whatsapp_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
