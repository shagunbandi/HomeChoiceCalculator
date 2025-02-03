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
        ...req.body,
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

  const httpServer = createServer(app);
  return httpServer;
}
