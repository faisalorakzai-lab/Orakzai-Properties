/**
 * binanceEngine.ts
 * Dual-engine data provider for the trading chart:
 *   - External crypto: Binance REST + WebSocket
 *   - Internal tokens: AMM candlestick generator
 */

export type Candle = {
  time: number;  // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
};

/* ── Internal property token identifiers ── */
export const INTERNAL_TOKENS = new Set([
  "ASC", "CSC", "DHA9", "GBR", "OKBOND", "BTI",
]);

/* ── Binance symbol map: our ticker → Binance symbol ── */
const BINANCE_SYMBOL_MAP: Record<string, string> = {
  BTC: "BTCUSDT", ETH: "ETHUSDT", SOL: "SOLUSDT", BNB: "BNBUSDT",
  USDT: "USDCUSDT", USDC: "USDCUSDT", XRP: "XRPUSDT", TRX: "TRXUSDT",
  DOGE: "DOGEUSDT", ADA: "ADAUSDT", MATIC: "MATICUSDT", DOT: "DOTUSDT",
  LTC: "LTCUSDT", LINK: "LINKUSDT", AVAX: "AVAXUSDT", UNI: "UNIUSDT",
  ATOM: "ATOMUSDT", XLM: "XLMUSDT", HYPE: "HYPEUSDT", LEO: "LEOUSDT",
  DAI: "DAIUSDT", BCH: "BCHUSDT", SHIB: "SHIBUSDT", NEAR: "NEARUSDT",
  ZEC: "ZECUSDT",
};

/* ── Timeframe to Binance API interval ── */
const BINANCE_INTERVALS: Record<string, string> = {
  "1m": "1m", "3m": "3m", "5m": "5m", "15m": "15m",
  "1h": "1h", "4h": "4h", "1D": "1d",
};

/* ── Timeframe to seconds ── */
export const TIMEFRAME_SECONDS: Record<string, number> = {
  "1m": 60, "3m": 180, "5m": 300, "15m": 900,
  "1h": 3600, "4h": 14400, "1D": 86400,
};

/* ───────────────────────────────────────────────
   EXTERNAL CRYPTO ENGINE (Binance)
─────────────────────────────────────────────── */

/**
 * Fetch historical OHLC candles from Binance REST API.
 */
export async function fetchBinanceCandles(
  ticker: string,
  timeframe: string,
  limit = 200,
): Promise<Candle[]> {
  const symbol = BINANCE_SYMBOL_MAP[ticker.toUpperCase()];
  if (!symbol) return [];

  const interval = BINANCE_INTERVALS[timeframe] ?? "15m";
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const raw: any[][] = await res.json();
    return raw.map((k) => ({
      time:  Math.floor(k[0] / 1000),
      open:  parseFloat(k[1]),
      high:  parseFloat(k[2]),
      low:   parseFloat(k[3]),
      close: parseFloat(k[4]),
    }));
  } catch {
    return [];
  }
}

/**
 * Open a Binance WebSocket kline stream.
 * Returns a cleanup function.
 */
export function subscribeBinanceKline(
  ticker: string,
  timeframe: string,
  onCandle: (candle: Candle) => void,
): () => void {
  const symbol = BINANCE_SYMBOL_MAP[ticker.toUpperCase()];
  if (!symbol) return () => {};

  const interval = BINANCE_INTERVALS[timeframe] ?? "15m";
  const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`;

  let ws: WebSocket | null = null;
  let dead = false;

  const connect = () => {
    if (dead) return;
    ws = new WebSocket(wsUrl);

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        const k = msg.k;
        if (!k) return;
        onCandle({
          time:  Math.floor(k.t / 1000),
          open:  parseFloat(k.o),
          high:  parseFloat(k.h),
          low:   parseFloat(k.l),
          close: parseFloat(k.c),
        });
      } catch {}
    };

    ws.onerror = () => {};
    ws.onclose = () => {
      if (!dead) setTimeout(connect, 3000); // auto-reconnect
    };
  };

  connect();

  return () => {
    dead = true;
    ws?.close();
  };
}

/* ───────────────────────────────────────────────
   INTERNAL AMM ENGINE (Property tokens)
─────────────────────────────────────────────── */

/**
 * Deterministic seeded random (ensures chart is stable on re-render).
 * Uses mulberry32.
 */
function seededRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0xFFFFFFFF;
  };
}

/**
 * Generate internal AMM candles for a property token.
 * Uses AMM formula: price *= (1 + netVolume / 100 * 0.01)
 * Each candle's net volume is seeded deterministically so the chart
 * stays stable across re-renders. The final candle reflects the live price.
 */
export function generateAMMCandles(
  ticker: string,
  basePrice: number,
  livePrice: number,
  timeframe: string,
  n = 150,
): Candle[] {
  const intervalSec = TIMEFRAME_SECONDS[timeframe] ?? 900;
  const now = Math.floor(Date.now() / intervalSec) * intervalSec; // floor to candle boundary
  const out: Candle[] = [];

  // Seed: ticker + timeframe → stable candles
  const seedVal = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0) +
                  timeframe.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = seededRng(seedVal);

  let p = basePrice * 0.88;

  for (let i = n; i >= 1; i--) {
    const o = p;
    // AMM-style price impact: random net USD volume per candle
    const netUsd = (rng() - 0.48) * 800;  // random net buy/sell volume
    const pctImpact = (netUsd / 100) * 0.01;  // $100 → 1%
    const c = Math.max(o * 0.01, o * (1 + pctImpact));
    const wRange = Math.abs(c - o) + rng() * o * 0.004;

    const high  = Math.max(o, c) + rng() * wRange * 0.5;
    const low   = Math.min(o, c) - rng() * wRange * 0.5;
    const tSec  = now - i * intervalSec;

    out.push({
      time:  tSec,
      open:  +o.toPrecision(6),
      high:  +high.toPrecision(6),
      low:   +Math.max(low, o * 0.001).toPrecision(6),
      close: +c.toPrecision(6),
    });
    p = c;
  }

  // Final candle = current (live) candle — reflects real live price
  const lastClose = out.length > 0 ? out[out.length - 1].close : basePrice;
  const liveHigh  = Math.max(lastClose, livePrice) * (1 + 0.002);
  const liveLow   = Math.min(lastClose, livePrice) * (1 - 0.002);

  out.push({
    time:  now,
    open:  +lastClose.toPrecision(6),
    high:  +liveHigh.toPrecision(6),
    low:   +Math.max(liveLow, livePrice * 0.001).toPrecision(6),
    close: +livePrice.toPrecision(6),
  });

  return out;
}

/**
 * Apply AMM trade impact and return the new price.
 * Formula: New Price = Current Price * (1 + (netUsd / 100) * 0.01)
 */
export function applyAMMTrade(
  currentPrice: number,
  side: "BUY" | "SELL",
  totalUsdt: number,
): number {
  const netAmount = side === "BUY" ? totalUsdt : -totalUsdt;
  const pctChange = (netAmount / 100) * 0.01;  // $100 → ±1%
  return Math.max(0.000001, currentPrice * (1 + pctChange));
}

/**
 * Simple Moving Average for MA overlay lines.
 */
export function calcMA(
  candles: Candle[],
  period: number,
): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const sum = candles.slice(i - period + 1, i + 1).reduce((s, c) => s + c.close, 0);
    out.push({ time: candles[i].time, value: +(sum / period).toPrecision(6) });
  }
  return out;
}
