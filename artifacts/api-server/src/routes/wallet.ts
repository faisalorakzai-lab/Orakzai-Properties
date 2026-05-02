import { Router } from "express";
import { getAuth } from "@clerk/express";
import { createHash, randomUUID } from "crypto";
import { db } from "@workspace/db";
import { walletsTable, walletTransactionsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { walletSseController } from "../wallet/walletSseController";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  if (!auth?.userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = auth.userId;
  next();
};

const hashPin = (pin: string) =>
  createHash("sha256").update(`ORAKZAI_${pin}_SECURE_2024`).digest("hex");

async function getOrCreateWallet(userId: string) {
  const [existing] = await db
    .select()
    .from(walletsTable)
    .where(eq(walletsTable.userId, userId))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(walletsTable)
    .values({ userId, balance: "0", currency: "PKR" })
    .returning();
  return created;
}

router.get("/wallet/stream", requireAuth, (req: any, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  res.write(`event: connected\ndata: {"userId":"${req.userId}"}\n\n`);
  walletSseController.subscribe(req.userId, res);

  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); }
  }, 20000);

  req.on("close", () => clearInterval(heartbeat));
});

router.get("/wallet/me", requireAuth, async (req: any, res) => {
  try {
    const wallet = await getOrCreateWallet(req.userId);
    res.json({
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      currency: wallet.currency,
      isPinSet: wallet.isPinSet,
      createdAt: wallet.createdAt,
    });
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch wallet" });
  }
});

