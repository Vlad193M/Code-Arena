import { Router, type Request, type Response } from "express";
import { prisma } from "../../db/prisma.client";

export const healthRouter: Router = Router();

healthRouter.get("/health", async (req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, db: "connected" });
});
