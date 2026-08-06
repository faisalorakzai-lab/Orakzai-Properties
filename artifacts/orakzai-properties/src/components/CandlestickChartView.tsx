import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Star, Bell, ChevronDown,
  Maximize2, Settings2, BarChart2, MoreHorizontal,
} from "lucide-react";
import { createChart, ColorType, CandlestickSeries, LineSeries, LineStyle } from "lightweight-charts";
import {
  INTERNAL_TOKENS, TIMEFRAME_SECONDS,
  fetchBinanceCandles, subscribeBinanceKline,
  generateAMMCandles, calcMA as calcMAEngine,
  type Candle as EngineCandle,
} from "@/lib/binanceEngine";

/* ── Theme ── */
const BG    = "#0B0E11";
const CARD  = "#12161C";
const BORD  = "#1E2329";
const RED   = "#F6465D";
const GREEN = "#0ECB81";
const GOLD  = "#C9A84C";
const DIM   = "#848E9C";
const FG    = "#EAECEF";
const ACT   = "#1A1F27";

type Candle = { time: number; open: number; high: number; low: number; close: number };
type OBRow  = { price: number; amt: string };

const ASSETS: Record<string, {
  name: string; price: number; change: number;
  high: number; low: number; vol: number; volUsdt: number;
}> = {
  "ASC/USDT":  { name:"Azan Smart City",    price:1.2400, change:4.80,  high:1.3100, low:1.1800, vol:284310,  volUsdt:352000  },
  "CSC/USDT":  { name:"Capital Smart City", price:2.1800, change:-1.40, high:2.3100, low:2.1200, vol:71200,   volUsdt:155000  },
  "DHA9/USDT": { name:"DHA Lahore Ph-9",    price:8.7500, change:1.20,  high:9.1000, low:8.4200, vol:95800,   volUsdt:838000  },
  "GBR/USDT":  { name:"Gulberg Residencia", price:3.6200, change:2.30,  high:3.8000, low:3.5500, vol:48900,   volUsdt:177000  },
  "OKBOND/USDT":  { name:"Orakzai Bond",     price:0.8800, change:6.50,  high:0.9400, low:0.8200, vol:312000,  volUsdt:274000  },
  "BTI/USDT":  { name:"Bahria Town Isb",    price:5.1000, change:-0.70, high:5.2800, low:4.9700, vol:162400,  volUsdt:828000  },
};

/* ── Per-coin category tags ── */
const CRYPTO_CATEGORIES: Record<string, string> = {
  BTC:"Store of Value", ETH:"Smart Contract", USDT:"Stablecoin",
  BNB:"Exchange Token", USDC:"Stablecoin",    XRP:"Payment Network",
  SOL:"Smart Contract", TRX:"Smart Contract", DOGE:"Meme Coin",
  ADA:"Smart Contract", MATIC:"Smart Contract", DOT:"Interoperability",
  LTC:"Payments",       LINK:"Oracle",          AVAX:"Smart Contract",
  UNI:"DEX Protocol",  ATOM:"Interoperability", XLM:"Payment Network",
  HYPE:"DeFi",         LEO:"Exchange Token",    DAI:"Stablecoin",
  BCH:"Payments",      SHIB:"Meme Coin",        NEAR:"Smart Contract",
  OKBOND:"Real Estate Bond",
};

/* ── Asset live data shape passed from Trade ── */
export interface AssetLiveData {
  name:       string;
  price:      number;
  change:     number;
  high:       number;
  low:        number;
  vol:        number;
  volUsdt:    number;
  isProperty?: boolean;
}

/* ── Format large volume numbers ── */
function fmtVol(n: number): string {
  if (n >= 1e9)  return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3)  return `${(n / 1e3).toFixed(2)}K`;
  if (n > 0)     return n.toFixed(2);
  return "—";
}

