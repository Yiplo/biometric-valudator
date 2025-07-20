import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const electoralRegistry = pgTable("electoral_registry", {
  id: serial("id").primaryKey(),
  curp: text("curp").notNull().unique(),
  fullName: text("full_name").notNull(),
  ineNumber: text("ine_number").notNull().unique(),
  rfc: text("rfc"),
  state: text("state").notNull(), // Estado de la República Mexicana
  fingerprintData: text("fingerprint_data").notNull(), // base64 encoded
  status: text("status").notNull().default("active"), // active | inactive
  createdAt: timestamp("created_at").defaultNow(),
});

export const validationHistory = pgTable("validation_history", {
  id: serial("id").primaryKey(),
  institution: text("institution").notNull(),
  curp: text("curp").notNull(),
  matchingPercentage: integer("matching_percentage").notNull(),
  status: text("status").notNull(), // success | failed
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const institutions = pgTable("institutions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  apiKey: text("api_key").notNull().unique(),
  active: boolean("active").default(true),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertElectoralRegistrySchema = createInsertSchema(electoralRegistry).omit({
  id: true,
  createdAt: true,
});

export const insertValidationHistorySchema = createInsertSchema(validationHistory).omit({
  id: true,
  timestamp: true,
});

export const insertInstitutionSchema = createInsertSchema(institutions).omit({
  id: true,
});

// Validation schemas
export const biometricValidationSchema = z.object({
  curp: z.string().min(18).max(18),
  fingerprintData: z.string(), // base64
});

export const identityVerificationSchema = z.object({
  identifier: z.string().min(1),
  identifierType: z.enum(["curp", "ine", "rfc"]),
  fingerprintData: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ElectoralRegistry = typeof electoralRegistry.$inferSelect;
export type InsertElectoralRegistry = z.infer<typeof insertElectoralRegistrySchema>;

export type ValidationHistory = typeof validationHistory.$inferSelect;
export type InsertValidationHistory = z.infer<typeof insertValidationHistorySchema>;

export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;

export type BiometricValidation = z.infer<typeof biometricValidationSchema>;
export type IdentityVerification = z.infer<typeof identityVerificationSchema>;
