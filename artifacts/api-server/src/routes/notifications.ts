import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  notificationsTable,
  notificationSettingsTable,
  pushSubscriptionsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import webPush from "web-push";

const router = Router();

/* ── WebPush config (graceful when env vars absent) ── */
const vapidPublic  = process.env["VAPID_PUBLIC_KEY"];
const vapidPrivate = process.env["VAPID_PRIVATE_KEY"];
const vapidEmail   = process.env["VAPID_EMAIL"] ?? "mailto:admin@orakzaiproperties.com";
let pushReady = false;
if (vapidPublic && vapidPrivate) {
  webPush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);
  pushReady = true;
}

/* ── Auth middleware ── */
const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

/* ═══════════════════════════════════
   EXPORTED helper — call from other routes to create + push notifications
═══════════════════════════════════ */
export async function createNotification(params: {
  userId: string;
  type: "market_alert" | "price_pulse" | "wealth_alert" | "system";
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  broadcast?: (userId: string, payload: unknown) => void;
}): Promise<void> {
  const { userId, type, title, body, metadata = {}, broadcast } = params;

  // Check user settings
  const [settings] = await db
    .select()
    .from(notificationSettingsTable)
    .where(eq(notificationSettingsTable.userId, userId))
    .limit(1);

  const allowed = !settings || (
    (type === "market_alert" && settings.marketAlerts) ||
    (type === "price_pulse"  && settings.pricePulse)   ||
    (type === "wealth_alert" && settings.wealthAlerts) ||
    (type === "system"       && settings.systemUpdates)
  );
  if (!allowed) return;

  // Insert into DB
  const [row] = await db
    .insert(notificationsTable)
    .values({ userId, type, title, body, metadata })
    .returning();

  // WebSocket broadcast (in-app real-time)
  if (broadcast && row) {
    broadcast(userId, { event: "notification", data: row });
  }

  // Web push delivery
  if (pushReady && settings?.pushEnabled) {
    const subs = await db
      .select()
      .from(pushSubscriptionsTable)
      .where(eq(pushSubscriptionsTable.userId, userId));

    const payload = JSON.stringify({ title, body, type, id: row?.id });
    await Promise.allSettled(
      subs.map(sub =>
        webPush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys as any },
          payload,
        ).catch(() => null),
      ),
    );
  }
}

/* ─── GET /notifications ─── */
router.get("/notifications", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(100);

  const unreadCount = rows.filter(r => !r.isRead).length;
  res.json({ notifications: rows, unreadCount });
  return;
});

/* ─── DELETE /notifications — clear all ─── */
router.delete("/notifications", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  await db.delete(notificationsTable).where(eq(notificationsTable.userId, userId));
  res.json({ success: true });
  return;
});

/* ─── PATCH /notifications/:id/read ─── */
router.patch("/notifications/:id/read", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
  res.json({ success: true });
  return;
});

/* ─── POST /notifications/read-all ─── */
router.post("/notifications/read-all", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, userId));
  res.json({ success: true });
  return;
});

/* ─── GET /notifications/settings ─── */
router.get("/notifications/settings", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  let [settings] = await db
    .select()
    .from(notificationSettingsTable)
    .where(eq(notificationSettingsTable.userId, userId))
    .limit(1);

  if (!settings) {
    [settings] = await db
      .insert(notificationSettingsTable)
      .values({ userId })
      .returning();
  }
  res.json({
    userId: settings!.userId,
    marketAlerts: settings!.marketAlerts,
    pricePulse: settings!.pricePulse,
    wealthAlerts: settings!.wealthAlerts,
    systemUpdates: settings!.systemUpdates,
    pushEnabled: settings!.pushEnabled,
  });
  return;
});

/* ─── PATCH /notifications/settings ─── */
router.patch("/notifications/settings", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  const { marketAlerts, pricePulse, wealthAlerts, systemUpdates, pushEnabled } = req.body;

  const existing = await db
    .select()
    .from(notificationSettingsTable)
    .where(eq(notificationSettingsTable.userId, userId))
    .limit(1);

  const update: Record<string, boolean> = {};
  if (marketAlerts  !== undefined) update.marketAlerts  = Boolean(marketAlerts);
  if (pricePulse    !== undefined) update.pricePulse    = Boolean(pricePulse);
  if (wealthAlerts  !== undefined) update.wealthAlerts  = Boolean(wealthAlerts);
  if (systemUpdates !== undefined) update.systemUpdates = Boolean(systemUpdates);
  if (pushEnabled   !== undefined) update.pushEnabled   = Boolean(pushEnabled);

  let settings;
  if (existing.length === 0) {
    [settings] = await db
      .insert(notificationSettingsTable)
      .values({ userId, ...update })
      .returning();
  } else {
    [settings] = await db
      .update(notificationSettingsTable)
      .set(update)
      .where(eq(notificationSettingsTable.userId, userId))
      .returning();
  }
  res.json({
    userId: settings!.userId,
    marketAlerts: settings!.marketAlerts,
    pricePulse: settings!.pricePulse,
    wealthAlerts: settings!.wealthAlerts,
    systemUpdates: settings!.systemUpdates,
    pushEnabled: settings!.pushEnabled,
  });
  return;
});

/* ─── POST /notifications/push-subscribe ─── */
router.post("/notifications/push-subscribe", requireAuth, async (req: any, res) => {
  const userId = req.userId as string;
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: "Invalid subscription" });
    return;
  }

  await db
    .insert(pushSubscriptionsTable)
    .values({ userId, endpoint, keys })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.endpoint,
      set: { userId, keys },
    });

  // Also enable push in settings
  const existing = await db.select().from(notificationSettingsTable).where(eq(notificationSettingsTable.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(notificationSettingsTable).values({ userId, pushEnabled: true });
  } else {
    await db.update(notificationSettingsTable).set({ pushEnabled: true }).where(eq(notificationSettingsTable.userId, userId));
  }

  res.json({ success: true });
  return;
});

export const vapidPublicKey = vapidPublic ?? "";

export default router;
