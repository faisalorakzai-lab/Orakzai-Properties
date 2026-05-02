import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { propertiesTable } from "@workspace/db";
import { eq, and, gte, lte, ilike, or, sql } from "drizzle-orm";
import {
  ListPropertiesQueryParams,
  CreatePropertyBody,
  UpdatePropertyBody,
  GetPropertyParams,
  UpdatePropertyParams,
  DeletePropertyParams,
} from "@workspace/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
};

router.get("/properties/stats", async (req, res) => {
  try {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(propertiesTable);
    const total = Number(totalResult[0]?.count ?? 0);

    const byCity = await db
      .select({ label: propertiesTable.city, count: sql<number>`count(*)` })
      .from(propertiesTable)
      .groupBy(propertiesTable.city);

    const byType = await db
      .select({ label: propertiesTable.type, count: sql<number>`count(*)` })
      .from(propertiesTable)
      .groupBy(propertiesTable.type);

    const byCategory = await db
      .select({ label: propertiesTable.category, count: sql<number>`count(*)` })
      .from(propertiesTable)
      .groupBy(propertiesTable.category);

    res.json({
      total,
      byCity: byCity.map((r) => ({ label: r.label, count: Number(r.count) })),
      byType: byType.map((r) => ({ label: r.label, count: Number(r.count) })),
      byCategory: byCategory.map((r) => ({ label: r.label, count: Number(r.count) })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/properties/my", requireAuth, async (req: any, res) => {
  try {
    const props = await db
      .select()
      .from(propertiesTable)
      .where(eq(propertiesTable.ownerId, req.userId));
    res.json(props.map(serializeProperty));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/properties", async (req, res) => {
  try {
    const parsed = ListPropertiesQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};

    const conditions: any[] = [];
    if (params.city) conditions.push(ilike(propertiesTable.city, `%${params.city}%`));
    if (params.category) conditions.push(eq(propertiesTable.category, params.category));
    if (params.type) conditions.push(eq(propertiesTable.type, params.type));
    if (params.minPrice) conditions.push(gte(propertiesTable.price, String(params.minPrice)));
    if (params.maxPrice) conditions.push(lte(propertiesTable.price, String(params.maxPrice)));
    if (params.search) {
      conditions.push(
        or(
          ilike(propertiesTable.title, `%${params.search}%`),
          ilike(propertiesTable.description, `%${params.search}%`),
          ilike(propertiesTable.city, `%${params.search}%`),
        ),
      );
    }

    const props = conditions.length
      ? await db.select().from(propertiesTable).where(and(...conditions))
      : await db.select().from(propertiesTable);

    res.json(props.map(serializeProperty));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/properties", requireAuth, async (req: any, res) => {
  try {
    const parsed = CreatePropertyBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }
    const data = parsed.data;
    const [prop] = await db
      .insert(propertiesTable)
      .values({
        title: data.title,
        description: data.description,
        price: String(data.price),
        city: data.city,
        area: data.area ?? null,
        category: data.category,
        type: data.type,
        images: data.images,
        ownerId: req.userId,
        ownerName: data.ownerName ?? null,
        ownerPhone: data.ownerPhone ?? null,
        whatsappNumber: data.whatsappNumber ?? null,
        beds: data.beds ?? null,
        baths: data.baths ?? null,
        areaSqft: data.areaSqft ?? null,
      })
      .returning();
    res.status(201).json(serializeProperty(prop));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/properties/:id", async (req, res) => {
  try {
    const parsed = GetPropertyParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
    const [prop] = await db
      .select()
      .from(propertiesTable)
      .where(eq(propertiesTable.id, parsed.data.id));
    if (!prop) return res.status(404).json({ error: "Not found" });
    res.json(serializeProperty(prop));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/properties/:id", requireAuth, async (req: any, res) => {
  try {
    const parsed = UpdatePropertyParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
    const bodyParsed = UpdatePropertyBody.safeParse(req.body);
    if (!bodyParsed.success) return res.status(400).json({ error: bodyParsed.error.message });

    const existing = await db
      .select()
      .from(propertiesTable)
      .where(eq(propertiesTable.id, parsed.data.id));
    if (!existing[0]) return res.status(404).json({ error: "Not found" });
    if (existing[0].ownerId !== req.userId) return res.status(403).json({ error: "Forbidden" });

    const data = bodyParsed.data;
    const updateFields: any = { updatedAt: new Date() };
    if (data.title !== undefined) updateFields.title = data.title;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.price !== undefined) updateFields.price = String(data.price);
    if (data.city !== undefined) updateFields.city = data.city;
    if (data.area !== undefined) updateFields.area = data.area;
    if (data.category !== undefined) updateFields.category = data.category;
    if (data.type !== undefined) updateFields.type = data.type;
    if (data.images !== undefined) updateFields.images = data.images;
    if (data.ownerPhone !== undefined) updateFields.ownerPhone = data.ownerPhone;
    if (data.whatsappNumber !== undefined) updateFields.whatsappNumber = data.whatsappNumber;

    const [updated] = await db
      .update(propertiesTable)
      .set(updateFields)
      .where(eq(propertiesTable.id, parsed.data.id))
      .returning();
    res.json(serializeProperty(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/properties/:id", requireAuth, async (req: any, res) => {
  try {
    const parsed = DeletePropertyParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
    const existing = await db
      .select()
      .from(propertiesTable)
      .where(eq(propertiesTable.id, parsed.data.id));
    if (!existing[0]) return res.status(404).json({ error: "Not found" });
    if (existing[0].ownerId !== req.userId) return res.status(403).json({ error: "Forbidden" });
    await db.delete(propertiesTable).where(eq(propertiesTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function serializeProperty(p: any) {
  return {
    ...p,
    price: Number(p.price),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
  };
}

export default router;
