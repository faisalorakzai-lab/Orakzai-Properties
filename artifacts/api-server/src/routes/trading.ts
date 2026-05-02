import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  tradingOrdersTable,
  tradesTable,
  priceHistoryTable,
  investmentProjectsTable,
} from "@workspace/db";
import { eq, and, desc, gte, lte, asc, sql } from "drizzle-orm";
import { sseController } from "../trading/sseController";
import { matchOrders, ensurePriceHistory } from "../trading/orderMatcher";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = auth.userId;
  next();
};

router.get("/trading/stream/:projectId", (req: any, res) => {
  const projectId = Number(req.params.projectId);
  if (isNaN(projectId)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(`event: connected\ndata: {"projectId":${projectId}}\n\n`);

  sseController.subscribe(projectId, res);

  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
  });
});

router.get("/trading/orderbook/:projectId", async (req: any, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (isNaN(projectId)) return res.status(400).json({ error: "Invalid project id" });

    const [bids, asks] = await Promise.all([
      db
        .select()
        .from(tradingOrdersTable)
        .where(
          and(
            eq(tradingOrdersTable.projectId, projectId),
            eq(tradingOrdersTable.type, "buy"),
            eq(tradingOrdersTable.status, "pending"),
          ),
        )
        .orderBy(desc(tradingOrdersTable.pricePerShare)),
      db
        .select()
        .from(tradingOrdersTable)
        .where(
          and(
            eq(tradingOrdersTable.projectId, projectId),
            eq(tradingOrdersTable.type, "sell"),
            eq(tradingOrdersTable.status, "pending"),
          ),
        )
        .orderBy(asc(tradingOrdersTable.pricePerShare)),
    ]);

    const serialize = (o: any) => ({
      id: o.id,
      type: o.type,
      quantity: o.quantity - o.filledQuantity,
      pricePerShare: parseFloat(o.pricePerShare),
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    });

    return res.json({
      bids: bids.map(serialize),
      asks: asks.map(serialize),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trading/ticker/:projectId", async (req: any, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (isNaN(projectId)) return res.status(400).json({ error: "Invalid project id" });

    const [project] = await db
      .select()
      .from(investmentProjectsTable)
      .where(eq(investmentProjectsTable.id, projectId));

    if (!project) return res.status(404).json({ error: "Project not found" });

    const basePrice = parseFloat(project.totalValue) / project.totalShares;

    await ensurePriceHistory(projectId, basePrice);

    const [lastTrade] = await db
      .select()
      .from(tradesTable)
      .where(eq(tradesTable.projectId, projectId))
      .orderBy(desc(tradesTable.createdAt))
      .limit(1);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [oldPrice] = await db
      .select()
      .from(priceHistoryTable)
      .where(
        and(
          eq(priceHistoryTable.projectId, projectId),
          gte(priceHistoryTable.timestamp, twentyFourHoursAgo),
        ),
      )
      .orderBy(asc(priceHistoryTable.timestamp))
      .limit(1);

    const lastPrice = lastTrade ? parseFloat(String(lastTrade.pricePerShare)) : basePrice;
    const open24h = oldPrice ? parseFloat(String(oldPrice.price)) : basePrice;
    const change24h = open24h > 0 ? ((lastPrice - open24h) / open24h) * 100 : 0;

    const volumeResult = await db
      .select({ vol: sql<number>`sum(quantity)` })
      .from(tradesTable)
      .where(
        and(
          eq(tradesTable.projectId, projectId),
          gte(tradesTable.createdAt, twentyFourHoursAgo),
        ),
      );
    const volume24h = Number(volumeResult[0]?.vol ?? 0);

    const [buyOrders, sellOrders] = await Promise.all([
      db
        .select({ qty: sql<number>`sum(quantity - filled_quantity)` })
        .from(tradingOrdersTable)
        .where(
          and(
            eq(tradingOrdersTable.projectId, projectId),
            eq(tradingOrdersTable.type, "buy"),
            eq(tradingOrdersTable.status, "pending"),
          ),
        ),
      db
        .select({ qty: sql<number>`sum(quantity - filled_quantity)` })
        .from(tradingOrdersTable)
        .where(
          and(
            eq(tradingOrdersTable.projectId, projectId),
            eq(tradingOrdersTable.type, "sell"),
            eq(tradingOrdersTable.status, "pending"),
          ),
        ),
    ]);

    const buyQty = Number(buyOrders[0]?.qty ?? 0);
    const sellQty = Number(sellOrders[0]?.qty ?? 0);
    const total = buyQty + sellQty;
    const sentimentScore = total > 0 ? Math.round((buyQty / total) * 100) : 50;
    const sentiment = sentimentScore >= 60 ? "bullish" : sentimentScore <= 40 ? "bearish" : "neutral";

    return res.json({
      projectId,
      projectTitle: project.title,
      basePrice,
      lastPrice,
      change24h: parseFloat(change24h.toFixed(2)),
      volume24h,
      sentimentScore,
      sentiment,
      highPrice: basePrice * 1.05,
      lowPrice: basePrice * 0.95,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trading/price-history/:projectId", async (req: any, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (isNaN(projectId)) return res.status(400).json({ error: "Invalid project id" });

    const rows = await db
      .select()
      .from(priceHistoryTable)
      .where(eq(priceHistoryTable.projectId, projectId))
      .orderBy(asc(priceHistoryTable.timestamp));

    return res.json(
      rows.map((r) => ({
        time: Math.floor(
          (r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp)).getTime() / 1000,
        ),
        value: parseFloat(String(r.price)),
        volume: r.volume,
      })),
    );
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trading/my-orders/:projectId", requireAuth, async (req: any, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (isNaN(projectId)) return res.status(400).json({ error: "Invalid project id" });

    const orders = await db
      .select()
      .from(tradingOrdersTable)
      .where(
        and(
          eq(tradingOrdersTable.userId, req.userId),
          eq(tradingOrdersTable.projectId, projectId),
        ),
      )
      .orderBy(desc(tradingOrdersTable.createdAt));

    return res.json(
      orders.map((o) => ({
        id: o.id,
        type: o.type,
        quantity: o.quantity,
        filledQuantity: o.filledQuantity,
        pricePerShare: parseFloat(String(o.pricePerShare)),
        status: o.status,
        createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
      })),
    );
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/trading/orders", requireAuth, async (req: any, res) => {
  try {
    const { projectId, type, quantity, pricePerShare } = req.body;

    if (!projectId || !type || !quantity || !pricePerShare) {
      return res.status(400).json({ error: "projectId, type, quantity, pricePerShare required" });
    }
    if (!["buy", "sell"].includes(type)) {
      return res.status(400).json({ error: "type must be buy or sell" });
    }
    if (quantity < 1 || !Number.isInteger(Number(quantity))) {
      return res.status(400).json({ error: "quantity must be a positive integer" });
    }
    if (pricePerShare <= 0) {
      return res.status(400).json({ error: "pricePerShare must be positive" });
    }

    const [order] = await db
      .insert(tradingOrdersTable)
      .values({
        projectId: Number(projectId),
        userId: req.userId,
        type,
        quantity: Number(quantity),
        pricePerShare: String(pricePerShare),
        status: "pending",
        filledQuantity: 0,
      })
      .returning();

    sseController.broadcast(Number(projectId), "orderbook_update", { projectId });

    setImmediate(() => {
      matchOrders(order.id, Number(projectId), req.log).catch((err) =>
        req.log.error(err, "Order matching failed"),
      );
    });

    return res.status(201).json({
      id: order.id,
      projectId: order.projectId,
      type: order.type,
      quantity: order.quantity,
      pricePerShare: parseFloat(String(order.pricePerShare)),
      status: order.status,
      createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/trading/orders/:id", requireAuth, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid order id" });

    const [order] = await db
      .select()
      .from(tradingOrdersTable)
      .where(eq(tradingOrdersTable.id, id));

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== req.userId) return res.status(403).json({ error: "Forbidden" });
    if (order.status !== "pending" && order.status !== "partial") {
      return res.status(400).json({ error: "Order cannot be cancelled" });
    }

    await db
      .update(tradingOrdersTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(tradingOrdersTable.id, id));

    sseController.broadcast(order.projectId, "orderbook_update", { projectId: order.projectId });

    return res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
