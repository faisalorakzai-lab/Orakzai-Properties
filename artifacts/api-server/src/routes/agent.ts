import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  propertiesTable,
  agentProfilesTable,
  propertyLeadsTable,
} from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

/* ─── GET /agent/dashboard ─── */
router.get("/agent/dashboard", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;

  // Profile (create if first visit)
  let [profile] = await db
    .select()
    .from(agentProfilesTable)
    .where(eq(agentProfilesTable.userId, userId))
    .limit(1);

  if (!profile) {
    [profile] = await db
      .insert(agentProfilesTable)
      .values({ userId })
      .returning();
  }

  // Agent's property listings
  const listings = await db
    .select()
    .from(propertiesTable)
    .where(eq(propertiesTable.ownerId, userId))
    .orderBy(desc(propertiesTable.createdAt))
    .limit(50);

  // Leads for agent's properties
  const leads = await db
    .select()
    .from(propertyLeadsTable)
    .where(eq(propertyLeadsTable.agentId, userId))
    .orderBy(desc(propertyLeadsTable.createdAt))
    .limit(100);

  // Build stats
  const activeListings = listings.filter(l => l.isAvailable).length;
  const totalViews = listings.length * 47; // placeholder until view tracking is added

  // Build listing items with lead counts
  const leadsByProperty = leads.reduce<Record<number, number>>((acc, lead) => {
    acc[lead.propertyId] = (acc[lead.propertyId] ?? 0) + 1;
    return acc;
  }, {});

  const listingItems = listings.map(l => ({
    id: l.id,
    title: l.title,
    city: l.city,
    price: parseFloat(l.price),
    category: l.category,
    type: l.type,
    isAvailable: l.isAvailable,
    isVerified: l.isVerified,
    status: !l.isAvailable ? "sold" : l.isVerified ? "live" : "pending",
    views: Math.floor(Math.random() * 150) + 10, // placeholder
    leads: leadsByProperty[l.id] ?? 0,
    createdAt: l.createdAt.toISOString(),
  }));

  const leadItems = leads.map(lead => ({
    id: lead.id,
    propertyTitle: lead.propertyTitle,
    leadName: lead.leadName ?? null,
    leadPhone: lead.leadPhone ?? null,
    source: lead.source,
    createdAt: lead.createdAt.toISOString(),
  }));

  res.json({
    profile: {
      userId: profile!.userId,
      agencyName: profile!.agencyName ?? null,
      logoUrl: profile!.logoUrl ?? null,
      experienceYears: profile!.experienceYears ?? 0,
      specialization: profile!.specialization ?? null,
      bio: profile!.bio ?? null,
      verificationStatus: profile!.verificationStatus,
    },
    stats: {
      totalListings: listings.length,
      activeListings,
      totalLeads: leads.length,
      totalViews,
    },
    listings: listingItems,
    leads: leadItems,
  });
  return;
});

/* ─── GET /agent/profile ─── */
router.get("/agent/profile", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  let [profile] = await db
    .select()
    .from(agentProfilesTable)
    .where(eq(agentProfilesTable.userId, userId))
    .limit(1);

  if (!profile) {
    [profile] = await db
      .insert(agentProfilesTable)
      .values({ userId })
      .returning();
  }
  res.json({
    userId: profile!.userId,
    agencyName: profile!.agencyName ?? null,
    logoUrl: profile!.logoUrl ?? null,
    experienceYears: profile!.experienceYears ?? 0,
    specialization: profile!.specialization ?? null,
    bio: profile!.bio ?? null,
    verificationStatus: profile!.verificationStatus,
  });
  return;
});

/* ─── PATCH /agent/profile ─── */
router.patch("/agent/profile", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  const { agencyName, logoUrl, experienceYears, specialization, bio } = req.body;

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (agencyName      !== undefined) update.agencyName      = agencyName;
  if (logoUrl         !== undefined) update.logoUrl         = logoUrl;
  if (experienceYears !== undefined) update.experienceYears = Number(experienceYears);
  if (specialization  !== undefined) update.specialization  = specialization;
  if (bio             !== undefined) update.bio             = bio;

  const existing = await db.select().from(agentProfilesTable).where(eq(agentProfilesTable.userId, userId)).limit(1);
  let profile;
  if (existing.length === 0) {
    [profile] = await db.insert(agentProfilesTable).values({ userId, ...update }).returning();
  } else {
    [profile] = await db.update(agentProfilesTable).set(update).where(eq(agentProfilesTable.userId, userId)).returning();
  }
  res.json({
    userId: profile!.userId,
    agencyName: profile!.agencyName ?? null,
    logoUrl: profile!.logoUrl ?? null,
    experienceYears: profile!.experienceYears ?? 0,
    specialization: profile!.specialization ?? null,
    bio: profile!.bio ?? null,
    verificationStatus: profile!.verificationStatus,
  });
  return;
});

/* ─── POST /agent/lead ─── */
router.post("/agent/lead", async (req: any, res) => {
  const { propertyId, propertyTitle, agentId, leadName, leadPhone, source } = req.body;
  if (!propertyId || !propertyTitle || !agentId || !source) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const auth = getAuth(req);
  await db.insert(propertyLeadsTable).values({
    propertyId: Number(propertyId),
    propertyTitle,
    agentId,
    leadUserId: auth?.userId ?? undefined,
    leadName: leadName ?? undefined,
    leadPhone: leadPhone ?? undefined,
    source,
  });
  res.json({ success: true });
  return;
});

export default router;
