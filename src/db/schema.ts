import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url"),
  shortUrl: text("short_url"),
  status: text("status"),
  country: text("country"),
  categoryId: integer("category_id"),
  minBudget: real("min_budget").default(0),
  maxBudget: real("max_budget").default(0),
  budget: real("budget").default(0),
  duration: integer("duration").default(0),
  rating: real("rating").default(0),
  ratingCount: integer("rating_count").default(0),
  bids: integer("bids").default(0),
  urgent: integer("urgent").default(0),
  fulltime: integer("fulltime").default(0),
  onsite: integer("onsite").default(0),
  highlight: integer("highlight").default(0),
  ladder: integer("ladder").default(0),
  pin: integer("pin").default(0),
  multi: integer("multi").default(0),
  lowHire: integer("low_hire").default(0),
  expired: integer("expired").default(0),
  successRate: real("success_rate").default(0),
  skills: text("skills"), // JSON array
  pastTime: text("past_time"),
  userId: integer("user_id"),
  token: integer("token"),
  description: text("description"),
  starred: integer("starred").default(0),
  fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
