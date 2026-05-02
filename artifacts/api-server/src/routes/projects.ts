import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { projectsTable, projectUpdatesTable, bookingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetProjectParams,
  ListProjectUpdatesParams,
  CreateProjectUpdateBody,
  CreateProjectUpdateParams,
  CreateBookingBody,
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

router.get("/projects", async (req, res) => {
  try {
    const projects = await db.select().from(projectsTable);
    res.json(projects.map(serializeProject));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/projects/:id", async (req, res) => {
  try {
    const parsed = GetProjectParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, parsed.data.id));
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(serializeProject(project));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/projects/:id/updates", async (req, res) => {
  try {
    const parsed = ListProjectUpdatesParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
    const updates = await db
      .select()
      .from(projectUpdatesTable)
      .where(eq(projectUpdatesTable.projectId, parsed.data.id));
    res.json(updates.map(serializeUpdate));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects/:id/updates", requireAuth, async (req: any, res) => {
  try {
    const parsed = CreateProjectUpdateParams.safeParse({ id: Number(req.params.id) });
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
    const bodyParsed = CreateProjectUpdateBody.safeParse(req.body);
    if (!bodyParsed.success) return res.status(400).json({ error: bodyParsed.error.message });

    const [update] = await db
      .insert(projectUpdatesTable)
      .values({
        projectId: parsed.data.id,
        title: bodyParsed.data.title,
        content: bodyParsed.data.content,
        imageUrl: bodyParsed.data.imageUrl ?? null,
      })
      .returning();
    res.status(201).json(serializeUpdate(update));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bookings", async (req: any, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId ?? null;

    const parsed = CreateBookingBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

    const [booking] = await db
      .insert(bookingsTable)
      .values({
        projectId: parsed.data.projectId,
        userId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email ?? null,
        plotSize: parsed.data.plotSize,
        message: parsed.data.message ?? null,
        status: "pending",
      })
      .returning();
    res.status(201).json(serializeBooking(booking));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bookings", requireAuth, async (req: any, res) => {
  try {
    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.userId, req.userId));
    res.json(bookings.map(serializeBooking));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function serializeProject(p: any) {
  return {
    ...p,
    pricePerMarla: Number(p.pricePerMarla),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  };
}

function serializeUpdate(u: any) {
  return {
    ...u,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  };
}

function serializeBooking(b: any) {
  return {
    ...b,
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
  };
}

export default router;
