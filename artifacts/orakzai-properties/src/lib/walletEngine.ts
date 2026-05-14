/* ─── Wallet Engine (localStorage-backed) ──────────────────────────────────── */

export type Currency = "PKR" | "USDT" | "USDC" | "OKBOND";

export interface Balances { PKR: number; USDT: number; USDC: number; OKBOND: number }

export interface WalletState {
  address: string;
  balances: Balances;
  createdAt: string;
  isPinSet: boolean;
}

export interface TradeTx {
  id: string;
  ticker: string;
  side: "BUY" | "SELL";
  amount: number;          // token amount
  price: number;           // price per token
  quote: Currency;         // USDT | USDC | OKBOND
  total: number;           // amount * price
  fee: number;             // fee in quote currency
  feeRate: number;         // 0.005 or 0.003
  netTotal: number;        // total + fee (buy) or total - fee (sell)
  time: string;
  type: "trade";
}

export interface DepositTx {
  id: string;
  currency: Currency;
  amount: number;
  note: string;
  time: string;
  type: "deposit";
}

export type WalletTx = TradeTx | DepositTx;

export interface AdminRevenue { USDT: number; USDC: number; OKBOND: number }

const WALLET_KEY   = "orakzai_wallet";
const TXNS_KEY     = "orakzai_wallet_txns";
const ADMIN_FEE_KEY = "orakzai_admin_revenue";

