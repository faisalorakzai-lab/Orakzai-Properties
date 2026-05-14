import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createChart, ColorType, CandlestickSeries, LineStyle } from "lightweight-charts";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Search, ChevronDown, X, AlertTriangle, ArrowLeft,
  Star, Bell, ChevronRight, TrendingUp, TrendingDown, ExternalLink,
} from "lucide-react";

const _basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const logoShield = `${_basePath}/logo-shield.png`;

// ─── Theme ───────────────────────────────────────────────────────────────────
const BG       = "#0B0E11";
const CARD     = "#161A1E";
const BORDER   = "#2B2F36";
const RED      = "#F6465D";
const GREEN    = "#0ECB81";
const GOLD     = "#F3BA2F";
const DIM      = "#848E9C";
const FG       = "#EAECEF";
const ACTIVE_BG = "#1E2329";

// ─── Data ────────────────────────────────────────────────────────────────────
const ASSETS = [
  {
    ticker: "ASC", pair: "ASC/USDT", name: "Azan Smart City",
    price: 1.2400, change: 4.80, high: 1.3100, low: 1.1800, vol: 284310, volUsdt: 352744,
    marketCap: "$31.0M", supply: "25M ASC", maxSupply: "100M ASC",
    allTimeHigh: "$2.10 (2025-08-12)", allTimeLow: "$0.42 (2025-01-04)",
    website: "https://azansmartcity.com", whitepaper: "https://azansmartcity.com/whitepaper",
    description: "Azan Smart City is a next-generation real estate tokenization project in Rawalpindi, Pakistan. Each ASC token represents fractional ownership of premium land plots within Pakistan's first blockchain-integrated smart city development.",
    moneyFlow: { large: { buy: 6590, sell: 5828, inflow: 762 }, medium: { buy: 4405, sell: 8753, inflow: -4348 }, small: { buy: 2494, sell: 4423, inflow: -1929 } },
  },
  {
    ticker: "DHA9", pair: "DHA9/USDT", name: "DHA Lahore Ph-9",
    price: 8.7500, change: 1.20, high: 9.1000, low: 8.4200, vol: 95800, volUsdt: 838250,
    marketCap: "$43.8M", supply: "5M DHA9", maxSupply: "5M DHA9",
    allTimeHigh: "$12.40 (2025-11-20)", allTimeLow: "$5.10 (2025-03-01)",
    website: "https://dha.com.pk", whitepaper: "https://dha.com.pk/whitepaper",
    description: "DHA Lahore Phase 9 token (DHA9) represents tokenized commercial and residential plots in Pakistan's most prestigious defence housing authority project. Holders benefit from capital appreciation and rental yield sharing.",
    moneyFlow: { large: { buy: 2100, sell: 1890, inflow: 210 }, medium: { buy: 1400, sell: 2200, inflow: -800 }, small: { buy: 800, sell: 1100, inflow: -300 } },
  },
  {
    ticker: "BTI", pair: "BTI/USDT", name: "Bahria Town Isb",
    price: 5.1000, change: -0.70, high: 5.2800, low: 4.9700, vol: 162400, volUsdt: 828240,
    marketCap: "$25.5M", supply: "5M BTI", maxSupply: "10M BTI",
    allTimeHigh: "$8.90 (2025-09-15)", allTimeLow: "$2.80 (2025-01-20)",
    website: "https://bahriatownisb.com", whitepaper: "https://bahriatownisb.com/whitepaper",
    description: "Bahria Town Islamabad Token (BTI) tokenizes residential and commercial properties in Bahria Town Islamabad Phase 8. Each token grants proportional rights to rental income and property appreciation.",
    moneyFlow: { large: { buy: 3200, sell: 4100, inflow: -900 }, medium: { buy: 2100, sell: 3400, inflow: -1300 }, small: { buy: 1200, sell: 2100, inflow: -900 } },
  },
  {
    ticker: "GBR", pair: "GBR/USDT", name: "Gulberg Residencia",
    price: 3.6200, change: 2.30, high: 3.8000, low: 3.5500, vol: 48900, volUsdt: 177018,
    marketCap: "$18.1M", supply: "5M GBR", maxSupply: "5M GBR",
    allTimeHigh: "$5.60 (2025-10-01)", allTimeLow: "$1.90 (2025-02-10)",
    website: "https://gulbergresidencia.com", whitepaper: "https://gulbergresidencia.com/whitepaper",
    description: "Gulberg Residencia Tokens (GBR) represent fractional shares of the premium residential project in Islamabad. The project offers studio to 4-bedroom apartments with guaranteed rental returns.",
    moneyFlow: { large: { buy: 1800, sell: 1400, inflow: 400 }, medium: { buy: 1200, sell: 1000, inflow: 200 }, small: { buy: 600, sell: 500, inflow: 100 } },
  },
  {
    ticker: "CSC", pair: "CSC/USDT", name: "Capital Smart City",
    price: 2.1800, change: -1.40, high: 2.3100, low: 2.1200, vol: 71200, volUsdt: 155216,
    marketCap: "$10.9M", supply: "5M CSC", maxSupply: "20M CSC",
    allTimeHigh: "$4.20 (2025-07-22)", allTimeLow: "$1.10 (2025-01-08)",
    website: "https://capitalsmartcity.com", whitepaper: "https://capitalsmartcity.com/whitepaper",
    description: "Capital Smart City Token (CSC) offers tokenized access to Pakistan's first CPEC-aligned smart city on the Islamabad–Lahore Motorway. Token holders receive quarterly yield distributions.",
    moneyFlow: { large: { buy: 1400, sell: 1800, inflow: -400 }, medium: { buy: 900, sell: 1400, inflow: -500 }, small: { buy: 400, sell: 700, inflow: -300 } },
  },
  {
    ticker: "OBK", pair: "OBK/USDT", name: "Orakzai Bond",
    price: 0.8800, change: 6.50, high: 0.9400, low: 0.8200, vol: 312000, volUsdt: 274560,
    marketCap: "$4.4M", supply: "5M OBK", maxSupply: "50M OBK",
    allTimeHigh: "$1.20 (2025-12-01)", allTimeLow: "$0.18 (2025-01-01)",
    website: "https://orakzaiproperties.com", whitepaper: "https://orakzaiproperties.com/whitepaper",
    description: "Orakzai Bond (OBK) is the native utility and governance token of the Orakzai Properties platform. OBK holders get discounted trading fees, voting rights on new property listings, and staking rewards.",
    moneyFlow: { large: { buy: 8400, sell: 6200, inflow: 2200 }, medium: { buy: 5100, sell: 3800, inflow: 1300 }, small: { buy: 2600, sell: 1900, inflow: 700 } },
  },
];

