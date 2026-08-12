import { createContext, useContext, useState } from "react";

type Mode = "exchange" | "market";

/** Shared crypto coin shape — same data used by Markets Crypto tab and Trade pair selector */
export interface CryptoItem {
  rank:      number;
  id:        string;
  symbol:    string;
  name:      string;
  image:     string;
  price:     number;
  change24h: number;
  marketCap: number;
}

interface ModeContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
  activePair: string;
  setActivePair: (pair: string) => void;
  /** Global quote currency selection — shared across all market tabs */
  activeQuoteCurrency: string;
  setActiveQuoteCurrency: (currency: string) => void;
  /** When true the bottom nav unmounts so the full-screen chart can fill the viewport */
  chartFullScreen: boolean;
  setChartFullScreen: (v: boolean) => void;
  /** Live CoinGecko top-100 list — fetched once, shared between Markets and Trade */
  liveCryptoList:    CryptoItem[];
  setLiveCryptoList: (list: CryptoItem[]) => void;
  cryptoFetching:    boolean;
  setCryptoFetching: (v: boolean) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode,               setMode]               = useState<Mode>("exchange");
  const [activePair,         setActivePair]         = useState("ASC/USDT");
  const [activeQuoteCurrency,setActiveQuoteCurrency]= useState("USDT");
  const [chartFullScreen,    setChartFullScreen]    = useState(false);
  const [liveCryptoList,     setLiveCryptoList]     = useState<CryptoItem[]>([]);
  const [cryptoFetching,     setCryptoFetching]     = useState(false);

  return (
    <ModeContext.Provider value={{
      mode, setMode,
      activePair, setActivePair,
      activeQuoteCurrency, setActiveQuoteCurrency,
      chartFullScreen, setChartFullScreen,
      liveCryptoList, setLiveCryptoList,
      cryptoFetching, setCryptoFetching,
    }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used inside ModeProvider");
  return ctx;
}
