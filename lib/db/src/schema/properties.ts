import { pgTable, text, serial, numeric, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
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
  ownerAvatar: text("owner_avatar"),
  ownerRating: numeric("owner_rating", { precision: 3, scale: 1 }),
  whatsappNumber: text("whatsapp_number"),
  isVerified: boolean("is_verified").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
  beds: integer("beds"),
  baths: integer("baths"),
  areaSqft: integer("area_sqft"),
  // Rental-specific fields
  furnishedStatus: text("furnished_status"), // fully_furnished | semi_furnished | unfurnished
  occupancyType: text("occupancy_type"),    // family | bachelor | office_commercial
  rentalDuration: text("rental_duration"),  // short_term | long_term
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
