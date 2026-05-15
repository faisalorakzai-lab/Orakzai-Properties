import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "wouter";
import {
  TrendingUp, TrendingDown, Minus, Plus, X, AlertTriangle,
  Activity, Zap, BarChart3, Shield, ChevronLeft, Clock,
  ArrowUpRight, ArrowDownRight, Wifi, WifiOff,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useUser, Show } from "@/contexts/AuthContext";
import { createChart, ColorType, LineStyle, AreaSeries } from "lightweight-charts";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = basePath;

function formatPKR(n: number, compact = false) {
  if (compact) {
    if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(2)}Cr`;
    if (n >= 100_000)    return `${(n / 100_000).toFixed(1)}L`;
    if (n >= 1_000)      return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(0);
  }
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `PKR ${(n / 100_000).toFixed(2)}L`;
  return `PKR ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

type OrderSide = { id: number; type: string; quantity: number; pricePerShare: number; createdAt: string };
type OrderBook = { bids: OrderSide[]; asks: OrderSide[] };
type Ticker = {
  projectId: number; projectTitle: string; basePrice: number; lastPrice: number;
  change24h: number; volume24h: number; sentimentScore: number; sentiment: string;
  highPrice: number; lowPrice: number;
};
type MyOrder = {
  id: number; type: string; quantity: number; filledQuantity: number;
  pricePerShare: number; status: string; createdAt: string;
};
type PricePoint = { time: number; value: number };

function PriceChart({ data }: { data: PricePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#040c18" },
        textColor: "#4a6080",
      },
      grid: {
        vertLines: { color: "#0f1f35", style: LineStyle.Dotted },
        horzLines: { color: "#0f1f35", style: LineStyle.Dotted },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#C9A84C44", labelBackgroundColor: "#0f1929" },
        horzLine: { color: "#C9A84C44", labelBackgroundColor: "#0f1929" },
      },
      rightPriceScale: { borderColor: "#1e3a5f" },
      timeScale: { borderColor: "#1e3a5f", timeVisible: true },
      handleScroll: true,
      handleScale: true,
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#C9A84C",
      topColor: "#C9A84C33",
      bottomColor: "#C9A84C05",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: "#C9A84C",
      crosshairMarkerBackgroundColor: "#0f1929",
      priceFormat: { type: "custom", formatter: (p: number) => formatPKR(p, true) },
    } as any);

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return;
    try {
      const deduplicated = Array.from(
        new Map(data.map((d) => [d.time, d])).values(),
      ).sort((a, b) => a.time - b.time);
      seriesRef.current.setData(deduplicated);
      chartRef.current?.timeScale().fitContent();
    } catch { /* ignore */ }
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: 280 }}
    />
  );
}

function OrderBookRow({
  side, price, qty, maxQty,
}: { side: "bid" | "ask"; price: number; qty: number; maxQty: number }) {
  const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0;
  const bg = side === "bid" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)";
  const color = side === "bid" ? "text-emerald-400" : "text-red-400";
  return (
    <div className="relative flex justify-between items-center px-2 py-[3px] text-[11px] font-mono group hover:bg-white/5 cursor-default">
      <div
        className="absolute inset-y-0 right-0 transition-all duration-300"
        style={{ width: `${pct}%`, background: bg }}
      />
      <span className={`relative ${color} font-semibold`}>{formatPKR(price, true)}</span>
      <span className="relative text-[#6a7f99]">{qty}</span>
      <span className="relative text-[#3a5070]">{formatPKR(price * qty, true)}</span>
    </div>
  );
}

