import { pgTable, text, serial, numeric, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  bannerImage: text("banner_image"),
  plotSizes: json("plot_sizes").$type<string[]>().notNull().default([]),
  pricePerMarla: numeric("price_per_marla", { precision: 15, scale: 2 }).notNull(),
  totalPlots: integer("total_plots"),
  progressPercent: integer("progress_percent").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projectUpdatesTable = pgTable("project_updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true });
export const insertProjectUpdateSchema = createInsertSchema(projectUpdatesTable).omit({ id: true, createdAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertProjectUpdate = z.infer<typeof insertProjectUpdateSchema>;
export type Project = typeof projectsTable.$inferSelect;
export type ProjectUpdate = typeof projectUpdatesTable.$inferSelect;
