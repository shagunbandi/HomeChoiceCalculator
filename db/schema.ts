import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mortgageCalculations = pgTable("mortgage_calculations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  buyingCost: decimal("buying_cost", { precision: 10, scale: 2 }).notNull(),
  downPayment: decimal("down_payment", { precision: 10, scale: 2 }).notNull(),
  sellPrice: decimal("sell_price", { precision: 10, scale: 2 }).notNull(),
  oneTimeExpense: decimal("one_time_expense", { precision: 10, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  loanTerm: integer("loan_term").notNull(),
  yearlyMaintenance: decimal("yearly_maintenance", { precision: 10, scale: 2 }).notNull(),
  taxCreditRate: decimal("tax_credit_rate", { precision: 5, scale: 2 }).notNull(),
  currentRent: decimal("current_rent", { precision: 10, scale: 2 }).notNull(),
  rentalIncrease: decimal("rental_increase", { precision: 5, scale: 2 }).notNull(),
  monthlyPayment: decimal("monthly_payment", { precision: 10, scale: 2 }).notNull(),
  totalInterest: decimal("total_interest", { precision: 10, scale: 2 }).notNull(),
  breakevenMonth: integer("breakeven_month").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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