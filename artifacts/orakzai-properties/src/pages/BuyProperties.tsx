import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import GlobalCityPicker from "@/components/GlobalCityPicker";
import {
  ArrowLeft, Bath, BedDouble, Check, ChevronDown, Filter, Heart, List,
  Map, MapPin, MessageCircle, Search, ShieldCheck, SlidersHorizontal,
  Sparkles, X, CalendarDays, Phone, Building2, Tag, UserRound,
} from "lucide-react";

const GOLD = "#C9A84C";
const BG = "#040b14";
const PANEL = "#0b111a";
const CARD = "#111923";
const LINE = "rgba(255,255,255,.09)";
const DIM = "#8993a1";
const GREEN = "#21c68b";

type Listing = {
  id: number; title: string; location: string; city: string; type: string; price: string;
  amount: number; beds: number; baths: number; area: string; seller: string; agencyId: string;
  image: string; tag: string; verified: boolean; lat: number; lng: number; noc?: string;
};

const LISTINGS: Listing[] = [
  { id: 101, title: "5 Marla Modern Luxury Villa", location: "DHA Phase 6, Lahore", city: "Lahore", type: "Homes", price: "PKR 2.85 Cr", amount: 28500000, beds: 4, baths: 5, area: "5 Marla · 2,250 Sq Ft", seller: "Sovereign Estates", agencyId: "sovereign-estates", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85", tag: "New", verified: true, noc: "NOC Verified", lat: 31.4697, lng: 74.4063 },
  { id: 102, title: "1 Kanal Executive Residence", location: "Bahria Town, Lahore", city: "Lahore", type: "Homes", price: "PKR 6.75 Cr", amount: 67500000, beds: 5, baths: 6, area: "1 Kanal · 4,500 Sq Ft", seller: "Orakzai Properties", agencyId: "orakzai-properties", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=85", tag: "Sovereign Verified", verified: true, noc: "LDA Approved", lat: 31.3612, lng: 74.2028 },
  { id: 103, title: "Sea View Luxury Villa", location: "DHA Phase 8, Karachi", city: "Karachi", type: "Luxury Villas", price: "PKR 22 Cr", amount: 220000000, beds: 7, baths: 8, area: "1.2 Kanal · 12,000 Sq Ft", seller: "Emaar Pakistan", agencyId: "emaar-pakistan", image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=85", tag: "Luxury", verified: true, noc: "NOC Verified", lat: 24.8607, lng: 67.0011 },
  { id: 104, title: "Corner Commercial Plaza", location: "Blue Area, Islamabad", city: "Islamabad", type: "Commercial", price: "PKR 11.5 Cr", amount: 115000000, beds: 0, baths: 4, area: "5,800 Sq Ft · Corner", seller: "Capital Realty Group", agencyId: "capital-realty", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85", tag: "Income Asset", verified: true, noc: "CDA Approved", lat: 33.7077, lng: 73.0498 },
  { id: 105, title: "Marina Heights Residence", location: "Dubai Marina, Dubai", city: "Dubai", type: "Luxury Villas", price: "AED 2.8M", amount: 280000000, beds: 3, baths: 3, area: "2,200 Sq Ft · Sea View", seller: "Emaar Properties", agencyId: "emaar-dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85", tag: "12.4% ROI", verified: true, noc: "NOC Verified", lat: 25.0805, lng: 55.1403 },
  { id: 106, title: "DHA Phase 9 Commercial Plot", location: "DHA Phase 9, Lahore", city: "Lahore", type: "Plots", price: "PKR 4.2 Cr", amount: 42000000, beds: 0, baths: 0, area: "8 Marla · Main Boulevard", seller: "DHA Authorized Dealer", agencyId: "dha-dealer", image: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=1200&q=85", tag: "Limited Inventory", verified: true, noc: "LDA Approved", lat: 31.4801, lng: 74.4011 },
];

const TYPES = ["All Properties", "Residential Houses", "Apartments", "Commercial Outlets", "Plots & Land"];

export default function BuyProperties() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const unified = params.get("mode") === "buy-sell";
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [city, setCity] = useState("All Cities");
  const [type, setType] = useState("All Properties");
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(300000000);
  const [minBeds, setMinBeds] = useState(0);
  const [minBaths, setMinBaths] = useState(0);
  const [nocOnly, setNocOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [tourListing, setTourListing] = useState<Listing | null>(null);
  const [tourDate, setTourDate] = useState("");
  const [tourSubmitted, setTourSubmitted] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LISTINGS.filter((item) => {
      const category = type === "All Properties" ||
        (type === "Residential Houses" && item.type === "Homes") ||
        (type === "Apartments" && item.title.toLowerCase().includes("apartment")) ||
        (type === "Commercial Outlets" && item.type === "Commercial") ||
        (type === "Plots & Land" && item.type === "Plots");
      return (city === "All Cities" || item.city === city) && category && item.amount <= maxPrice &&
        item.beds >= minBeds && item.baths >= minBaths && (!nocOnly || Boolean(item.noc)) &&
        (!q || `${item.title} ${item.location} ${item.city} ${item.type} ${item.seller} ${item.tag} ${item.noc}`.toLowerCase().includes(q));
    });
  }, [city, type, maxPrice, minBeds, minBaths, nocOnly, query]);

  const reset = () => { setCity("All Cities"); setType("All Properties"); setMaxPrice(300000000); setMinBeds(0); setMinBaths(0); setNocOnly(false); setQuery(""); };
  const toggleFavorite = (id: number) => setFavorites((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  const switchMode = (next: "buy" | "sell") => { setMode(next); if (next === "sell") navigate("/market/sell"); };

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: "#f5f7fa", fontFamily: "'Plus Jakarta Sans', Inter, sans-serif", paddingBottom: "calc(86px + env(safe-area-inset-bottom))" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(4,11,20,.96)", backdropFilter: "blur(18px)", borderBottom: `1px solid ${LINE}` }}>
        <div style={{ height: 58, display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
          <button onClick={() => navigate("/")} aria-label="Back" style={iconButton}><ArrowLeft size={21} /></button>
          <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 850 }}>Buy & Sell Properties</div><div style={{ color: DIM, fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", marginTop: 2 }}>Unified property marketplace</div></div>
          <button onClick={() => setFilterOpen((v) => !v)} aria-label="Advanced filters" style={iconButton}><SlidersHorizontal size={19} /></button>
        </div>
        {unified && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, padding: "0 14px 10px" }}><button onClick={() => setMode("buy")} style={{ ...modeButton, ...(mode === "buy" ? activeMode : {}) }}>Buy Properties</button><button onClick={() => switchMode("sell")} style={{ ...modeButton, ...(mode === "sell" ? activeMode : {}) }}>Sell / List Property</button></div>}
        <div style={{ padding: "0 14px 11px" }}><div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL }}><Search size={17} color={DIM} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search properties, areas, agencies..." style={inputStyle} /><span style={{ color: GOLD, fontSize: 10, fontWeight: 800 }}>{filtered.length}</span></div></div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "12px 14px 0" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 9, scrollbarWidth: "none" }}>
          <GlobalCityPicker value={city === "All Cities" ? "" : city} allLabel="All Cities" placeholder="All Cities" onChange={(value) => setCity(value || "All Cities")} style={{ minWidth: 160, flexShrink: 0 }} />
          <FilterSelect label={type} options={TYPES} onChange={setType} />
          <button onClick={() => setFilterOpen((v) => !v)} style={pillButton}><Filter size={13} /> Advanced Filters</button>
          <button onClick={() => setView(view === "list" ? "map" : "list")} style={{ ...pillButton, color: GOLD, borderColor: `${GOLD}55` }}>{view === "list" ? <Map size={14} /> : <List size={14} />} {view === "list" ? "Map View" : "List View"}</button>
        </div>

        <AnimatePresence>{filterOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden", marginBottom: 12 }}><div style={{ padding: 14, background: CARD, border: `1px solid ${LINE}`, borderRadius: 16 }}><div style={{ display: "flex", justifyContent: "space-between", color: DIM, fontSize: 11 }}><span>Maximum price</span><strong style={{ color: GREEN, fontFamily: "monospace" }}>PKR {maxPrice.toLocaleString()}</strong></div><input type="range" min="1000000" max="300000000" step="1000000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ width: "100%", accentColor: GOLD, marginTop: 8 }} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}><NumberFilter label="Min beds" value={minBeds} onChange={setMinBeds} /><NumberFilter label="Min baths" value={minBaths} onChange={setMinBaths} /><button onClick={() => setNocOnly((v) => !v)} style={{ ...smallFilter, color: nocOnly ? GREEN : DIM, borderColor: nocOnly ? `${GREEN}66` : LINE }}>{nocOnly ? <Check size={13} /> : <ShieldCheck size={13} />} NOC only</button></div><button onClick={reset} style={{ ...secondaryButton, width: "100%", marginTop: 12 }}>Reset all filters</button></div></motion.div>}</AnimatePresence>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "5px 0 13px" }}><div><div style={{ color: DIM, fontSize: 10, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>Buy properties</div><h1 style={{ margin: "4px 0 0", fontSize: 21, letterSpacing: "-.03em" }}>{filtered.length} verified listings</h1></div><div style={{ color: DIM, fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={13} color={GOLD} /> Updated live</div></div>
        {view === "map" ? <MapView listings={filtered} onSelect={(id) => navigate(`/market/properties/${id}`)} /> : <div>{filtered.map((item) => <PropertyCard key={item.id} item={item} favorite={favorites.includes(item.id)} onFavorite={() => toggleFavorite(item.id)} onDetails={() => navigate(`/market/properties/${item.id}`)} onChat={() => navigate(`/inbox/${item.agencyId}`)} onTour={() => { setTourListing(item); setTourSubmitted(false); setTourDate(""); }} />)}</div>}
        {!filtered.length && <div style={{ padding: "48px 22px", textAlign: "center", background: CARD, border: `1px solid ${LINE}`, borderRadius: 20 }}><Search size={22} color={GOLD} /><h2 style={{ margin: "13px 0 0", fontSize: 16 }}>No Properties Found</h2><p style={{ margin: "8px 0 17px", color: DIM, fontSize: 12 }}>Try another city, property type, or price range.</p><button onClick={reset} style={primaryButton}>Reset Filters</button></div>}
      </main>

      <AnimatePresence>{tourListing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={overlay}><motion.div initial={{ y: 25 }} animate={{ y: 0 }} style={modal}><button onClick={() => setTourListing(null)} style={{ ...iconButton, marginLeft: "auto" }}><X size={20} /></button>{tourSubmitted ? <div style={{ textAlign: "center", padding: "20px 8px 10px" }}><div style={successIcon}><Check size={24} /></div><h2 style={{ fontSize: 18 }}>Tour request received</h2><p style={{ color: DIM, fontSize: 12 }}>The verified seller will confirm your visit for {tourListing.title}.</p><button onClick={() => setTourListing(null)} style={{ ...primaryButton, width: "100%" }}>Done</button></div> : <><div style={{ color: DIM, fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em" }}>Schedule property tour</div><h2 style={{ margin: "6px 0", fontSize: 18 }}>{tourListing.title}</h2><p style={{ color: DIM, fontSize: 12, marginTop: 0 }}><MapPin size={13} style={{ verticalAlign: "-2px" }} /> {tourListing.location}</p><label style={labelStyle}>Preferred date<input type="date" value={tourDate} onChange={(e) => setTourDate(e.target.value)} style={fieldStyle} /></label><button disabled={!tourDate} onClick={() => setTourSubmitted(true)} style={{ ...primaryButton, width: "100%", opacity: tourDate ? 1 : .45 }}>Request tour</button></>}</motion.div></motion.div>}</AnimatePresence>
    </div>
  );
}

function NumberFilter({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label style={{ ...smallFilter, display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start" }}><span>{label}</span><input type="number" min="0" max="10" value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", background: "transparent", color: "#fff", border: 0, outline: 0, fontSize: 13 }} /></label>; }
function FilterSelect({ label, options, onChange }: { label: string; options: string[]; onChange: (value: string) => void }) { return <label style={{ position: "relative", flexShrink: 0 }}><select value={label} onChange={(e) => onChange(e.target.value)} style={{ ...pillButton, appearance: "none", paddingRight: 27, cursor: "pointer" }}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={12} color={DIM} style={{ position: "absolute", right: 9, top: 13, pointerEvents: "none" }} /></label>; }
function CityFilter({ value, open, search, options, onToggle, onSearch, onChange }: { value: string; open: boolean; search: string; options: string[]; onToggle: () => void; onSearch: (value: string) => void; onChange: (value: string) => void }) { return <div style={{ position: "relative", flexShrink: 0 }}><button onClick={onToggle} style={{ ...pillButton, minWidth: 160, justifyContent: "space-between", cursor: "pointer", borderColor: open ? `${GOLD}88` : LINE, color: open ? GOLD : "#f5f7fa" }}>{value}<ChevronDown size={12} color={open ? GOLD : DIM} /></button>{open && <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 70, width: 265, maxWidth: "calc(100vw - 28px)", padding: 10, background: "#171d26", border: `1px solid ${GOLD}55`, borderRadius: 16, boxShadow: "0 18px 45px rgba(0,0,0,.5)" }}><div style={{ display: "flex", gap: 7, padding: "9px 10px", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 11 }}><Search size={14} color={DIM} /><input autoFocus value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search city or country..." style={{ ...inputStyle, fontSize: 11 }} /></div><div style={{ maxHeight: 260, overflowY: "auto", marginTop: 7 }}><button onClick={() => onChange("All Cities")} style={cityOptionStyle(value === "All Cities")}>All Cities <span style={{ color: DIM, fontSize: 10 }}>432 cities</span></button>{options.map((name) => <button key={name} onClick={() => onChange(name)} style={cityOptionStyle(value === name)}>{name}</button>)}</div></div>}</div>; }
const cityOptionStyle = (active: boolean) => ({ width: "100%", display: "flex", justifyContent: "space-between", border: 0, borderRadius: 9, padding: "10px 9px", background: active ? `${GOLD}18` : "transparent", color: active ? GOLD : "#f5f7fa", textAlign: "left" as const, fontSize: 12 });
function PropertyCard({ item, favorite, onFavorite, onDetails, onChat, onTour }: { item: Listing; favorite: boolean; onFavorite: () => void; onDetails: () => void; onChat: () => void; onTour: () => void }) { return <motion.article whileTap={{ scale: .995 }} style={{ marginBottom: 14, overflow: "hidden", background: CARD, border: `1px solid ${LINE}`, borderRadius: 20, boxShadow: "0 12px 28px rgba(0,0,0,.18)" }}><div style={{ position: "relative", height: 190, background: "#1a222d" }}><img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(.78)" }} /><div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.35), transparent 40%, rgba(0,0,0,.72))" }} /><div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 7 }}><span style={{ padding: "6px 9px", borderRadius: 8, background: item.tag === "New" ? GOLD : "rgba(4,11,20,.82)", color: item.tag === "New" ? BG : "#fff", border: `1px solid ${item.tag === "New" ? GOLD : "rgba(255,255,255,.2)"}`, fontSize: 10, fontWeight: 900 }}>{item.tag}</span>{item.verified && <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", borderRadius: 8, background: "rgba(4,11,20,.82)", color: GREEN, border: `1px solid ${GREEN}55`, fontSize: 9, fontWeight: 800 }}><ShieldCheck size={12} /> Verified</span>}</div><button onClick={(e) => { e.stopPropagation(); onFavorite(); }} aria-label="Favorite property" style={{ position: "absolute", right: 12, top: 12, width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "50%", background: "rgba(4,11,20,.78)", border: `1px solid ${favorite ? `${GOLD}99` : "rgba(255,255,255,.18)"}`, color: favorite ? GOLD : "#fff" }}><Heart size={17} fill={favorite ? GOLD : "none"} /></button><div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}><div><div style={{ color: "rgba(255,255,255,.65)", fontSize: 10 }}>Asking price</div><strong style={{ color: GREEN, fontSize: 20, fontFamily: "monospace" }}>{item.price}</strong></div><span style={{ padding: "6px 9px", borderRadius: 9, color: "#fff", background: "rgba(4,11,20,.72)", fontSize: 10, fontWeight: 800 }}>{item.type}</span></div></div><div style={{ padding: 14 }}><h2 style={{ margin: 0, fontSize: 16, fontWeight: 850 }}>{item.title}</h2><div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7, color: DIM, fontSize: 11 }}><MapPin size={14} color={GOLD} /> {item.location}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 13, paddingBottom: 12, borderBottom: `1px solid ${LINE}`, color: DIM, fontSize: 10 }}><span><BedDouble size={13} style={{ verticalAlign: "-3px", marginRight: 4 }} />{item.beds || "—"} Beds</span><span><Bath size={13} style={{ verticalAlign: "-3px", marginRight: 4 }} />{item.baths || "—"} Baths</span><span>▦ {item.area}</span></div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12, color: DIM, fontSize: 10 }}><span style={{ display: "flex", alignItems: "center", gap: 5 }}><ShieldCheck size={14} color={GREEN} /> {item.seller}</span><span style={{ color: GREEN, fontSize: 9, fontWeight: 800 }}>{item.noc}</span></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginTop: 14 }}><Link href={`/market/properties/${item.id}`} onClick={(event) => { event.stopPropagation(); onDetails(); }} style={{ ...primaryButton, textDecoration: "none" }}>View Details</Link><button onClick={onChat} style={secondaryButton}><MessageCircle size={14} /> Contact</button><button onClick={onTour} style={secondaryButton}><CalendarDays size={14} /> Tour</button></div></div></motion.article>; }
function MapView({ listings, onSelect }: { listings: Listing[]; onSelect: (id: number) => void }) { return <div style={{ position: "relative", height: "calc(100dvh - 260px)", minHeight: 440, overflow: "hidden", border: `1px solid ${LINE}`, borderRadius: 20, background: "radial-gradient(circle at 25% 35%, rgba(201,168,76,.12), transparent 25%), linear-gradient(135deg,#101d2b,#0a121d)" }}><div style={{ position: "absolute", inset: 0, opacity: .3, backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)", backgroundSize: "42px 42px" }} />{listings.map((item, index) => <button key={item.id} onClick={() => onSelect(item.id)} style={{ position: "absolute", left: `${18 + ((index * 31) % 68)}%`, top: `${25 + ((index * 19) % 52)}%`, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: 0, background: "transparent", color: "#fff" }}><span style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", background: GOLD }}><MapPin size={17} style={{ transform: "rotate(45deg)" }} /></span><span style={{ padding: "4px 6px", borderRadius: 6, background: "rgba(4,11,20,.88)", color: GREEN, fontSize: 9, fontWeight: 800, whiteSpace: "nowrap" }}>{item.price}</span></button>)}</div>; }
const iconButton = { width: 38, height: 38, display: "grid", placeItems: "center", flexShrink: 0, border: 0, borderRadius: 12, background: "transparent", color: "#f5f7fa" } as const;
const inputStyle = { minWidth: 0, flex: 1, border: 0, outline: 0, background: "transparent", color: "#fff", fontSize: 12 } as const;
const pillButton = { display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 10px", background: CARD, color: DIM, fontSize: 10, fontWeight: 750, whiteSpace: "nowrap" } as const;
const modeButton = { border: `1px solid ${LINE}`, borderRadius: 11, padding: "10px 8px", background: CARD, color: DIM, fontSize: 11, fontWeight: 850 } as const;
const activeMode = { background: GOLD, borderColor: GOLD, color: BG } as const;
const primaryButton = { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: 0, borderRadius: 11, padding: "11px 12px", background: GOLD, color: BG, fontSize: 11, fontWeight: 900 } as const;
const secondaryButton = { ...primaryButton, background: "#1a2532", color: "#dce2ea", border: `1px solid ${LINE}` } as const;
const smallFilter = { display: "flex", alignItems: "center", justifyContent: "center", gap: 5, border: `1px solid ${LINE}`, borderRadius: 10, padding: "8px 9px", background: PANEL, color: DIM, fontSize: 10, fontWeight: 750 } as const;
const overlay = { position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "end center", background: "rgba(0,0,0,.62)", padding: 14 } as const;
const modal = { width: "min(100%, 520px)", padding: "6px 18px 18px", borderRadius: "22px 22px 12px 12px", background: "#111923", border: `1px solid ${LINE}`, boxShadow: "0 -18px 60px rgba(0,0,0,.55)" } as const;
const labelStyle = { display: "grid", gap: 7, margin: "16px 0", color: DIM, fontSize: 11 } as const;
const fieldStyle = { width: "100%", boxSizing: "border-box" as const, padding: "12px", borderRadius: 11, border: `1px solid ${LINE}`, background: PANEL, color: "#fff", outline: 0 };
const successIcon = { width: 54, height: 54, margin: "0 auto", display: "grid", placeItems: "center", borderRadius: "50%", background: `${GREEN}20`, color: GREEN } as const;
