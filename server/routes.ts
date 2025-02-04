import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { mortgageCalculations } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.post("/api/calculations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const calculation = await db
      .insert(mortgageCalculations)
      .values({
        buyingCost: req.body.buyingCost,
        downPayment: req.body.downPayment,
        sellPrice: req.body.sellPrice,
        oneTimeExpense: req.body.oneTimeExpense,
        interestRate: req.body.interestRate,
        loanTerm: req.body.loanTerm,
        yearlyMaintenance: req.body.yearlyMaintenance,
        taxCreditRate: req.body.mortgageTaxScheme,
        currentRent: req.body.currentRent,
        rentalIncrease: req.body.rentalIncrease,
        monthlyPayment: req.body.monthlyPayment,
        totalInterest: req.body.totalInterest,
        breakevenMonth: req.body.breakevenMonth,
        name: req.body.name,
        userId: req.user.id,
      })
      .returning();

    res.json(calculation[0]);
  });

  app.get("/api/calculations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const calculations = await db
      .select()
      .from(mortgageCalculations)
      .where(eq(mortgageCalculations.userId, req.user.id));

    res.json(calculations);
  });

  app.patch("/api/calculations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const calculation = await db
      .update(mortgageCalculations)
      .set({
        buyingCost: req.body.buyingCost,
        downPayment: req.body.downPayment,
        sellPrice: req.body.sellPrice,
        oneTimeExpense: req.body.oneTimeExpense,
        interestRate: req.body.interestRate,
        loanTerm: req.body.loanTerm,
        yearlyMaintenance: req.body.yearlyMaintenance,
        taxCreditRate: req.body.mortgageTaxScheme,
        currentRent: req.body.currentRent,
        rentalIncrease: req.body.rentalIncrease,
        monthlyPayment: req.body.monthlyPayment,
        totalInterest: req.body.totalInterest,
        breakevenMonth: req.body.breakevenMonth,
        name: req.body.name,
        
      })
      .where(
        eq(mortgageCalculations.id, parseInt(req.params.id)),
      )
      .returning();

    res.json(calculation[0]);
  });

  app.delete("/api/calculations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    await db
      .delete(mortgageCalculations)
      .where(
        eq(mortgageCalculations.id, parseInt(req.params.id)),
      );

    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}