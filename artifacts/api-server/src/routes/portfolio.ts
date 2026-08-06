import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  userPortfoliosTable,
  investmentsLedgerTable,
  investmentProjectsTable,
  walletsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

/* ─────────────────────────────────────────────────────────
   GET /portfolio/dashboard  — aggregated investor dashboard
───────────────────────────────────────────────────────── */
router.get("/portfolio/dashboard", requireAuth, async (req: any, res) => {
  try {
    const userId = req.userId as string;

    // 1. Wallet balance
    let walletBalance = 0;
    let walletCurrency = "PKR";
    const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId)).limit(1);
    if (wallet) {
      walletBalance = parseFloat(wallet.balance);
      walletCurrency = wallet.currency;
    }

    // 2. Portfolio positions
    const portfolioRows = await db
      .select()
      .from(userPortfoliosTable)
      .where(eq(userPortfoliosTable.userId, userId));

    const positions = (await Promise.all(
      portfolioRows.map(async (row) => {
        const [project] = await db
          .select()
          .from(investmentProjectsTable)
          .where(eq(investmentProjectsTable.id, row.projectId));
        if (!project) return null;

        const sharePrice = parseFloat(project.totalValue) / project.totalShares;
        const currentValue = sharePrice * row.totalShares;
        const totalInvested = parseFloat(row.totalInvested);
        const gain = currentValue - totalInvested;
        const gainPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

        const roiMatch = project.roi.match(/(\d+(\.\d+)?)/);
        const roiPct = roiMatch ? parseFloat(roiMatch[1]) : 15;
        const projectedMonthlyRoi = (totalInvested * (roiPct / 100)) / 12;

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
          totalProjectShares: project.totalShares,
          totalInvested,
          currentValue,
          sharePrice,
          gain,
          gainPct,
          projectedMonthlyRoi,
          updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
        };
      }),
    )).filter(Boolean) as any[];

    // 3. Summary
    const totalAssets = positions.reduce((s, p) => s + p.currentValue, 0);
    const investedCapital = positions.reduce((s, p) => s + p.totalInvested, 0);
    const unrealizedPnL = totalAssets - investedCapital;
    const unrealizedPnLPct = investedCapital > 0 ? (unrealizedPnL / investedCapital) * 100 : 0;
    const projectedAnnualIncome = positions.reduce((s, p) => s + p.projectedMonthlyRoi * 12, 0);
    const totalShares = positions.reduce((s, p) => s + p.totalShares, 0);

    // 4. Investment ledger (last 30 entries)
    const ledgerRows = await db
      .select()
      .from(investmentsLedgerTable)
      .where(eq(investmentsLedgerTable.userId, userId))
      .orderBy(desc(investmentsLedgerTable.createdAt))
      .limit(30);

    const projectCache: Record<number, any> = {};
    const ledger = await Promise.all(
      ledgerRows.map(async (row) => {
        if (!projectCache[row.projectId]) {
          const [proj] = await db.select().from(investmentProjectsTable).where(eq(investmentProjectsTable.id, row.projectId));
          projectCache[row.projectId] = proj;
        }
        const proj = projectCache[row.projectId];
        const sharePrice = proj ? parseFloat(proj.totalValue) / proj.totalShares : 0;
        return {
          transactionId: row.transactionId,
          projectId: row.projectId,
          projectTitle: proj?.title ?? "Unknown Project",
          sharesBought: row.sharesBought,
          amountPaid: parseFloat(row.amountPaid),
          sharePrice,
          status: row.status,
          createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
        };
      }),
    );

    // 5. 6-month performance history (cumulative portfolio value)
    const now = new Date();
    const performanceHistory = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleDateString("en-PK", { month: "short", year: "2-digit" });

      // sum invested up to end of that month
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const investedSoFar = ledgerRows
        .filter(r => new Date(r.createdAt) <= monthEnd)
        .reduce((s, r) => s + parseFloat(r.amountPaid), 0);

      // apply a modest simulated growth curve: each month prior has a small discount
      const monthsAgo = 5 - i;
      const growthFactor = 1 + (unrealizedPnLPct / 100) * ((6 - monthsAgo) / 6);
      const value = investedSoFar * Math.max(growthFactor, 1);

      return { month: label, value: Math.round(value), invested: Math.round(investedSoFar) };
    });

    res.json({
      wallet: { balance: walletBalance, currency: walletCurrency },
      summary: {
        totalAssets: Math.round(totalAssets * 100) / 100,
        investedCapital: Math.round(investedCapital * 100) / 100,
        unrealizedPnL: Math.round(unrealizedPnL * 100) / 100,
        unrealizedPnLPct: Math.round(unrealizedPnLPct * 100) / 100,
        projectedAnnualIncome: Math.round(projectedAnnualIncome * 100) / 100,
        totalPositions: positions.length,
        totalShares,
      },
      positions,
      ledger,
      performanceHistory,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
