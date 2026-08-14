import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Building2, Calculator, Check, ChevronRight, CircleDollarSign,
  FileCheck2, Heart, Landmark, LayoutGrid, MapPin, Search, ShieldCheck,
  ShoppingCart, Sparkles, Wallet, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BG = "#0b0e11";
const CARD = "#181a20";
const PANEL = "#1e2329";
const LINE = "#2b313a";
const FG = "#f5f5f5";
const DIM = "#929aa5";
const GOLD = "#f0b90b";
const GREEN = "#0ecb81";

type Asset = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  token: string;
  badge: string;
  badgeColor: string;
  price: string;
  yield: string;
  available: string;
  valuation: string;
  icon: string;
  gradient: string;
};

const ASSETS: Asset[] = [
  {
    id: "dhai-plot",
    title: "DHA Islamabad – 1 Kanal Plot Twin",
    subtitle: "Location: Sector J, Phase 2, Islamabad",
    category: "Residential Plots",
    token: "DHAISB",
    badge: "On-Chain Verified",
    badgeColor: GREEN,
    price: "20 USDT (Rs 5,600)",
    yield: "14.5% APY",
    available: "1,240 / 5,000 Left",
    valuation: "Rs 28,000,000",
    icon: "⌂",
    gradient: "linear-gradient(135deg,#142b35 0%,#1b3d40 42%,#0b1016 100%)",
  },
  {
    id: "azan-plaza",
    title: "Azan Smart City – Commercial Plaza",
    subtitle: "Fractional Ownership • Retail & Corporate Floor",
    category: "Commercial Buildings",
    token: "ASC",
    badge: "High Dividend",
    badgeColor: GOLD,
    price: "50 USDT (Rs 14,000)",
    yield: "18.2% APY",
    available: "680 / 2,000 Left",
    valuation: "Rs 140,000,000",
    icon: "▦",
    gradient: "linear-gradient(135deg,#302411 0%,#5a3d12 45%,#12100c 100%)",
  },
  {
    id: "dubai-twin",
    title: "Dubai Marina – Luxury Twin Residence",
    subtitle: "Dubai Marina, UAE • Managed rental asset",
    category: "Luxury Twins",
    token: "DMAR",
    badge: "Global Asset",
    badgeColor: "#60a5fa",
    price: "100 USDT (AED 367)",
    yield: "11.8% APY",
    available: "420 / 1,500 Left",
    valuation: "AED 42,000,000",
    icon: "◇",
    gradient: "linear-gradient(135deg,#172744 0%,#1b4269 44%,#0b1018 100%)",
  },
];

const FILTERS = ["All RWA Assets", "Residential Plots", "Commercial Buildings", "Luxury Twins", "High Yield (15%+)"];

type Sheet = "buy" | "details" | "portfolio" | null;

function BottomSheet({ kind, asset, close, onBuy }: { kind: Exclude<Sheet, null>; asset?: Asset; close: () => void; onBuy: () => void }) {
  const title = kind === "buy" ? "Buy Fractional Tokens" : kind === "details" ? "Legal Twin & Asset Details" : "RWA Portfolio";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,.78)" }}>
      <div onClick={close} style={{ position: "absolute", inset: 0 }} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} style={{ position: "relative", width: "100%", maxHeight: "88dvh", overflowY: "auto", padding: "20px 16px calc(34px + env(safe-area-inset-bottom) + 72px)", background: BG, borderTop: `1px solid ${LINE}`, borderRadius: "24px 24px 0 0" }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: LINE, margin: "0 auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><strong style={{ fontSize: 16 }}>{title}</strong><button onClick={close} aria-label="Close" style={{ border: 0, background: "none", color: DIM, padding: 8 }}><X size={20} /></button></div>
        {kind !== "portfolio" && asset && <>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 17, padding: 14, borderRadius: 14, background: CARD, border: `1px solid ${LINE}` }}><div style={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 14, background: asset.gradient, color: GOLD, fontSize: 25, fontWeight: 900 }}>{asset.icon}</div><div style={{ minWidth: 0 }}><strong style={{ display: "block", fontSize: 13 }}>{asset.title}</strong><span style={{ display: "block", marginTop: 4, color: DIM, fontSize: 10 }}>{asset.token} · {asset.price} per token</span></div></div>
          {kind === "details" ? <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: PANEL, border: `1px solid ${LINE}`, color: DIM, fontSize: 11, lineHeight: 1.65 }}><div style={{ display: "flex", gap: 9, color: GREEN, fontWeight: 800, marginBottom: 8 }}><FileCheck2 size={16} /> Verified asset documentation</div>Legal twin documents, ownership structure, token registry and yield disclosures are reviewed before an asset is listed. Full document access is available from the asset detail view.</div> : <><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 14, overflow: "hidden", borderRadius: 13, background: LINE }}><div style={{ padding: 13, background: CARD }}><span style={{ color: DIM, fontSize: 10 }}>Token price</span><strong style={{ display: "block", marginTop: 4, fontSize: 14 }}>{asset.price}</strong></div><div style={{ padding: 13, background: CARD }}><span style={{ color: DIM, fontSize: 10 }}>Estimated yield</span><strong style={{ display: "block", marginTop: 4, color: GREEN, fontSize: 14 }}>{asset.yield}</strong></div></div><div style={{ marginTop: 14, padding: 13, borderRadius: 13, background: PANEL, color: DIM, fontSize: 11, lineHeight: 1.55 }}>Fractional ownership is subject to KYC, asset eligibility and the applicable offering terms. Review the legal twin and risk disclosure before confirming.</div><button onClick={() => { onBuy(); close(); }} style={{ width: "100%", marginTop: 16, marginBottom: 8, padding: 14, border: 0, borderRadius: 13, background: GOLD, color: BG, fontWeight: 900 }}>Confirm Token Purchase</button></>}
        </>}
        {kind === "portfolio" && <><div style={{ marginTop: 16, padding: 16, borderRadius: 15, background: "linear-gradient(135deg,#181a20,#12161c)", border: `1px solid ${GOLD}45` }}><span style={{ color: DIM, fontSize: 10, letterSpacing: ".12em" }}>RWA PORTFOLIO VALUE</span><strong style={{ display: "block", marginTop: 7, fontSize: 28 }}>10 USDT</strong><span style={{ display: "block", marginTop: 4, color: GREEN, fontSize: 11 }}>Start fractional ownership from 10 USDT</span></div><button onClick={close} style={{ width: "100%", marginTop: 16, marginBottom: 8, padding: 13, border: `1px solid ${LINE}`, borderRadius: 12, background: CARD, color: FG, fontWeight: 800 }}>Close Portfolio</button></>}
      </motion.div>
    </motion.div>
  );
}

