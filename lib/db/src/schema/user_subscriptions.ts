import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const userSubscriptionsTable = pgTable("user_subscriptions", {
  id:           serial("id").primaryKey(),
  userId:       text("user_id").notNull(),
  planId:       text("plan_id").notNull(),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  amountPaid:   text("amount_paid").notNull().default("0"),
  currency:     text("currency").notNull().default("PKR"),
  startDate:    timestamp("start_date").notNull().defaultNow(),
  expiryDate:   timestamp("expiry_date").notNull(),
  isAutoRenew:  boolean("is_auto_renew").notNull().default(true),
  status:       text("status").notNull().default("active"),
  txnId:        text("txn_id"),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
});
