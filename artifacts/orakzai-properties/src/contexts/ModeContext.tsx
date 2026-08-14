import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Mode = "exchange" | "market";

export interface CryptoItem {
  rank: number;
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  marketCap: number;
}

export interface DemoBalances {
  USDT: number;
  OKBOND: number;
}

interface ModeContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
  activePair: string;
  setActivePair: (pair: string) => void;
  activeQuoteCurrency: string;
  setActiveQuoteCurrency: (currency: string) => void;
  chartFullScreen: boolean;
  setChartFullScreen: (v: boolean) => void;
  liveCryptoList: CryptoItem[];
  setLiveCryptoList: (list: CryptoItem[]) => void;
  cryptoFetching: boolean;
  setCryptoFetching: (v: boolean) => void;
  isDemoTrading: boolean;
  setIsDemoTrading: (active: boolean) => void;
  demoBalances: DemoBalances;
  resetDemoFunds: () => void;
  refillDemoWallet: () => void;
  updateDemoBalance: (asset: keyof DemoBalances, amount: number) => void;
}

const DEMO_START: DemoBalances = { USDT: 100000, OKBOND: 50000 };
const STORAGE_KEY = "okzbyte-demo-trading";
const BALANCE_KEY = "okzbyte-demo-balances";

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("exchange");
  const [activePair, setActivePair] = useState("ASC/USDT");
  const [activeQuoteCurrency, setActiveQuoteCurrency] = useState("USDT");
  const [chartFullScreen, setChartFullScreen] = useState(false);
  const [liveCryptoList, setLiveCryptoList] = useState<CryptoItem[]>([]);
  const [cryptoFetching, setCryptoFetching] = useState(false);
  const [isDemoTrading, setIsDemoTradingState] = useState(false);
  const [demoBalances, setDemoBalances] = useState<DemoBalances>(DEMO_START);

  useEffect(() => {
    try {
      setIsDemoTradingState(window.localStorage.getItem(STORAGE_KEY) === "true");
      const saved = window.localStorage.getItem(BALANCE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.USDT === "number" && typeof parsed.OKBOND === "number") setDemoBalances(parsed);
      }
    } catch { /* localStorage can be unavailable in private contexts */ }
  }, []);

  const setIsDemoTrading = (active: boolean) => {
    setIsDemoTradingState(active);
    try { window.localStorage.setItem(STORAGE_KEY, String(active)); } catch { /* noop */ }
  };

  const persistBalances = (next: DemoBalances) => {
    setDemoBalances(next);
    try { window.localStorage.setItem(BALANCE_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const resetDemoFunds = () => persistBalances({ ...DEMO_START });
  const refillDemoWallet = () => persistBalances({ USDT: 100000, OKBOND: 50000 });
  const updateDemoBalance = (asset: keyof DemoBalances, amount: number) => {
    persistBalances({ ...demoBalances, [asset]: Math.max(0, amount) });
  };

  const value = useMemo(() => ({
    mode, setMode, activePair, setActivePair, activeQuoteCurrency, setActiveQuoteCurrency,
    chartFullScreen, setChartFullScreen, liveCryptoList, setLiveCryptoList, cryptoFetching,
    setCryptoFetching, isDemoTrading, setIsDemoTrading, demoBalances, resetDemoFunds,
    refillDemoWallet, updateDemoBalance,
  }), [mode, activePair, activeQuoteCurrency, chartFullScreen, liveCryptoList, cryptoFetching, isDemoTrading, demoBalances]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used inside ModeProvider");
  return ctx;
}

export const DEMO_FUNDS = DEMO_START;
