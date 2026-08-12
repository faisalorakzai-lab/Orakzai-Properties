/**
 * AppStoreContext — unified reactive store
 *
 * Wraps walletEngine (localStorage) + priceEngine (in-memory) and exposes
 * them as a React context so every consumer re-renders on state changes.
 *
 * All trade execution goes through dispatchTrade(); direct calls to
 * walletEngine.executeTrade() elsewhere bypass the reactive layer.
 */
import {
  createContext, useContext, useState, useEffect, useCallback, useRef,
  type ReactNode,
} from "react";
import {
  getWallet, executeTrade,
  type WalletState, type Currency,
} from "@/lib/walletEngine";
import {
  initEngine, tickPrice, applyTrade, getPrice,
} from "@/lib/priceEngine";

/* ═══════════════════════════════════════════════════════════════
   Canonical pair metadata — single source of truth for all pages
═══════════════════════════════════════════════════════════════ */
export const ASSET_DEFS: Record<string, {
  ticker: string;
  name: string;
  basePrice: number;
  change: number;
  high: number;
  low: number;
  vol: number;
  /** Relative path inside /public (no leading slash) — present when a real logo is available */
  logo?: string;
}> = {
  "ASC/USDT":  { ticker:"ASC",   name:"Azan Smart City",       basePrice:0.00000313, change:-0.36, high:0.00000320, low:0.00000298, vol:3480, logo:"tokens/token-asc.jpg" },
  "CSC/USDT":  { ticker:"CSC",   name:"Capital Smart City",    basePrice:0.00001850, change:+1.24, high:0.00001910, low:0.00001800, vol:1920, logo:"tokens/token-csc.jpg" },
  "DHA9/USDT": { ticker:"DHA9",  name:"DHA Phase 9 Plot",      basePrice:0.00008420, change:+2.78, high:0.00008700, low:0.00008100, vol:8400 },
  "GBR/USDT":  { ticker:"GBR",   name:"Gulberg Residencia",    basePrice:0.00003210, change:-0.54, high:0.00003300, low:0.00003100, vol:1800, logo:"tokens/token-gbr.png" },
  "OKBOND/USDT":  { ticker:"OKBOND", name:"Orakzai Bond",        basePrice:0.00028800, change:+0.94, high:0.00029500, low:0.00028000, vol:2700, logo:"tokens/token-obk.png" },
  "BTI/USDT":  { ticker:"BTI",   name:"Bahria Town Islamabad", basePrice:0.00006540, change:+1.62, high:0.00006800, low:0.00006200, vol:4100 },
};

/* Seed marketplace listings on first load */
export const SEED_LISTINGS = [
  { id:"L1", pair:"ASC/USDT",  title:"Azan Smart City — 5 Marla Plot",      price:"PKR 25L",  roi:"12.4% APR" },
  { id:"L2", pair:"CSC/USDT",  title:"Capital Smart City — 10 Marla Res.",  price:"PKR 48L",  roi:"9.8% APR"  },
  { id:"L3", pair:"DHA9/USDT", title:"DHA Ph-9 — Commercial 4 Marla",       price:"PKR 120L", roi:"15.2% APR" },
  { id:"L4", pair:"GBR/USDT",  title:"Gulberg Residencia — Farmhouse 2K",   price:"PKR 72L",  roi:"8.5% APR"  },
  { id:"L5", pair:"OKBOND/USDT",  title:"Orakzai Bond — Sovereign Tier",     price:"PKR 8.8L", roi:"11.0% APR" },
  { id:"L6", pair:"BTI/USDT",  title:"Bahria Town ISB — Boulevard Facing",  price:"PKR 95L",  roi:"13.7% APR" },
  { id:"L7", pair:"ASC/USDT",  title:"ASC Phase-1 — Corner Plot",           price:"PKR 18L",  roi:"10.9% APR" },
  { id:"L8", pair:"CSC/USDT",  title:"CSC Executive Block — 7 Marla",       price:"PKR 35L",  roi:"9.1% APR"  },
];

/* ═══════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════ */
export interface Position {
  ticker: string;
  pair: string;
  netTokens: number;
  avgBuyPrice: number;
  totalInvested: number;
}

export interface FilledOrder {
  id: string;
  pair: string;
  ticker: string;
  side: "BUY" | "SELL";
  tokenAmount: number;
  price: number;
  total: number;
  time: string;
}

export interface TradeToast {
  ok: boolean;
  message: string;
}

