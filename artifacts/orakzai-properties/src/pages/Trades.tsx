import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createChart, ColorType, CandlestickSeries, LineStyle } from "lightweight-charts";
import { ChevronDown, X, AlertTriangle } from "lucide-react";

const DEEP_DARK = "#070B14";
const CARD_BG = "#0B1120";
const BORDER = "#1a2235";
const RED = "#F6465D";
const GREEN = "#0ECB81";
const GOLD = "#F3BA2F";
const TEXT_PRIMARY = "#EAECEF";
const TEXT_DIM = "#848E9C";

const ASSETS = [
  { pair: "ASC / USDT", name: "Azan Smart City", ticker: "ASC", price: 1.24, high24h: 1.31, low24h: 1.18, volume24h: 284310, change24h: 4.8 },
  { pair: "DHA9 / USDT", name: "DHA Lahore Ph-9", ticker: "DHA9", price: 8.75, high24h: 9.10, low24h: 8.42, volume24h: 95800, change24h: 1.2 },
  { pair: "BTI / USDT", name: "Bahria Town Isb", ticker: "BTI", price: 5.10, high24h: 5.28, low24h: 4.97, volume24h: 162400, change24h: -0.7 },
  { pair: "GBR / USDT", name: "Gulberg Residencia", ticker: "GBR", price: 3.62, high24h: 3.80, low24h: 3.55, volume24h: 48900, change24h: 2.3 },
];

type CandleData = { time: number; open: number; high: number; low: number; close: number };
type OrderBookEntry = { price: number; amount: number; total: number };
type OpenOrder = { id: number; side: "BUY" | "SELL"; type: string; price: number; amount: number; filled: number; time: string };

function generateCandles(basePrice: number, count = 60): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice * 0.88;
  const now = Math.floor(Date.now() / 1000);
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.025;
    const close = Math.max(price * 0.5, open + change);
    const high = Math.max(open, close) + Math.random() * price * 0.01;
    const low = Math.min(open, close) - Math.random() * price * 0.01;
    candles.push({ time: now - i * 300, open, high, low, close });
    price = close;
  }
  return candles;
}

function generateOrderBook(midPrice: number): { asks: OrderBookEntry[]; bids: OrderBookEntry[] } {
  const asks: OrderBookEntry[] = [];
  const bids: OrderBookEntry[] = [];
  let total = 0;
  for (let i = 0; i < 8; i++) {
    const price = midPrice * (1 + (i + 1) * 0.0015);
    const amount = +(Math.random() * 1500 + 100).toFixed(0);
    total += amount;
    asks.push({ price: +price.toFixed(4), amount, total });
  }
  total = 0;
  for (let i = 0; i < 8; i++) {
    const price = midPrice * (1 - (i + 1) * 0.0015);
    const amount = +(Math.random() * 1500 + 100).toFixed(0);
    total += amount;
    bids.push({ price: +price.toFixed(4), amount, total });
  }
  return { asks: asks.reverse(), bids };
}

function CandleChart({ assetPrice }: { assetPrice: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: CARD_BG },
        textColor: TEXT_DIM,
      },
      grid: {
        vertLines: { color: "#101828", style: LineStyle.Dotted },
        horzLines: { color: "#101828", style: LineStyle.Dotted },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#F3BA2F44", labelBackgroundColor: "#0B1120" },
        horzLine: { color: "#F3BA2F44", labelBackgroundColor: "#0B1120" },
      },
      rightPriceScale: { borderColor: BORDER },
      timeScale: { borderColor: BORDER, timeVisible: true, secondsVisible: false },
      handleScroll: true,
      handleScale: true,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: GREEN,
      downColor: RED,
      borderUpColor: GREEN,
      borderDownColor: RED,
      wickUpColor: GREEN,
      wickDownColor: RED,
    } as any);

    const candles = generateCandles(assetPrice);
    series.setData(candles as any);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [assetPrice]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}