router.get("/wallet/transactions", requireAuth, async (req: any, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    const type = req.query.type as string | undefined;

    const conditions = [eq(walletTransactionsTable.userId, req.userId)];
    if (type && type !== "all") conditions.push(eq(walletTransactionsTable.type, type));

    const rows = await db
      .select()
      .from(walletTransactionsTable)
      .where(and(...conditions))
      .orderBy(desc(walletTransactionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(rows);
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.post("/wallet/deposit", requireAuth, async (req: any, res) => {
  try {
    const { amount, note } = req.body;
    const num = parseFloat(amount);
    if (!num || num <= 0 || num > 50_000_000) {
      res.status(400).json({ error: "Amount must be between 1 and 50,000,000" });
      return;
    }

    const wallet = await getOrCreateWallet(req.userId);
    const newBalance = (parseFloat(wallet.balance) + num).toFixed(2);

    await db
      .update(walletsTable)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(walletsTable.userId, req.userId));

    const txnId = `DEP-${randomUUID().slice(0, 12).toUpperCase()}`;
    const [txn] = await db
      .insert(walletTransactionsTable)
      .values({
        txnId,
        userId: req.userId,
        amount: num.toFixed(2),
        type: "deposit",
        status: "success",
        note: note || "Bank Transfer Deposit",
        balanceAfter: newBalance,
      })
      .returning();

    walletSseController.emit(req.userId, "balance_update", { balance: newBalance, txn });
    res.json({ success: true, txn, newBalance });
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Deposit failed" });
  }
});

router.post("/wallet/withdraw", requireAuth, async (req: any, res) => {
  try {
    const { amount, bankName, accountNumber, pin } = req.body;
    const num = parseFloat(amount);
    if (!num || num <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }

    const wallet = await getOrCreateWallet(req.userId);
    if (!wallet.isPinSet) { res.status(403).json({ error: "Set a wallet PIN first" }); return; }
    if (wallet.pinHash !== hashPin(pin)) { res.status(403).json({ error: "Invalid PIN" }); return; }
    if (parseFloat(wallet.balance) < num) { res.status(400).json({ error: "Insufficient balance" }); return; }

    const newBalance = (parseFloat(wallet.balance) - num).toFixed(2);
    await db
      .update(walletsTable)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(walletsTable.userId, req.userId));

    const txnId = `WDR-${randomUUID().slice(0, 12).toUpperCase()}`;
    const [txn] = await db
      .insert(walletTransactionsTable)
      .values({
        txnId,
        userId: req.userId,
        amount: num.toFixed(2),
        type: "withdrawal",
        status: "pending",
        note: `Withdrawal to ${bankName} — ${accountNumber}`,
        balanceAfter: newBalance,
      })
      .returning();

    walletSseController.emit(req.userId, "balance_update", { balance: newBalance, txn });
    res.json({ success: true, txn, newBalance });
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Withdrawal failed" });
  }
});

router.post("/wallet/transfer", requireAuth, async (req: any, res) => {
  try {
    const { recipientUserId, amount, note, pin } = req.body;
    const num = parseFloat(amount);
    if (!num || num <= 0) { res.status(400).json({ error: "Invalid amount" }); return; }
    if (recipientUserId === req.userId) { res.status(400).json({ error: "Cannot transfer to yourself" }); return; }

    const senderWallet = await getOrCreateWallet(req.userId);
    if (num >= 50_000) {
      if (!senderWallet.isPinSet) { res.status(403).json({ error: "Set a wallet PIN first" }); return; }
      if (senderWallet.pinHash !== hashPin(pin)) { res.status(403).json({ error: "Invalid PIN" }); return; }
    }
    if (parseFloat(senderWallet.balance) < num) { res.status(400).json({ error: "Insufficient balance" }); return; }

    const [recipientWallet] = await db
      .select()
      .from(walletsTable)
      .where(eq(walletsTable.userId, recipientUserId))
      .limit(1);
    if (!recipientWallet) { res.status(404).json({ error: "Recipient wallet not found. They must log in first." }); return; }

    const senderNewBalance = (parseFloat(senderWallet.balance) - num).toFixed(2);
    const recipientNewBalance = (parseFloat(recipientWallet.balance) + num).toFixed(2);

    await db
      .update(walletsTable)
      .set({ balance: senderNewBalance, updatedAt: new Date() })
      .where(eq(walletsTable.userId, req.userId));

    await db
      .update(walletsTable)
      .set({ balance: recipientNewBalance, updatedAt: new Date() })
      .where(eq(walletsTable.userId, recipientUserId));

    const pairId = randomUUID().slice(0, 12).toUpperCase();
    const outId = `TRF-OUT-${pairId}`;
    const inId = `TRF-IN-${pairId}`;

    const [outTxn] = await db
      .insert(walletTransactionsTable)
      .values({
        txnId: outId,
        userId: req.userId,
        counterpartyId: recipientUserId,
        amount: num.toFixed(2),
        type: "transfer_out",
        status: "success",
        note: note || `Transfer to ${recipientUserId.slice(0, 16)}...`,
        balanceAfter: senderNewBalance,
      })
      .returning();

    const [inTxn] = await db
      .insert(walletTransactionsTable)
      .values({
        txnId: inId,
        userId: recipientUserId,
        counterpartyId: req.userId,
        amount: num.toFixed(2),
        type: "transfer_in",
        status: "success",
        note: note || `Transfer from ${req.userId.slice(0, 16)}...`,
        balanceAfter: recipientNewBalance,
      })
      .returning();

    walletSseController.emit(req.userId, "balance_update", { balance: senderNewBalance, txn: outTxn });
    walletSseController.emit(recipientUserId, "balance_update", { balance: recipientNewBalance, txn: inTxn });

    res.json({ success: true, txn: outTxn, newBalance: senderNewBalance });
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Transfer failed" });
  }
});

router.post("/wallet/set-pin", requireAuth, async (req: any, res) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{4,6}$/.test(pin)) { res.status(400).json({ error: "PIN must be 4–6 digits" }); return; }

    await getOrCreateWallet(req.userId);
    await db
      .update(walletsTable)
      .set({ pinHash: hashPin(pin), isPinSet: true, updatedAt: new Date() })
      .where(eq(walletsTable.userId, req.userId));

    res.json({ success: true });
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to set PIN" });
  }
});

router.post("/wallet/verify-pin", requireAuth, async (req: any, res) => {
  try {
    const { pin } = req.body;
    const wallet = await getOrCreateWallet(req.userId);
    const valid = wallet.isPinSet && wallet.pinHash === hashPin(pin);
    res.json({ valid });
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Verification failed" });
  }
});