interface AppStoreValue {
  /** Live prices keyed by pair, e.g. prices["ASC/USDT"] */
  prices: Record<string, number>;
  /** Current wallet state (balances, address) */
  wallet: WalletState | null;
  /** Positions aggregated from all fills */
  positions: Position[];
  /** All filled orders, most recent first */
  filledOrders: FilledOrder[];
  /** Marketplace listings */
  listings: typeof SEED_LISTINGS;
  /** Execute a trade — updates wallet + positions + prices atomically */
  dispatchTrade: (pair: string, side: "BUY" | "SELL", tokenAmount: number, quote: Currency) => void;
  /** Add a new listing */
  addListing: (l: typeof SEED_LISTINGS[0]) => void;
  /** Trade toast notification (auto-clears after 3 s) */
  tradeToast: TradeToast | null;
  dismissToast: () => void;
}

/* ═══════════════════════════════════════════════════════════════
   Context
═══════════════════════════════════════════════════════════════ */
const AppStoreContext = createContext<AppStoreValue | null>(null);

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside <AppStoreProvider>");
  return ctx;
}

/* ═══════════════════════════════════════════════════════════════
   Provider
═══════════════════════════════════════════════════════════════ */
export function AppStoreProvider({ children }: { children: ReactNode }) {
  /* Initialise price engine for every pair */
  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const [pair, def] of Object.entries(ASSET_DEFS)) {
      const ticker = def.ticker;
      init[pair] = initEngine(ticker, def.basePrice);
    }
    return init;
  });

  const [wallet,       setWallet]       = useState<WalletState | null>(() => getWallet());
  const [positions,    setPositions]    = useState<Position[]>([]);
  const [filledOrders, setFilledOrders] = useState<FilledOrder[]>([]);
  const [listings,     setListings]     = useState(SEED_LISTINGS);
  const [tradeToast,   setTradeToast]   = useState<TradeToast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Price tick — every 2.5 s */
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const next: Record<string, number> = {};
        for (const [pair, def] of Object.entries(ASSET_DEFS)) {
          next[pair] = tickPrice(def.ticker);
        }
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  /* Show a toast and auto-dismiss after 3 s */
  const showToast = useCallback((toast: TradeToast) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setTradeToast(toast);
    toastTimer.current = setTimeout(() => setTradeToast(null), 3000);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setTradeToast(null);
  }, []);

  /* dispatchTrade — the only way to execute trades in the app */
  const dispatchTrade = useCallback((
    pair: string,
    side: "BUY" | "SELL",
    tokenAmount: number,
    quote: Currency,
  ) => {
    const def = ASSET_DEFS[pair];
    if (!def) { showToast({ ok: false, message: `Unknown pair: ${pair}` }); return; }

    const price = getPrice(def.ticker) || def.basePrice;
    const result = executeTrade(def.ticker, side, tokenAmount, quote, price);

    if (!result.ok) {
      showToast({ ok: false, message: result.error ?? "Trade failed" });
      return;
    }

    /* Update wallet */
    if (result.wallet) setWallet({ ...result.wallet });

    /* Update price engine */
    const totalUsdt = tokenAmount * price;
    const newPrice = applyTrade(def.ticker, side, totalUsdt);
    setPrices(prev => ({ ...prev, [pair]: newPrice }));

    /* Record filled order */
    const order: FilledOrder = {
      id:          result.tx!.id,
      pair,
      ticker:      def.ticker,
      side,
      tokenAmount,
      price,
      total:       result.tx!.total,
      time:        result.tx!.time,
    };
    setFilledOrders(prev => [order, ...prev]);

    /* Update positions */
    setPositions(prev => {
      const existing = prev.find(p => p.ticker === def.ticker);
      if (side === "BUY") {
        if (existing) {
          const newTokens = existing.netTokens + tokenAmount;
          const newInvested = existing.totalInvested + totalUsdt;
          return prev.map(p => p.ticker === def.ticker
            ? { ...p, netTokens: newTokens, avgBuyPrice: newInvested / newTokens, totalInvested: newInvested }
            : p
          );
        }
        return [...prev, { ticker: def.ticker, pair, netTokens: tokenAmount, avgBuyPrice: price, totalInvested: totalUsdt }];
      } else {
        // SELL
        if (!existing) return prev;
        const newTokens = Math.max(0, existing.netTokens - tokenAmount);
        if (newTokens === 0) return prev.filter(p => p.ticker !== def.ticker);
        return prev.map(p => p.ticker === def.ticker ? { ...p, netTokens: newTokens } : p);
      }
    });

    const usdtAmt = (tokenAmount * price).toFixed(2);
    showToast({
      ok: true,
      message: `${side} ${tokenAmount.toFixed(4)} ${def.ticker} @ ${price.toFixed(5)} — $${usdtAmt} USDT`,
    });
  }, [showToast]);

  const addListing = useCallback((l: typeof SEED_LISTINGS[0]) => {
    setListings(prev => [l, ...prev]);
  }, []);

  return (
    <AppStoreContext.Provider value={{
      prices, wallet, positions, filledOrders, listings,
      dispatchTrade, addListing,
      tradeToast, dismissToast,
    }}>
      {children}
    </AppStoreContext.Provider>
  );
}
