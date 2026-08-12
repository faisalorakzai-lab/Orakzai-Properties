import { db } from "@workspace/db";
import {
  tradingOrdersTable,
  tradesTable,
  priceHistoryTable,
  userPortfoliosTable,
} from "@workspace/db";
import { eq, and, lte, gte, asc, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sseController } from "./sseController";

const TRADING_FEE_RATE = 0.005; // 0.5%

export async function matchOrders(newOrderId: number, projectId: number, log: any) {
  const [newOrder] = await db
    .select()
    .from(tradingOrdersTable)
    .where(eq(tradingOrdersTable.id, newOrderId));

  if (!newOrder || newOrder.status === "cancelled" || newOrder.status === "filled") return;

  let remainingQty = newOrder.quantity - newOrder.filledQuantity;

  while (remainingQty > 0) {
    let matchingOrder: typeof newOrder | undefined;

    if (newOrder.type === "buy") {
      const [best] = await db
        .select()
        .from(tradingOrdersTable)
        .where(
          and(
            eq(tradingOrdersTable.projectId, projectId),
            eq(tradingOrdersTable.type, "sell"),
            eq(tradingOrdersTable.status, "pending"),
            lte(tradingOrdersTable.pricePerShare, String(newOrder.pricePerShare)),
          ),
        )
        .orderBy(asc(tradingOrdersTable.pricePerShare), asc(tradingOrdersTable.createdAt));
      matchingOrder = best;
    } else {
      const [best] = await db
        .select()
        .from(tradingOrdersTable)
        .where(
          and(
            eq(tradingOrdersTable.projectId, projectId),
            eq(tradingOrdersTable.type, "buy"),
            eq(tradingOrdersTable.status, "pending"),
            gte(tradingOrdersTable.pricePerShare, String(newOrder.pricePerShare)),
          ),
        )
        .orderBy(desc(tradingOrdersTable.pricePerShare), asc(tradingOrdersTable.createdAt));
      matchingOrder = best;
    }

    if (!matchingOrder) break;

    const matchQty = Math.min(
      remainingQty,
      matchingOrder.quantity - matchingOrder.filledQuantity,
    );
    const tradePrice = parseFloat(String(matchingOrder.pricePerShare));
    const fee = tradePrice * matchQty * TRADING_FEE_RATE;

    const buyOrderId = newOrder.type === "buy" ? newOrder.id : matchingOrder.id;
    const sellOrderId = newOrder.type === "sell" ? newOrder.id : matchingOrder.id;
    const buyerId = newOrder.type === "buy" ? newOrder.userId : matchingOrder.userId;
    const sellerId = newOrder.type === "sell" ? newOrder.userId : matchingOrder.userId;

    const [trade] = await db
      .insert(tradesTable)
      .values({
        projectId,
        buyOrderId,
        sellOrderId,
        buyerId,
        sellerId,
        quantity: matchQty,
        pricePerShare: String(tradePrice),
        tradingFee: String(fee),
      })
      .returning();

    await db.insert(priceHistoryTable).values({
      projectId,
      price: String(tradePrice),
      volume: matchQty,
    });

    const newMatchedFilled = matchingOrder.filledQuantity + matchQty;
    const matchNewStatus = newMatchedFilled >= matchingOrder.quantity ? "filled" : "partial";
    await db
      .update(tradingOrdersTable)
      .set({ filledQuantity: newMatchedFilled, status: matchNewStatus, updatedAt: new Date() })
      .where(eq(tradingOrdersTable.id, matchingOrder.id));

    const newFilled = (newOrder.filledQuantity || 0) + matchQty;
    const newStatus = newFilled >= newOrder.quantity ? "filled" : "partial";
    await db
      .update(tradingOrdersTable)
      .set({ filledQuantity: newFilled, status: newStatus, updatedAt: new Date() })
      .where(eq(tradingOrdersTable.id, newOrderId));

    await transferPortfolioShares(sellerId, buyerId, projectId, matchQty, tradePrice);

    remainingQty -= matchQty;

    const tradePayload = {
      id: trade.id,
      projectId,
      quantity: matchQty,
      pricePerShare: tradePrice,
      tradingFee: fee,
      createdAt: trade.createdAt instanceof Date ? trade.createdAt.toISOString() : trade.createdAt,
    };

    sseController.broadcast(projectId, "trade", tradePayload);
    sseController.broadcast(projectId, "orderbook_update", { projectId });

    log.info({ tradeId: trade.id, projectId, matchQty, tradePrice }, "Trade executed");
  }
}

async function transferPortfolioShares(
  sellerId: string,
  buyerId: string,
  projectId: number,
  quantity: number,
  tradePrice: number,
) {
  const tradeValue = quantity * tradePrice;

  const [sellerPortfolio] = await db
    .select()
    .from(userPortfoliosTable)
    .where(
      and(eq(userPortfoliosTable.userId, sellerId), eq(userPortfoliosTable.projectId, projectId)),
    );

  if (sellerPortfolio) {
    const newShares = Math.max(0, sellerPortfolio.totalShares - quantity);
    const costPerShare =
      sellerPortfolio.totalShares > 0
        ? parseFloat(String(sellerPortfolio.totalInvested)) / sellerPortfolio.totalShares
        : tradePrice;
    const newInvested = Math.max(0, parseFloat(String(sellerPortfolio.totalInvested)) - costPerShare * quantity);
    await db
      .update(userPortfoliosTable)
      .set({ totalShares: newShares, totalInvested: String(newInvested), updatedAt: new Date() })
      .where(
        and(
          eq(userPortfoliosTable.userId, sellerId),
          eq(userPortfoliosTable.projectId, projectId),
        ),
      );
  }

  const [buyerPortfolio] = await db
    .select()
    .from(userPortfoliosTable)
    .where(
      and(eq(userPortfoliosTable.userId, buyerId), eq(userPortfoliosTable.projectId, projectId)),
    );

  if (buyerPortfolio) {
    await db
      .update(userPortfoliosTable)
      .set({
        totalShares: buyerPortfolio.totalShares + quantity,
        totalInvested: String(parseFloat(String(buyerPortfolio.totalInvested)) + tradeValue),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userPortfoliosTable.userId, buyerId),
          eq(userPortfoliosTable.projectId, projectId),
        ),
      );
  } else {
    await db.insert(userPortfoliosTable).values({
      userId: buyerId,
      projectId,
      totalShares: quantity,
      totalInvested: String(tradeValue),
    });
  }
}

export async function ensurePriceHistory(projectId: number, basePrice: number) {
  const existing = await db
    .select()
    .from(priceHistoryTable)
    .where(eq(priceHistoryTable.projectId, projectId));

  if (existing.length > 0) return;

  const now = Date.now();
  const rows = [];
  let price = basePrice;

  for (let i = 59; i >= 0; i--) {
    const drift = (Math.random() - 0.48) * 0.02;
    price = price * (1 + drift);
    price = Math.max(price, basePrice * 0.6);
    const ts = new Date(now - i * 6 * 60 * 60 * 1000);
    rows.push({ projectId, price: String(price), volume: Math.floor(Math.random() * 20), timestamp: ts });
  }

  await db.insert(priceHistoryTable).values(rows as any);
}