router.get("/wallet/receipt/:txnId", requireAuth, async (req: any, res) => {
  try {
    const [txn] = await db
      .select()
      .from(walletTransactionsTable)
      .where(and(
        eq(walletTransactionsTable.txnId, req.params.txnId),
        eq(walletTransactionsTable.userId, req.userId),
      ))
      .limit(1);

    if (!txn) { res.status(404).json({ error: "Transaction not found" }); return; }

    const typeLabel: Record<string, string> = {
      deposit: "DEPOSIT",
      withdrawal: "WITHDRAWAL",
      transfer_in: "RECEIVED TRANSFER",
      transfer_out: "SENT TRANSFER",
      investment: "INVESTMENT",
      investment_return: "INVESTMENT RETURN",
      trade_fee: "TRADING FEE",
    };
    const isCredit = ["deposit", "transfer_in", "investment_return"].includes(txn.type);
    const sign = isCredit ? "+" : "−";
    const color = isCredit ? "#22c55e" : "#ef4444";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Receipt — ${txn.txnId}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#050d1a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
.card{background:linear-gradient(160deg,#0a1628 0%,#0f1e35 100%);border:1px solid #C9A84C44;border-radius:1.5rem;padding:2.5rem;max-width:480px;width:100%;box-shadow:0 0 60px #C9A84C11}
.logo{display:flex;align-items:center;gap:.75rem;margin-bottom:2rem}
.logo-icon{width:2.5rem;height:2.5rem;background:#C9A84C;border-radius:.5rem;display:flex;align-items:center;justify-content:center;font-size:1.25rem}
.brand{color:#C9A84C;font-weight:700;font-size:1.1rem}
.sub{color:#4a6080;font-size:.65rem;letter-spacing:.15em;text-transform:uppercase}
.divider{border:none;border-top:1px solid #1e3a5f;margin:1.5rem 0}
.receipt-title{font-size:1.5rem;font-weight:300;color:#94a3b8;margin-bottom:.25rem}
.amount{font-size:3rem;font-weight:700;color:${color};letter-spacing:-.02em;margin-bottom:.25rem}
.currency{color:#4a6080;font-size:.8rem;text-transform:uppercase;letter-spacing:.1em}
.rows{margin-top:1.5rem;space-y:1rem}
.row{display:flex;justify-content:space-between;align-items:center;padding:.6rem 0;border-bottom:1px solid #0f2040}
.row:last-child{border-bottom:none}
.label{color:#4a6080;font-size:.78rem;text-transform:uppercase;letter-spacing:.08em}
.value{color:#e2e8f0;font-size:.85rem;font-weight:500;text-align:right;max-width:60%}
.status{display:inline-flex;align-items:center;gap:.4rem;padding:.25rem .75rem;border-radius:9999px;font-size:.75rem;font-weight:600}
.success{background:#22c55e22;color:#22c55e;border:1px solid #22c55e44}
.pending{background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b44}
.failed{background:#ef444422;color:#ef4444;border:1px solid #ef444444}
.footer{margin-top:2rem;text-align:center;color:#2a4060;font-size:.7rem;line-height:1.6}
@media print{body{background:white}@page{margin:1cm}}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-icon">🏛</div>
    <div>
      <div class="brand">Orakzai Properties</div>
      <div class="sub">Wallet Receipt</div>
    </div>
  </div>
  <hr class="divider">
  <div class="receipt-title">${typeLabel[txn.type] || txn.type.toUpperCase()}</div>
  <div class="amount">${sign} PKR ${parseFloat(txn.amount).toLocaleString("en-PK", { minimumFractionDigits: 2 })}</div>
  <div class="currency">Pakistani Rupee · $OKBOND Ecosystem</div>
  <div class="rows">
    <div class="row"><span class="label">Transaction ID</span><span class="value" style="font-family:monospace;font-size:.75rem">${txn.txnId}</span></div>
    <div class="row"><span class="label">Status</span><span class="value"><span class="status ${txn.status}">● ${txn.status.toUpperCase()}</span></span></div>
    ${txn.note ? `<div class="row"><span class="label">Description</span><span class="value">${txn.note}</span></div>` : ""}
    ${txn.balanceAfter ? `<div class="row"><span class="label">Balance After</span><span class="value">PKR ${parseFloat(txn.balanceAfter).toLocaleString("en-PK", { minimumFractionDigits: 2 })}</span></div>` : ""}
    <div class="row"><span class="label">Date & Time</span><span class="value">${new Date(txn.createdAt).toLocaleString("en-PK", { dateStyle: "long", timeStyle: "medium" })}</span></div>
  </div>
  <hr class="divider">
  <div class="footer">
    Orakzai Group · Islamabad, Pakistan<br>
    This is a digital receipt. All transactions are secured and logged.<br>
    <strong style="color:#C9A84C">support@orakzai.pk</strong>
  </div>
</div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (e: any) {
    req.log.error(e);
    res.status(500).json({ error: "Failed to generate receipt" });
  }
});

export default router;