/* Generate a random Ethereum-style address */
function genAddress(): string {
  const hex = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  return "0x" + Array.from({ length: 10 }, hex).join("").slice(0, 40);
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ── Read / Write helpers ───────────────────────────────────────────────────── */
export function getWallet(): WalletState | null {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveWallet(w: WalletState): void {
  try { localStorage.setItem(WALLET_KEY, JSON.stringify(w)); } catch {}
}

export function getTxns(): WalletTx[] {
  try {
    const raw = localStorage.getItem(TXNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTxns(txns: WalletTx[]): void {
  try { localStorage.setItem(TXNS_KEY, JSON.stringify(txns)); } catch {}
}

export function getAdminRevenue(): AdminRevenue {
  try {
    const raw = localStorage.getItem(ADMIN_FEE_KEY);
    return raw ? JSON.parse(raw) : { USDT: 0, USDC: 0, OKBOND: 0 };
  } catch { return { USDT: 0, USDC: 0, OKBOND: 0 }; }
}

function saveAdminRevenue(r: AdminRevenue): void {
  try { localStorage.setItem(ADMIN_FEE_KEY, JSON.stringify(r)); } catch {}
}

/* ── Wallet lifecycle ───────────────────────────────────────────────────────── */
export function createWallet(): WalletState {
  const w: WalletState = {
    address: genAddress(),
    balances: { PKR: 100000, USDT: 500, USDC: 500, OKBOND: 250 },
    createdAt: new Date().toISOString(),
    isPinSet: false,
  };
  saveWallet(w);
  // Seed a welcome deposit
  const txns = getTxns();
  txns.unshift({ id: uid(), type: "deposit", currency: "USDT", amount: 500, note: "Welcome bonus — Orakzai Properties", time: new Date().toISOString() });
  txns.unshift({ id: uid(), type: "deposit", currency: "OKBOND", amount: 250, note: "Welcome OKBOND allocation", time: new Date().toISOString() });
  txns.unshift({ id: uid(), type: "deposit", currency: "PKR", amount: 100000, note: "Welcome bonus — PKR balance", time: new Date().toISOString() });
  saveTxns(txns);
  return w;
}

export function deposit(currency: Currency, amount: number, note = ""): WalletState | null {
  const w = getWallet();
  if (!w) return null;
  w.balances[currency] = +(w.balances[currency] + amount).toFixed(6);
  saveWallet(w);
  const txns = getTxns();
  txns.unshift({ id: uid(), type: "deposit", currency, amount, note: note || `${currency} Deposit`, time: new Date().toISOString() });
  saveTxns(txns);
  return w;
}

/* ── Fee calculation ─────────────────────────────────────────────────────────── */
export function calculateFee(total: number, quote: Currency): { fee: number; feeRate: number; label: string } {
  const feeRate = quote === "OKBOND" ? 0.003 : 0.005;
  return { fee: +(total * feeRate).toFixed(6), feeRate, label: quote === "OKBOND" ? "0.30% (OKBOND discount)" : "0.50% Standard" };
}

/* ── Execute trade ───────────────────────────────────────────────────────────── */
export function executeTrade(
  ticker: string,
  side: "BUY" | "SELL",
  tokenAmount: number,
  quote: Currency,
  price: number,
): { ok: boolean; error?: string; tx?: TradeTx; wallet?: WalletState } {
  const w = getWallet();
  if (!w) return { ok: false, error: "No wallet. Create one first." };

  const total = +(tokenAmount * price).toFixed(6);
  const { fee, feeRate } = calculateFee(total, quote);

  if (side === "BUY") {
    const cost = +(total + fee).toFixed(6);
    if (w.balances[quote] < cost) return { ok: false, error: `Insufficient ${quote} balance. Need ${cost.toFixed(4)}, have ${w.balances[quote].toFixed(4)}.` };
    w.balances[quote] = +(w.balances[quote] - cost).toFixed(6);
  } else {
    // SELL: receive quote, pay fee
    const proceeds = +(total - fee).toFixed(6);
    w.balances[quote] = +(w.balances[quote] + proceeds).toFixed(6);
  }

  saveWallet(w);

  // Track admin revenue
  const ar = getAdminRevenue();
  (ar as any)[quote] = +((ar as any)[quote] + fee).toFixed(6);
  saveAdminRevenue(ar);

  const tx: TradeTx = {
    id: uid(), ticker, side, amount: tokenAmount, price, quote,
    total, fee, feeRate, netTotal: side === "BUY" ? total + fee : total - fee,
    time: new Date().toISOString(), type: "trade",
  };

  const txns = getTxns();
  txns.unshift(tx);
  saveTxns(txns);

  return { ok: true, tx, wallet: w };
}

/* ── Portfolio from trades ───────────────────────────────────────────────────── */
export interface TokenPosition {
  ticker: string;
  totalBought: number;      // tokens bought
  totalSold: number;        // tokens sold
  netTokens: number;        // held now
  avgBuyPrice: number;      // weighted average buy price in USDT equiv
  totalInvested: number;    // total spent buying (USDT equiv)
  quote: Currency;          // primary quote currency used
  trades: TradeTx[];
}

export function getTradingPositions(): TokenPosition[] {
  const txns = getTxns().filter((t): t is TradeTx => t.type === "trade");
  const map = new Map<string, TradeTx[]>();
  for (const tx of txns) {
    if (!map.has(tx.ticker)) map.set(tx.ticker, []);
    map.get(tx.ticker)!.push(tx);
  }
  const positions: TokenPosition[] = [];
  map.forEach((trades, ticker) => {
    let totalBought = 0, totalSold = 0, totalInvested = 0, weightedSum = 0;
    let primaryQuote: Currency = "USDT";
    for (const t of trades) {
      if (t.side === "BUY") {
        totalBought += t.amount;
        totalInvested += t.total;
        weightedSum += t.amount * t.price;
        primaryQuote = t.quote;
      } else {
        totalSold += t.amount;
      }
    }
    const netTokens = totalBought - totalSold;
    const avgBuyPrice = totalBought > 0 ? weightedSum / totalBought : 0;
    positions.push({ ticker, totalBought, totalSold, netTokens, avgBuyPrice, totalInvested, quote: primaryQuote, trades });
  });
  return positions.filter(p => p.netTokens > 0 || p.totalBought > 0);
}
