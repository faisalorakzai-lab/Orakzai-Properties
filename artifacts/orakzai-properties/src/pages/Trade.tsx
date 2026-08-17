import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, X, BarChart2, MoreHorizontal,
  Copy, Settings2, CheckCircle, AlertCircle,
} from "lucide-react";
import { useMode, type CryptoItem } from "@/contexts/ModeContext";
import { useAppStore, ASSET_DEFS } from "@/store/AppStoreContext";
import { useWalletStore } from "@/store/WalletStoreContext";
import { createChart, ColorType, CandlestickSeries, LineSeries, LineStyle } from "lightweight-charts";
import CandlestickChartView from "@/components/CandlestickChartView";
import {
  INTERNAL_TOKENS, TIMEFRAME_SECONDS,
  fetchBinanceCandles, subscribeBinanceKline,
  generateAMMCandles, calcMA as calcMAEngine,
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

const TOP_TABS    = ["Convert", "Spot", "P2P"];
const ORDER_TYPES = ["Market", "Limit", "Stop-Limit", "OCO"];
const BOTTOM_TABS = ["Open Orders", "Holdings", "Bots"];
const CHART_TIMES = ["1m", "5m", "15m", "1h", "4h", "1D"];

type Candle = { time: number; open: number; high: number; low: number; close: number };
type OBRow  = { price: number; amt: string };

function genBook(mid: number): { asks: OBRow[]; bids: OBRow[] } {
  const asks: OBRow[] = [], bids: OBRow[] = [];
  for (let i = 5; i >= 1; i--) asks.push({ price: +(mid * (1 + i * 0.0002)).toFixed(5), amt: (Math.random() * 16 + 0.5).toFixed(2) + "K" });
  for (let i = 0; i < 5; i++)  bids.push({ price: +(mid * (1 - i * 0.0002)).toFixed(5), amt: (Math.random() * 25 + 1).toFixed(2) + "K" });
  return { asks, bids };
}

/* ── Inline candle chart (dual-engine: Binance for crypto, AMM for property tokens) ── */
function CandleChart({ pair, livePrice, assetMeta }: {
  pair: string;
  livePrice: number;
  assetMeta: typeof ASSET_DEFS[string];
}) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const seriesRef     = useRef<any>(null);
  const wsCleanupRef  = useRef<(() => void) | null>(null);
  const [timeframe, setTimeframe] = useState("15m");
  const [loading, setLoading]     = useState(false);
  const isPos   = assetMeta.change >= 0;
  const ticker  = pair.split("/")[0];
  const isExternal = !INTERNAL_TOKENS.has(ticker);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    wsCleanupRef.current?.();
    wsCleanupRef.current = null;

    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: BG }, textColor: DIM },
      grid:   { vertLines: { color: BORD, style: LineStyle.Dotted }, horzLines: { color: BORD, style: LineStyle.Dotted } },
      crosshair: { vertLine: { color: GOLD + "44", labelBackgroundColor: ACT }, horzLine: { color: GOLD + "44", labelBackgroundColor: ACT } },
      rightPriceScale: { borderColor: BORD },
      timeScale: { borderColor: BORD, timeVisible: true, secondsVisible: timeframe === "1m" },
      handleScroll: true, handleScale: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: GREEN, downColor: RED, borderVisible: false, wickUpColor: GREEN, wickDownColor: RED,
    } as any);
    seriesRef.current = series;

    const applyCandles = (candles: any[]) => {
      if (!candles.length) return;
      const deduped = Array.from(new Map(candles.map(c => [c.time, c])).values())
                           .sort((a: any, b: any) => a.time - b.time);
      series.setData(deduped as any);

      /* MA overlays */
      for (const [period, color] of [[7, "#F0B90B"], [25, "#00C8FF"], [99, "#BB86FC"]] as const) {
        const maData = calcMAEngine(deduped, period);
        if (!maData.length) continue;
        const ms = chart.addSeries(LineSeries, { color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false } as any);
        ms.setData(maData as any);
      }
      chart.timeScale().fitContent();
    };

    if (isExternal) {
      /* EXTERNAL: Binance REST → WebSocket */
      setLoading(true);
      fetchBinanceCandles(ticker, timeframe, 150).then(candles => {
        setLoading(false);
        applyCandles(candles);
        wsCleanupRef.current = subscribeBinanceKline(ticker, timeframe, (c) => {
          seriesRef.current?.update(c as any);
        });
      }).catch(() => setLoading(false));
    } else {
      /* INTERNAL: AMM deterministic candles */
      const candles = generateAMMCandles(ticker, assetMeta.basePrice, livePrice, timeframe, 150);
      applyCandles(candles);

      /* Tick live candle every 5s */
      const ivSec = TIMEFRAME_SECONDS[timeframe] ?? 900;
      const iv = setInterval(() => {
        const now = Math.floor(Date.now() / ivSec) * ivSec;
        const noise = (Math.random() - 0.5) * livePrice * 0.002;
        const newClose = Math.max(0.000001, livePrice + noise);
        seriesRef.current?.update({ time: now, open: livePrice, high: Math.max(livePrice, newClose) * 1.001, low: Math.min(livePrice, newClose) * 0.999, close: newClose } as any);
      }, 5000);
      wsCleanupRef.current = () => clearInterval(iv);
    }

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);
    return () => { wsCleanupRef.current?.(); wsCleanupRef.current = null; ro.disconnect(); chart.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, timeframe]);

  /* Seed per-pair seeded performance */
  const seed = pair.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng  = (s: number) => { const x = Math.sin(seed + s) * 10000; return x - Math.floor(x); };
  const perf = [
    { label: "Today",    val: assetMeta.change },
    { label: "7 Days",   val: +((rng(1) - 0.58) * 22).toFixed(2) },
    { label: "30 Days",  val: +((rng(2) - 0.52) * 45).toFixed(2) },
    { label: "90 Days",  val: +((rng(3) - 0.62) * 70).toFixed(2) },
    { label: "180 Days", val: +((rng(4) - 0.65) * 90).toFixed(2) },
    { label: "1 Year",   val: +((rng(5) - 0.68) * 130).toFixed(2) },
  ];

  const priceStr = livePrice >= 1000 ? `$${livePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : livePrice >= 1 ? livePrice.toFixed(5) : livePrice.toFixed(8);

  return (
    <div style={{ background: BG }}>
      <div style={{ padding: "12px 14px 6px", borderBottom: `1px solid ${BORD}` }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: isPos ? GREEN : RED, lineHeight: 1 }}>{priceStr}</div>
        <div style={{ fontSize: 12, color: DIM, marginTop: 3 }}>
          ≈Rs{(livePrice * 277.5).toFixed(2)}{" "}
          <span style={{ color: isPos ? GREEN : RED }}>{isPos ? "+" : ""}{assetMeta.change}%</span>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {[
            ["24h High", assetMeta.high >= 1 ? assetMeta.high.toFixed(4) : assetMeta.high.toFixed(8)],
            ["24h Low",  assetMeta.low  >= 1 ? assetMeta.low.toFixed(4)  : assetMeta.low.toFixed(8)],
            ["24h Vol",  `${(assetMeta.vol / 1000).toFixed(2)}K`],
          ].map(([l, v]) => (
            <div key={l as string}>
              <div style={{ fontSize: 10, color: DIM }}>{l}</div>
              <div style={{ fontSize: 11, color: FG, fontWeight: 600 }}>{v as string}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeframe selector */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 14px", gap: 4, overflowX: "auto", scrollbarWidth: "none", borderBottom: `1px solid ${BORD}` }}>
        {CHART_TIMES.map(t => (
          <button key={t} onClick={() => setTimeframe(t)}
            style={{ background: timeframe === t ? ACT : "none", border: `1px solid ${timeframe === t ? GOLD : BORD}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: timeframe === t ? GOLD : DIM, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
            {t}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {loading && <span style={{ fontSize: 9, color: GOLD }}>Loading…</span>}
          {[BarChart2, Settings2].map((Icon, i) => (
            <button key={i} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><Icon size={14} color={DIM} /></button>
          ))}
        </div>
      </div>

      {/* MA labels */}
      <div style={{ padding: "4px 14px", display: "flex", gap: 12, fontSize: 10 }}>
        <span style={{ color: "#F3C010" }}>MA(7): {(livePrice * 0.998).toPrecision(5)}</span>
        <span style={{ color: "#00C8FF" }}>MA(25): {(livePrice * 1.001).toPrecision(5)}</span>
        <span style={{ color: "#BB86FC" }}>MA(99): {(livePrice * 0.9995).toPrecision(5)}</span>
      </div>

      {/* Chart container */}
      <div style={{ position: "relative", height: 220, width: "100%" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, background: BG + "cc" }}>
            <div style={{ width: 20, height: 20, border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}
        <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      </div>

      {/* Historical performance */}
      <div style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none", borderTop: `1px solid ${BORD}`, padding: "8px 14px", gap: 14 }}>
        {perf.map(p => (
          <div key={p.label} style={{ flexShrink: 0, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: DIM }}>{p.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: p.val >= 0 ? GREEN : RED }}>{p.val >= 0 ? "+" : ""}{p.val}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* LiveCoin alias — re-export of shared CryptoItem for internal use */
type LiveCoin = CryptoItem;

/* ═══════════════════════════════════════════════════════════════
   Helper — resolve canonical USDT pair from any quoted pair
   e.g. "DHA9/USDC" → "DHA9/USDT"  |  "BTC/OKBOND" → "BTC/USDT"
═══════════════════════════════════════════════════════════════ */
function resolveCanonicalPair(pair: string): string {
  const base = pair.split("/")[0];
  return `${base}/USDT`;
}

/* ═══════════════════════════════════════════════════════════════
   Main Trade Page
═══════════════════════════════════════════════════════════════ */
export default function Trade() {
  const { ledger: unifiedLedger, debit: debitWallet, credit: creditWallet } = useWalletStore();
  const {
    activePair, setActivePair, setChartFullScreen, activeQuoteCurrency,
    liveCryptoList, setLiveCryptoList, cryptoFetching, setCryptoFetching,
    isDemoTrading, demoBalances, updateDemoBalance,
  } = useMode();
  const {
    prices, wallet, filledOrders, positions,
    dispatchTrade, tradeToast, dismissToast,
  } = useAppStore();

  /* ── All hooks first — useMemo below reads liveCryptoList so state must come first ── */
  const [topTab,         setTopTab]         = useState("Spot");
  const [side,           setSide]           = useState<"buy" | "sell">("buy");
  const [orderType,      setOrderType]      = useState("Market");
  const [total,          setTotal]          = useState("");
  const [pct,            setPct]            = useState(0);
  const [slippage,       setSlippage]       = useState(false);
  const [bottomTab,      setBottomTab]      = useState("Open Orders");
  const [showChart,      setShowChart]      = useState(false);
  const [showFullChart,  setShowFullChart]  = useState(false);
  const [showPairDrop,   setShowPairDrop]   = useState(false);
  const [pairSearch,     setPairSearch]     = useState("");
  const cryptoFetchedRef = useRef(false);
  const [showOrderDrop,  setShowOrderDrop]  = useState(false);
  const [announcement,   setAnnouncement]   = useState(true);
  const [demoOrderNote,  setDemoOrderNote]  = useState("");

  /* ── Derived pair values ── */
  const canonicalPair = resolveCanonicalPair(activePair);
  const baseTicker    = activePair.split("/")[0];
  const quoteCurrency = activePair.split("/")[1] ?? activeQuoteCurrency;
  const displayPair   = activePair;

  /* livePairMeta — metadata for coins fetched from CoinGecko (not in ASSET_DEFS) */
  const livePairMeta = useMemo(() => {
    const out: Record<string, typeof ASSET_DEFS[string]> = {};
    for (const c of liveCryptoList) {
      const key = `${c.symbol}/USDT`;
      out[key] = {
        ticker: c.symbol, name: c.name,
        basePrice: c.price, change: c.change24h,
        high: c.price * 1.02, low: c.price * 0.98, vol: 0,
      };
    }
    return out;
  }, [liveCryptoList]);

  const assetMeta  = ASSET_DEFS[canonicalPair] ?? livePairMeta[canonicalPair] ?? ASSET_DEFS["ASC/USDT"];
  const livePrice  = prices[canonicalPair] ?? assetMeta.basePrice;
  const isPos      = assetMeta.change >= 0;

  /* Wallet balances */
  const avblUSDT   = isDemoTrading ? demoBalances.USDT : unifiedLedger.spot.USDT;
  const avblOKBOND = isDemoTrading ? demoBalances.OKBOND : unifiedLedger.spot.OKBOND;

  /* Per-pair data */
  const pairOrders = filledOrders.filter(o => o.pair === canonicalPair);
  const tickerPos  = positions.find(p => p.ticker === baseTicker);

  const [book, setBook] = useState(() => genBook(livePrice));

  /* Keep live price in a ref so book interval can read it without re-subscribing */
  const livePriceRef = useRef(livePrice);
  useEffect(() => { livePriceRef.current = livePrice; }, [livePrice]);

  /* Order book refresh every 2 s */
  useEffect(() => {
    const t = setInterval(() => setBook(genBook(livePriceRef.current * (0.998 + Math.random() * 0.004))), 2000);
    return () => clearInterval(t);
  }, [canonicalPair]);

  /* Fallback fetch — runs only if Markets page hasn't fetched yet (list is empty) */
  useEffect(() => {
    if (!showPairDrop || liveCryptoList.length > 0 || cryptoFetchedRef.current) return;
    cryptoFetchedRef.current = true;
    setCryptoFetching(true);
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets" +
      "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false" +
      "&price_change_percentage=24h"
    )
      .then(r => r.json())
      .then((data: Array<{
        market_cap_rank: number; id: string;
        symbol: string; name: string; image: string;
        current_price: number; price_change_percentage_24h: number;
        market_cap: number;
      }>) => {
        setLiveCryptoList(data.map(d => ({
          rank:      d.market_cap_rank,
          id:        d.id,
          symbol:    d.symbol.toUpperCase(),
          name:      d.name,
          image:     d.image,
          price:     d.current_price,
          change24h: d.price_change_percentage_24h ?? 0,
          marketCap: d.market_cap,
        })));
      })
      .catch(() => { cryptoFetchedRef.current = false; })
      .finally(() => setCryptoFetching(false));
  }, [showPairDrop, liveCryptoList.length]);

  /* Percentage → USDT amount */
  useEffect(() => {
    if (pct > 0) setTotal((avblUSDT * pct / 100).toFixed(4));
    else if (pct === 0) setTotal("");
  }, [pct, avblUSDT]);

  /* Derived values */
  const totalUSDT  = parseFloat(total) || 0;
  const tokenAmt   = totalUSDT > 0 ? totalUSDT / livePrice : 0;
  const estFee     = totalUSDT > 0 ? (totalUSDT * (avblOKBOND > 5 ? 0.003 : 0.005)).toFixed(4) : "—";
  const maxBuyTkns = (avblUSDT / livePrice).toFixed(4);
  const bidPct     = 63;

  /* Execute trade — always against canonical USDT pair internally */
  const handleTrade = useCallback(() => {
    const amt = tokenAmt > 0 ? tokenAmt : (pct > 0 ? avblUSDT * pct / 100 / livePrice : 0);
    if (amt <= 0) return;
    if (isDemoTrading) {
      const notional = amt * livePrice;
      if (side === "buy") {
        updateDemoBalance("USDT", demoBalances.USDT - notional);
        if (baseTicker === "OKBOND") updateDemoBalance("OKBOND", demoBalances.OKBOND + amt);
      } else {
        updateDemoBalance("USDT", demoBalances.USDT + notional);
        if (baseTicker === "OKBOND") updateDemoBalance("OKBOND", demoBalances.OKBOND - amt);
      }
      setDemoOrderNote(`Demo ${side.toUpperCase()} executed · ${amt.toFixed(4)} ${baseTicker}`);
    } else {
      dispatchTrade(canonicalPair, side === "buy" ? "BUY" : "SELL", amt, "USDT");
      if (side === "buy") debitWallet("spot", "USDT", totalUSDT);
      if (side === "sell" && baseTicker === "OKBOND") creditWallet("spot", "OKBOND", amt);
    }
    setTotal("");
    setPct(0);
  }, [tokenAmt, pct, avblUSDT, livePrice, canonicalPair, side, dispatchTrade, isDemoTrading, demoBalances, updateDemoBalance, baseTicker]);

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: "'Plus Jakarta Sans',sans-serif", paddingBottom: 80 }}>

      {/* ── Full-screen chart overlay ── */}
      <AnimatePresence>
        {showFullChart && (
          <CandlestickChartView
            pair={canonicalPair}
            assetData={{
              name:       assetMeta.name,
              price:      livePrice,
              change:     assetMeta.change,
              high:       assetMeta.high,
              low:        assetMeta.low,
              vol:        assetMeta.vol,
              volUsdt:    livePrice * assetMeta.vol,
              isProperty: !!ASSET_DEFS[canonicalPair],
            }}
            onBack={() => { setShowFullChart(false); setChartFullScreen(false); }}
            onBuy={() => { setSide("buy");  setShowFullChart(false); setChartFullScreen(false); }}
            onSell={() => { setSide("sell"); setShowFullChart(false); setChartFullScreen(false); }}
          />
        )}
      </AnimatePresence>

      {/* ── Trade toast ── */}
      <AnimatePresence>
        {tradeToast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            style={{ position: "fixed", top: 14, left: 14, right: 14, zIndex: 9998,
              background: tradeToast.ok ? GREEN : RED, borderRadius: 10, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            {tradeToast.ok
              ? <CheckCircle size={16} color="#fff" />
              : <AlertCircle size={16} color="#fff" />}
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#fff" }}>{tradeToast.message}</span>
            <button onClick={dismissToast} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <X size={14} color="#fff" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isDemoTrading && demoOrderNote && <div style={{ margin: "8px 14px 0", padding: "9px 12px", borderRadius: 9, background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.28)", color: "#22d3ee", fontSize: 11, fontWeight: 800 }}>{demoOrderNote}</div>}

      {/* ── Top nav tabs ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px 0", borderBottom: `1px solid ${BORD}`, overflowX: "auto", scrollbarWidth: "none" }}>
        {TOP_TABS.map(t => (
          <button key={t} onClick={() => setTopTab(t)}
            style={{ background: "none", border: "none", padding: "0 14px 10px", fontSize: 13, fontWeight: topTab === t ? 800 : 500, color: topTab === t ? FG : DIM, borderBottom: topTab === t ? `2px solid ${GOLD}` : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Announcement banner ── */}
      {announcement && (
        <div style={{ display: "flex", alignItems: "center", background: "rgba(201,168,76,0.08)", borderBottom: `1px solid ${BORD}`, padding: "8px 14px", gap: 8 }}>
          <span style={{ fontSize: 11, color: GOLD }}>🔔</span>
          <span style={{ flex: 1, fontSize: 11, color: DIM, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            Important Notice: OkzByte Exchange — bStocks & Tokenized Real Estate Trading Now Live
          </span>
          <button onClick={() => setAnnouncement(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={13} color={DIM} />
          </button>
        </div>
      )}

      {/* ── Pair header — shows the selected display pair (e.g. DHA9/USDC) ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px 8px", gap: 10 }}>
        <button onClick={() => setShowPairDrop(!showPairDrop)}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: FG }}>{displayPair}</span>
          <ChevronDown size={15} color={DIM} />
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: isPos ? GREEN : RED }}>{isPos ? "+" : ""}{assetMeta.change}%</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button onClick={() => { setShowFullChart(true); setChartFullScreen(true); }}
            style={{ background: "none", border: "none", cursor: "pointer" }}>
            <BarChart2 size={18} color={DIM} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer" }}>
            <MoreHorizontal size={18} color={DIM} />
          </button>
        </div>
      </div>

      {/* ── Pair selector modal — all Properties + all Crypto, searchable ── */}
      <AnimatePresence>
        {showPairDrop && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.7)", display: "flex", flexDirection: "column" }}
            onClick={() => { setShowPairDrop(false); setPairSearch(""); }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              onClick={e => e.stopPropagation()}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: BG, borderRadius: "18px 18px 0 0", border: `1px solid ${BORD}`, maxHeight: "82vh", display: "flex", flexDirection: "column" }}
            >
              {/* Handle bar */}
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: BORD }} />
              </div>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 16px 10px" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: FG }}>Select Pair</span>
                <button onClick={() => { setShowPairDrop(false); setPairSearch(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <X size={18} color={DIM} />
                </button>
              </div>

              {/* Search */}
              <div style={{ padding: "0 16px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", background: CARD, border: `1px solid ${BORD}`, borderRadius: 8, padding: "8px 12px", gap: 8 }}>
                  <span style={{ fontSize: 14, color: DIM }}>🔍</span>
                  <input
                    value={pairSearch}
                    onChange={e => setPairSearch(e.target.value)}
                    placeholder="Search token…"
                    autoFocus
                    style={{ background: "none", border: "none", outline: "none", flex: 1, fontSize: 13, color: FG, fontFamily: "inherit" }}
                  />
                  {pairSearch && (
                    <button onClick={() => setPairSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <X size={12} color={DIM} />
                    </button>
                  )}
                </div>
              </div>

              {/* Pair list — scrollable */}
              <div style={{ overflowY: "auto", flex: 1, paddingBottom: 24 }}>
                {/* ── Properties & Project Tokens ── */}
                {(() => {
                  const q = pairSearch.toLowerCase();
                  const entries = Object.entries(ASSET_DEFS).filter(([, d]) =>
                    !q || d.ticker.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)
                  );
                  if (entries.length === 0) return null;
                  return (
                    <>
                      <div style={{ padding: "6px 16px 4px", fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: "uppercase" }}>
                        Properties & Project Tokens
                      </div>
                      {entries.map(([canonPair, def]) => {
                        const displayedPair = `${def.ticker}/${quoteCurrency}`;
                        const isActive = canonPair === canonicalPair;
                        return (
                          <button key={canonPair}
                            onClick={() => { setActivePair(displayedPair); setShowPairDrop(false); setPairSearch(""); }}
                            style={{ width: "100%", padding: "11px 16px", background: isActive ? ACT : "none", border: "none", borderBottom: `1px solid ${BORD}`, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit" }}>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? GOLD : FG }}>{displayedPair}</span>
                              <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>{def.name}</div>
                            </div>
                            <span style={{ fontSize: 12, color: def.change >= 0 ? GREEN : RED }}>{def.change >= 0 ? "+" : ""}{def.change}%</span>
                          </button>
                        );
                      })}
                    </>
                  );
                })()}

                {/* ── Crypto — live CoinGecko top 100 ── */}
                {(() => {
                  const q = pairSearch.toLowerCase();
                  /* While loading show spinner */
                  if (cryptoFetching && liveCryptoList.length === 0) {
                    return (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, color: DIM, fontSize: 12 }}>
                        <span style={{ display: "inline-block", width: 14, height: 14, border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        Loading coins…
                      </div>
                    );
                  }
                  /* Use live list if available, nothing to show otherwise */
                  const coins = liveCryptoList.filter(c => {
                    /* Skip project tokens that are already in Properties section */
                    const alreadyInProps = Object.values(ASSET_DEFS).some(d => d.ticker === c.symbol);
                    if (alreadyInProps) return false;
                    if (!q) return true;
                    return c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
                  });
                  if (coins.length === 0) return null;
                  return (
                    <>
                      <div style={{ padding: "10px 16px 4px", fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: "uppercase" }}>
                        Crypto ({coins.length})
                      </div>
                      {coins.map(c => {
                        const displayedPair = `${c.symbol}/${quoteCurrency}`;
                        const canonPair     = `${c.symbol}/USDT`;
                        const isActive      = canonPair === canonicalPair;
                        const isPos         = c.change24h >= 0;
                        const mcap = c.marketCap >= 1e12 ? `$${(c.marketCap/1e12).toFixed(2)}T`
                                   : c.marketCap >= 1e9  ? `$${(c.marketCap/1e9).toFixed(2)}B`
                                   : c.marketCap >= 1e6  ? `$${(c.marketCap/1e6).toFixed(2)}M`
                                   : c.marketCap > 0     ? `$${(c.marketCap/1e3).toFixed(0)}K`
                                   : "—";
                        const priceStr = c.price >= 1000 ? `$${c.price.toLocaleString("en-US",{maximumFractionDigits:2})}`
                                       : c.price >= 1    ? `$${c.price.toFixed(4)}`
                                       : `$${c.price.toFixed(6)}`;
                        return (
                          <button key={c.symbol}
                            onClick={() => { setActivePair(displayedPair); setShowPairDrop(false); setPairSearch(""); }}
                            style={{ width: "100%", padding: "10px 16px", background: isActive ? ACT : "none", border: "none", borderBottom: `1px solid ${BORD}`, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit" }}>
                            {/* Coin avatar */}
                            <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: `linear-gradient(135deg,${GOLD}cc,#8B6914)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <img src={c.image} alt={c.symbol}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                              />
                            </div>
                            {/* Name + market cap */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? GOLD : FG }}>{displayedPair}</div>
                              <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>{c.name}</div>
                              <div style={{ fontSize: 10, color: "rgba(132,142,156,0.5)", marginTop: 1 }}>{mcap}</div>
                            </div>
                            {/* Price + 24h% */}
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: isPos ? GREEN : RED }}>{priceStr}</div>
                              <div style={{ fontSize: 11, marginTop: 2, background: isPos ? GREEN : RED, borderRadius: 4, padding: "2px 6px", color: "#fff", fontWeight: 700 }}>
                                {isPos ? "+" : ""}{c.change24h.toFixed(2)}%
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  );
                })()}

                {/* No results */}
                {pairSearch && (() => {
                  const q = pairSearch.toLowerCase();
                  const inProps  = Object.values(ASSET_DEFS).some(d => d.ticker.toLowerCase().includes(q) || d.name.toLowerCase().includes(q));
                  const inCrypto = liveCryptoList.some(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
                  return !inProps && !inCrypto;
                })() && (
                  <div style={{ textAlign: "center", padding: 32, color: DIM, fontSize: 13 }}>No pairs found</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main trading layout ── */}
      <div style={{ display: "flex", padding: "0 8px", gap: 8, marginTop: 4 }}>

        {/* LEFT: Order form */}
        <div style={{ flex: "0 0 55%", display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Buy/Sell tabs */}
          <div style={{ display: "flex", background: CARD, borderRadius: 10, overflow: "hidden", border: `1px solid ${BORD}` }}>
            <button onClick={() => setSide("buy")}
              style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit",
                background: side === "buy" ? GREEN : "transparent", color: side === "buy" ? "#0a0a0a" : DIM, transition: "all 0.2s" }}>
              Buy
            </button>
            <button onClick={() => setSide("sell")}
              style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer", fontFamily: "inherit",
                background: side === "sell" ? RED : "transparent", color: side === "sell" ? "#fff" : DIM, transition: "all 0.2s" }}>
              Sell
            </button>
          </div>

          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Order type */}
            <button onClick={() => setShowOrderDrop(!showOrderDrop)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: CARD, border: `1px solid ${BORD}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: 12, color: DIM, marginRight: 6 }}>ⓘ</span>
              <span style={{ flex: 1, fontSize: 13, color: FG, textAlign: "left" }}>{orderType}</span>
              <ChevronDown size={14} color={DIM} />
            </button>
            <AnimatePresence>
              {showOrderDrop && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 8, overflow: "hidden" }}>
                  {ORDER_TYPES.map(t => (
                    <button key={t} onClick={() => { setOrderType(t); setShowOrderDrop(false); }}
                      style={{ width: "100%", padding: "10px 12px", background: t === orderType ? ACT : "none", border: "none", borderBottom: `1px solid ${BORD}`, textAlign: "left", fontSize: 13, color: t === orderType ? GOLD : FG, cursor: "pointer", fontFamily: "inherit" }}>
                      {t}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Total input — labelled with quote currency */}
            <div style={{ display: "flex", alignItems: "center", background: CARD, border: `1px solid ${BORD}`, borderRadius: 8, padding: "10px 12px", gap: 8 }}>
              <span style={{ fontSize: 12, color: DIM, flex: 1 }}>Total</span>
              <input value={total} onChange={e => { setTotal(e.target.value); setPct(0); }}
                placeholder="—"
                style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: FG, width: 80, textAlign: "right", fontFamily: "inherit" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{quoteCurrency}</span>
            </div>

            {/* % slider */}
            <div style={{ padding: "0 2px" }}>
              <input type="range" min={0} max={100} step={25} value={pct} onChange={e => setPct(+e.target.value)}
                style={{ width: "100%", accentColor: side === "buy" ? GREEN : RED, cursor: "pointer" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                {[0, 25, 50, 75, 100].map(v => (
                  <button key={v} onClick={() => setPct(v)}
                    style={{ fontSize: 10, color: pct >= v ? (side === "buy" ? GREEN : RED) : DIM, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "2px 0" }}>
                    {v === 0 ? "◇" : v + "%"}
                  </button>
                ))}
              </div>
            </div>

            {/* Slippage toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={slippage} onChange={e => setSlippage(e.target.checked)}
                style={{ accentColor: GOLD, width: 13, height: 13 }} />
              <span style={{ fontSize: 11, color: DIM }}>Slippage Tolerance</span>
            </label>

            {/* Live balance info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "6px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: DIM }}>Avbl ▼</span>
                <span style={{ color: FG }}>{avblUSDT.toFixed(4)} USDT <span style={{ color: GOLD }}>⊕</span></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: DIM }}>Max {side === "buy" ? "Buy" : "Sell"}</span>
                <span style={{ color: FG }}>
                  {side === "buy" ? maxBuyTkns : (tickerPos?.netTokens?.toFixed(4) ?? "0.0000")} {baseTicker}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: DIM }}>Est. Fee</span>
                <span style={{ color: FG }}>{estFee !== "—" ? `${estFee} USDT` : "— USDT"}</span>
              </div>
              {tokenAmt > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 2 }}>
                  <span style={{ color: DIM }}>You receive</span>
                  <span style={{ color: GREEN, fontWeight: 700 }}>{tokenAmt.toFixed(4)} {baseTicker}</span>
                </div>
              )}
            </div>

            {/* Action button */}
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={handleTrade}
              disabled={totalUSDT <= 0 && pct === 0}
              style={{ width: "100%", padding: "13px 0", borderRadius: 8, border: "none",
                cursor: totalUSDT > 0 || pct > 0 ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 800,
                background: side === "buy" ? GREEN : RED, color: "#fff", fontFamily: "inherit",
                opacity: totalUSDT > 0 || pct > 0 ? 1 : 0.6 }}>
              {isDemoTrading ? `Demo ${side === "buy" ? "Buy" : "Sell"} ${baseTicker}` : (side === "buy" ? `Buy ${baseTicker}` : `Sell ${baseTicker}`)}
            </motion.button>
          </div>
        </div>

        {/* RIGHT: Order book — quote currency label reflects selected currency */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: DIM }}>Price<br />({quoteCurrency})</span>
            {isDemoTrading && <span style={{ marginLeft: "auto", marginRight: 8, color: "#22d3ee", background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.3)", borderRadius: 5, padding: "3px 6px", fontSize: 9, fontWeight: 900 }}>DEMO ORDER</span>}
            <span style={{ fontSize: 9, color: DIM, textAlign: "right" }}>Amount<br />({baseTicker})</span>
          </div>

          {book.asks.map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2.5px 0", position: "relative" }}>
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, background: `${RED}18`, width: `${30 + i * 12}%` }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: RED, position: "relative", zIndex: 1 }}>{row.price.toFixed(5)}</span>
              <span style={{ fontSize: 11, color: DIM, position: "relative", zIndex: 1 }}>{row.amt}</span>
            </div>
          ))}

          {/* Spread (live price) */}
          <div style={{ padding: "5px 0", textAlign: "center", borderTop: `1px solid ${BORD}`, borderBottom: `1px solid ${BORD}`, margin: "2px 0" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{livePrice.toFixed(5)}</div>
            <div style={{ fontSize: 9, color: DIM }}>≈Rs{(livePrice * 277.5).toFixed(2)}</div>
          </div>

          {book.bids.map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2.5px 0", position: "relative" }}>
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, background: `${GREEN}18`, width: `${65 - i * 10}%` }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: GREEN, position: "relative", zIndex: 1 }}>{row.price.toFixed(5)}</span>
              <span style={{ fontSize: 11, color: DIM, position: "relative", zIndex: 1 }}>{row.amt}</span>
            </div>
          ))}

          <div style={{ marginTop: 6 }}>
            <div style={{ height: 4, borderRadius: 2, overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${bidPct}%`, background: GREEN }} />
              <div style={{ flex: 1, background: RED }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
              <span style={{ fontSize: 9, color: GREEN }}>{bidPct}%</span>
              <span style={{ fontSize: 9, color: RED }}>{100 - bidPct}%</span>
            </div>
          </div>

          <button style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between", background: ACT, border: `1px solid ${BORD}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", width: "100%", fontFamily: "inherit" }}>
            <span style={{ fontSize: 10, color: DIM }}>0.00001</span>
            <ChevronDown size={10} color={DIM} />
          </button>
        </div>
      </div>

      {/* ── Bottom tabs: Open Orders / Holdings / Bots ── */}
      <div style={{ marginTop: 14, borderTop: `1px solid ${BORD}` }}>
        <div style={{ display: "flex", alignItems: "center", padding: "0 14px", borderBottom: `1px solid ${BORD}` }}>
          {BOTTOM_TABS.map(t => (
            <button key={t} onClick={() => setBottomTab(t)}
              style={{ background: "none", border: "none", padding: "10px 14px 10px 0", fontSize: 12, fontWeight: bottomTab === t ? 700 : 500, color: bottomTab === t ? FG : DIM, borderBottom: bottomTab === t ? `2px solid ${GOLD}` : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit" }}>
              {t}
              {t === "Open Orders" && ` (${pairOrders.length})`}
              {t === "Holdings"    && ` (${tickerPos && tickerPos.netTokens > 0 ? 1 : 0})`}
            </button>
          ))}
          <button style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer" }}>
            <Copy size={14} color={DIM} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Open Orders */}
          {bottomTab === "Open Orders" && (
            <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {pairOrders.length === 0 ? (
                <div style={{ padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 36, marginBottom: 4 }}>📋</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: FG }}>No orders yet</div>
                  <div style={{ fontSize: 12, color: DIM, marginBottom: 12 }}>Place a buy or sell to see your history</div>
                  <button style={{ background: "none", border: `1px solid ${BORD}`, borderRadius: 8, padding: "10px 28px", fontSize: 13, color: FG, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                    Copy Trading
                  </button>
                </div>
              ) : (
                <div style={{ padding: "8px 14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "6px 0", borderBottom: `1px solid ${BORD}` }}>
                    {["Side", "Amount", "Price", "Total"].map(h => (
                      <span key={h} style={{ fontSize: 10, color: DIM, textAlign: h === "Total" ? "right" : "left" }}>{h}</span>
                    ))}
                  </div>
                  {pairOrders.slice(0, 8).map(order => (
                    <div key={order.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "8px 0", borderBottom: `1px solid ${BORD}22` }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: order.side === "BUY" ? GREEN : RED }}>{order.side}</span>
                      <span style={{ fontSize: 11, color: FG }}>{order.tokenAmount.toFixed(4)}</span>
                      <span style={{ fontSize: 11, color: FG }}>{order.price.toFixed(5)}</span>
                      <span style={{ fontSize: 11, color: DIM, textAlign: "right" }}>{order.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Holdings */}
          {bottomTab === "Holdings" && (
            <motion.div key="holdings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "16px" }}>
              {tickerPos && tickerPos.netTokens > 0 ? (
                <div style={{ background: CARD, borderRadius: 10, padding: "12px 14px", border: `1px solid ${BORD}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: FG }}>{baseTicker}</div>
                      <div style={{ fontSize: 11, color: DIM }}>Available: {tickerPos.netTokens.toFixed(4)}</div>
                      <div style={{ fontSize: 10, color: DIM }}>Avg Buy: {tickerPos.avgBuyPrice.toFixed(5)} USDT</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: GOLD, fontWeight: 700 }}>
                        ${(tickerPos.netTokens * livePrice).toFixed(2)}
                      </div>
                      {(() => {
                        const pnl = (livePrice - tickerPos.avgBuyPrice) * tickerPos.netTokens;
                        const pct = tickerPos.avgBuyPrice > 0 ? ((livePrice - tickerPos.avgBuyPrice) / tickerPos.avgBuyPrice) * 100 : 0;
                        return (
                          <div style={{ fontSize: 11, color: pnl >= 0 ? GREEN : RED, fontWeight: 600 }}>
                            {pnl >= 0 ? "+" : ""}{pnl.toFixed(4)} ({pct >= 0 ? "+" : ""}{pct.toFixed(2)}%)
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: CARD, borderRadius: 10, padding: "12px 14px", border: `1px solid ${BORD}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: FG }}>{baseTicker}</div>
                    <div style={{ fontSize: 11, color: DIM }}>Available: 0.0000</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: DIM, fontWeight: 700 }}>$0.00</div>
                    <div style={{ fontSize: 11, color: DIM }}>No position yet</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Bots */}
          {bottomTab === "Bots" && (
            <motion.div key="bots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "32px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🤖</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: FG }}>Automated Trading</div>
              <div style={{ fontSize: 12, color: DIM, marginBottom: 16 }}>Set up bots for automated execution</div>
              <button style={{ background: `linear-gradient(135deg,${GOLD},#8B6914)`, border: "none", borderRadius: 8, padding: "10px 28px", fontSize: 13, color: "#0a0a0a", cursor: "pointer", fontFamily: "inherit", fontWeight: 800 }}>
                Create Bot
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Collapsible inline chart ── */}
      <div style={{ borderTop: `1px solid ${BORD}`, marginTop: 8 }}>
        <button onClick={() => setShowChart(!showChart)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: FG }}>{displayPair} Chart</span>
          {showChart ? <ChevronUp size={15} color={DIM} /> : <ChevronDown size={15} color={DIM} />}
        </button>
        <AnimatePresence>
          {showChart && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <CandleChart pair={canonicalPair} livePrice={livePrice} assetMeta={assetMeta} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
