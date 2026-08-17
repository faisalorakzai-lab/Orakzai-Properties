import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bath, BedDouble, Check, ChevronDown, Filter, Heart, List,
  Map, MapPin, MessageCircle, Search, ShieldCheck, SlidersHorizontal,
  Sparkles, X,
} from "lucide-react";

const GOLD = "#C9A84C";
const BG = "#040b14";
const PANEL = "#0b111a";
const CARD = "#111923";
const LINE = "rgba(255,255,255,.09)";
const DIM = "#8993a1";
const GREEN = "#21c68b";

type Listing = {
  id: number;
  title: string;
  location: string;
  city: string;
  type: string;
  price: string;
  amount: number;
  beds: number;
  baths: number;
  area: string;
  seller: string;
  agencyId: string;
  image: string;
  tag: string;
  verified: boolean;
  lat: number;
  lng: number;
};

const LISTINGS: Listing[] = [
  { id: 101, title: "5 Marla Modern Luxury Villa", location: "DHA Phase 6, Lahore", city: "Lahore", type: "Homes", price: "PKR 2.85 Cr", amount: 28500000, beds: 4, baths: 5, area: "5 Marla · 2,250 Sq Ft", seller: "Sovereign Estates", agencyId: "sovereign-estates", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85", tag: "New", verified: true, lat: 31.4697, lng: 74.4063 },
  { id: 102, title: "1 Kanal Executive Residence", location: "Bahria Town, Lahore", city: "Lahore", type: "Homes", price: "PKR 6.75 Cr", amount: 67500000, beds: 5, baths: 6, area: "1 Kanal · 4,500 Sq Ft", seller: "Orakzai Properties", agencyId: "orakzai-properties", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=85", tag: "Sovereign Verified", verified: true, lat: 31.3612, lng: 74.2028 },
  { id: 103, title: "Sea View Luxury Villa", location: "DHA Phase 8, Karachi", city: "Karachi", type: "Luxury Villas", price: "PKR 22 Cr", amount: 220000000, beds: 7, baths: 8, area: "1.2 Kanal · 12,000 Sq Ft", seller: "Emaar Pakistan", agencyId: "emaar-pakistan", image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=85", tag: "Luxury", verified: true, lat: 24.8607, lng: 67.0011 },
  { id: 104, title: "Corner Commercial Plaza", location: "Blue Area, Islamabad", city: "Islamabad", type: "Commercial", price: "PKR 11.5 Cr", amount: 115000000, beds: 0, baths: 4, area: "5,800 Sq Ft · Corner", seller: "Capital Realty Group", agencyId: "capital-realty", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85", tag: "Income Asset", verified: true, lat: 33.7077, lng: 73.0498 },
  { id: 105, title: "Marina Heights Residence", location: "Dubai Marina, Dubai", city: "Dubai", type: "Luxury Villas", price: "AED 2.8M", amount: 280000000, beds: 3, baths: 3, area: "2,200 Sq Ft · Sea View", seller: "Emaar Properties", agencyId: "emaar-dubai", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=85", tag: "12.4% ROI", verified: true, lat: 25.0805, lng: 55.1403 },
  { id: 106, title: "DHA Phase 9 Commercial Plot", location: "DHA Phase 9, Lahore", city: "Lahore", type: "Plots", price: "PKR 4.2 Cr", amount: 42000000, beds: 0, baths: 0, area: "8 Marla · Main Boulevard", seller: "DHA Authorized Dealer", agencyId: "dha-dealer", image: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=1200&q=85", tag: "Limited Inventory", verified: true, lat: 31.4801, lng: 74.4011 },
];

const CITIES = ["All Cities", "Lahore", "Karachi", "Islamabad", "Dubai"];
const TYPES = ["All Types", "Homes", "Plots", "Commercial", "Luxury Villas"];

export default function BuyProperties() {
  const [, navigate] = useLocation();
  const [city, setCity] = useState("All Cities");
  const [type, setType] = useState("All Types");
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(300000000);
  const [priceOpen, setPriceOpen] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [favorites, setFavorites] = useState<number[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LISTINGS.filter((item) => {
      const matchesCity = city === "All Cities" || item.city === city;
      const matchesType = type === "All Types" || item.type === type;
      const matchesPrice = item.amount <= maxPrice;
      const matchesSearch = !q || `${item.title} ${item.location} ${item.city} ${item.type} ${item.seller} ${item.tag}`.toLowerCase().includes(q);
      return matchesCity && matchesType && matchesPrice && matchesSearch;
    });
  }, [city, type, maxPrice, query]);

  const reset = () => { setCity("All Cities"); setType("All Types"); setMaxPrice(300000000); setQuery(""); };
  const toggleFavorite = (id: number) => setFavorites((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: "#f5f7fa", fontFamily: "'Plus Jakarta Sans', Inter, sans-serif", paddingBottom: "calc(86px + env(safe-area-inset-bottom))" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(4,11,20,.96)", backdropFilter: "blur(18px)", borderBottom: `1px solid ${LINE}` }}>
        <div style={{ height: 58, display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
          <button onClick={() => navigate("/")} aria-label="Back" style={iconButton}><ArrowLeft size={21} /></button>
          <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 850 }}>Buy Properties</div><div style={{ color: DIM, fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", marginTop: 2 }}>Verified real estate marketplace</div></div>
          <button onClick={() => setPriceOpen((v) => !v)} aria-label="Filters" style={iconButton}><SlidersHorizontal size={19} /></button>
        </div>
        <div style={{ padding: "0 14px 11px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 13px", border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL }}><Search size={17} color={DIM} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search properties, areas, agencies..." style={inputStyle} /><span style={{ color: GOLD, fontSize: 10, fontWeight: 800 }}>{filtered.length}</span></div>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "12px 14px 0" }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 9, scrollbarWidth: "none" }}>
          <FilterSelect label={city} options={CITIES} onChange={setCity} />
          <FilterSelect label={type} options={TYPES} onChange={setType} />
          <button onClick={() => setPriceOpen((v) => !v)} style={pillButton}><Filter size={13} /> Price Range</button>
          <button onClick={() => setView(view === "list" ? "map" : "list")} style={{ ...pillButton, color: GOLD, borderColor: `${GOLD}55` }}>{view === "list" ? <Map size={14} /> : <List size={14} />} {view === "list" ? "Map View" : "List View"}</button>
        </div>
        {priceOpen && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 12, padding: 14, background: CARD, border: `1px solid ${LINE}`, borderRadius: 16 }}><div style={{ display: "flex", justifyContent: "space-between", color: DIM, fontSize: 11 }}><span>Maximum price</span><strong style={{ color: GREEN, fontFamily: "monospace" }}>PKR {maxPrice.toLocaleString()}</strong></div><input type="range" min="1000000" max="300000000" step="1000000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ width: "100%", accentColor: GOLD, marginTop: 10 }} /></motion.div>}

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "5px 0 13px" }}><div><div style={{ color: DIM, fontSize: 10, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase" }}>Buy listings</div><h1 style={{ margin: "4px 0 0", fontSize: 21, letterSpacing: "-.03em" }}>{filtered.length} verified properties</h1></div><div style={{ color: DIM, fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={13} color={GOLD} /> Updated live</div></div>

        {view === "map" ? <MapView listings={filtered} onSelect={(id) => navigate(`/market/properties/${id}`)} /> : <div>{filtered.map((item) => <PropertyCard key={item.id} item={item} favorite={favorites.includes(item.id)} onFavorite={() => toggleFavorite(item.id)} onDetails={() => navigate(`/market/properties/${item.id}`)} onChat={() => navigate(`/inbox/${item.agencyId}`)} />)}</div>}

        {!filtered.length && <div style={{ padding: "48px 22px", textAlign: "center", background: CARD, border: `1px solid ${LINE}`, borderRadius: 20 }}><div style={{ width: 48, height: 48, display: "grid", placeItems: "center", margin: "0 auto 13px", borderRadius: 15, background: `${GOLD}18`, color: GOLD }}><Search size={22} /></div><h2 style={{ margin: 0, fontSize: 16 }}>No Properties Found</h2><p style={{ margin: "8px 0 17px", color: DIM, fontSize: 12 }}>Try another city, property type, or price range.</p><button onClick={reset} style={primaryButton}>Reset Filters</button></div>}
      </main>
    </div>
  );
}

function FilterSelect({ label, options, onChange }: { label: string; options: string[]; onChange: (value: string) => void }) {
  return <label style={{ position: "relative", flexShrink: 0 }}><select value={label} onChange={(e) => onChange(e.target.value)} style={{ ...pillButton, appearance: "none", paddingRight: 27, cursor: "pointer" }}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={12} color={DIM} style={{ position: "absolute", right: 9, top: 13, pointerEvents: "none" }} /></label>;
}

function PropertyCard({ item, favorite, onFavorite, onDetails, onChat }: { item: Listing; favorite: boolean; onFavorite: () => void; onDetails: () => void; onChat: () => void }) {
  return <motion.article whileTap={{ scale: .995 }} style={{ marginBottom: 14, overflow: "hidden", background: CARD, border: `1px solid ${LINE}`, borderRadius: 20, boxShadow: "0 12px 28px rgba(0,0,0,.18)" }}>
    <div style={{ position: "relative", height: 190, background: "#1a222d" }}><img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "brightness(.78)" }} /><div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,.35), transparent 40%, rgba(0,0,0,.72))" }} /><div style={{ position: "absolute", left: 12, top: 12, display: "flex", gap: 7 }}><span style={{ padding: "6px 9px", borderRadius: 8, background: item.tag === "New" ? GOLD : "rgba(4,11,20,.82)", color: item.tag === "New" ? BG : "#fff", border: `1px solid ${item.tag === "New" ? GOLD : "rgba(255,255,255,.2)"}`, fontSize: 10, fontWeight: 900 }}>{item.tag}</span>{item.verified && <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 8px", borderRadius: 8, background: "rgba(4,11,20,.82)", color: GREEN, border: `1px solid ${GREEN}55`, fontSize: 9, fontWeight: 800 }}><ShieldCheck size={12} /> Verified</span>}</div><button onClick={(e) => { e.stopPropagation(); onFavorite(); }} aria-label="Favorite property" style={{ position: "absolute", right: 12, top: 12, width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "50%", background: "rgba(4,11,20,.78)", border: `1px solid ${favorite ? `${GOLD}99` : "rgba(255,255,255,.18)"}`, color: favorite ? GOLD : "#fff" }}><Heart size={17} fill={favorite ? GOLD : "none"} /></button><div style={{ position: "absolute", left: 12, right: 12, bottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}><div><div style={{ color: "rgba(255,255,255,.65)", fontSize: 10 }}>Asking price</div><strong style={{ color: GREEN, fontSize: 20, fontFamily: "monospace" }}>{item.price}</strong></div><span style={{ padding: "6px 9px", borderRadius: 9, color: "#fff", background: "rgba(4,11,20,.72)", fontSize: 10, fontWeight: 800 }}>{item.type}</span></div></div>
    <div style={{ padding: 14 }}><h2 style={{ margin: 0, fontSize: 16, fontWeight: 850 }}>{item.title}</h2><div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7, color: DIM, fontSize: 11 }}><MapPin size={14} color={GOLD} /> {item.location}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 13, paddingBottom: 12, borderBottom: `1px solid ${LINE}`, color: DIM, fontSize: 10 }}><span><BedDouble size={13} style={{ verticalAlign: "-3px", marginRight: 4 }} />{item.beds || "—"} Beds</span><span><Bath size={13} style={{ verticalAlign: "-3px", marginRight: 4 }} />{item.baths || "—"} Baths</span><span>▦ {item.area}</span></div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12 }}><div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, color: DIM, fontSize: 10 }}><ShieldCheck size={14} color={GREEN} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.seller}</span></div><span style={{ color: GREEN, fontSize: 9, fontWeight: 800 }}>Sovereign Verified Agency</span></div><div style={{ display: "flex", gap: 8, marginTop: 14 }}><button onClick={onDetails} style={primaryButton}>View Details</button><button onClick={onChat} style={secondaryButton}><MessageCircle size={15} /> Chat</button></div></div>
  </motion.article>;
}

