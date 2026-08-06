import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  propertyLeadsTable,
  leadCallLogsTable,
  leadMessagesTable,
  agentSettingsTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { broadcastToUser } from "../lib/ws";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.userId = userId;
  next();
};

/* ─── GET /leads ─── agent's leads with call logs & message counts */
router.get("/leads", requireAuth, async (req: any, res) => {
  const agentId = req.userId as string;
  const leads = await db
    .select()
    .from(propertyLeadsTable)
    .where(eq(propertyLeadsTable.agentId, agentId))
    .orderBy(desc(propertyLeadsTable.updatedAt))
    .limit(200);

  const callLogs = await db
    .select()
    .from(leadCallLogsTable)
    .where(eq(leadCallLogsTable.agentId, agentId))
    .orderBy(desc(leadCallLogsTable.createdAt));

  const callLogsByLead = callLogs.reduce<Record<number, typeof callLogs>>((acc, log) => {
    if (!acc[log.leadId]) acc[log.leadId] = [];
    acc[log.leadId]!.push(log);
    return acc;
  }, {});

  // Score auto-calculation: leads from same buyer (same leadPhone) count × frequency
  const phoneCounts = leads.reduce<Record<string, number>>((acc, l) => {
    if (l.leadPhone) acc[l.leadPhone] = (acc[l.leadPhone] ?? 0) + 1;
    return acc;
  }, {});

  const enriched = leads.map(lead => {
    const freq = lead.leadPhone ? (phoneCounts[lead.leadPhone] ?? 1) : 1;
    const autoScore = freq >= 3 ? "hot" : freq >= 2 ? "warm" : "cold";
    return {
      id: lead.id,
      propertyId: lead.propertyId,
      propertyTitle: lead.propertyTitle,
      leadName: lead.leadName ?? null,
      leadPhone: lead.leadPhone ?? null,
      leadUserId: lead.leadUserId ?? null,
      source: lead.source,
      status: lead.status,
      score: lead.score !== "cold" ? lead.score : autoScore,
      callLogs: (callLogsByLead[lead.id] ?? []).map(l => ({
        id: l.id, note: l.note, createdAt: l.createdAt.toISOString(),
      })),
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    };
  });

  res.json(enriched);
  return;
});

/* ─── PATCH /leads/:id ─── update pipeline status or score */
router.patch("/leads/:id", requireAuth, async (req: any, res) => {
  const agentId = req.userId as string;
  const leadId = Number(req.params["id"]);
  const { status, score } = req.body as { status?: string; score?: string };

  const VALID_STATUS = ["new", "contacted", "visit_scheduled", "negotiation", "closed"];
  const VALID_SCORE  = ["hot", "warm", "cold"];

  if (status && !VALID_STATUS.includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  if (score && !VALID_SCORE.includes(score)) {
    res.status(400).json({ error: "Invalid score" }); return;
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (status) update["status"] = status;
  if (score)  update["score"]  = score;

  const [lead] = await db
    .update(propertyLeadsTable)
    .set(update)
    .where(and(eq(propertyLeadsTable.id, leadId), eq(propertyLeadsTable.agentId, agentId)))
    .returning();

  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
  res.json({ success: true, lead });
  return;
});

/* ─── POST /leads/:id/call-log ─── add call note */
router.post("/leads/:id/call-log", requireAuth, async (req: any, res) => {
  const agentId = req.userId as string;
  const leadId  = Number(req.params["id"]);
  const { note } = req.body as { note?: string };

  if (!note?.trim()) { res.status(400).json({ error: "Note required" }); return; }

  const [log] = await db.insert(leadCallLogsTable).values({ leadId, agentId, note: note.trim() }).returning();
  res.json({ success: true, log });
  return;
});

/* ─── GET /leads/:id/messages ─── chat history for a lead */
router.get("/leads/:id/messages", requireAuth, async (req: any, res) => {
  const leadId = Number(req.params["id"]);
  const messages = await db
    .select()
    .from(leadMessagesTable)
    .where(eq(leadMessagesTable.leadId, leadId))
    .orderBy(leadMessagesTable.createdAt)
    .limit(200);
  res.json(messages.map(m => ({
    id: m.id, role: m.role, senderId: m.senderId,
    body: m.body, isRead: m.isRead, createdAt: m.createdAt.toISOString(),
  })));
  return;
});

/* ─── POST /leads/:id/messages ─── send a chat message */
router.post("/leads/:id/messages", requireAuth, async (req: any, res) => {
  const agentId = req.userId as string;
  const leadId  = Number(req.params["id"]);
  const { body } = req.body as { body?: string };

  if (!body?.trim()) { res.status(400).json({ error: "Message body required" }); return; }

  // Verify the agent owns this lead
  const [lead] = await db.select().from(propertyLeadsTable)
    .where(and(eq(propertyLeadsTable.id, leadId), eq(propertyLeadsTable.agentId, agentId)))
    .limit(1);

  if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }

  const [msg] = await db.insert(leadMessagesTable).values({
    leadId, senderId: agentId, role: "agent", body: body.trim(),
  }).returning();

  const payload = {
    event: "lead_message",
    leadId,
    message: { id: msg!.id, role: "agent", senderId: agentId, body: msg!.body, createdAt: msg!.createdAt.toISOString() },
  };
  // Push to buyer if they have a user account
  if (lead.leadUserId) broadcastToUser(lead.leadUserId, payload);
  // Echo back to agent (for multi-tab sync)
  broadcastToUser(agentId, payload);

  res.json({ success: true, message: payload.message });
  return;
});

/* ─── GET /agent/settings ─── away message settings */
router.get("/agent/settings", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  let [settings] = await db.select().from(agentSettingsTable).where(eq(agentSettingsTable.userId, userId)).limit(1);
  if (!settings) {
    [settings] = await db.insert(agentSettingsTable).values({ userId }).returning();
  }
  res.json({
    awayEnabled: settings!.awayEnabled,
    awayMessage: settings!.awayMessage,
  });
  return;
});

/* ─── PATCH /agent/settings ─── update away message */
router.patch("/agent/settings", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  const { awayEnabled, awayMessage } = req.body as { awayEnabled?: boolean; awayMessage?: string };

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (awayEnabled !== undefined) update["awayEnabled"] = awayEnabled;
  if (awayMessage  !== undefined) update["awayMessage"] = awayMessage;

  const existing = await db.select().from(agentSettingsTable).where(eq(agentSettingsTable.userId, userId)).limit(1);
  let settings;
  if (existing.length === 0) {
    [settings] = await db.insert(agentSettingsTable).values({ userId, ...update }).returning();
  } else {
    [settings] = await db.update(agentSettingsTable).set(update).where(eq(agentSettingsTable.userId, userId)).returning();
  }
  res.json({ awayEnabled: settings!.awayEnabled, awayMessage: settings!.awayMessage });
  return;
});

export default router;
