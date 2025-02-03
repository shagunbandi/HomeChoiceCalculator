import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mortgageCalculations = pgTable("mortgage_calculations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  propertyValue: decimal("property_value").notNull(),
  downPayment: decimal("down_payment").notNull(),
  interestRate: decimal("interest_rate").notNull(),
  loanTerm: integer("loan_term").notNull(),
  monthlyPayment: decimal("monthly_payment").notNull(),
  totalInterest: decimal("total_interest").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  name: text("name"),
});

export const userRelations = relations(users, ({ many }) => ({
  calculations: many(mortgageCalculations),
}));

export const calculationRelations = relations(mortgageCalculations, ({ one }) => ({
  user: one(users, {
    fields: [mortgageCalculations.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
