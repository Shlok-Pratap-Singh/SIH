import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("tourist"), // "tourist", "police", "admin"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tourists table for detailed tourist information
export const tourists = pgTable("tourists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  digitalId: varchar("digital_id").unique().notNull(),
  fullName: varchar("full_name").notNull(),
  aadhaarNumber: varchar("aadhaar_number"),
  passportNumber: varchar("passport_number"),
  phoneNumber: varchar("phone_number").notNull(),
  emergencyContact: varchar("emergency_contact").notNull(),
  emergencyPhone: varchar("emergency_phone").notNull(),
  nationality: varchar("nationality").notNull(),
  travelPurpose: varchar("travel_purpose"),
  validUntil: timestamp("valid_until").notNull(),
  qrCodeData: text("qr_code_data").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tourist locations for tracking
export const touristLocations = pgTable("tourist_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  touristId: varchar("tourist_id").notNull().references(() => tourists.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  address: text("address"),
  safetyZone: varchar("safety_zone").notNull(), // "safe", "moderate", "unsafe", "forest", "restricted"
  safetyScore: integer("safety_score").default(0),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Safety zones definition
export const safetyZones = pgTable("safety_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  state: varchar("state").notNull(),
  zoneType: varchar("zone_type").notNull(), // "safe", "moderate", "unsafe", "forest", "restricted"
  coordinates: jsonb("coordinates").notNull(), // GeoJSON polygon
  description: text("description"),
  riskLevel: integer("risk_level").default(0), // 0-100
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Panic alerts
export const panicAlerts = pgTable("panic_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  touristId: varchar("tourist_id").notNull().references(() => tourists.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  address: text("address"),
  status: varchar("status").default("active"), // "active", "responded", "resolved"
  priority: varchar("priority").default("high"), // "low", "medium", "high", "critical"
  responseTime: integer("response_time"), // in minutes
  respondedBy: varchar("responded_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// News updates
export const newsUpdates = pgTable("news_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  category: varchar("category").notNull(), // "safety", "alert", "info", "emergency"
  state: varchar("state"),
  priority: varchar("priority").default("medium"),
  sourceUrl: varchar("source_url"),
  publishedAt: timestamp("published_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Police stations
export const policeStations = pgTable("police_stations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  state: varchar("state").notNull(),
  district: varchar("district").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  phoneNumber: varchar("phone_number").notNull(),
  email: varchar("email"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  tourists: many(tourists),
  panicAlerts: many(panicAlerts),
}));

export const touristsRelations = relations(tourists, ({ one, many }) => ({
  user: one(users, { fields: [tourists.userId], references: [users.id] }),
  locations: many(touristLocations),
  panicAlerts: many(panicAlerts),
}));

export const touristLocationsRelations = relations(touristLocations, ({ one }) => ({
  tourist: one(tourists, { fields: [touristLocations.touristId], references: [tourists.id] }),
}));

export const panicAlertsRelations = relations(panicAlerts, ({ one }) => ({
  tourist: one(tourists, { fields: [panicAlerts.touristId], references: [tourists.id] }),
  responder: one(users, { fields: [panicAlerts.respondedBy], references: [users.id] }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertTouristSchema = createInsertSchema(tourists).omit({
  id: true,
  digitalId: true,
  qrCodeData: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  validUntil: z.string().transform((str) => new Date(str)),
});

export const insertTouristLocationSchema = createInsertSchema(touristLocations).omit({
  id: true,
  timestamp: true,
});

export const insertPanicAlertSchema = createInsertSchema(panicAlerts).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertNewsUpdateSchema = createInsertSchema(newsUpdates).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTourist = z.infer<typeof insertTouristSchema>;
export type Tourist = typeof tourists.$inferSelect;
export type InsertTouristLocation = z.infer<typeof insertTouristLocationSchema>;
export type TouristLocation = typeof touristLocations.$inferSelect;
export type InsertPanicAlert = z.infer<typeof insertPanicAlertSchema>;
export type PanicAlert = typeof panicAlerts.$inferSelect;
export type InsertNewsUpdate = z.infer<typeof insertNewsUpdateSchema>;
export type NewsUpdate = typeof newsUpdates.$inferSelect;
export type SafetyZone = typeof safetyZones.$inferSelect;
export type PoliceStation = typeof policeStations.$inferSelect;