function MapView({ listings, onSelect }: { listings: Listing[]; onSelect: (id: number) => void }) {
  return <div style={{ position: "relative", height: "calc(100dvh - 260px)", minHeight: 440, overflow: "hidden", border: `1px solid ${LINE}`, borderRadius: 20, background: "radial-gradient(circle at 25% 35%, rgba(201,168,76,.12), transparent 25%), linear-gradient(135deg,#101d2b,#0a121d)" }}><div style={{ position: "absolute", inset: 0, opacity: .3, backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)", backgroundSize: "42px 42px" }} /><div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ padding: "8px 10px", borderRadius: 9, background: "rgba(4,11,20,.82)", color: DIM, fontSize: 10 }}><Map size={13} style={{ verticalAlign: "-3px", marginRight: 5 }} /> Live property map</span><span style={{ padding: "8px 10px", borderRadius: 9, background: `${GREEN}18`, color: GREEN, fontSize: 10, fontWeight: 800 }}>{listings.length} pins</span></div>{listings.map((item, index) => <button key={item.id} onClick={() => onSelect(item.id)} style={{ position: "absolute", left: `${18 + ((index * 31) % 68)}%`, top: `${25 + ((index * 19) % 52)}%`, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, border: 0, background: "transparent", color: "#fff" }}><span style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", background: GOLD, boxShadow: `0 0 0 5px ${GOLD}22, 0 7px 18px rgba(0,0,0,.4)` }}><MapPin size={17} style={{ transform: "rotate(45deg)" }} /></span><span style={{ padding: "4px 6px", borderRadius: 6, background: "rgba(4,11,20,.88)", color: GREEN, fontSize: 9, fontWeight: 800, whiteSpace: "nowrap" }}>{item.price}</span></button>)}</div>;
}

const iconButton = { width: 38, height: 38, display: "grid", placeItems: "center", flexShrink: 0, border: 0, borderRadius: 12, background: "transparent", color: "#f5f7fa" } as const;
const inputStyle = { minWidth: 0, flex: 1, border: 0, outline: 0, background: "transparent", color: "#fff", fontSize: 12 } as const;
const pillButton = { display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 10px", background: CARD, color: DIM, fontSize: 10, fontWeight: 750, whiteSpace: "nowrap" } as const;
const primaryButton = { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: 0, borderRadius: 11, padding: "11px 12px", background: GOLD, color: BG, fontSize: 11, fontWeight: 900 } as const;
const secondaryButton = { ...primaryButton, background: "#1a2532", color: "#dce2ea", border: `1px solid ${LINE}` } as const;
