import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  userSubscriptionsTable,
  walletsTable,
  walletTransactionsTable,
  propertiesTable,
} from "@workspace/db";
import { eq, desc, and, count, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { createNotification } from "./notifications";
import { broadcastToUser } from "../index";

const router = Router();

/* ── Plan definitions ────────────────────────────────────────────────────── */
export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    monthlyPkr: 0,
    annualPkr: 0,
    listingLimit: 2,
    hotTags: 0,
    verifiedBadge: false,
    featuredHome: false,
    directLeads: false,
    support: "community",
    perks: ["2 Active Listings", "Standard Visibility", "Community Support"],
  },
  premium: {
    id: "premium",
    name: "Premium",
    monthlyPkr: 9_900,
    annualPkr: 100_980,
    listingLimit: 20,
    hotTags: 5,
    verifiedBadge: true,
    featuredHome: false,
    directLeads: false,
    support: "email",
    perks: ["20 Listings", "Verified Agent Badge", "5 Hot Tags", "Email Support", "Priority Search Placement"],
  },
  sovereign: {
    id: "sovereign",
    name: "Sovereign",
    monthlyPkr: 24_900,
    annualPkr: 253_980,
    listingLimit: -1,
    hotTags: -1,
    verifiedBadge: true,
    featuredHome: true,
    directLeads: true,
    support: "247",
    perks: ["Unlimited Listings", "Featured on Home Dashboard", "Direct Lead Notifications", "24/7 Priority Support", "Verified Agent Badge", "Unlimited Hot Tags"],
  },
} as const;

export type PlanId = keyof typeof PLANS;

/* ── Auth middleware ── */
const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.userId = auth.userId;
  next();
};

/* ── GET /subscription/plans ─────────────────────────────────────────────── */
router.get("/subscription/plans", (_req, res) => {
  res.json(Object.values(PLANS));
});

/* ── GET /subscription/me ────────────────────────────────────────────────── */
router.get("/subscription/me", requireAuth, async (req: any, res) => {
  try {
    const [active] = await db
      .select()
      .from(userSubscriptionsTable)
      .where(and(
        eq(userSubscriptionsTable.userId, req.userId),
        eq(userSubscriptionsTable.status, "active"),
      ))
      .orderBy(desc(userSubscriptionsTable.createdAt))
      .limit(1);

    if (!active) {
      res.json({ planId: "free", plan: PLANS.free, subscription: null });
      return;
    }

    const planId = active.planId as PlanId;
    res.json({ planId, plan: PLANS[planId] ?? PLANS.free, subscription: active });
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

/* ── GET /subscription/listing-count ─────────────────────────────────────── */
router.get("/subscription/listing-count", requireAuth, async (req: any, res) => {
  try {
    const [row] = await db
      .select({ n: count() })
      .from(propertiesTable)
      .where(eq(propertiesTable.ownerId, req.userId));
    res.json({ count: Number(row?.n ?? 0) });
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Failed" });
  }
});

/* ── POST /subscription/subscribe ────────────────────────────────────────── */
router.post("/subscription/subscribe", requireAuth, async (req: any, res) => {
  try {
    const { planId, billingCycle } = req.body as { planId: string; billingCycle: "monthly" | "annual" };

    if (!["premium", "sovereign"].includes(planId)) {
      res.status(400).json({ error: "Invalid plan" }); return;
    }
    if (!["monthly", "annual"].includes(billingCycle)) {
      res.status(400).json({ error: "Invalid billing cycle" }); return;
    }

    const plan = PLANS[planId as PlanId];
    const amount = billingCycle === "annual" ? plan.annualPkr : plan.monthlyPkr;

    /* ── deduct from wallet ── */
    const [wallet] = await db
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.userId, req.userId))
      .limit(1);

    if (!wallet) { res.status(400).json({ error: "Wallet not found. Please open your Wallet first." }); return; }
    if (parseFloat(wallet.balance) < amount) {
      res.status(400).json({ error: "Insufficient wallet balance", required: amount, available: parseFloat(wallet.balance) });
      return;
    }

    const newBalance = (parseFloat(wallet.balance) - amount).toFixed(2);

    /* ── expire any existing active sub ── */
    await db
      .update(userSubscriptionsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(
        eq(userSubscriptionsTable.userId, req.userId),
        eq(userSubscriptionsTable.status, "active"),
      ));

    /* ── calculate expiry ── */
    const now = new Date();
    const expiryDate = new Date(now);
    if (billingCycle === "annual") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    const txnId = `SUB-${randomUUID().slice(0, 12).toUpperCase()}`;

    /* ── deduct wallet balance ── */
    await db
      .update(walletsTable)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(walletsTable.userId, req.userId));

    /* ── record wallet transaction ── */
    await db.insert(walletTransactionsTable).values({
      txnId,
      userId: req.userId,
      amount: amount.toFixed(2),
      type: "subscription",
      status: "success",
      note: `${plan.name} Plan — ${billingCycle} subscription`,
      balanceAfter: newBalance,
    });

    /* ── insert subscription record ── */
    const [sub] = await db
      .insert(userSubscriptionsTable)
      .values({
        userId: req.userId,
        planId,
        billingCycle,
        amountPaid: amount.toFixed(2),
        currency: "PKR",
        startDate: now,
        expiryDate,
        isAutoRenew: true,
        status: "active",
        txnId,
      })
      .returning();

    /* ── fire notification ── */
    await createNotification({
      userId: req.userId,
      type: "wealth_alert",
      title: `${plan.name} Plan Activated 🎉`,
      body: `Your ${plan.name} subscription is now active until ${expiryDate.toLocaleDateString("en-PK")}. Unlock your new listing capacity now.`,
      metadata: { planId, billingCycle, txnId },
      broadcast: broadcastToUser,
    });

    res.json({ success: true, subscription: sub, newBalance });
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Subscription failed" });
  }
});

/* ── POST /subscription/cancel ───────────────────────────────────────────── */
router.post("/subscription/cancel", requireAuth, async (req: any, res) => {
  try {
    await db
      .update(userSubscriptionsTable)
      .set({ isAutoRenew: false, updatedAt: new Date() })
      .where(and(
        eq(userSubscriptionsTable.userId, req.userId),
        eq(userSubscriptionsTable.status, "active"),
      ));
    res.json({ success: true });
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Cancel failed" });
  }
});

export default router;