function OrderBook({ asks, bids, midPrice }: { asks: OrderBookEntry[]; bids: OrderBookEntry[]; midPrice: number }) {
  const maxTotal = Math.max(...asks.map(a => a.total), ...bids.map(b => b.total));
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontSize: 11, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "6px 8px", color: TEXT_DIM, fontSize: 10, borderBottom: `1px solid ${BORDER}` }}>
        <span>Price(USDT)</span>
        <span style={{ textAlign: "right" }}>Amount</span>
      </div>

      {/* Asks */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {asks.map((ask, i) => (
          <div key={i} style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", padding: "2px 8px" }}>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, background: `rgba(246,70,93,0.12)`, width: `${(ask.total / maxTotal) * 100}%` }} />
            <span style={{ color: RED, position: "relative", fontVariantNumeric: "tabular-nums" }}>{ask.price.toFixed(4)}</span>
            <span style={{ color: TEXT_PRIMARY, textAlign: "right", position: "relative" }}>{ask.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Spread / Last Price */}
      <div style={{ padding: "5px 8px", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: DEEP_DARK }}>
        <span style={{ color: midPrice > 0 ? GREEN : RED, fontWeight: 700, fontSize: 13 }}>{midPrice.toFixed(4)}</span>
        <span style={{ color: TEXT_DIM, fontSize: 10, marginLeft: 6 }}>USDT</span>
      </div>

      {/* Bids */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {bids.map((bid, i) => (
          <div key={i} style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", padding: "2px 8px" }}>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, background: `rgba(14,203,129,0.12)`, width: `${(bid.total / maxTotal) * 100}%` }} />
            <span style={{ color: GREEN, position: "relative", fontVariantNumeric: "tabular-nums" }}>{bid.price.toFixed(4)}</span>
            <span style={{ color: TEXT_PRIMARY, textAlign: "right", position: "relative" }}>{bid.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCK_BALANCE_USDT = 500;
const MOCK_BALANCE_TOKEN = 250;

const INITIAL_OPEN_ORDERS: OpenOrder[] = [
  { id: 1, side: "BUY", type: "Limit", price: 1.18, amount: 100, filled: 0, time: "10:32" },
  { id: 2, side: "SELL", type: "Limit", price: 1.35, amount: 50, filled: 0, time: "09:15" },
];

export default function Trades() {
  const [selectedAssetIdx, setSelectedAssetIdx] = useState(0);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const asset = ASSETS[selectedAssetIdx];

  const [livePrice, setLivePrice] = useState(asset.price);
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(asset.price));

  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"Limit" | "Market">("Limit");
  const [price, setPrice] = useState(asset.price.toFixed(4));
  const [amount, setAmount] = useState("");
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>(INITIAL_OPEN_ORDERS);
  const [showOrderTypeMenu, setShowOrderTypeMenu] = useState(false);

  const priceNum = parseFloat(price) || 0;
  const amountNum = parseFloat(amount) || 0;
  const total = orderType === "Market" ? livePrice * amountNum : priceNum * amountNum;
  const meetsMinimum = total >= 1;
  const balance = side === "BUY" ? MOCK_BALANCE_USDT : MOCK_BALANCE_TOKEN;

  useEffect(() => {
    setLivePrice(asset.price);
    setPrice(asset.price.toFixed(4));
    setAmount("");
    setOrderBook(generateOrderBook(asset.price));
  }, [selectedAssetIdx]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLivePrice(prev => {
        const next = prev * (1 + (Math.random() - 0.5) * 0.002);
        return +next.toFixed(4);
      });
      setOrderBook(generateOrderBook(livePrice));
    }, 2000);
    return () => clearInterval(interval);
  }, [livePrice]);

  const handlePct = useCallback((pct: number) => {
    if (side === "BUY") {
      const maxQty = balance / (priceNum || livePrice);
      setAmount((maxQty * pct).toFixed(2));
    } else {
      setAmount((balance * pct).toFixed(2));
    }
  }, [side, balance, priceNum, livePrice]);

  const handleSubmit = () => {
    if (!meetsMinimum) return;
    const newOrder: OpenOrder = {
      id: Date.now(),
      side,
      type: orderType,
      price: orderType === "Market" ? livePrice : priceNum,
      amount: amountNum,
      filled: 0,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    setOpenOrders(prev => [newOrder, ...prev]);
    setAmount("");
  };

  const cancelOrder = (id: number) => {
    setOpenOrders(prev => prev.filter(o => o.id !== id));
  };

  return (
    <div
      style={{
        height: "100dvh",
        background: DEEP_DARK,
        color: TEXT_PRIMARY,
        fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── TOP HEADER ── */}
      <div
        style={{
          background: CARD_BG,
          borderBottom: `1px solid ${BORDER}`,
          padding: "10px 12px 8px",
          flexShrink: 0,
        }}
      >
        {/* Pair selector row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <button
            onClick={() => setShowAssetPicker(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 16, color: TEXT_PRIMARY }}>{asset.ticker}</span>
            <span style={{ fontSize: 13, color: TEXT_DIM }}>/USDT</span>
            <ChevronDown size={14} color={TEXT_DIM} />
          </button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: asset.change24h >= 0 ? GREEN : RED, fontVariantNumeric: "tabular-nums" }}>
              {livePrice.toFixed(4)}
            </div>
            <div style={{ fontSize: 10, color: asset.change24h >= 0 ? GREEN : RED }}>
              {asset.change24h >= 0 ? "+" : ""}{asset.change24h}%
            </div>
          </div>
        </div>

        {/* Pair name */}
        <div style={{ fontSize: 10, color: TEXT_DIM, marginBottom: 8 }}>{asset.name}</div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
          {[
            { label: "24h High", value: asset.high24h.toFixed(4), color: GREEN },
            { label: "24h Low", value: asset.low24h.toFixed(4), color: RED },
            { label: "24h Vol", value: asset.volume24h.toLocaleString(), color: TEXT_DIM },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 9, color: TEXT_DIM }}>{s.label}</div>
              <div style={{ fontSize: 11, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Asset picker dropdown */}
        <AnimatePresence>
          {showAssetPicker && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: "#0d1526", border: `1px solid ${BORDER}`, zIndex: 100,
                borderBottom: `2px solid ${GOLD}`,
              }}
            >
              {ASSETS.map((a, i) => (
                <div
                  key={i}
                  onClick={() => { setSelectedAssetIdx(i); setShowAssetPicker(false); }}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", cursor: "pointer",
                    background: i === selectedAssetIdx ? "rgba(243,186,47,0.07)" : "transparent",
                    borderBottom: i < ASSETS.length - 1 ? `1px solid ${BORDER}` : "none",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: TEXT_PRIMARY }}>{a.ticker}/USDT</span>
                    <span style={{ fontSize: 10, color: TEXT_DIM, marginLeft: 8 }}>{a.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: a.change24h >= 0 ? GREEN : RED }}>
                    {a.price.toFixed(4)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CHART ── */}
      <div style={{ flex: "0 0 200px", borderBottom: `1px solid ${BORDER}`, position: "relative", overflow: "hidden" }}>
        <CandleChart assetPrice={asset.price} />
      </div>

      {/* ── TERMINAL: ORDER BOOK + ORDER ENTRY ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${BORDER}`, overflow: "hidden" }}>
        {/* Left: Order Book */}
        <div style={{ borderRight: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <div style={{ padding: "6px 8px", fontSize: 10, fontWeight: 700, color: TEXT_DIM, borderBottom: `1px solid ${BORDER}`, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Order Book
          </div>
          <OrderBook asks={orderBook.asks} bids={orderBook.bids} midPrice={livePrice} />
        </div>

        {/* Right: Order Entry */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* BUY / SELL tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flexShrink: 0 }}>
            {(["BUY", "SELL"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSide(s)}
                style={{
                  padding: "10px 0",
                  fontWeight: 800, fontSize: 13,
                  border: "none", cursor: "pointer",
                  color: side === s ? "#fff" : TEXT_DIM,
                  background: side === s
                    ? s === "BUY" ? "rgba(14,203,129,0.18)" : "rgba(246,70,93,0.18)"
                    : "transparent",
                  borderBottom: side === s
                    ? `2px solid ${s === "BUY" ? GREEN : RED}`
                    : `2px solid ${BORDER}`,
                  transition: "all 0.15s",
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 6px" }}>
            {/* Balance */}
            <div style={{ fontSize: 10, color: TEXT_DIM, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>Avail.</span>
              <span style={{ color: TEXT_PRIMARY }}>
                {side === "BUY" ? `${MOCK_BALANCE_USDT} USDT` : `${MOCK_BALANCE_TOKEN} ${asset.ticker}`}
              </span>
            </div>

            {/* Order type */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              <button
                onClick={() => setShowOrderTypeMenu(v => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#111827", border: `1px solid ${BORDER}`, borderRadius: 4,
                  padding: "6px 10px", color: TEXT_PRIMARY, fontSize: 12, cursor: "pointer",
                }}
              >
                {orderType} <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showOrderTypeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0,
                      background: "#111827", border: `1px solid ${BORDER}`, borderRadius: 4, zIndex: 50,
                    }}
                  >
                    {(["Limit", "Market"] as const).map(t => (
                      <div
                        key={t}
                        onClick={() => { setOrderType(t); setShowOrderTypeMenu(false); }}
                        style={{
                          padding: "8px 10px", fontSize: 12, cursor: "pointer",
                          color: orderType === t ? GOLD : TEXT_PRIMARY,
                          background: orderType === t ? "rgba(243,186,47,0.08)" : "transparent",
                        }}
                      >
                        {t}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Price input (Limit only) */}
            {orderType === "Limit" && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: TEXT_DIM, marginBottom: 3 }}>Price (USDT)</div>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  step="0.0001"
                  style={{
                    width: "100%", background: "#111827", border: `1px solid ${BORDER}`,
                    borderRadius: 4, padding: "7px 10px", color: TEXT_PRIMARY,
                    fontSize: 12, outline: "none", boxSizing: "border-box",
                    fontVariantNumeric: "tabular-nums",
                  }}
                />
              </div>
            )}
            {orderType === "Market" && (
              <div style={{ marginBottom: 8, padding: "7px 10px", background: "#111827", border: `1px solid ${BORDER}`, borderRadius: 4, fontSize: 11, color: TEXT_DIM }}>
                Market Price: <span style={{ color: GREEN }}>{livePrice.toFixed(4)}</span>
              </div>
            )}

            {/* Amount input */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: TEXT_DIM, marginBottom: 3 }}>Amount ({asset.ticker})</div>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: "100%", background: "#111827", border: `1px solid ${BORDER}`,
                  borderRadius: 4, padding: "7px 10px", color: TEXT_PRIMARY,
                  fontSize: 12, outline: "none", boxSizing: "border-box",
                  fontVariantNumeric: "tabular-nums",
                }}
              />
            </div>

            {/* Percentage slider */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 4, marginBottom: 8 }}>
              {[0.25, 0.5, 0.75, 1].map(pct => (
                <button
                  key={pct}
                  onClick={() => handlePct(pct)}
                  style={{
                    padding: "4px 0", fontSize: 10, fontWeight: 600, borderRadius: 3,
                    border: `1px solid ${BORDER}`, background: "transparent",
                    color: TEXT_DIM, cursor: "pointer",
                  }}
                >
                  {pct * 100}%
                </button>
              ))}
            </div>

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: TEXT_DIM, marginBottom: 6 }}>
              <span>Total</span>
              <span style={{ color: meetsMinimum || total === 0 ? TEXT_PRIMARY : RED, fontVariantNumeric: "tabular-nums" }}>
                {total > 0 ? total.toFixed(4) : "0.0000"} USDT
              </span>
            </div>

            {/* Min order warning */}
            <AnimatePresence>
              {total > 0 && !meetsMinimum && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden", marginBottom: 6 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(246,70,93,0.1)", border: `1px solid rgba(246,70,93,0.3)`, borderRadius: 4, padding: "5px 8px" }}>
                    <AlertTriangle size={10} color={RED} />
                    <span style={{ fontSize: 10, color: RED }}>Minimum order size is $1 USDT</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!meetsMinimum}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 4,
                border: "none", cursor: meetsMinimum ? "pointer" : "not-allowed",
                fontWeight: 800, fontSize: 13, letterSpacing: "0.03em",
                background: meetsMinimum
                  ? side === "BUY"
                    ? GREEN
                    : RED
                  : "#1a2235",
                color: meetsMinimum ? "#fff" : TEXT_DIM,
                transition: "all 0.15s",
                opacity: meetsMinimum ? 1 : 0.6,
              }}
            >
              {side === "BUY" ? `Buy ${asset.ticker}` : `Sell ${asset.ticker}`}
            </button>
          </div>
        </div>
      </div>

      {/* ── OPEN ORDERS ── */}
      <div
        style={{
          flexShrink: 0,
          maxHeight: "28vh",
          overflowY: "auto",
          background: CARD_BG,
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <div
          style={{
            position: "sticky", top: 0,
            padding: "7px 12px", fontSize: 10, fontWeight: 700,
            color: TEXT_DIM, background: CARD_BG,
            borderBottom: `1px solid ${BORDER}`,
            textTransform: "uppercase", letterSpacing: "0.05em",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            zIndex: 10,
          }}
        >
          <span>Open Orders</span>
          <span style={{ color: GOLD, background: "rgba(243,186,47,0.12)", borderRadius: 10, padding: "1px 7px" }}>
            {openOrders.length}
          </span>
        </div>

        {openOrders.length === 0 ? (
          <div style={{ padding: "20px 12px", textAlign: "center", fontSize: 11, color: TEXT_DIM }}>
            No open orders
          </div>
        ) : (
          <div>
            {openOrders.map(order => (
              <div
                key={order.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto auto",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderBottom: `1px solid ${BORDER}`,
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    color: order.side === "BUY" ? GREEN : RED,
                    fontWeight: 700, fontSize: 10,
                    background: order.side === "BUY" ? "rgba(14,203,129,0.1)" : "rgba(246,70,93,0.1)",
                    padding: "2px 6px", borderRadius: 3,
                  }}
                >
                  {order.side}
                </span>
                <div>
                  <span style={{ color: TEXT_PRIMARY, fontWeight: 600 }}>{asset.ticker}/USDT</span>
                  <span style={{ color: TEXT_DIM, marginLeft: 6, fontSize: 10 }}>{order.type}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: TEXT_PRIMARY, fontVariantNumeric: "tabular-nums" }}>{order.price.toFixed(4)}</div>
                  <div style={{ color: TEXT_DIM, fontSize: 9 }}>{order.amount} {asset.ticker}</div>
                </div>
                <div style={{ fontSize: 10, color: TEXT_DIM }}>{order.time}</div>
                <button
                  onClick={() => cancelOrder(order.id)}
                  style={{
                    background: "rgba(246,70,93,0.12)", border: `1px solid rgba(246,70,93,0.3)`,
                    borderRadius: 4, padding: "3px 6px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 2,
                  }}
                >
                  <X size={10} color={RED} />
                  <span style={{ fontSize: 9, color: RED }}>Cancel</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