/* ── Per-pair seeded performance metrics ── */
function seedPerf(pair: string, todayChange: number) {
  const seed = pair.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rng  = (salt: number) => { const x = Math.sin(seed + salt) * 10000; return x - Math.floor(x); };
  return [
    { label: "Today",    val: todayChange },
    { label: "7 Days",   val: +((rng(1) - 0.58) * 22).toFixed(2) },
    { label: "30 Days",  val: +((rng(2) - 0.52) * 45).toFixed(2) },
    { label: "90 Days",  val: +((rng(3) - 0.62) * 70).toFixed(2) },
    { label: "180 Days", val: +((rng(4) - 0.65) * 90).toFixed(2) },
    { label: "1 Year",   val: +((rng(5) - 0.68) * 130).toFixed(2) },
  ];
}

const CHART_TABS   = ["Price", "Info", "Data", "Square", "MindX"];
const CHART_TIMES  = ["1m", "5m", "15m", "1h", "4h", "1D"];
const TECH_IND     = ["MA", "EMA", "BOLL", "SAR", "AVL", "SUPER", "VOL", "MACD"];
const OB_TABS      = ["Order Book", "Depth", "Trades", "Network"];

/* Dynamic precision — avoids stair-step blocks on micro-priced tokens */
function pFmt(v: number): number {
  if (v >= 100)   return +v.toFixed(2);
  if (v >= 1)     return +v.toFixed(4);
  if (v >= 0.01)  return +v.toFixed(6);
  return +v.toFixed(8);
}

function genBook(mid: number): { asks: OBRow[]; bids: OBRow[] } {
  const asks: OBRow[] = [], bids: OBRow[] = [];
  for (let i = 5; i >= 1; i--)
    asks.push({ price: +(mid * (1 + i * 0.0002)).toFixed(5), amt: (Math.random() * 16 + 0.5).toFixed(1) });
  for (let i = 0; i < 5; i++)
    bids.push({ price: +(mid * (1 - i * 0.0002)).toFixed(5), amt: (Math.random() * 25 + 1).toFixed(1) });
  return { asks, bids };
}

interface Props {
  pair:       string;
  assetData?: AssetLiveData;   // live data injected by Trade screen
  onBack:  () => void;
  onBuy:   () => void;
  onSell:  () => void;
}

