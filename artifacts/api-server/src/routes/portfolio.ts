import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  userPortfoliosTable,
  investmentsLedgerTable,
  investmentProjectsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

router.post("/investment-projects/:id/invest", requireAuth, async (req: any, res) => {
  try {
    const projectId = Number(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ error: "Invalid project id" });

    const { shares } = req.body;
    const shareCount = Number(shares);
    if (!shareCount || shareCount < 1 || !Number.isInteger(shareCount)) {
      return res.status(400).json({ error: "shares must be a positive integer" });
    }

    const [project] = await db
      .select()
      .from(investmentProjectsTable)
      .where(eq(investmentProjectsTable.id, projectId));

    if (!project) return res.status(404).json({ error: "Project not found" });

    const available = project.totalShares - project.fundedShares;
    if (shareCount > available) {
      return res.status(400).json({
        error: `Only ${available} shares available. Requested ${shareCount}.`,
      });
    }

    const sharePrice = parseFloat(project.totalValue) / project.totalShares;
    const amountPaid = sharePrice * shareCount;
    const transactionId = randomUUID();

    const [ledgerEntry] = await db
      .insert(investmentsLedgerTable)
      .values({
        transactionId,
        userId: req.userId,
        projectId,
        sharesBought: shareCount,
        amountPaid: String(amountPaid),
        status: "confirmed",
      })
      .returning();

    const existingPortfolio = await db
      .select()
      .from(userPortfoliosTable)
      .where(
        and(
          eq(userPortfoliosTable.userId, req.userId),
          eq(userPortfoliosTable.projectId, projectId),
        ),
      );

    let portfolio;
    if (existingPortfolio.length > 0) {
      const current = existingPortfolio[0];
      const [updated] = await db
        .update(userPortfoliosTable)
        .set({
          totalShares: current.totalShares + shareCount,
          totalInvested: String(parseFloat(current.totalInvested) + amountPaid),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userPortfoliosTable.userId, req.userId),
            eq(userPortfoliosTable.projectId, projectId),
          ),
        )
        .returning();
      portfolio = updated;
    } else {
      const [created] = await db
        .insert(userPortfoliosTable)
        .values({
          userId: req.userId,
          projectId,
          totalShares: shareCount,
          totalInvested: String(amountPaid),
        })
        .returning();
      portfolio = created;
    }

    await db
      .update(investmentProjectsTable)
      .set({ fundedShares: project.fundedShares + shareCount, updatedAt: new Date() })
      .where(eq(investmentProjectsTable.id, projectId));

    return res.status(201).json({
      transactionId: ledgerEntry.transactionId,
      projectId,
      projectTitle: project.title,
      sharesBought: shareCount,
      amountPaid,
      sharePrice,
      roi: project.roi,
      duration: project.duration,
      status: "confirmed",
      createdAt: ledgerEntry.createdAt instanceof Date
        ? ledgerEntry.createdAt.toISOString()
        : ledgerEntry.createdAt,
      portfolio: {
        totalShares: portfolio.totalShares,
        totalInvested: parseFloat(portfolio.totalInvested),
      },
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/portfolio", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(userPortfoliosTable)
      .where(eq(userPortfoliosTable.userId, req.userId));

    const enriched = await Promise.all(
      rows.map(async (row) => {
        const [project] = await db
          .select()
          .from(investmentProjectsTable)
          .where(eq(investmentProjectsTable.id, row.projectId));

        if (!project) return null;

        const sharePrice = parseFloat(project.totalValue) / project.totalShares;
        const currentValue = sharePrice * row.totalShares;
        const roiMatch = project.roi.match(/(\d+(\.\d+)?)/);
        const roiPct = roiMatch ? parseFloat(roiMatch[1]) : 15;
        const projectedMonthlyRoi = (parseFloat(row.totalInvested) * (roiPct / 100)) / 12;

        return {
          portfolioId: row.id,
          projectId: row.projectId,
          projectTitle: project.title,
          projectLocation: project.location,
          projectStatus: project.status,
          projectType: project.type,
          roi: project.roi,
          duration: project.duration,
          totalShares: row.totalShares,
          totalInvested: parseFloat(row.totalInvested),
          currentValue,
          projectedMonthlyRoi,
          updatedAt: row.updatedAt instanceof Date
            ? row.updatedAt.toISOString()
            : row.updatedAt,
        };
      }),
    );

    return res.json(enriched.filter(Boolean));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
