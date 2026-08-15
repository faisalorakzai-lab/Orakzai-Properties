import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, ChevronUp, ChevronDown, MoreVertical, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/AuthContext";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { useMode } from "@/contexts/ModeContext";
import { useAppStore, ASSET_DEFS } from "@/store/AppStoreContext";

/* ── Theme ── */
const BG    = "#0B0E11";
const CARD  = "#12161C";
const BORD  = "#1E2329";
const RED   = "#F6465D";
const GREEN = "#0ECB81";
const GOLD  = "#C9A84C";
const DIM   = "#848E9C";
const FG    = "#EAECEF";

/* Static metadata keyed by BASE ticker (quote-currency-agnostic) */
const ASSET_META: Record<string, { vol: string }> = {
  "ASC":    { vol: "0.35M" },
  "CSC":    { vol: "0.16M" },
  "DHA9":   { vol: "0.84M" },
  "GBR":    { vol: "0.18M" },
  "OKBOND": { vol: "0.27M" },
  "BTI":    { vol: "0.41M" },
};

/* ── Crypto tab types ── */
interface CryptoAsset {
  rank: number;
  id: string;
  symbol: string;
  name: string;
  image?: string;
  price: number;
  change24h: number;
  marketCap: number;
  isCustom?: boolean;
}

/* Format market cap */
function fmtMcap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

