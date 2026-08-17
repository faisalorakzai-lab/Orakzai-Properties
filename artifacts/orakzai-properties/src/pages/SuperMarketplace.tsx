import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Search, Bell, Plus, ChevronRight, Building2, KeyRound, Hotel,
  TrendingUp, HardHat, Package, Palette, Wrench, ShieldCheck,
  MapPin, Heart, MessageCircle, X, ArrowUpRight, Wallet2,
} from "lucide-react";
import { useAppStore } from "@/store/AppStoreContext";

const GOLD = "#F0B90B";
const BG = "#060b12";
const PANEL = "#121923";
const BORDER = "rgba(255,255,255,.09)";
const MUTED = "#8490a3";

const categories = ["All", "Buy", "Rent", "Bookings / Hotels", "RWA Investments", "Installment Projects", "Construction & Material", "Services & Trades"];
const modules = [
  { title: "Buy & Sale Portal", subtitle: "Plots, homes, commercial & industrial", icon: Building2, color: "#10b981", route: "/market/properties?type=buy", category: "Buy" },
  { title: "Rent & Monthly Leases", subtitle: "Verified deposits and flexible stays", icon: KeyRound, color: "#22d3ee", route: "/market/properties?type=rent", category: "Rent" },
  { title: "Hotels & Villa Bookings", subtitle: "Daily, weekly and luxury escapes", icon: Hotel, color: "#f59e0b", route: "/market/bookings", category: "Bookings / Hotels" },
  { title: "RWA Investment Hub", subtitle: "Fractional vaults and installment projects", icon: TrendingUp, color: "#a78bfa", route: "/market/investments", category: "RWA Investments" },
  { title: "Builders & Megaprojects", subtitle: "Approved developers and new launches", icon: HardHat, color: "#fb7185", route: "/market/developers", category: "Installment Projects" },
  { title: "Materials & Suppliers", subtitle: "Cement, steel, tiles and bulk supply", icon: Package, color: "#f97316", route: "/market/materials", category: "Construction & Material" },
  { title: "Designers & Contractors", subtitle: "Architects, interiors and turnkey builds", icon: Palette, color: "#38bdf8", route: "/market/designers", category: "Construction & Material" },
  { title: "Skilled Trades & Services", subtitle: "Verified local technicians on demand", icon: Wrench, color: "#34d399", route: "/market/services", category: "Services & Trades" },
];
const listings = [
  { title: "Orakzai Heights — 5 Marla Residence", meta: "DHA Phase 6, Lahore · 4 Beds", price: "PKR 42.5M", tag: "Verified Buy", image: "🏡" },
  { title: "Ocean Tower Residence", meta: "Dubai Maritime City · 2 Beds", price: "AED 2.85M", tag: "RWA Eligible", image: "🌆" },
  { title: "Business Hub Commercial Unit", meta: "Bahria Town, Karachi · 620 sq ft", price: "PKR 18.75M", tag: "Installment", image: "🏢" },
];
const agencies = [
  { name: "Orakzai Group Realty", detail: "Lahore · 126 active listings", badge: "Sovereign Verified" },
  { name: "Gulf Prime Developments", detail: "Dubai · RWA and off-plan", badge: "Authorized Agency" },
  { name: "BuildRight Pakistan", detail: "Islamabad · Turnkey construction", badge: "Sovereign Verified" },
];