function SentimentMeter({ score, sentiment }: { score: number; sentiment: string }) {
  const color = sentiment === "bullish" ? "#10b981" : sentiment === "bearish" ? "#ef4444" : "#C9A84C";
  const label = sentiment === "bullish" ? "Bullish" : sentiment === "bearish" ? "Bearish" : "Neutral";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[9px] text-[#4a6080] uppercase tracking-wider">
        <span>Bear</span>
        <span style={{ color }} className="font-semibold">{label} {score}%</span>
        <span>Bull</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#0d1e35] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, #ef4444, ${color})`, width: `${score}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function TradingFloor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const projectId = Number(id);

  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [] });
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [connected, setConnected] = useState(false);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);

  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [orderQty, setOrderQty] = useState(1);
  const [orderPrice, setOrderPrice] = useState<number | "">("");
  const [placing, setPlacing] = useState(false);
  const [orderMsg, setOrderMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const sharePrice = ticker?.lastPrice ?? ticker?.basePrice ?? 0;
  const estTotal = useMemo(() => (Number(orderPrice) || 0) * orderQty, [orderPrice, orderQty]);
  const estFee    = useMemo(() => estTotal * 0.005, [estTotal]);

  const fetchTicker = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/trading/ticker/${projectId}`);
      if (r.ok) setTicker(await r.json());
    } catch { /* ignore */ }
  }, [projectId]);

  const fetchOrderBook = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/trading/orderbook/${projectId}`);
      if (r.ok) setOrderBook(await r.json());
    } catch { /* ignore */ }
  }, [projectId]);

  const fetchPriceHistory = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/trading/price-history/${projectId}`);
      if (r.ok) setPriceHistory(await r.json());
    } catch { /* ignore */ }
  }, [projectId]);

  const fetchMyOrders = useCallback(async () => {
    if (!user) return;
    try {
      const r = await fetch(`${API}/api/trading/my-orders/${projectId}`, { credentials: "include" });
      if (r.ok) setMyOrders(await r.json());
    } catch { /* ignore */ }
  }, [projectId, user]);

  useEffect(() => {
    fetchTicker();
    fetchOrderBook();
    fetchPriceHistory();
    fetchMyOrders();
  }, [fetchTicker, fetchOrderBook, fetchPriceHistory, fetchMyOrders]);

  useEffect(() => {
    const evtSource = new EventSource(`${API}/api/trading/stream/${projectId}`);

    evtSource.addEventListener("connected", () => setConnected(true));

    evtSource.addEventListener("trade", (e) => {
      const data = JSON.parse(e.data);
      setRecentTrades((prev) => [data, ...prev].slice(0, 20));
      fetchPriceHistory();
      fetchTicker();
    });

    evtSource.addEventListener("orderbook_update", () => {
      fetchOrderBook();
      fetchMyOrders();
      fetchTicker();
    });

    evtSource.onerror = () => setConnected(false);
    evtSource.onopen = () => setConnected(true);

    return () => evtSource.close();
  }, [projectId, fetchOrderBook, fetchPriceHistory, fetchMyOrders, fetchTicker]);

  useEffect(() => {
    if (ticker && orderPrice === "") {
      setOrderPrice(parseFloat((ticker.lastPrice).toFixed(0)));
    }
  }, [ticker]);

  const handlePlaceOrder = useCallback(async () => {
    if (!user) { setOrderMsg({ type: "err", text: "Sign in to trade." }); return; }
    if (!orderPrice || Number(orderPrice) <= 0) { setOrderMsg({ type: "err", text: "Enter a valid price." }); return; }

    setPlacing(true);
    setOrderMsg(null);
    try {
      const r = await fetch(`${API}/api/trading/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId, type: orderType, quantity: orderQty, pricePerShare: Number(orderPrice) }),
      });
      const data = await r.json();
      if (!r.ok) {
        setOrderMsg({ type: "err", text: data.error ?? "Order failed." });
      } else {
        setOrderMsg({ type: "ok", text: `${orderType.toUpperCase()} order placed — ID #${data.id}` });
        fetchMyOrders();
        fetchOrderBook();
        fetchTicker();
      }
    } catch {
      setOrderMsg({ type: "err", text: "Network error." });
    } finally {
      setPlacing(false);
    }
  }, [user, orderPrice, orderType, orderQty, projectId, fetchMyOrders, fetchOrderBook, fetchTicker]);

  const handleCancelOrder = useCallback(async (orderId: number) => {
    setCancellingId(orderId);
    try {
      await fetch(`${API}/api/trading/orders/${orderId}`, { method: "DELETE", credentials: "include" });
      fetchMyOrders();
      fetchOrderBook();
    } finally {
      setCancellingId(null);
    }
  }, [fetchMyOrders, fetchOrderBook]);

  const maxBidQty = Math.max(...orderBook.bids.map((b) => b.quantity), 1);
  const maxAskQty = Math.max(...orderBook.asks.map((a) => a.quantity), 1);

  const change24hPositive = (ticker?.change24h ?? 0) >= 0;

  if (!ticker && !priceHistory.length) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#030b14" }}>
        <Navbar />
        <div className="text-center mt-14">
          <div className="w-10 h-10 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6a7f99] text-sm">Connecting to Trading Floor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#030b14" }}>
      <Navbar />
      <div className="pt-14">

        {/* ── Top Ticker Bar ── */}
        <div className="border-b border-[#C9A84C]/15 bg-[#050e1b]">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 flex flex-wrap items-center gap-4 sm:gap-8">
            <Link href="/invest">
              <button className="flex items-center gap-1.5 text-[10px] text-[#4a6080] hover:text-[#C9A84C] transition-colors">
                <ChevronLeft className="w-3 h-3" /> Back
              </button>
            </Link>

            <div>
              <div className="text-[9px] text-[#4a6080] uppercase tracking-widest">Project</div>
              <div className="text-sm font-semibold text-white">{ticker?.projectTitle ?? "—"}</div>
            </div>

            <div className="h-8 w-px bg-[#1e3a5f]/50 hidden sm:block" />

            <div>
              <div className="text-[9px] text-[#4a6080] uppercase tracking-widest">Last Price</div>
              <div className="text-lg font-bold font-mono text-[#C9A84C]">
                {formatPKR(ticker?.lastPrice ?? 0, true)}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-[#4a6080] uppercase tracking-widest">24h Change</div>
              <div className={`text-sm font-bold font-mono flex items-center gap-1 ${change24hPositive ? "text-emerald-400" : "text-red-400"}`}>
                {change24hPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {change24hPositive ? "+" : ""}{ticker?.change24h?.toFixed(2) ?? "0.00"}%
              </div>
            </div>

            <div>
              <div className="text-[9px] text-[#4a6080] uppercase tracking-widest">24h Volume</div>
              <div className="text-sm font-mono text-white">{ticker?.volume24h ?? 0} shares</div>
            </div>

            <div className="hidden lg:block">
              <div className="text-[9px] text-[#4a6080] uppercase tracking-widest">High</div>
              <div className="text-sm font-mono text-emerald-400">{formatPKR(ticker?.highPrice ?? 0, true)}</div>
            </div>
            <div className="hidden lg:block">
              <div className="text-[9px] text-[#4a6080] uppercase tracking-widest">Low</div>
              <div className="text-sm font-mono text-red-400">{formatPKR(ticker?.lowPrice ?? 0, true)}</div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
              <span className="text-[10px] text-[#4a6080]">{connected ? "Live" : "Reconnecting…"}</span>
            </div>
          </div>
        </div>

        {/* ── Main Trading Grid ── */}
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 py-4 grid grid-cols-1 xl:grid-cols-[1fr_280px_300px] gap-4">

          {/* ── Chart + Sentiment ── */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-[#1e3a5f]/40 bg-[#040c18]">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e3a5f]/30">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span className="text-[10px] text-[#4a6080] uppercase tracking-widest">Price Chart</span>
                </div>
                <span className="text-[9px] text-[#2a4060]">PKR / Share</span>
              </div>
              <div style={{ height: 320 }}>
                <PriceChart data={priceHistory} />
              </div>
            </div>

            {ticker && (
              <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#050e1b] px-4 py-3">
                <div className="text-[9px] text-[#4a6080] uppercase tracking-widest mb-2">Market Sentiment</div>
                <SentimentMeter score={ticker.sentimentScore} sentiment={ticker.sentiment} />
              </div>
            )}

            {/* ── Recent Trades Feed ── */}
            {recentTrades.length > 0 && (
              <div className="rounded-2xl border border-[#1e3a5f]/30 bg-[#040c18] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#1e3a5f]/30 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#C9A84C]" />
                  <span className="text-[10px] text-[#4a6080] uppercase tracking-widest">Recent Trades</span>
                </div>
                <div className="divide-y divide-[#0d1e35]">
                  {recentTrades.slice(0, 8).map((t, i) => (
                    <motion.div
                      key={t.id ?? i}
                      initial={{ opacity: 0, backgroundColor: "#C9A84C22" }}
                      animate={{ opacity: 1, backgroundColor: "#00000000" }}
                      className="flex items-center justify-between px-4 py-2 text-[11px] font-mono"
                    >
                      <span className="text-emerald-400 font-semibold">{formatPKR(t.pricePerShare, true)}</span>
                      <span className="text-[#6a7f99]">{t.quantity} shares</span>
                      <span className="text-[#3a5070]">Fee: {formatPKR(t.tradingFee, true)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Order Book ── */}
          <div className="rounded-2xl border border-[#1e3a5f]/40 bg-[#040c18] overflow-hidden flex flex-col">
            <div className="px-3 py-2.5 border-b border-[#1e3a5f]/30 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span className="text-[10px] text-[#4a6080] uppercase tracking-widest">Order Book</span>
            </div>

            <div className="flex justify-between px-2 py-1.5 text-[9px] text-[#2a4060] uppercase tracking-wider border-b border-[#0d1e35]">
              <span>Price (PKR)</span>
              <span>Qty</span>
              <span>Total</span>
            </div>

            {/* Asks */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 180 }}>
              {orderBook.asks.length === 0 ? (
                <div className="text-center text-[10px] text-[#2a4060] py-4">No sell orders</div>
              ) : (
                [...orderBook.asks].reverse().map((ask) => (
                  <OrderBookRow key={ask.id} side="ask" price={ask.pricePerShare} qty={ask.quantity} maxQty={maxAskQty} />
                ))
              )}
            </div>

            {/* Spread */}
            <div className="flex items-center justify-center gap-2 py-1.5 border-y border-[#1e3a5f]/20 bg-[#060f1c]">
              <span className="text-[10px] font-mono text-[#C9A84C] font-semibold">{formatPKR(ticker?.lastPrice ?? 0, true)}</span>
              <span className="text-[9px] text-[#2a4060]">Last</span>
              {orderBook.asks.length > 0 && orderBook.bids.length > 0 && (
                <>
                  <span className="text-[9px] text-[#2a4060]">·</span>
                  <span className="text-[9px] text-[#2a4060]">
                    Spread: {formatPKR(
                      Math.abs((orderBook.asks[0]?.pricePerShare ?? 0) - (orderBook.bids[0]?.pricePerShare ?? 0)),
                      true,
                    )}
                  </span>
                </>
              )}
            </div>

            {/* Bids */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 180 }}>
              {orderBook.bids.length === 0 ? (
                <div className="text-center text-[10px] text-[#2a4060] py-4">No buy orders</div>
              ) : (
                orderBook.bids.map((bid) => (
                  <OrderBookRow key={bid.id} side="bid" price={bid.pricePerShare} qty={bid.quantity} maxQty={maxBidQty} />
                ))
              )}
            </div>
          </div>

          {/* ── Order Entry Panel ── */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#C9A84C]/20 bg-[#050e1b] overflow-hidden">
              <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #C9A84C, #e8c060, #C9A84C)" }} />

              {/* Buy / Sell Tabs */}
              <div className="flex border-b border-[#1e3a5f]/30">
                <button
                  onClick={() => setOrderType("buy")}
                  className={`flex-1 py-3 text-sm font-bold transition-all ${orderType === "buy"
                    ? "text-emerald-400 bg-emerald-500/10 border-b-2 border-emerald-400"
                    : "text-[#4a6080] hover:text-[#6a7f99]"}`}
                >
                  ▲ BUY
                </button>
                <button
                  onClick={() => setOrderType("sell")}
                  className={`flex-1 py-3 text-sm font-bold transition-all ${orderType === "sell"
                    ? "text-red-400 bg-red-500/10 border-b-2 border-red-400"
                    : "text-[#4a6080] hover:text-[#6a7f99]"}`}
                >
                  ▼ SELL
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="text-[9px] text-[#4a6080] uppercase tracking-wider block mb-1.5">Limit Price (PKR / Share)</label>
                  <input
                    type="number"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-[#060f1c] border border-[#1e3a5f] rounded-lg px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#C9A84C]/50 focus:ring-1 focus:ring-[#C9A84C]/20"
                    placeholder="0"
                    min="1"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-[#4a6080] uppercase tracking-wider block mb-1.5">Quantity (Shares)</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOrderQty((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-lg border border-[#1e3a5f] flex items-center justify-center text-[#6a7f99] hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={orderQty}
                      onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value) || 1))}
                      className="flex-1 bg-[#060f1c] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white font-mono text-sm text-center focus:outline-none focus:border-[#C9A84C]/50"
                      min="1"
                    />
                    <button
                      onClick={() => setOrderQty((q) => q + 1)}
                      className="w-9 h-9 rounded-lg border border-[#1e3a5f] flex items-center justify-center text-[#6a7f99] hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-[#040c18] border border-[#0d1e35] p-3 space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#4a6080]">Order Value</span>
                    <span className="text-white font-mono">{formatPKR(estTotal, true)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#4a6080]">Trading Fee (0.5% $OKBOND)</span>
                    <span className="text-[#C9A84C] font-mono">{formatPKR(estFee, true)}</span>
                  </div>
                  <div className="border-t border-[#1e3a5f]/30 pt-2 flex justify-between text-[10px]">
                    <span className="text-[#4a6080]">Net Total</span>
                    <span className="font-mono font-semibold text-white">{formatPKR(estTotal + (orderType === "buy" ? estFee : -estFee), true)}</span>
                  </div>
                </div>

                <Show when="signed-in">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePlaceOrder}
                    disabled={placing || !orderPrice}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${orderType === "buy"
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                      : "bg-red-500 hover:bg-red-400 text-white"}`}
                  >
                    {placing ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : orderType === "buy" ? (
                      <><TrendingUp className="w-4 h-4" /> Place Buy Order</>
                    ) : (
                      <><TrendingDown className="w-4 h-4" /> Place Sell Order</>
                    )}
                  </motion.button>
                </Show>
                <Show when="signed-out">
                  <Link href="/sign-in">
                    <button className="w-full py-3 rounded-xl text-sm font-bold text-[#0a1220]"
                      style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)" }}>
                      Sign In to Trade
                    </button>
                  </Link>
                </Show>

                <AnimatePresence>
                  {orderMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`text-[11px] text-center rounded-lg px-3 py-2 ${orderMsg.type === "ok"
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : "bg-red-500/10 border border-red-500/30 text-red-400"}`}
                    >
                      {orderMsg.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-start gap-2 text-[9px] text-[#2a4060]">
                  <Shield className="w-3 h-3 text-[#C9A84C] shrink-0 mt-0.5" />
                  <span>Limit orders · 0.5% fee to Orakzai Treasury · Instant on-match execution</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── My Active Orders Table ── */}
        <Show when="signed-in">
          <div className="max-w-[1600px] mx-auto px-2 sm:px-4 pb-8">
            <div className="rounded-2xl border border-[#1e3a5f]/30 bg-[#040c18] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1e3a5f]/30 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C9A84C]" />
                <span className="text-[10px] text-[#4a6080] uppercase tracking-widest">My Orders</span>
                <span className="ml-2 bg-[#C9A84C]/10 text-[#C9A84C] text-[9px] px-2 py-0.5 rounded-full border border-[#C9A84C]/20">
                  {myOrders.filter((o) => o.status === "pending" || o.status === "partial").length} active
                </span>
              </div>

              {myOrders.length === 0 ? (
                <div className="text-center py-8 text-[#2a4060] text-xs">No orders yet — place your first trade above.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-[#0d1e35] text-[#2a4060] text-[9px] uppercase tracking-wider">
                        <th className="px-4 py-2 text-left">ID</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-right">Price</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Filled</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Placed</th>
                        <th className="px-4 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0a1624]">
                      {myOrders.map((order) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-2.5 text-[#3a5070]">#{order.id}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${order.type === "buy"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/15 text-red-400 border border-red-500/20"}`}>
                              {order.type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-[#C9A84C]">{formatPKR(order.pricePerShare, true)}</td>
                          <td className="px-4 py-2.5 text-right text-white">{order.quantity}</td>
                          <td className="px-4 py-2.5 text-right text-[#6a7f99]">{order.filledQuantity}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[9px] font-medium ${order.status === "filled" ? "text-emerald-400"
                              : order.status === "cancelled" ? "text-[#3a5070]"
                              : order.status === "partial" ? "text-[#C9A84C]"
                              : "text-amber-400"}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[#3a5070]">
                            {new Date(order.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {(order.status === "pending" || order.status === "partial") && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancellingId === order.id}
                                className="flex items-center gap-1 mx-auto text-[10px] text-red-400/60 hover:text-red-400 border border-red-500/15 hover:border-red-500/30 px-2 py-0.5 rounded transition-all disabled:opacity-40"
                              >
                                {cancellingId === order.id ? (
                                  <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                Cancel
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