function AssetBanner({ asset }: { asset: Asset }) {
  return <div style={{ position: "relative", height: 144, overflow: "hidden", borderRadius: 13, marginBottom: 13, border: `1px solid ${LINE}`, background: asset.gradient }}><div style={{ position: "absolute", inset: 0, opacity: .25, backgroundImage: "linear-gradient(135deg,transparent 0 42%,rgba(255,255,255,.22) 42% 43%,transparent 43% 58%,rgba(255,255,255,.12) 58% 59%,transparent 59%), radial-gradient(circle at 75% 30%,rgba(240,185,11,.33),transparent 27%)" }} /><div style={{ position: "absolute", left: 12, bottom: 12, color: "rgba(255,255,255,.85)", fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{asset.icon}</div><span style={{ position: "absolute", top: 9, left: 9, padding: "5px 8px", borderRadius: 6, color: BG, background: `${asset.badgeColor}e8`, fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>{asset.badge}</span><span style={{ position: "absolute", top: 9, right: 9, padding: "4px 7px", borderRadius: 6, color: GOLD, background: "rgba(0,0,0,.75)", border: "1px solid rgba(240,185,11,.35)", fontSize: 10, fontWeight: 800 }}>Token: {asset.token}</span><span style={{ position: "absolute", right: 12, bottom: 11, color: "rgba(255,255,255,.76)", fontSize: 9, letterSpacing: ".12em", fontWeight: 800 }}>RWA / VERIFIED</span></div>;
}

export default function Marketplace() {
  const [, nav] = useLocation();
  const { toast } = useToast();
  const [filter, setFilter] = useState(FILTERS[0]);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<Sheet>(null);
  const [selected, setSelected] = useState<Asset | undefined>();

  const filtered = useMemo(() => ASSETS.filter(asset => {
    const matchesFilter = filter === FILTERS[0] || (filter === "High Yield (15%+)" ? Number(asset.yield.replace(/[^0-9.]/g, "")) >= 15 : asset.category === filter);
    const query = search.trim().toLowerCase();
    return matchesFilter && (!query || `${asset.title} ${asset.subtitle} ${asset.token}`.toLowerCase().includes(query));
  }), [filter, search]);

  const openAsset = (kind: Exclude<Sheet, "portfolio" | null>, asset: Asset) => { setSelected(asset); setSheet(kind); };
  const buyDone = () => toast({ title: "Purchase request submitted", description: "Complete verification and wallet confirmation to finalize your fractional token order." });

  return <div style={{ minHeight: "100dvh", overflowX: "hidden", padding: "12px 16px calc(92px + env(safe-area-inset-bottom))", background: BG, color: FG, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", WebkitFontSmoothing: "antialiased" }}>
    <header style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}><div style={{ display: "flex", alignItems: "center", minWidth: 0 }}><button onClick={() => nav("/services")} aria-label="Back to services" style={{ border: 0, background: "none", color: DIM, padding: 8 }}><ArrowLeft size={20} /></button><strong style={{ fontSize: 16, letterSpacing: ".02em", whiteSpace: "nowrap" }}>RWA Marketplace</strong></div><div style={{ display: "flex", gap: 3 }}><button onClick={() => setSheet("portfolio")} aria-label="Open portfolio" style={{ padding: 9, border: 0, background: "none", color: DIM }}><ShoppingCart size={19} /></button><button onClick={() => toast({ title: "Saved assets", description: `${saved.size} asset${saved.size === 1 ? "" : "s"} saved to your watchlist.` })} aria-label="Saved favorites" style={{ padding: 9, border: 0, background: "none", color: saved.size ? GOLD : DIM }}><Heart size={19} fill={saved.size ? GOLD : "none"} /></button></div></header>
    <main style={{ maxWidth: 760, margin: "0 auto" }}>
      <section style={{ display: "flex", alignItems: "center", gap: 4, padding: 5, marginBottom: 15, borderRadius: 13, background: CARD, border: `1px solid ${LINE}` }}><button onClick={() => nav("/")} style={{ flex: 1, padding: "10px 5px", border: 0, borderRadius: 9, background: "transparent", color: DIM, fontSize: 11, fontWeight: 700 }}>📈 Crypto Exchange</button><button style={{ flex: 1, padding: "10px 5px", border: 0, borderRadius: 9, background: GOLD, color: BG, boxShadow: "0 4px 14px rgba(240,185,11,.2)", fontSize: 11, fontWeight: 900 }}>🏛️ RWA Marketplace</button></section>
      <section style={{ padding: 17, marginBottom: 17, borderRadius: 18, border: `1px solid ${LINE}`, background: "linear-gradient(110deg,#181a20,#1e2329 50%,#0b0e11)", boxShadow: "0 18px 42px rgba(0,0,0,.18)" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 13, background: `${GOLD}16`, color: GOLD }}><Landmark size={22} /></div><div><div style={{ color: GOLD, fontSize: 10, fontWeight: 900, letterSpacing: ".14em" }}>TOKENIZED REAL-WORLD ASSETS</div><h1 style={{ margin: "5px 0 0", fontSize: 21, lineHeight: 1.15 }}>Invest in verified property</h1></div></div><p style={{ margin: "12px 0 0", color: DIM, fontSize: 12, lineHeight: 1.55 }}>Access fractional real estate opportunities with transparent token pricing, legal documentation and income-focused asset structures.</p></section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 1, overflow: "hidden", marginBottom: 17, borderRadius: 15, background: LINE, border: `1px solid ${LINE}` }}><div style={{ padding: 13, background: CARD, textAlign: "center" }}><Building2 size={16} color={FG} /><strong style={{ display: "block", marginTop: 6, fontSize: 13 }}>Rs 4.2B+</strong><span style={{ color: DIM, fontSize: 9, textTransform: "uppercase" }}>Total Volume</span></div><div style={{ padding: 13, background: CARD, textAlign: "center" }}><ShieldCheck size={16} color={GREEN} /><strong style={{ display: "block", marginTop: 6, color: GREEN, fontSize: 13 }}>128 Units</strong><span style={{ color: DIM, fontSize: 9, textTransform: "uppercase" }}>Verified Assets</span></div><div style={{ padding: 13, background: CARD, textAlign: "center" }}><CircleDollarSign size={16} color={GOLD} /><strong style={{ display: "block", marginTop: 6, color: GOLD, fontSize: 13 }}>10 USDT</strong><span style={{ color: DIM, fontSize: 9, textTransform: "uppercase" }}>Fractional Start</span></div></section>
      <div style={{ display: "flex", alignItems: "center", gap: 9, height: 42, padding: "0 12px", marginBottom: 12, borderRadius: 11, background: CARD, border: `1px solid ${LINE}` }}><Search size={15} color={DIM} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets, locations or tokens" style={{ minWidth: 0, flex: 1, border: 0, outline: 0, background: "transparent", color: FG, fontSize: 12 }} />{search && <button onClick={() => setSearch("")} style={{ padding: 3, border: 0, background: "none", color: DIM }}><X size={14} /></button>}</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "1px 0 8px", marginBottom: 5, scrollbarWidth: "none" }}>{FILTERS.map(item => <button key={item} onClick={() => setFilter(item)} style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 9, border: `1px solid ${filter === item ? `${GOLD}66` : LINE}`, background: filter === item ? `${GOLD}18` : CARD, color: filter === item ? GOLD : DIM, fontSize: 10, fontWeight: filter === item ? 800 : 600, whiteSpace: "nowrap" }}>{item}</button>)}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 2px 11px" }}><div style={{ display: "flex", alignItems: "center", gap: 7 }}><LayoutGrid size={14} color={GOLD} /><strong style={{ fontSize: 13 }}>Verified RWA listings</strong></div><span style={{ color: DIM, fontSize: 10 }}>{filtered.length} available</span></div>
      {filtered.length === 0 ? <div style={{ padding: 38, textAlign: "center", borderRadius: 15, background: CARD, border: `1px solid ${LINE}`, color: DIM, fontSize: 12 }}>No assets match this filter yet.</div> : filtered.map((asset, i) => <motion.article key={asset.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }} style={{ padding: 14, marginBottom: 13, borderRadius: 17, background: CARD, border: `1px solid ${LINE}`, boxShadow: "0 10px 26px rgba(0,0,0,.13)" }}><AssetBanner asset={asset} /><div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}><div style={{ minWidth: 0 }}><strong style={{ display: "block", fontSize: 14, lineHeight: 1.3 }}>{asset.title}</strong><span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, color: DIM, fontSize: 10 }}><MapPin size={12} color={GOLD} />{asset.subtitle}</span></div><button onClick={() => setSaved(prev => { const next = new Set(prev); next.has(asset.id) ? next.delete(asset.id) : next.add(asset.id); return next; })} aria-label={`Save ${asset.title}`} style={{ flexShrink: 0, padding: 7, border: 0, background: "none", color: saved.has(asset.id) ? GOLD : DIM }}><Heart size={18} fill={saved.has(asset.id) ? GOLD : "none"} /></button></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, overflow: "hidden", margin: "13px 0", borderRadius: 12, background: LINE, border: `1px solid ${LINE}` }}><div style={{ padding: 11, background: PANEL }}><span style={{ display: "block", color: DIM, fontSize: 9 }}>PRICE PER TOKEN</span><strong style={{ display: "block", marginTop: 4, fontSize: 12 }}>{asset.price}</strong></div><div style={{ padding: 11, background: PANEL }}><span style={{ display: "block", color: DIM, fontSize: 9 }}>EST. RENTAL YIELD</span><strong style={{ display: "block", marginTop: 4, color: GREEN, fontSize: 12 }}>{asset.yield}</strong></div><div style={{ padding: 11, background: PANEL }}><span style={{ display: "block", color: DIM, fontSize: 9 }}>TOKENS AVAILABLE</span><span style={{ display: "block", marginTop: 4, color: FG, fontSize: 10 }}>{asset.available}</span></div><div style={{ padding: 11, background: PANEL }}><span style={{ display: "block", color: DIM, fontSize: 9 }}>PROPERTY VALUATION</span><span style={{ display: "block", marginTop: 4, color: FG, fontSize: 10 }}>{asset.valuation}</span></div></div><div style={{ display: "flex", gap: 8 }}><button onClick={() => openAsset("buy", asset)} style={{ flex: 1, padding: "11px 8px", border: 0, borderRadius: 11, background: GOLD, color: BG, fontSize: 11, fontWeight: 900 }}>Buy Fractions Now</button><button onClick={() => openAsset("details", asset)} style={{ padding: "11px 12px", border: 0, borderRadius: 11, background: LINE, color: FG, fontSize: 10, fontWeight: 800 }}>View Legal Twin</button></div></motion.article>)}
      <section style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 17, padding: 13, borderRadius: 13, background: `${GREEN}09`, border: `1px solid ${GREEN}25`, color: DIM, fontSize: 10, lineHeight: 1.55 }}><Check size={16} color={GREEN} />Listings shown are subject to verification, availability, KYC and the applicable asset offering terms. Returns are estimates and are not guaranteed.</section>
    </main>
    <nav style={{ position: "fixed", inset: "auto 0 0", zIndex: 50, height: "calc(64px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)", display: "flex", justifyContent: "space-around", alignItems: "center", background: "rgba(11,14,17,.96)", borderTop: `1px solid ${LINE}`, backdropFilter: "blur(16px)" }}>{[["Home", "/"], ["Markets", "/markets"], ["Trade", "/trade"], ["Assets", "/wallet"], ["Profile", "/profile"]].map(([label, href]) => <button key={label} onClick={() => nav(href)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: 0, background: "none", color: label === "Assets" ? GOLD : DIM, fontSize: 10, fontWeight: 700 }}>{label === "Assets" ? <Wallet size={18} /> : label === "Markets" ? <Calculator size={18} /> : label === "Trade" ? <CircleDollarSign size={18} /> : label === "Profile" ? <ShieldCheck size={18} /> : <Building2 size={18} />}<span>{label}</span></button>)}</nav>
    <AnimatePresence>{sheet && <BottomSheet kind={sheet} asset={selected} close={() => setSheet(null)} onBuy={buyDone} />}</AnimatePresence>
  </div>;
}

export { ASSETS };