export default function SuperMarketplace() {
  const [, navigate] = useLocation();
  const { wallet } = useAppStore();
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const balance = Number(wallet?.balances?.PKR || 100000);
  const filteredModules = useMemo(() => modules.filter(m => activeCategory === "All" || m.category === activeCategory), [activeCategory]);
  const filteredListings = useMemo(() => listings.filter(item => !search || `${item.title} ${item.meta} ${item.price}`.toLowerCase().includes(search.toLowerCase())), [search]);

  return <div style={{ minHeight: "100dvh", background: BG, color: "#f4f6f8", paddingBottom: 100, fontFamily: "Inter, ui-sans-serif, system-ui" }}>
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(6,11,18,.94)", backdropFilter: "blur(18px)", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 38, height: 38, borderRadius: 13, background: `linear-gradient(145deg, ${GOLD}, #8d6200)`, color: "#071018", display: "grid", placeItems: "center", fontWeight: 950 }}>O</div><div><div style={{ fontSize: 15, fontWeight: 900, letterSpacing: ".02em" }}>OKZBYTE MARKET</div><div style={{ color: MUTED, fontSize: 9, letterSpacing: ".12em", marginTop: 2 }}>SUPER MARKETPLACE</div></div></div><div style={{ display: "flex", gap: 5 }}><button aria-label="Notifications" style={{ border: 0, background: "transparent", color: "#c9d0da", padding: 7 }}><Bell size={19} /></button><button aria-label="Messages" onClick={() => navigate("/chats")} style={{ border: 0, background: "transparent", color: "#c9d0da", padding: 7 }}><MessageCircle size={19} /></button></div>
      </div>
      <div style={{ padding: "0 16px 12px" }}><div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 13px", borderRadius: 14, background: PANEL, border: `1px solid ${BORDER}` }}><Search size={16} color={MUTED} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search properties, projects, contractors, hotels, or services..." style={{ minWidth: 0, flex: 1, background: "transparent", color: "#fff", border: 0, outline: 0, fontSize: 11 }} /></div></div>
    </header>

    <main style={{ maxWidth: 720, margin: "0 auto" }}>
      <section style={{ padding: "18px 16px 10px" }}><div style={{ color: MUTED, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".12em" }}>Available marketplace balance</div><div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginTop: 6 }}><div style={{ fontSize: 29, fontWeight: 900, letterSpacing: "-.04em" }}>PKR {balance.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</div><button onClick={() => navigate("/assets?tab=overview")} style={{ display: "flex", alignItems: "center", gap: 5, border: `1px solid ${GOLD}66`, background: "rgba(240,185,11,.1)", color: GOLD, borderRadius: 11, padding: "8px 10px", fontSize: 10, fontWeight: 850 }}><Wallet2 size={13} /> Assets</button></div><div style={{ color: "#10b981", fontSize: 10, marginTop: 7, fontWeight: 750 }}>Unified wallet connected · local settlement enabled</div></section>

      <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "7px 16px 15px", scrollbarWidth: "none" }}>{categories.map(category => <button key={category} onClick={() => setActiveCategory(category)} style={{ flexShrink: 0, border: `1px solid ${activeCategory === category ? `${GOLD}88` : BORDER}`, background: activeCategory === category ? "rgba(240,185,11,.14)" : PANEL, color: activeCategory === category ? GOLD : MUTED, borderRadius: 999, padding: "8px 12px", fontSize: 10, fontWeight: 800 }}>{category}</button>)}</div>

      <section style={{ padding: "0 16px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 10 }}><div><div style={{ fontSize: 16, fontWeight: 900 }}>Explore the marketplace</div><div style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>One verified ecosystem for property, capital and services</div></div><ShieldCheck size={18} color="#10b981" /></div><div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 9 }}>{filteredModules.map((module, index) => { const Icon = module.icon; return <motion.button key={module.title} whileTap={{ scale: .97 }} onClick={() => navigate(module.route)} style={{ textAlign: "left", border: `1px solid ${BORDER}`, background: PANEL, color: "#fff", borderRadius: 17, padding: 13, minHeight: 119, cursor: "pointer" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ width: 35, height: 35, borderRadius: 12, display: "grid", placeItems: "center", color: module.color, background: `${module.color}1c` }}><Icon size={18} /></div><ArrowUpRight size={15} color={MUTED} /></div><div style={{ marginTop: 12, fontSize: 11, fontWeight: 850 }}>{module.title}</div><div style={{ color: MUTED, fontSize: 9, lineHeight: 1.35, marginTop: 5 }}>{module.subtitle}</div></motion.button>; })}</div></section>

      <section style={{ padding: "24px 16px 0" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><div><div style={{ fontSize: 16, fontWeight: 900 }}>Verified marketplace picks</div><div style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>Updated listings from approved sellers</div></div><button onClick={() => navigate("/market/properties?type=buy")} style={{ border: 0, background: "transparent", color: GOLD, fontSize: 10, fontWeight: 850 }}>View all <ChevronRight size={13} style={{ verticalAlign: "-3px" }} /></button></div>{filteredListings.map((item, index) => <motion.button key={item.title} whileTap={{ scale: .985 }} onClick={() => navigate(`/property/${index + 1}`)} style={{ display: "flex", width: "100%", gap: 12, alignItems: "center", textAlign: "left", border: `1px solid ${BORDER}`, background: PANEL, borderRadius: 17, padding: 11, marginBottom: 9, color: "#fff" }}><div style={{ width: 83, height: 78, borderRadius: 12, display: "grid", placeItems: "center", fontSize: 33, background: "linear-gradient(145deg,#182432,#0c131b)", flexShrink: 0 }}>{item.image}</div><div style={{ minWidth: 0, flex: 1 }}><div style={{ color: GOLD, fontSize: 9, fontWeight: 850 }}>{item.tag}</div><div style={{ marginTop: 5, fontSize: 12, fontWeight: 850, lineHeight: 1.25 }}>{item.title}</div><div style={{ color: MUTED, fontSize: 9, marginTop: 5 }}>{item.meta}</div><div style={{ color: "#10b981", fontSize: 12, fontWeight: 900, marginTop: 7 }}>{item.price}</div></div><button aria-label="Save listing" onClick={e => { e.stopPropagation(); setSaved(prev => { const next = new Set(prev); next.has(index) ? next.delete(index) : next.add(index); return next; }); }} style={{ alignSelf: "flex-start", border: 0, background: "transparent", color: saved.has(index) ? "#fb7185" : MUTED, padding: 5 }}><Heart size={17} fill={saved.has(index) ? "currentColor" : "none"} /></button></motion.button>)}</section>

      <section style={{ padding: "22px 16px 0" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><div><div style={{ fontSize: 16, fontWeight: 900 }}>Agencies & local network</div><div style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>Verified professionals for every stage</div></div><button onClick={() => navigate("/market/services")} style={{ border: 0, background: "transparent", color: GOLD, fontSize: 10, fontWeight: 850 }}>Directory <ChevronRight size={13} style={{ verticalAlign: "-3px" }} /></button></div>{agencies.map(agency => <div key={agency.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, border: `1px solid ${BORDER}`, background: PANEL, borderRadius: 14, marginBottom: 8 }}><div style={{ width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center", background: "rgba(16,185,129,.13)", color: "#10b981" }}><ShieldCheck size={18} /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11, fontWeight: 850 }}>{agency.name}</div><div style={{ color: MUTED, fontSize: 9, marginTop: 3 }}>{agency.detail}</div></div><div style={{ textAlign: "right" }}><div style={{ color: "#10b981", fontSize: 8, fontWeight: 850 }}>{agency.badge}</div><button onClick={() => navigate("/chats")} style={{ marginTop: 5, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, borderRadius: 7, padding: "4px 7px", fontSize: 8 }}>Chat</button></div></div>)}</section>
    </main>

    <motion.button whileTap={{ scale: .92 }} onClick={() => setPublishOpen(true)} style={{ position: "fixed", right: 18, bottom: 23, zIndex: 30, width: 58, height: 58, borderRadius: "50%", border: `3px solid ${GOLD}99`, background: GOLD, color: "#080d12", boxShadow: "0 12px 35px rgba(240,185,11,.25)", display: "grid", placeItems: "center" }}><Plus size={29} strokeWidth={2.7} /></motion.button>

    <AnimatePresence>{publishOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPublishOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,.72)", display: "flex", alignItems: "flex-end" }}><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={e => e.stopPropagation()} style={{ width: "100%", background: PANEL, borderTop: `1px solid ${BORDER}`, borderRadius: "24px 24px 0 0", padding: "22px 18px calc(28px + env(safe-area-inset-bottom))" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div><div style={{ color: GOLD, fontSize: 10, fontWeight: 850, letterSpacing: ".1em" }}>VENDOR CENTER</div><div style={{ fontSize: 19, fontWeight: 900, marginTop: 5 }}>Publish to Market</div></div><button onClick={() => setPublishOpen(false)} style={{ border: 0, background: "rgba(255,255,255,.06)", color: MUTED, borderRadius: 9, padding: 7 }}><X size={17} /></button></div><div style={{ color: MUTED, fontSize: 11, lineHeight: 1.5, margin: "10px 0 16px" }}>Choose what you want to list or register. Verification and regional settlement will be applied during submission.</div>{[{ label: "Property Listing", route: "/post-property", icon: Building2 }, { label: "Bookable Stay / Villa", route: "/market/bookings?publish=1", icon: Hotel }, { label: "Construction Material", route: "/market/materials?publish=1", icon: Package }, { label: "Register as Service Provider / Trade", route: "/market/services?register=1", icon: Wrench }].map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => { setPublishOpen(false); navigate(item.route); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 13, marginTop: 8, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.025)", color: "#fff", borderRadius: 13, textAlign: "left" }}><div style={{ width: 35, height: 35, borderRadius: 11, display: "grid", placeItems: "center", background: "rgba(240,185,11,.12)", color: GOLD }}><Icon size={17} /></div><span style={{ flex: 1, fontSize: 12, fontWeight: 800 }}>{item.label}</span><ChevronRight size={15} color={MUTED} /></button>; })}</motion.div></motion.div>}</AnimatePresence>
  </div>;
}
