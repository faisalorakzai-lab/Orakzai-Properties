import { Router } from "express";
import { db } from "@workspace/db";
import { investmentProjectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateInvestmentProjectBody } from "@workspace/api-zod";

const router = Router();

function serializeInvestmentProject(p: any) {
  return {
    ...p,
    totalValue: parseFloat(p.totalValue),
    minInvestment: parseFloat(p.minInvestment),
    roadmap: p.roadmap ?? [],
    features: p.features ?? [],
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  };
}

router.get("/investment-projects", async (req, res) => {
  try {
    const { status } = req.query;
    let rows;
    if (status && typeof status === "string") {
      rows = await db
        .select()
        .from(investmentProjectsTable)
        .where(eq(investmentProjectsTable.status, status));
    } else {
      rows = await db.select().from(investmentProjectsTable);
    }
    return res.json(rows.map(serializeInvestmentProject));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/investment-projects/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const [row] = await db
      .select()
      .from(investmentProjectsTable)
      .where(eq(investmentProjectsTable.id, id));
    if (!row) return res.status(404).json({ error: "Not found" });
    return res.json(serializeInvestmentProject(row));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/investment-projects", async (req: any, res) => {
  try {
    const parsed = CreateInvestmentProjectBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const d = parsed.data;
    const [row] = await db
      .insert(investmentProjectsTable)
      .values({
        title: d.title,
        description: d.description,
        location: d.location,
        bannerImage: d.bannerImage ?? null,
        totalValue: String(d.totalValue),
        minInvestment: String(d.minInvestment),
        totalShares: d.totalShares,
        fundedShares: d.fundedShares ?? 0,
        roi: d.roi,
        duration: d.duration,
        status: d.status ?? "funding",
        type: d.type ?? "plaza",
        roadmap: (d.roadmap ?? []) as any,
        features: d.features ?? [],
      })
      .returning();
    return res.status(201).json(serializeInvestmentProject(row));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