export default function CandlestickChartView({ pair, assetData, onBack, onBuy, onSell }: Props) {
  const staticAsset = ASSETS[pair] ?? ASSETS["ASC/USDT"];
  /* Prefer live data injected from Trade; fall back to static table */
  const asset = assetData ?? staticAsset;
  const ticker  = pair.split("/")[0];
  const isPos   = asset.change >= 0;
  const isProperty = assetData?.isProperty ?? !!ASSETS[pair];
  const category   = isProperty
    ? "Real Estate Token"
    : (CRYPTO_CATEGORIES[ticker] ?? "Cryptocurrency");

  const [chartTab,  setChartTab]  = useState("Price");
  const [timeframe, setTimeframe] = useState("15m");
  const [obTab,     setObTab]     = useState("Order Book");
  const [activeInd, setActiveInd] = useState("MA");
  const [book,      setBook]      = useState(() => genBook(asset.price));
  const [starred,   setStarred]   = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);
  const seriesRef     = useRef<any>(null);
  const chartRef      = useRef<any>(null);
  const wsCleanupRef  = useRef<(() => void) | null>(null);
  const [loading, setLoading] = useState(false);

  /* Detect asset type */
  const isExternalCrypto  = !INTERNAL_TOKENS.has(ticker);
  const isInternalProject = INTERNAL_TOKENS.has(ticker);

  /* Refresh order book */
  useEffect(() => {
    const t = setInterval(
      () => setBook(genBook(asset.price * (0.998 + Math.random() * 0.004))),
      2000
    );
    return () => clearInterval(t);
  }, [pair]);

  /* ── Build and mount the chart ── */
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    /* Teardown previous WS if any */
    wsCleanupRef.current?.();
    wsCleanupRef.current = null;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: BG },
        textColor: DIM,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1E2329aa", style: LineStyle.Dotted },
        horzLines: { color: "#1E2329aa", style: LineStyle.Dotted },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: GOLD + "66", labelBackgroundColor: "#1A1F27", width: 1 as any },
        horzLine: { color: GOLD + "66", labelBackgroundColor: "#1A1F27", width: 1 as any },
      },
      rightPriceScale: {
        borderColor: BORD,
        scaleMargins: { top: 0.08, bottom: 0.06 },
      },
      timeScale: {
        borderColor: BORD,
        timeVisible: true,
        secondsVisible: timeframe === "1m",
        fixLeftEdge: false,
      },
      watermark: {
        visible: true, fontSize: 36,
        horzAlign: "center", vertAlign: "center",
        color: "rgba(255,255,255,0.04)", text: "OKZBYTE",
      } as any,
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: GREEN, downColor: RED,
      borderUpColor: GREEN, borderDownColor: RED,
      wickUpColor: GREEN, wickDownColor: RED,
      borderVisible: true,
    } as any);
    seriesRef.current = series;

    /* ── Suppress TV attribution logo ── */
    const hideLogo = () => {
      const els = containerRef.current?.querySelectorAll<HTMLElement>(
        'a[href*="tradingview"], [class*="logo"], [class*="attribution"]'
      );
      els?.forEach(el => { el.style.display = "none"; });
    };
    hideLogo();
    const mo = new MutationObserver(hideLogo);
    mo.observe(containerRef.current, { childList: true, subtree: true });

    const ro = new ResizeObserver(() => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    /* ─────────────────────────────────────────────────────────────
       ENGINE SELECTOR
       External crypto  → Binance REST (historical) + WS (live)
       Internal token   → AMM deterministic candle generator
    ───────────────────────────────────────────────────────────── */
    const applyCandles = (candles: EngineCandle[]) => {
      if (!candles.length) return;
      // Deduplicate and sort by time
      const deduped = Array.from(
        new Map(candles.map(c => [c.time, c])).values()
      ).sort((a, b) => a.time - b.time);
      series.setData(deduped as any);

      /* 24h reference lines */
      if (asset.high > 0)
        (series as any).createPriceLine({ price: asset.high, color: GREEN + "55", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "24h H" });
      if (asset.low > 0)
        (series as any).createPriceLine({ price: asset.low, color: RED + "55", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "24h L" });

      /* MA overlay lines */
      const maStyles = [
        { period: 7,  color: "#F0B90B", width: 1 },
        { period: 25, color: "#00C8FF", width: 1 },
        { period: 99, color: "#BB86FC", width: 1 },
      ];
      for (const { period, color, width } of maStyles) {
        const maData = calcMAEngine(deduped, period);
        if (!maData.length) continue;
        const maSeries = chart.addSeries(LineSeries, {
          color, lineWidth: width,
          priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        } as any);
        maSeries.setData(maData as any);
      }

      chart.timeScale().fitContent();
    };

    if (isExternalCrypto) {
      /* ── EXTERNAL ENGINE: Binance REST → WS live ── */
      setLoading(true);
      fetchBinanceCandles(ticker, timeframe, 200).then(candles => {
        setLoading(false);
        applyCandles(candles);

        /* Live WebSocket kline feed */
        const unsubscribe = subscribeBinanceKline(ticker, timeframe, (liveCandle) => {
          seriesRef.current?.update(liveCandle as any);
        });
        wsCleanupRef.current = unsubscribe;
      }).catch(() => setLoading(false));
    } else {
      /* ── INTERNAL ENGINE: AMM deterministic candle generator ── */
      const candles = generateAMMCandles(ticker, asset.price, asset.price, timeframe, 150);
      applyCandles(candles);

      /* Tick the last (live) candle every 5 s to simulate AMM activity */
      const interval = setInterval(() => {
        if (!seriesRef.current) return;
        const intervalSec = TIMEFRAME_SECONDS[timeframe] ?? 900;
        const now = Math.floor(Date.now() / intervalSec) * intervalSec;
        const noise = (Math.random() - 0.5) * asset.price * 0.002;
        const newClose = Math.max(0.000001, asset.price + noise);
        seriesRef.current.update({
          time:  now,
          open:  pFmt(asset.price),
          high:  pFmt(Math.max(asset.price, newClose) * 1.001),
          low:   pFmt(Math.min(asset.price, newClose) * 0.999),
          close: pFmt(newClose),
        } as any);
      }, 5000);
      wsCleanupRef.current = () => clearInterval(interval);
    }

    return () => {
      wsCleanupRef.current?.();
      wsCleanupRef.current = null;
      mo.disconnect();
      ro.disconnect();
      chart.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, timeframe]);

  const perf = seedPerf(pair, asset.change);

  /* Dynamic bid/ask ratio from live order book */
  const bidTotal = book.bids.reduce((s, r) => s + parseFloat(r.amt), 0);
  const askTotal = book.asks.reduce((s, r) => s + parseFloat(r.amt), 0);
  const bidPct   = Math.round((bidTotal / (bidTotal + askTotal)) * 100) || 50;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.28 }}
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: BG,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflowY: "auto",
        overscrollBehavior: "contain",
        paddingBottom: 80,
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "14px 14px 10px",
        gap: 10,
        borderBottom: `1px solid ${BORD}`,
        position: "sticky", top: 0, background: BG, zIndex: 10,
      }}>
        <button onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 1 }}>
          <ArrowLeft size={20} color={FG} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: FG }}>{pair}</span>
            <ChevronDown size={13} color={DIM} />
            <span style={{
              fontSize: 9, fontWeight: 700, color: GOLD,
              background: "rgba(201,168,76,0.15)", border: `1px solid ${GOLD}44`,
              borderRadius: 4, padding: "1px 5px",
            }}>
              {category}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {/* AI badge */}
          <span style={{
            fontSize: 11, fontWeight: 800, color: GOLD,
            border: `1px solid ${GOLD}`, borderRadius: 4,
            padding: "1px 5px", letterSpacing: 0.5,
          }}>Ai</span>

          <button onClick={() => setStarred(!starred)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Star size={18} color={starred ? GOLD : DIM} fill={starred ? GOLD : "none"} />
          </button>

          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Bell size={18} color={DIM} />
          </button>
        </div>
      </div>

      {/* ── Sub-header tabs ── */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "0 14px",
        borderBottom: `1px solid ${BORD}`,
        gap: 0, overflowX: "auto", scrollbarWidth: "none",
      }}>
        {CHART_TABS.map(t => (
          <button key={t} onClick={() => setChartTab(t)}
            style={{
              background: "none", border: "none",
              padding: "10px 14px 10px 0",
              fontSize: 13, fontWeight: chartTab === t ? 800 : 500,
              color: chartTab === t ? FG : DIM,
              borderBottom: chartTab === t ? `2px solid ${GOLD}` : "2px solid transparent",
              cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
              position: "relative",
            }}>
            {t}
            {t === "MindX" && (
              <span style={{
                fontSize: 8, fontWeight: 800, color: "#fff",
                background: GREEN, borderRadius: 3,
                padding: "1px 3px",
                position: "absolute", top: 6, right: -2,
              }}>New</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Live metric block ── */}
      <div style={{ padding: "12px 14px 8px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Left: price */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: isPos ? GREEN : RED, lineHeight: 1, letterSpacing: -1 }}>
            {asset.price >= 1000
              ? `$${asset.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : asset.price >= 1    ? asset.price.toFixed(4)
              : asset.price >= 0.01 ? asset.price.toFixed(6)
              : asset.price.toFixed(8)}
          </div>
          <div style={{ fontSize: 12, color: DIM, marginTop: 4 }}>
            ≈Rs{(asset.price * 277.5).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
            <span style={{ color: isPos ? GREEN : RED }}>
              {isPos ? "+" : ""}{asset.change.toFixed(2)}%
            </span>
          </div>
          <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>
            {category} &gt;
          </div>
        </div>

        {/* Right: stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          {[
            ["24h High",              asset.high > 0 ? asset.high.toFixed(asset.high >= 1 ? 4 : 8) : "—"],
            ["24h Vol(" + ticker + ")", fmtVol(asset.vol)],
            ["24h Low",               asset.low  > 0 ? asset.low.toFixed(asset.low  >= 1 ? 4 : 8) : "—"],
            ["24h Vol(USDT)",          fmtVol(asset.volUsdt)],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: DIM }}>{l}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: FG }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Timeframe selector ── */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "6px 14px", gap: 4,
        overflowX: "auto", scrollbarWidth: "none",
        borderBottom: `1px solid ${BORD}`,
      }}>
        {CHART_TIMES.map(t => (
          <button key={t} onClick={() => setTimeframe(t)}
            style={{
              background: timeframe === t ? ACT : "none",
              border: `1px solid ${timeframe === t ? GOLD : "transparent"}`,
              borderRadius: 6,
              padding: "4px 9px", fontSize: 11, fontWeight: 600,
              color: timeframe === t ? GOLD : DIM,
              cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
            }}>
            {t}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Maximize2 size={14} color={DIM} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Settings2 size={14} color={DIM} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <BarChart2 size={14} color={DIM} />
          </button>
        </div>
      </div>

      {/* ── MA labels ── */}
      <div style={{ padding: "5px 14px", display: "flex", gap: 12, fontSize: 10, flexWrap: "wrap" }}>
        {[["#F3C010","MA(7)",0.9985],["#E91E8C","MA(25)",1.0011],["#9C27B0","MA(99)",0.9997]].map(([col,lbl,mult]) => {
          const v = asset.price * (mult as number);
          const s = v >= 1000 ? `$${v.toLocaleString("en-US",{maximumFractionDigits:2})}` : v >= 1 ? v.toFixed(4) : v.toFixed(8);
          return <span key={lbl as string} style={{ color: col as string }}>{lbl as string}: {s}</span>;
        })}
      </div>

      {/* ── Candlestick Chart + OKZBYTE watermark + TV logo suppression ── */}
      <style>{`
        .tv-lightweight-charts a,
        .tv-lightweight-charts [class*="logo"],
        .tv-lightweight-charts [class*="attribution"] {
          display: none !important;
          pointer-events: none !important;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{ position: "relative", height: 270, width: "100%", background: BG }}>
        {/* Fallback OKZBYTE watermark — always visible behind candles */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none", zIndex: 1,
          fontSize: 34, fontWeight: 900, letterSpacing: 4,
          color: "rgba(255,255,255,0.04)",
          userSelect: "none",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          OKZBYTE
        </div>
        {/* Loading overlay for Binance fetch */}
        {loading && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 5,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(11,14,17,0.85)", gap: 10,
          }}>
            <div style={{ width: 22, height: 22, border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 11, color: GOLD }}>
              {isExternalCrypto ? "Fetching live data…" : "Loading AMM engine…"}
            </span>
          </div>
        )}
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      </div>

      {/* ── Technical indicators ── */}
      <div style={{
        display: "flex", overflowX: "auto", scrollbarWidth: "none",
        borderTop: `1px solid ${BORD}`,
        padding: "8px 14px", gap: 14,
      }}>
        {TECH_IND.map(ind => (
          <button key={ind} onClick={() => setActiveInd(ind)}
            style={{
              background: "none", border: "none",
              fontSize: 12, fontWeight: activeInd === ind ? 800 : 500,
              color: activeInd === ind ? FG : DIM,
              borderBottom: activeInd === ind ? `2px solid ${GOLD}` : "2px solid transparent",
              paddingBottom: 4,
              cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
            }}>
            {ind}
          </button>
        ))}
        <button style={{
          background: "none", border: "none", cursor: "pointer",
          marginLeft: "auto", padding: 0,
        }}>
          <BarChart2 size={14} color={DIM} />
        </button>
      </div>

      {/* ── Historical performance tracker ── */}
      <div style={{
        display: "flex", overflowX: "auto", scrollbarWidth: "none",
        borderTop: `1px solid ${BORD}`,
        padding: "10px 14px", gap: 18,
      }}>
        {perf.map(p => (
          <div key={p.label} style={{ flexShrink: 0, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: DIM }}>{p.label}</div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: p.val >= 0 ? GREEN : RED,
              marginTop: 2,
            }}>
              {p.val >= 0 ? "+" : ""}{p.val}%
            </div>
          </div>
        ))}
      </div>

      {/* ── Order Book section ── */}
      <div style={{ borderTop: `1px solid ${BORD}` }}>
        {/* Tabs */}
        <div style={{
          display: "flex", alignItems: "center",
          padding: "0 14px", borderBottom: `1px solid ${BORD}`,
          gap: 0, overflowX: "auto", scrollbarWidth: "none",
        }}>
          {OB_TABS.map(t => (
            <button key={t} onClick={() => setObTab(t)}
              style={{
                background: "none", border: "none",
                padding: "10px 14px 10px 0",
                fontSize: 12, fontWeight: obTab === t ? 700 : 500,
                color: obTab === t ? FG : DIM,
                borderBottom: obTab === t ? `2px solid ${GOLD}` : "2px solid transparent",
                cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit",
              }}>
              {t}
            </button>
          ))}
        </div>

        {/* Bid/Ask ratio bar */}
        <div style={{ padding: "8px 14px 4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: GREEN, fontWeight: 700 }}>{bidPct.toFixed(2)}%</span>
            <span style={{ fontSize: 10, color: RED,   fontWeight: 700 }}>{(100 - bidPct).toFixed(2)}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 3, overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${bidPct}%`, background: GREEN }} />
            <div style={{ flex: 1, background: RED }} />
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          padding: "6px 14px",
          borderBottom: `1px solid ${BORD}`,
        }}>
          <span style={{ fontSize: 10, color: DIM }}>Bid</span>
          <span style={{ fontSize: 10, color: DIM, textAlign: "center" }}>Ask</span>
          <span style={{ fontSize: 10, color: DIM, textAlign: "right" }}>
            {(0.00001).toFixed(5)} ▾
          </span>
        </div>

        {/* Order rows */}
        <div style={{ padding: "4px 14px 0" }}>
          {book.asks.slice().reverse().map((ask, i) => (
            <div key={"a" + i} style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              padding: "3px 0",
            }}>
              <span style={{ fontSize: 12, color: DIM }}>{book.bids[i]?.amt ?? "—"}</span>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>
                  {book.bids[i]?.price.toFixed(5)}
                </span>
                <span style={{ fontSize: 12, color: RED, fontWeight: 600, marginLeft: 8 }}>
                  {ask.price.toFixed(5)}
                </span>
              </div>
              <span style={{ fontSize: 12, color: DIM, textAlign: "right" }}>{ask.amt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fixed bottom action bar ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: BG,
        borderTop: `1px solid ${BORD}`,
        display: "flex", alignItems: "center",
        padding: "12px 16px 20px",
        gap: 10,
        zIndex: 20,
      }}>
        {/* Left tools */}
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginRight: 4 }}>
          {[
            [MoreHorizontal, "More"],
            [BarChart2, "Hub"],
          ].map(([Icon, label], i) => (
            <button key={i} style={{
              background: "none", border: "none",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 2, cursor: "pointer", padding: 0,
            }}>
              {/* @ts-ignore */}
              <Icon size={18} color={DIM} />
              <span style={{ fontSize: 9, color: DIM }}>{label as string}</span>
            </button>
          ))}
          <button style={{
            background: "none", border: "none",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 2, cursor: "pointer", padding: 0,
          }}>
            <span style={{ fontSize: 16, color: DIM }}>⇌</span>
            <span style={{ fontSize: 9, color: DIM }}>Margin</span>
          </button>
        </div>

        {/* Buy button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onBuy}
          style={{
            flex: 1, padding: "13px 0",
            borderRadius: 8, border: "none",
            background: GREEN, color: "#0a0a0a",
            fontSize: 15, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
          }}>
          Buy
        </motion.button>

        {/* Sell button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSell}
          style={{
            flex: 1, padding: "13px 0",
            borderRadius: 8, border: "none",
            background: RED, color: "#fff",
            fontSize: 15, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
          }}>
          Sell
        </motion.button>
      </div>
    </motion.div>
  );
}