type Asset = typeof ASSETS[0];
type OrderBookEntry = { price: number; amount: number; total: number };
type TradeEntry = { time: string; price: number; amount: number; side: "buy" | "sell" };
type OpenOrder = { id: number; side: "BUY" | "SELL"; type: string; price: number; amount: number; time: string };
type CandleData = { time: number; open: number; high: number; low: number; close: number };

// ─── Generators ──────────────────────────────────────────────────────────────
function genCandles(base: number, count = 80): CandleData[] {
  const out: CandleData[] = [];
  let p = base * 0.85;
  const now = Math.floor(Date.now() / 1000);
  for (let i = count; i >= 0; i--) {
    const o = p;
    const c = Math.max(p * 0.5, o + (Math.random() - 0.47) * o * 0.028);
    const h = Math.max(o, c) + Math.random() * o * 0.012;
    const l = Math.min(o, c) - Math.random() * o * 0.012;
    out.push({ time: now - i * 900, open: +o.toFixed(5), high: +h.toFixed(5), low: +l.toFixed(5), close: +c.toFixed(5) });
    p = c;
  }
  return out;
}

function genOrderBook(mid: number): { asks: OrderBookEntry[]; bids: OrderBookEntry[] } {
  const asks: OrderBookEntry[] = [];
  const bids: OrderBookEntry[] = [];
  let t = 0;
  for (let i = 0; i < 14; i++) {
    const amt = +(Math.random() * 3000 + 100).toFixed(0);
    t += amt;
    asks.push({ price: +(mid * (1 + (i + 1) * 0.001)).toFixed(5), amount: amt, total: t });
  }
  t = 0;
  for (let i = 0; i < 14; i++) {
    const amt = +(Math.random() * 3000 + 100).toFixed(0);
    t += amt;
    bids.push({ price: +(mid * (1 - (i + 1) * 0.001)).toFixed(5), amount: amt, total: t });
  }
  return { asks: asks.reverse(), bids };
}

function genTrades(mid: number, count = 20): TradeEntry[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    time: new Date(now - i * 4200).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    price: +(mid * (1 + (Math.random() - 0.5) * 0.004)).toFixed(5),
    amount: +(Math.random() * 2000 + 50).toFixed(0),
    side: Math.random() > 0.48 ? "buy" : "sell",
  }));
}