/* Format price */
function fmtPrice(p: number): string {
  if (p === 0)     return "$0.00";
  if (p >= 1000)   return `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1)      return `$${p.toFixed(4)}`;
  if (p >= 0.001)  return `$${p.toFixed(6)}`;
  return `$${p.toFixed(8)}`;
}

/* OKBOND — inserted at position 6 (XRP's slot); XRP pushed to slot 11 */
const OKBOND_CUSTOM: CryptoAsset = {
  rank: 6,
  id: "okbond",
  symbol: "OKBOND",
  name: "Orakzai Bond",
  image: "OKBOND_LOCAL",   // sentinel — resolved to the local logo in JSX
  price: 0.00028800,
  change24h: +0.94,
  marketCap: 270000,
  isCustom: true,
};

/* Fallback top-20 (shown while API loads) */
const FALLBACK: CryptoAsset[] = [
  { rank: 1,  id: "bitcoin",        symbol: "BTC",  name: "Bitcoin",          price: 63619.63,  change24h: +0.89, marketCap: 1270000000000 },
  { rank: 2,  id: "ethereum",       symbol: "ETH",  name: "Ethereum",         price: 1860.66,   change24h: +0.21, marketCap: 224730000000  },
  { rank: 3,  id: "tether",         symbol: "USDT", name: "Tether",           price: 0.9988,    change24h: +0.00, marketCap: 183190000000  },
  { rank: 4,  id: "binancecoin",    symbol: "BNB",  name: "BNB",              price: 591.97,    change24h: +1.02, marketCap: 78840000000   },
  { rank: 5,  id: "usd-coin",       symbol: "USDC", name: "USD Coin",         price: 0.9997,    change24h: +0.00, marketCap: 71990000000   },
  { rank: 6,  id: "ripple",         symbol: "XRP",  name: "XRP",              price: 1.0838,    change24h: +0.42, marketCap: 67820000000   },
  { rank: 7,  id: "solana",         symbol: "SOL",  name: "Solana",           price: 73.57,     change24h: +0.79, marketCap: 42760000000   },
  { rank: 8,  id: "tron",           symbol: "TRX",  name: "TRON",             price: 0.3286,    change24h: +0.46, marketCap: 31200000000   },
  { rank: 9,  id: "hyperliquid",    symbol: "HYPE", name: "Hyperliquid",      price: 54.35,     change24h: +5.83, marketCap: 13720000000   },
  { rank: 10, id: "dogecoin",       symbol: "DOGE", name: "Dogecoin",         price: 0.07038,   change24h: +0.11, marketCap: 12040000000   },
  /* OKBOND inserted at 11 */
  { rank: 12, id: "leo-token",      symbol: "LEO",  name: "UNUS SED LEO",     price: 9.750,     change24h: -0.16, marketCap: 8970000000    },
  { rank: 13, id: "zcash",          symbol: "ZEC",  name: "Zcash",            price: 488.42,    change24h: -3.57, marketCap: 8200000000    },
  { rank: 14, id: "cardano",        symbol: "ADA",  name: "Cardano",          price: 0.1948,    change24h: +2.69, marketCap: 7100000000    },
  { rank: 15, id: "monero",         symbol: "XMR",  name: "Monero",           price: 360.74,    change24h: -0.57, marketCap: 6780000000    },
  { rank: 16, id: "chainlink",      symbol: "LINK", name: "Chainlink",        price: 8.249,     change24h: -0.28, marketCap: 6170000000    },
  { rank: 17, id: "stellar",        symbol: "XLM",  name: "Stellar",          price: 0.1713,    change24h: +0.00, marketCap: 5870000000    },
  { rank: 18, id: "dai",            symbol: "DAI",  name: "Dai",              price: 0.9995,    change24h: -0.03, marketCap: 4580000000    },
  { rank: 19, id: "bitcoin-cash",   symbol: "BCH",  name: "Bitcoin Cash",     price: 210.93,    change24h: -0.81, marketCap: 4230000000    },
  { rank: 20, id: "usd1",           symbol: "USD1", name: "USD1",             price: 0.9989,    change24h: +0.00, marketCap: 3978000000    },
];

const CATS       = ["Favorites", "Projects", "Building", "Commercial", "Crypto", "News", "Data"];
const CURRENCIES = ["USDT", "USDC", "OKBOND"] as const;

export default function Markets() {
  const [search,        setSearch]        = useState("");
  const [cat,           setCat]           = useState("Projects");
  const [sortDir,       setSortDir]       = useState<"asc" | "desc">("desc");
  const [cryptoSort,    setCryptoSort]    = useState<"rank" | "change">("rank");
  const [cryptoDir,     setCryptoDir]     = useState<"asc" | "desc">("asc");
  const [favorites,     setFavorites]     = useState<Set<string>>(new Set());
  const [cryptoList,    setCryptoList]    = useState<CryptoAsset[]>(FALLBACK);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cryptoError,   setCryptoError]   = useState(false);
  const fetchedRef                         = useRef(false);
  const [, navigate]                      = useLocation();
  const { user } = useUser();
  const profilePhoto = useProfilePhoto();

  /* ── Global state from ModeContext ── */
  const {
    setActivePair, activeQuoteCurrency, setActiveQuoteCurrency,
    setLiveCryptoList, setCryptoFetching,
  } = useMode();
  const currency = activeQuoteCurrency;

  /* ── OKBOND live price: ticks up toward $0.92 ── */
  const OKBOND_TARGET = 0.92;
  const [okbondLivePrice,  setOkbondLivePrice]  = useState(OKBOND_CUSTOM.price);
  const [okbondLiveChange, setOkbondLiveChange] = useState(OKBOND_CUSTOM.change24h);
  const okbondTickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    okbondTickRef.current = setInterval(() => {
      setOkbondLivePrice(prev => {
        if (prev >= OKBOND_TARGET) {
          clearInterval(okbondTickRef.current!);
          return OKBOND_TARGET;
        }
        const noise = 1 + (Math.random() - 0.12) * 0.06;
        const next  = Math.min(prev * 1.06 * noise, OKBOND_TARGET);
        return next;
      });
      setOkbondLiveChange(prev =>
        Math.min(prev + 1.1 + Math.random() * 1.5, 9999.99)
      );
    }, 1500);
    return () => clearInterval(okbondTickRef.current!);
  }, []);

  const { prices } = useAppStore();

  /* Fetch top 100 from CoinGecko (once per session) — writes to local + shared context */
  useEffect(() => {
    if (cat !== "Crypto" || fetchedRef.current) return;
    fetchedRef.current = true;
    setCryptoLoading(true);
    setCryptoFetching(true);
    setCryptoError(false);
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets" +
      "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false" +
      "&price_change_percentage=24h"
    )
      .then(r => r.json())
      .then((data: Array<{
        market_cap_rank: number;
        id: string; symbol: string; name: string; image: string;
        current_price: number;
        price_change_percentage_24h: number;
        market_cap: number;
      }>) => {
        const list: CryptoAsset[] = data.map(d => ({
          rank:      d.market_cap_rank,
          id:        d.id,
          symbol:    d.symbol.toUpperCase(),
          name:      d.name,
          image:     d.image,
          price:     d.current_price,
          change24h: d.price_change_percentage_24h ?? 0,
          marketCap: d.market_cap,
        }));
        setCryptoList(list);
        setLiveCryptoList(list);   // share with Trade page
      })
      .catch(() => { setCryptoError(true); fetchedRef.current = false; })
      .finally(() => { setCryptoLoading(false); setCryptoFetching(false); });
  }, [cat]);

  /* ── Property pair list
     Always built from USDT canonical pairs, then quote is swapped to the
     active currency for display & navigation. Prices from the engine are
     always USDT-denominated; the quote label changes only visually.        ── */
  const ASSETS = useMemo(() =>
    Object.entries(ASSET_DEFS).map(([canonicalPair, def]) => {
      const base       = def.ticker;                                   // e.g. "DHA9"
      const quotedPair = `${base}/${currency}`;                        // e.g. "DHA9/USDC"
      return {
        ticker:        base,
        pair:          quotedPair,                                     // display pair
        canonicalPair,                                                 // USDT pair for price/meta lookup
        name:          def.name,
        price:         prices[canonicalPair] ?? def.basePrice,
        change:        def.change,
        vol:           ASSET_META[base]?.vol ?? "—",
        usd:           `≈$${((prices[canonicalPair] ?? def.basePrice) * 0.0036).toFixed(3)}`,
        logo:          def.logo ? `${import.meta.env.BASE_URL}${def.logo}` : undefined,
      };
    }),
  [prices, currency]);

  /* Filtered list — all pairs shown for every quote currency (dynamically re-quoted),
     still filtered by search text and Favorites. */
  const filtered = useMemo(() => {
    let list = ASSETS;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.ticker.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.pair.toLowerCase().includes(q)
      );
    }
    if (cat === "Favorites") list = list.filter(a => favorites.has(a.pair));
    return [...list].sort((a, b) =>
      sortDir === "desc" ? b.change - a.change : a.change - b.change
    );
  }, [ASSETS, search, cat, sortDir, favorites]);

  /* Crypto list: pure CoinGecko coins only — project tokens stay in their own tabs */
  const displayedCrypto = useMemo(() => {
    // Sort by rank, pull XRP out, insert OKBOND at idx 5 (slot 6), XRP at idx 10 (slot 11)
    const sorted = [...cryptoList]
      .filter(a => a.id !== "ripple")
      .sort((a, b) => a.rank - b.rank);
    const xrp = cryptoList.find(a => a.id === "ripple");

    const withOK: CryptoAsset[] = [];
    sorted.forEach((item, idx) => {
      if (idx === 5)  withOK.push(OKBOND_CUSTOM);         // slot 6
      if (idx === 10 && xrp) withOK.push(xrp);           // slot 11
      withOK.push(item);
    });
    if (!withOK.find(a => a.id === "okbond"))  withOK.splice(5, 0, OKBOND_CUSTOM);
    if (xrp && !withOK.find(a => a.id === "ripple")) withOK.splice(10, 0, xrp);

    // Search filter
    const q = search.trim().toLowerCase();
    const filtered2 = q
      ? withOK.filter(a =>
          a.symbol.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q)
        )
      : withOK;

    if (cryptoSort === "change") {
      return [...filtered2].sort((a, b) =>
        cryptoDir === "asc" ? a.change24h - b.change24h : b.change24h - a.change24h
      );
    }
    if (cryptoSort === "rank") {
      return cryptoDir === "asc" ? filtered2 : [...filtered2].reverse();
    }
    return filtered2;
  }, [cryptoList, search, cryptoSort, cryptoDir]);

  /* Navigate to Trade with the selected (re-quoted) pair */
  function handleTokenClick(quotedPair: string) {
    setActivePair(quotedPair);
    navigate("/trade");
  }

  function toggleFav(key: string, e: React.MouseEvent) {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleCryptoSort(col: "rank" | "change") {
    if (cryptoSort === col) {
      setCryptoDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setCryptoSort(col);
      setCryptoDir(col === "rank" ? "asc" : "desc");
    }
  }

  const isCrypto = cat === "Crypto";
  const okbondLogo = `${import.meta.env.BASE_URL}tokens/token-okbond-official.png`;

  return (
    <div style={{ minHeight: "100dvh", background: BG, paddingBottom: 80, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Search bar + profile access ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 12px 8px", background: BG, position: "sticky", top: 0, zIndex: 50 }}>
        <button aria-label="Open profile settings" onClick={() => navigate("/profile-center")} style={{ width: 38, height: 38, padding: 0, flexShrink: 0, borderRadius: "50%", border: `1px solid ${GOLD}70`, background: `linear-gradient(135deg,${GOLD},#8b6914)`, overflow: "hidden", color: "#111", fontWeight: 900, fontSize: 14 }}>
          {profilePhoto ? <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? "U").toUpperCase()}
        </button>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, background: CARD, border: `1px solid ${BORD}`, borderRadius: 10, padding: "10px 14px" }}>
          <Search size={15} color={DIM} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search coin pair, project, or asset..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: FG, fontSize: 13, fontFamily: "inherit" }}
          />
          <MoreVertical size={15} color={DIM} />
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div style={{ overflowX: "auto", scrollbarWidth: "none" }}>
        <div style={{ display: "flex", gap: 0, padding: "0 12px", borderBottom: `1px solid ${BORD}`, minWidth: "max-content" }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ background: "none", border: "none", padding: "10px 14px", fontSize: 13, fontWeight: cat === c ? 700 : 500, color: cat === c ? FG : DIM, borderBottom: cat === c ? `2px solid ${GOLD}` : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.2s" }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Quote currency pills — global state, visible on ALL tabs ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px" }}>
        {CURRENCIES.map(c => (
          <button
            key={c}
            onClick={() => setActiveQuoteCurrency(c)}
            style={{
              background:   currency === c ? GOLD : "none",
              border:       `1px solid ${currency === c ? GOLD : BORD}`,
              borderRadius: 20,
              padding:      "6px 16px",
              fontSize:     12,
              fontWeight:   700,
              color:        currency === c ? BG : DIM,
              cursor:       "pointer",
              fontFamily:   "inherit",
              transition:   "all 0.18s",
            }}>
            {c}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          CRYPTO TAB
      ═══════════════════════════════════════════ */}
      {isCrypto ? (
        <>
          {/* Column headers — "Price" label reflects active quote currency */}
          <div style={{ display: "flex", alignItems: "center", padding: "8px 16px 8px 16px", borderBottom: `1px solid ${BORD}`, gap: 4 }}>
            <span style={{ flex: 1, fontSize: 11, color: DIM, fontWeight: 600 }}>Market Cap</span>
            <span style={{ fontSize: 11, color: GOLD, marginRight: 8, fontWeight: 700 }}>Price ({currency})</span>
            <button onClick={() => toggleCryptoSort("change")}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 1, fontFamily: "inherit", padding: 0 }}>
              <span style={{ fontSize: 11, color: cryptoSort === "change" ? GOLD : DIM, fontWeight: 700 }}>24h %</span>
              {cryptoSort === "change" && (cryptoDir === "asc" ? <ChevronUp size={9} color={GOLD} /> : <ChevronDown size={9} color={GOLD} />)}
            </button>
          </div>

          {/* Loading / error */}
          {cryptoLoading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, color: DIM, fontSize: 12 }}>
              <Loader2 size={14} color={GOLD} style={{ animation: "spin 1s linear infinite" }} />
              Fetching live data…
            </div>
          )}
          {cryptoError && !cryptoLoading && (
            <div style={{ textAlign: "center", padding: "8px 16px", color: RED, fontSize: 12 }}>
              Could not fetch live prices — showing cached data.{" "}
              <button
                onClick={() => { fetchedRef.current = false; setCat("Projects"); setTimeout(() => setCat("Crypto"), 50); }}
                style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontFamily: "inherit", fontSize: 12, textDecoration: "underline" }}>
                Retry
              </button>
            </div>
          )}
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

          {/* Coin rows — clickable, prices quoted in selected currency */}
          <AnimatePresence>
            {displayedCrypto.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: DIM, fontSize: 13 }}>No results found</div>
            ) : (
              displayedCrypto.map((asset, i) => {
                const usdPrice   = asset.id === "okbond" ? okbondLivePrice  : asset.price;
                const liveChange = asset.id === "okbond" ? okbondLiveChange : asset.change24h;
                const isPos      = liveChange >= 0;
                const isFav      = favorites.has(asset.symbol);
                const imgSrc     = asset.isCustom ? okbondLogo : asset.image;

                /* ── Price conversion based on selected quote currency ── */
                let displayPrice: string;
                let approxLabel: string;
                if (currency === "OKBOND") {
                  // Convert USD price → OKBOND units (divide by OKBOND's current USD price)
                  const okbondUsd = okbondLivePrice > 0 ? okbondLivePrice : 0.000288;
                  const inOKBOND  = usdPrice / okbondUsd;
                  if (inOKBOND >= 1e9)       displayPrice = `${(inOKBOND / 1e9).toFixed(3)}B`;
                  else if (inOKBOND >= 1e6)  displayPrice = `${(inOKBOND / 1e6).toFixed(3)}M`;
                  else if (inOKBOND >= 1e3)  displayPrice = `${(inOKBOND / 1e3).toFixed(3)}K`;
                  else                       displayPrice = inOKBOND.toFixed(4);
                  approxLabel = `≈${fmtPrice(usdPrice)}`;
                } else {
                  // USDT and USDC are both ≈ $1 — show USD price directly
                  displayPrice = fmtPrice(usdPrice);
                  approxLabel  = `≈${fmtPrice(usdPrice)}`;
                }

                return (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.012, 0.35) }}
                    onClick={() => handleTokenClick(`${asset.symbol}/${currency}`)}
                    style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${BORD}`, gap: 12, cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Avatar */}
                    <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                      background: `linear-gradient(135deg, ${GOLD}cc, #8B6914)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {imgSrc && imgSrc !== "OKBOND_LOCAL" ? (
                        <img src={imgSrc} alt={asset.symbol}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.5px" }}>{asset.symbol.slice(0, 4)}</span>
                      )}
                    </div>

                    {/* Symbol/QUOTE + Name + Market Cap */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: FG }}>
                        {asset.symbol}<span style={{ color: DIM, fontWeight: 500 }}>/{currency}</span>
                      </div>
                      <div style={{ fontSize: 11, color: DIM, marginTop: 1 }}>{asset.name}</div>
                      <div style={{ fontSize: 10, color: "rgba(132,142,156,0.55)", marginTop: 1 }}>
                        {asset.marketCap ? fmtMcap(asset.marketCap) : "—"}
                      </div>
                    </div>

                    {/* Converted price + ≈$USD */}
                    <div style={{ textAlign: "right", marginRight: 4, minWidth: 88 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isPos ? GREEN : RED }}>
                        {displayPrice}
                      </div>
                      <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{approxLabel}</div>
                    </div>

                    {/* 24h change badge + star */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                      <div style={{ background: isPos ? GREEN : RED, borderRadius: 6, padding: "4px 8px", minWidth: 60, textAlign: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                          {isPos ? "+" : ""}{liveChange.toFixed(2)}%
                        </span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); toggleFav(asset.symbol, e); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <Star size={12} color={isFav ? GOLD : DIM} fill={isFav ? GOLD : "none"} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </>

      ) : (
        /* ═══════════════════════════════════════════
           OTHER TABS (property pairs — dynamically re-quoted)
        ═══════════════════════════════════════════ */
        <>
          {/* Column headers */}
          <div style={{ display: "flex", alignItems: "center", padding: "6px 16px 6px 52px", borderBottom: `1px solid ${BORD}` }}>
            <span style={{ flex: 1, fontSize: 11, color: DIM, display: "flex", alignItems: "center", gap: 3 }}>
              Name / Vol <ChevronUp size={10} color={GOLD} />
            </span>
            <span style={{ fontSize: 11, color: DIM, marginRight: 32 }}>Last Price ↕</span>
            <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              style={{ fontSize: 11, color: DIM, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2, fontFamily: "inherit" }}>
              24h Chg%
              {sortDir === "desc" ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
            </button>
          </div>

          {/* Token list */}
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: DIM, fontSize: 13 }}>No results found</div>
            ) : (
              filtered.map((asset, i) => {
                const isPos = asset.change >= 0;
                const isFav = favorites.has(asset.pair);
                return (
                  <motion.div
                    key={asset.pair}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleTokenClick(asset.pair)}
                    style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${BORD}`, cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Avatar */}
                    <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", marginRight: 12, flexShrink: 0,
                      background: `linear-gradient(135deg, ${GOLD}cc, #8B6914)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: asset.logo ? `1.5px solid rgba(201,168,76,0.3)` : "none",
                    }}>
                      {asset.logo ? (
                        <img src={asset.logo} alt={asset.ticker}
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.5px" }}>{asset.ticker.slice(0, 3)}</span>
                      )}
                    </div>

                    {/* Name + Vol — shows dynamically re-quoted pair (e.g. DHA9/USDC) */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: FG }}>{asset.pair}</div>
                      <div style={{ fontSize: 11, color: DIM, marginTop: 1 }}>{asset.name}</div>
                      <div style={{ fontSize: 10, color: "rgba(132,142,156,0.6)", marginTop: 1 }}>{asset.vol}</div>
                    </div>

                    {/* Live Price */}
                    <div style={{ textAlign: "right", marginRight: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isPos ? GREEN : RED }}>
                        {asset.price.toFixed(asset.price < 1 ? 5 : 4)}
                      </div>
                      <div style={{ fontSize: 11, color: DIM }}>{asset.usd}</div>
                    </div>

                    {/* Change badge + star */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <div style={{ background: isPos ? GREEN : RED, borderRadius: 6, padding: "4px 10px", minWidth: 64, textAlign: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                          {isPos ? "+" : ""}{asset.change.toFixed(2)}%
                        </span>
                      </div>
                      <button onClick={e => toggleFav(asset.pair, e)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <Star size={13} color={isFav ? GOLD : DIM} fill={isFav ? GOLD : "none"} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