// ─── Candlestick chart ────────────────────────────────────────────────────────
function CandleChart({ base }: { base: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: CARD }, textColor: DIM },
      grid: { vertLines: { color: "#1a1f27", style: LineStyle.Dotted }, horzLines: { color: "#1a1f27", style: LineStyle.Dotted } },
      crosshair: { mode: 1, vertLine: { color: "#F3BA2F55", labelBackgroundColor: CARD }, horzLine: { color: "#F3BA2F55", labelBackgroundColor: CARD } },
      rightPriceScale: { borderColor: BORDER },
      timeScale: { borderColor: BORDER, timeVisible: true, secondsVisible: false },
      width: ref.current.clientWidth,
      height: ref.current.clientHeight,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: GREEN, downColor: RED,
      borderUpColor: GREEN, borderDownColor: RED,
      wickUpColor: GREEN, wickDownColor: RED,
    } as any);
    series.setData(genCandles(base) as any);
    chart.timeScale().fitContent();
    chartRef.current = chart;
    const ro = new ResizeObserver(() => {
      if (ref.current && chartRef.current) chartRef.current.applyOptions({ width: ref.current.clientWidth, height: ref.current.clientHeight });
    });
    ro.observe(ref.current);
    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, [base]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}

// ─── Order Book ───────────────────────────────────────────────────────────────
function OrderBook({ book, mid }: { book: { asks: OrderBookEntry[]; bids: OrderBookEntry[] }; mid: number }) {
  const maxT = Math.max(...book.asks.map(a => a.total), ...book.bids.map(b => b.total));
  const bidTotal = book.bids.reduce((s, b) => s + b.total, 0);
  const askTotal = book.asks.reduce((s, a) => s + a.total, 0);
  const bidPct = Math.round(bidTotal / (bidTotal + askTotal) * 100);

  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", fontSize: 11 }}>
      {/* Ratio bar */}
      <div style={{ display: "flex", height: 4, margin: "6px 8px" }}>
        <div style={{ flex: bidPct, background: GREEN, borderRadius: "2px 0 0 2px" }} />
        <div style={{ flex: 100 - bidPct, background: RED, borderRadius: "0 2px 2px 0" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px 4px", fontSize: 9, color: DIM }}>
        <span style={{ color: GREEN }}>{bidPct}%</span>
        <span style={{ color: RED }}>{100 - bidPct}%</span>
      </div>

      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "3px 8px", color: DIM, fontSize: 9, borderBottom: `1px solid ${BORDER}` }}>
        <span>Bid</span><span style={{ textAlign: "center" }}>Price</span><span style={{ textAlign: "right" }}>Ask</span>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {book.asks.slice(0, 10).map((ask, i) => {
          const bidRow = book.bids[i];
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "1.5px 8px", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, background: "rgba(14,203,129,0.1)", width: `${(bidRow?.total || 0) / maxT * 50}%` }} />
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, background: "rgba(246,70,93,0.1)", width: `${ask.total / maxT * 50}%` }} />
              <span style={{ color: GREEN, position: "relative", fontVariantNumeric: "tabular-nums" }}>{bidRow?.amount?.toLocaleString() ?? ""}</span>
              <span style={{ color: mid > 0 ? FG : DIM, textAlign: "center", position: "relative", fontWeight: 600 }}>{ask.price.toFixed(4)}</span>
              <span style={{ color: RED, textAlign: "right", position: "relative", fontVariantNumeric: "tabular-nums" }}>{ask.amount.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Money Flow Donut Chart ───────────────────────────────────────────────────
const DONUT_COLORS = [GREEN, "#00A67E", "#FF6B82", RED, "#FF9BAB", "#FF4466"];
function MoneyFlowChart({ asset }: { asset: Asset }) {
  const mf = asset.moneyFlow;
  const [period, setPeriod] = useState("1D");
  const total = mf.large.buy + mf.large.sell + mf.medium.buy + mf.medium.sell + mf.small.buy + mf.small.sell;
  const data = [
    { name: "Large Buy", value: mf.large.buy },
    { name: "Medium Buy", value: mf.medium.buy },
    { name: "Small Buy", value: mf.small.buy },
    { name: "Large Sell", value: mf.large.sell },
    { name: "Medium Sell", value: mf.medium.sell },
    { name: "Small Sell", value: mf.small.sell },
  ];
  const fmtM = (n: number) => `${n.toLocaleString()}M`;
  return (
    <div style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontWeight: 700, color: FG, fontSize: 13 }}>Money Flow Analysis</span>
      </div>
      {/* Period selector */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {["15m","30m","1h","2h","4h","1D"].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: "3px 8px", fontSize: 11, borderRadius: 4, border: "none", cursor: "pointer",
            background: period === p ? GOLD : ACTIVE_BG,
            color: period === p ? BG : DIM, fontWeight: period === p ? 700 : 400,
          }}>{p}</button>
        ))}
      </div>
      {/* Donut */}
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
              {data.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
            </Pie>
            <Tooltip formatter={(v: any) => [`${v.toLocaleString()}M`, ""]} contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Table */}
      <div style={{ marginTop: 8, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr", padding: "6px 10px", background: ACTIVE_BG, fontSize: 10, color: DIM }}>
          <span>Orders</span><span style={{ textAlign: "center", color: GREEN }}>Buy ({asset.ticker})</span>
          <span style={{ textAlign: "center", color: RED }}>Sell ({asset.ticker})</span>
          <span style={{ textAlign: "right" }}>Inflow</span>
        </div>
        {[
          { label: "Large",  ...mf.large },
          { label: "Medium", ...mf.medium },
          { label: "Small",  ...mf.small },
          { label: "Total",
            buy: mf.large.buy + mf.medium.buy + mf.small.buy,
            sell: mf.large.sell + mf.medium.sell + mf.small.sell,
            inflow: mf.large.inflow + mf.medium.inflow + mf.small.inflow },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            display: "grid", gridTemplateColumns: "80px 1fr 1fr 1fr",
            padding: "7px 10px", fontSize: 11,
            borderTop: `1px solid ${BORDER}`,
            background: i === arr.length - 1 ? ACTIVE_BG : "transparent",
            fontWeight: i === arr.length - 1 ? 700 : 400,
          }}>
            <span style={{ color: DIM }}>{row.label}</span>
            <span style={{ textAlign: "center", color: GREEN }}>● {fmtM(row.buy)}</span>
            <span style={{ textAlign: "center", color: RED }}>● {fmtM(row.sell)}</span>
            <span style={{ textAlign: "right", color: row.inflow >= 0 ? GREEN : RED }}>
              {row.inflow >= 0 ? "+" : ""}{fmtM(row.inflow)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Order Entry Panel ────────────────────────────────────────────────────────
const MOCK_BAL_USDT = 500;
const MOCK_BAL_TOKEN = 250;

function OrderEntry({ asset, livePrice }: { asset: Asset; livePrice: number }) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"Limit" | "Market">("Limit");
  const [price, setPrice] = useState(livePrice.toFixed(5));
  const [amount, setAmount] = useState("");
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([
    { id: 1, side: "BUY", type: "Limit", price: asset.price * 0.95, amount: 100, time: "10:32" },
    { id: 2, side: "SELL", type: "Limit", price: asset.price * 1.08, amount: 50, time: "09:15" },
  ]);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"entry" | "orders">("entry");

  const pNum = parseFloat(price) || 0;
  const aNum = parseFloat(amount) || 0;
  const total = orderType === "Market" ? livePrice * aNum : pNum * aNum;
  const ok = total >= 1;
  const bal = side === "BUY" ? MOCK_BAL_USDT : MOCK_BAL_TOKEN;

  const pct = (p: number) => {
    const qty = side === "BUY" ? (bal / (pNum || livePrice)) * p : bal * p;
    setAmount(qty.toFixed(2));
  };

  const submit = () => {
    if (!ok) return;
    setOpenOrders(prev => [{
      id: Date.now(), side, type: orderType,
      price: orderType === "Market" ? livePrice : pNum,
      amount: aNum,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    }, ...prev]);
    setAmount("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Sub-tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {(["entry", "orders"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            flex: 1, padding: "8px 0", fontSize: 12, fontWeight: activeTab === t ? 700 : 400,
            border: "none", cursor: "pointer", background: "transparent",
            color: activeTab === t ? FG : DIM,
            borderBottom: activeTab === t ? `2px solid ${GOLD}` : "2px solid transparent",
          }}>
            {t === "entry" ? "Order Entry" : `Open (${openOrders.length})`}
          </button>
        ))}
      </div>

      {activeTab === "entry" ? (
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {/* BUY/SELL */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
            {(["BUY", "SELL"] as const).map(s => (
              <button key={s} onClick={() => setSide(s)} style={{
                padding: "8px 0", fontWeight: 800, fontSize: 13, border: "none", cursor: "pointer", borderRadius: 4,
                background: side === s ? (s === "BUY" ? GREEN : RED) : ACTIVE_BG,
                color: side === s ? "#fff" : DIM,
              }}>{s}</button>
            ))}
          </div>

          {/* Balance */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: DIM, marginBottom: 8 }}>
            <span>Available</span>
            <span style={{ color: FG }}>{side === "BUY" ? `${MOCK_BAL_USDT} USDT` : `${MOCK_BAL_TOKEN} ${asset.ticker}`}</span>
          </div>

          {/* Order type */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <button onClick={() => setShowTypeMenu(v => !v)} style={{
              width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
              background: ACTIVE_BG, border: `1px solid ${BORDER}`, borderRadius: 4,
              padding: "7px 10px", color: FG, fontSize: 12, cursor: "pointer",
            }}>
              {orderType} <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {showTypeMenu && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{
                  position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0,
                  background: "#1E2329", border: `1px solid ${BORDER}`, borderRadius: 4, zIndex: 50,
                }}>
                  {(["Limit", "Market"] as const).map(t => (
                    <div key={t} onClick={() => { setOrderType(t); setShowTypeMenu(false); }} style={{
                      padding: "8px 10px", fontSize: 12, cursor: "pointer",
                      color: orderType === t ? GOLD : FG,
                      background: orderType === t ? "rgba(243,186,47,0.08)" : "transparent",
                    }}>{t}</div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Price */}
          {orderType === "Limit" ? (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: DIM, marginBottom: 3 }}>Price (USDT)</div>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} step="0.00001" style={{
                width: "100%", background: ACTIVE_BG, border: `1px solid ${BORDER}`, borderRadius: 4,
                padding: "7px 10px", color: FG, fontSize: 12, outline: "none", boxSizing: "border-box",
              }} />
            </div>
          ) : (
            <div style={{ marginBottom: 8, padding: "7px 10px", background: ACTIVE_BG, border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 11, color: DIM }}>
              Market: <span style={{ color: GREEN }}>{livePrice.toFixed(5)}</span>
            </div>
          )}

          {/* Amount */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: DIM, marginBottom: 3 }}>Amount ({asset.ticker})</div>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={{
              width: "100%", background: ACTIVE_BG, border: `1px solid ${BORDER}`, borderRadius: 4,
              padding: "7px 10px", color: FG, fontSize: 12, outline: "none", boxSizing: "border-box",
            }} />
          </div>

          {/* Pct buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, marginBottom: 8 }}>
            {[0.25, 0.5, 0.75, 1].map(p => (
              <button key={p} onClick={() => pct(p)} style={{
                padding: "4px 0", fontSize: 10, fontWeight: 600, borderRadius: 3, cursor: "pointer",
                border: `1px solid ${BORDER}`, background: ACTIVE_BG, color: DIM,
              }}>{p * 100}%</button>
            ))}
          </div>

          {/* Total */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: DIM, marginBottom: 6 }}>
            <span>Total</span>
            <span style={{ color: ok || total === 0 ? FG : RED, fontVariantNumeric: "tabular-nums" }}>
              {total > 0 ? total.toFixed(4) : "0.0000"} USDT
            </span>
          </div>

          {/* Warning */}
          <AnimatePresence>
            {total > 0 && !ok && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(246,70,93,0.1)", border: `1px solid rgba(246,70,93,0.3)`, borderRadius: 4, padding: "5px 8px" }}>
                  <AlertTriangle size={10} color={RED} />
                  <span style={{ fontSize: 10, color: RED }}>Minimum order size is $1 USDT</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button onClick={submit} disabled={!ok} style={{
            width: "100%", padding: "11px 0", borderRadius: 4, border: "none", cursor: ok ? "pointer" : "not-allowed",
            fontWeight: 800, fontSize: 13,
            background: ok ? (side === "BUY" ? GREEN : RED) : ACTIVE_BG,
            color: ok ? "#fff" : DIM, opacity: ok ? 1 : 0.6, transition: "all 0.15s",
          }}>
            {side === "BUY" ? `Buy ${asset.ticker}` : `Sell ${asset.ticker}`}
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {openOrders.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: DIM, fontSize: 12 }}>No open orders</div>
          ) : openOrders.map(o => (
            <div key={o.id} style={{ padding: "8px 10px", borderBottom: `1px solid ${BORDER}`, fontSize: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ color: o.side === "BUY" ? GREEN : RED, fontWeight: 700, fontSize: 10, background: o.side === "BUY" ? "rgba(14,203,129,0.1)" : "rgba(246,70,93,0.1)", padding: "1px 5px", borderRadius: 3 }}>{o.side}</span>
                <button onClick={() => setOpenOrders(p => p.filter(x => x.id !== o.id))} style={{ background: "rgba(246,70,93,0.12)", border: `1px solid rgba(246,70,93,0.3)`, borderRadius: 3, padding: "2px 5px", cursor: "pointer" }}>
                  <X size={9} color={RED} />
                </button>
              </div>
              <div style={{ color: FG }}>{o.price.toFixed(4)} USDT · {o.amount} {asset.ticker}</div>
              <div style={{ color: DIM, fontSize: 9, marginTop: 1 }}>{o.type} · {o.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Coin Info ────────────────────────────────────────────────────────────────
function CoinInfo({ asset }: { asset: Asset }) {
  return (
    <div style={{ padding: "12px 14px", fontSize: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <img src={logoShield} alt="token" style={{ width: 36, height: 36, objectFit: "contain" }} />
        <div>
          <div style={{ fontWeight: 700, color: FG, fontSize: 14 }}>{asset.ticker}</div>
          <div style={{ color: DIM, fontSize: 11 }}>{asset.name}</div>
        </div>
      </div>
      <p style={{ color: DIM, fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>{asset.description}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Market Cap", value: asset.marketCap },
          { label: "Circulating Supply", value: asset.supply },
          { label: "Max Supply", value: asset.maxSupply },
          { label: "All Time High", value: asset.allTimeHigh },
          { label: "All Time Low", value: asset.allTimeLow },
          { label: "24h Volume", value: `$${(asset.volUsdt / 1000).toFixed(1)}K` },
        ].map(s => (
          <div key={s.label} style={{ background: ACTIVE_BG, borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ color: DIM, fontSize: 10, marginBottom: 3 }}>{s.label}</div>
            <div style={{ color: FG, fontWeight: 600, fontSize: 12 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12 }}>
        <div style={{ color: DIM, fontSize: 11, marginBottom: 8 }}>Links</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a href={asset.website} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, background: ACTIVE_BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "5px 10px", color: FG, fontSize: 11, textDecoration: "none" }}>
            <ExternalLink size={10} /> Official Website
          </a>
          <a href={asset.whitepaper} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, background: ACTIVE_BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "5px 10px", color: FG, fontSize: 11, textDecoration: "none" }}>
            <ExternalLink size={10} /> Whitepaper
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Trade History ────────────────────────────────────────────────────────────
function TradeHistory({ trades }: { trades: TradeEntry[] }) {
  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "4px 8px", color: DIM, fontSize: 9, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, background: CARD }}>
        <span>Price(USDT)</span><span style={{ textAlign: "center" }}>Amount</span><span style={{ textAlign: "right" }}>Time</span>
      </div>
      {trades.map((t, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "2px 8px", fontSize: 11 }}>
          <span style={{ color: t.side === "buy" ? GREEN : RED, fontVariantNumeric: "tabular-nums" }}>{t.price.toFixed(4)}</span>
          <span style={{ color: FG, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{Number(t.amount).toLocaleString()}</span>
          <span style={{ color: DIM, textAlign: "right" }}>{t.time}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Technical indicator bar ─────────────────────────────────────────────────
const PRICE_INDICATORS = ["MA", "EMA", "BOLL", "SAR", "AVL", "Super"];
const VOL_INDICATORS = ["VOL", "MACD", "RSI", "KDJ", "OBV", "WR"];

// ─── MARKET LIST VIEW ─────────────────────────────────────────────────────────
function MarketList({ onSelect }: { onSelect: (a: Asset) => void }) {
  const [q, setQ] = useState("");
  const filtered = ASSETS.filter(a =>
    a.ticker.toLowerCase().includes(q.toLowerCase()) ||
    a.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ height: "100dvh", background: BG, color: FG, display: "flex", flexDirection: "column", paddingBottom: 64 }}>
      {/* Header */}
      <div style={{ padding: "52px 16px 12px", background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <img src={logoShield} alt="Orakzai" style={{ width: 28, height: 28, objectFit: "contain" }} />
          <div>
            <div style={{ fontWeight: 800, color: FG, fontSize: 15 }}>Market</div>
            <div style={{ fontSize: 10, color: DIM }}>Real Estate Token Exchange</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: ACTIVE_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 12px" }}>
          <Search size={14} color={DIM} />
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search tokens… BTC, ASC, OBK"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: FG, fontSize: 13 }}
          />
          {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={13} color={DIM} /></button>}
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", padding: "8px 16px", fontSize: 10, color: DIM, borderBottom: `1px solid ${BORDER}`, background: BG }}>
        <span>Name</span><span style={{ textAlign: "right", marginRight: 40 }}>Last Price</span><span style={{ textAlign: "right" }}>24h Change</span>
      </div>

      {/* Pair list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.map((a, i) => (
          <motion.div
            key={a.ticker}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(a)}
            style={{
              display: "grid", gridTemplateColumns: "1fr auto auto",
              alignItems: "center", padding: "12px 16px", cursor: "pointer",
              borderBottom: `1px solid ${BORDER}`, gap: 12,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = ACTIVE_BG)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {/* Token info */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(243,186,47,0.12)", border: `1px solid rgba(243,186,47,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: GOLD, flexShrink: 0 }}>
                {a.ticker.slice(0, 3)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: FG }}>{a.ticker}<span style={{ color: DIM, fontWeight: 400 }}>/USDT</span></div>
                <div style={{ fontSize: 10, color: DIM }}>{a.name}</div>
              </div>
            </div>
            {/* Price */}
            <div style={{ textAlign: "right", fontWeight: 600, fontSize: 13, fontVariantNumeric: "tabular-nums", color: a.change >= 0 ? GREEN : RED }}>
              {a.price.toFixed(4)}
            </div>
            {/* Change badge */}
            <div style={{
              minWidth: 60, textAlign: "center", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700,
              background: a.change >= 0 ? "rgba(14,203,129,0.12)" : "rgba(246,70,93,0.12)",
              color: a.change >= 0 ? GREEN : RED,
            }}>
              {a.change >= 0 ? "+" : ""}{a.change.toFixed(2)}%
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: DIM, fontSize: 13 }}>No tokens found for "{q}"</div>
        )}
      </div>
    </div>
  );
}

// ─── TRADING TERMINAL VIEW ────────────────────────────────────────────────────
const TIMEFRAMES = ["15m", "1h", "4h", "1D", "More"];
const BOTTOM_TABS = ["Price", "Info", "Trading Data"] as const;
type BottomTab = typeof BOTTOM_TABS[number];
const BOTTOM_BOOK_TABS = ["Order Book", "Trades"] as const;

function TradingTerminal({ asset, onBack }: { asset: Asset; onBack: () => void }) {
  const [livePrice, setLivePrice] = useState(asset.price);
  const [orderBook, setOrderBook] = useState(() => genOrderBook(asset.price));
  const [trades, setTrades] = useState<TradeEntry[]>(() => genTrades(asset.price));
  const [bottomTab, setBottomTab] = useState<BottomTab>("Price");
  const [bookTab, setBookTab] = useState<typeof BOTTOM_BOOK_TABS[number]>("Order Book");
  const [timeframe, setTimeframe] = useState("15m");
  const [activeIndicators, setActiveIndicators] = useState<Set<string>>(new Set(["MA", "VOL"]));
  const [starred, setStarred] = useState(false);

  const toggleIndicator = (ind: string) => {
    setActiveIndicators(prev => {
      const n = new Set(prev);
      n.has(ind) ? n.delete(ind) : n.add(ind);
      return n;
    });
  };

  useEffect(() => {
    const iv = setInterval(() => {
      setLivePrice(prev => {
        const next = +(prev * (1 + (Math.random() - 0.5) * 0.003)).toFixed(5);
        setOrderBook(genOrderBook(next));
        setTrades(genTrades(next));
        return next;
      });
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  const isUp = livePrice >= asset.price;

  return (
    <div style={{ height: "100dvh", background: BG, color: FG, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* ── Header ── */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "48px 12px 8px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
              <ArrowLeft size={18} color={FG} />
            </button>
            <span style={{ fontWeight: 800, fontSize: 16, color: FG }}>{asset.ticker}<span style={{ color: DIM, fontWeight: 400 }}>/USDT</span></span>
            <ChevronDown size={14} color={DIM} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setStarred(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
              <Star size={16} fill={starred ? GOLD : "none"} color={starred ? GOLD : DIM} />
            </button>
            <Bell size={16} color={DIM} />
          </div>
        </div>

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: isUp ? GREEN : RED, fontVariantNumeric: "tabular-nums" }}>{livePrice.toFixed(4)}</span>
          <span style={{ fontSize: 13, color: isUp ? GREEN : RED }}>
            {isUp ? <TrendingUp size={13} style={{ display: "inline", verticalAlign: "middle" }} /> : <TrendingDown size={13} style={{ display: "inline", verticalAlign: "middle" }} />}
            {asset.change >= 0 ? "+" : ""}{asset.change.toFixed(2)}%
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, fontSize: 10 }}>
          {[
            { label: "24h High", value: asset.high.toFixed(4), color: GREEN },
            { label: "24h Low", value: asset.low.toFixed(4), color: RED },
            { label: `24h Vol(${asset.ticker})`, value: (asset.vol / 1000).toFixed(1) + "K", color: DIM },
            { label: "24h Vol(USDT)", value: (asset.volUsdt / 1000).toFixed(1) + "K", color: DIM },
          ].map(s => (
            <div key={s.label}>
              <div style={{ color: DIM, fontSize: 9 }}>{s.label}</div>
              <div style={{ color: s.color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom section tabs ── */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, background: CARD, flexShrink: 0, overflowX: "auto" }}>
        {BOTTOM_TABS.map(t => (
          <button key={t} onClick={() => setBottomTab(t)} style={{
            padding: "9px 14px", fontSize: 13, fontWeight: bottomTab === t ? 700 : 400,
            border: "none", cursor: "pointer", background: "transparent", whiteSpace: "nowrap",
            color: bottomTab === t ? FG : DIM,
            borderBottom: bottomTab === t ? `2px solid ${GOLD}` : "2px solid transparent",
          }}>{t}</button>
        ))}
      </div>

      {bottomTab === "Price" && (
        <>
          {/* ── Chart ── */}
          <div style={{ flex: "0 0 185px", background: CARD, position: "relative" }}>
            {/* Timeframe row */}
            <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "4px 8px", borderBottom: `1px solid ${BORDER}`, overflowX: "auto" }}>
              {TIMEFRAMES.map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)} style={{
                  padding: "3px 9px", fontSize: 11, border: "none", cursor: "pointer", borderRadius: 3,
                  background: timeframe === tf ? ACTIVE_BG : "transparent",
                  color: timeframe === tf ? GOLD : DIM, fontWeight: timeframe === tf ? 700 : 400,
                }}>{tf}</button>
              ))}
              <div style={{ marginLeft: "auto", width: 1, height: 14, background: BORDER }} />
            </div>

            {/* Active indicators display */}
            {activeIndicators.size > 0 && (
              <div style={{ display: "flex", gap: 8, padding: "2px 8px", fontSize: 10, flexWrap: "wrap" }}>
                {["MA(7)","MA(25)","MA(99)"].filter(() => activeIndicators.has("MA")).map((m, i) => (
                  <span key={m} style={{ color: [GOLD, "#DA5A9B", "#8B7FD4"][i] }}>{m}: {(livePrice * (1 + (i - 1) * 0.02)).toFixed(4)}</span>
                ))}
              </div>
            )}

            <div style={{ height: activeIndicators.has("VOL") ? 110 : 140 }}>
              <CandleChart base={asset.price} />
            </div>

            {/* Volume sub-chart (simulated bar) */}
            {activeIndicators.has("VOL") && (
              <div style={{ height: 38, padding: "2px 0", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "flex-end", gap: 1, paddingLeft: 8, paddingRight: 8, overflow: "hidden" }}>
                {Array.from({ length: 30 }, (_, i) => {
                  const h = 8 + Math.random() * 24;
                  return <div key={i} style={{ flex: 1, height: h, background: i % 2 === 0 ? GREEN : RED, opacity: 0.8, borderRadius: 1 }} />;
                })}
              </div>
            )}
          </div>

          {/* ── Indicator bar ── */}
          <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 2, padding: "5px 8px", overflowX: "auto" }}>
              {[...PRICE_INDICATORS, ...VOL_INDICATORS].map(ind => (
                <button key={ind} onClick={() => toggleIndicator(ind)} style={{
                  padding: "3px 8px", fontSize: 10, fontWeight: 600, borderRadius: 3, border: "none", cursor: "pointer", whiteSpace: "nowrap",
                  background: activeIndicators.has(ind) ? "rgba(243,186,47,0.18)" : ACTIVE_BG,
                  color: activeIndicators.has(ind) ? GOLD : DIM,
                  borderBottom: activeIndicators.has(ind) ? `1.5px solid ${GOLD}` : "1.5px solid transparent",
                }}>{ind}</button>
              ))}
            </div>
          </div>

          {/* ── Order Book / Trades + Order Entry ── */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden", minHeight: 0 }}>
            {/* Left: book/trades */}
            <div style={{ borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
                {BOTTOM_BOOK_TABS.map(t => (
                  <button key={t} onClick={() => setBookTab(t)} style={{
                    flex: 1, padding: "6px 0", fontSize: 11, fontWeight: bookTab === t ? 700 : 400, border: "none", cursor: "pointer",
                    background: "transparent", color: bookTab === t ? FG : DIM,
                    borderBottom: bookTab === t ? `2px solid ${GOLD}` : "2px solid transparent",
                  }}>{t}</button>
                ))}
              </div>
              {bookTab === "Order Book" ? (
                <OrderBook book={orderBook} mid={livePrice} />
              ) : (
                <TradeHistory trades={trades} />
              )}
            </div>

            {/* Right: order entry */}
            <OrderEntry asset={asset} livePrice={livePrice} />
          </div>
        </>
      )}

      {bottomTab === "Info" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <CoinInfo asset={asset} />
        </div>
      )}

      {bottomTab === "Trading Data" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <MoneyFlowChart asset={asset} />
        </div>
      )}
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────
export default function Trades() {
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);

  if (activeAsset) {
    return <TradingTerminal asset={activeAsset} onBack={() => setActiveAsset(null)} />;
  }
  return <MarketList onSelect={setActiveAsset} />;
}
