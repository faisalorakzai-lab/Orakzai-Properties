import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search, MapPin, TrendingUp, ChevronRight, X, Filter,
  Building2, HardHat, Star, Clock, Users, ArrowUpRight,
  ChevronDown, SlidersHorizontal, Bookmark, BookmarkCheck,
} from "lucide-react";

const GOLD = "#F3BA2F";
const BG = "#070B14";
const CARD_BG = "#0D1421";
const BORDER = "rgba(255,255,255,0.08)";

// ─── Mock Projects Database ───────────────────────────────────────────────────
const MOCK_PROJECTS = [
  {
    id: 1,
    title: "Azan Smart City",
    subtitle: "Pakistan's first fully integrated smart city development",
    location: "Chakri Road, Rawalpindi",
    city: "Rawalpindi",
    type: "Residential",
    category: "Smart City",
    minInvestment: 2500000,
    minLabel: "₨ 25L",
    roi: "22% p.a.",
    duration: "3 Years",
    status: "Phase 1",
    funded: 68,
    totalValue: 5000000000,
    investors: 342,
    featured: true,
    image: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&q=80",
    tags: ["Smart City", "CPEC", "Featured"],
    priceRange: "high",
  },
  {
    id: 2,
    title: "DHA Lahore Phase 9",
    subtitle: "Premium residential plots in the most sought-after address",
    location: "DHA Phase 9, Lahore",
    city: "Lahore",
    type: "Residential",
    category: "DHA",
    minInvestment: 5000000,
    minLabel: "₨ 50L",
    roi: "16% p.a.",
    duration: "2 Years",
    status: "Active",
    funded: 81,
    totalValue: 2000000000,
    investors: 218,
    featured: false,
    image: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&q=80",
    tags: ["DHA", "Lahore", "Plots"],
    priceRange: "high",
  },
  {
    id: 3,
    title: "Capital Smart City",
    subtitle: "Award-winning smart city on the CPEC corridor near Islamabad",
    location: "CPEC Route, Islamabad",
    city: "Islamabad",
    type: "Mixed Use",
    category: "Smart City",
    minInvestment: 3500000,
    minLabel: "₨ 35L",
    roi: "18% p.a.",
    duration: "4 Years",
    status: "Funding",
    funded: 54,
    totalValue: 8000000000,
    investors: 507,
    featured: true,
    image: "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=600&q=80",
    tags: ["Smart City", "CPEC", "Islamabad"],
    priceRange: "high",
  },
  {
    id: 4,
    title: "Bahria Town Karachi – Heights",
    subtitle: "High-rise commercial & residential units in Pakistan's mega city",
    location: "Bahria Town, Karachi",
    city: "Karachi",
    type: "Commercial",
    category: "High-Rise",
    minInvestment: 1000000,
    minLabel: "₨ 10L",
    roi: "20% p.a.",
    duration: "2 Years",
    status: "Active",
    funded: 73,
    totalValue: 1500000000,
    investors: 891,
    featured: false,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
    tags: ["Commercial", "Karachi", "High-Rise"],
    priceRange: "mid",
  },
  {
    id: 5,
    title: "Gulberg Galleria Lahore",
    subtitle: "Prime commercial plaza in Lahore's business hub",
    location: "Gulberg III, Lahore",
    city: "Lahore",
    type: "Commercial",
    category: "Plaza",
    minInvestment: 2000000,
    minLabel: "₨ 20L",
    roi: "19% p.a.",
    duration: "3 Years",
    status: "Pre-Launch",
    funded: 22,
    totalValue: 900000000,
    investors: 97,
    featured: false,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    tags: ["Commercial", "Lahore", "Gulberg"],
    priceRange: "mid",
  },
  {
    id: 6,
    title: "Blue World City Islamabad",
    subtitle: "Overseas block – Pakistan's largest tourism project",
    location: "Chakri Interchange, Islamabad",
    city: "Islamabad",
    type: "Residential",
    category: "Tourism",
    minInvestment: 500000,
    minLabel: "₨ 5L",
    roi: "14% p.a.",
    duration: "5 Years",
    status: "Active",
    funded: 61,
    totalValue: 3000000000,
    investors: 1240,
    featured: false,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80",
    tags: ["Tourism", "Islamabad", "Overseas"],
    priceRange: "low",
  },
  {
    id: 7,
    title: "Model Town Extension – Villa Park",
    subtitle: "Luxury villas with rooftop gardens in the heart of Lahore",
    location: "Model Town, Lahore",
    city: "Lahore",
    type: "Residential",
    category: "Villas",
    minInvestment: 7500000,
    minLabel: "₨ 75L",
    roi: "17% p.a.",
    duration: "2 Years",
    status: "Funded",
    funded: 100,
    totalValue: 600000000,
    investors: 64,
    featured: false,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80",
    tags: ["Villas", "Lahore", "Luxury"],
    priceRange: "high",
  },
  {
    id: 8,
    title: "Rawalpindi Ring Road Corridor",
    subtitle: "Industrial & commercial plots along the new ring road",
    location: "Ring Road, Rawalpindi",
    city: "Rawalpindi",
    type: "Industrial",
    category: "Industrial",
    minInvestment: 1500000,
    minLabel: "₨ 15L",
    roi: "21% p.a.",
    duration: "3 Years",
    status: "Active",
    funded: 47,
    totalValue: 1200000000,
    investors: 183,
    featured: false,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
    tags: ["Industrial", "Rawalpindi", "Ring Road"],
    priceRange: "mid",
  },
];

const CITIES = ["All Cities", "Lahore", "Islamabad", "Karachi", "Rawalpindi"];
const TYPES = ["All Types", "Residential", "Commercial", "Mixed Use", "Industrial"];
const PRICE_RANGES = [
  { label: "All Prices", value: "all" },
  { label: "Under ₨ 25L", value: "low" },
  { label: "₨ 25L – ₨ 50L", value: "mid" },
  { label: "Above ₨ 50L", value: "high" },
];
const SORT_OPTIONS = [
  { label: "Featured First", value: "featured" },
  { label: "Highest ROI", value: "roi" },
  { label: "Most Funded", value: "funded" },
  { label: "Lowest Min.", value: "minInvest" },
];

function FundingBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? "#10b981" : pct > 60 ? GOLD : "#3b82f6";
  return (
    <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, borderRadius: 3, background: `linear-gradient(90deg, ${color}, ${color}aa)`, transition: "width 0.5s ease" }} />
    </div>
  );
}

function ProjectCard({ p, bookmarked, onBookmark }: { p: typeof MOCK_PROJECTS[0]; bookmarked: boolean; onBookmark: () => void }) {
  const [, setLocation] = useLocation();
  const statusColor = p.status === "Active" ? "#10b981" : p.status === "Funded" ? "#8b5cf6" : p.status === "Funding" ? "#f97316" : p.status === "Phase 1" ? GOLD : "#3b82f6";

  return (
    <div style={{ background: CARD_BG, border: `1px solid ${p.featured ? "rgba(243,186,47,0.3)" : BORDER}`, borderRadius: 20, overflow: "hidden", cursor: "pointer" }}
      onClick={() => setLocation(`/invest/${p.id}`)}>
      {/* Image */}
      <div style={{ position: "relative", height: 160 }}>
        <img src={p.image} alt={p.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80"; }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(7,11,20,0.85) 100%)" }} />
        {p.featured && (
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 4, background: GOLD, borderRadius: 20, padding: "3px 10px" }}>
            <Star size={10} color="#070B14" fill="#070B14" />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#070B14" }}>FEATURED</span>
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); onBookmark(); }}
          style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {bookmarked ? <BookmarkCheck size={14} color={GOLD} /> : <Bookmark size={14} color="#fff" />}
        </button>
        <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{p.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 }}>
            <MapPin size={10} color={GOLD} />{p.location}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px" }}>
        <p style={{ color: "#8B93A7", fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>{p.subtitle}</p>

        {/* Key stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
          {[
            { label: "Min. Invest", value: p.minLabel, color: GOLD },
            { label: "Expected ROI", value: p.roi, color: "#10b981" },
            { label: "Duration", value: p.duration, color: "#F5F5F5" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
              <div style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.value}</div>
              <div style={{ color: "#8B93A7", fontSize: 10, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Funding progress */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#8B93A7", fontSize: 11 }}>Funding Progress</span>
            <span style={{ color: GOLD, fontWeight: 700, fontSize: 12 }}>{p.funded}%</span>
          </div>
          <FundingBar pct={p.funded} />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B93A7", fontSize: 11 }}>
              <Users size={11} />{p.investors.toLocaleString()} investors
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: statusColor, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, display: "inline-block" }} />
              {p.status}
            </span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setLocation(`/invest/${p.id}`); }}
            style={{ display: "flex", alignItems: "center", gap: 4, color: GOLD, fontSize: 12, fontWeight: 700, background: "rgba(243,186,47,0.1)", border: `1px solid rgba(243,186,47,0.25)`, borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}>
            Invest <ArrowUpRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectRow({ p, bookmarked, onBookmark }: { p: typeof MOCK_PROJECTS[0]; bookmarked: boolean; onBookmark: () => void }) {
  const [, setLocation] = useLocation();
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, display: "flex", gap: 12, padding: 12, cursor: "pointer", alignItems: "center" }}
      onClick={() => setLocation(`/invest/${p.id}`)}>
      <div style={{ width: 60, height: 60, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
        <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80"; }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#F5F5F5", fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{p.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B93A7", fontSize: 11, marginBottom: 4 }}>
          <MapPin size={9} color={GOLD} />{p.location}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>{p.minLabel}</span>
          <span style={{ color: "#10b981", fontWeight: 700, fontSize: 12 }}>{p.roi}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        <button onClick={(e) => { e.stopPropagation(); onBookmark(); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
          {bookmarked ? <BookmarkCheck size={14} color={GOLD} /> : <Bookmark size={14} color="#8B93A7" />}
        </button>
        <ChevronRight size={16} color="#8B93A7" />
      </div>
    </div>
  );
}

// ─── Dropdown Helper ──────────────────────────────────────────────────────────
function Dropdown({ label, value, options, onChange }: {
  label: string; value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value)?.label ?? label;
  const active = value !== options[0].value;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 12px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 400, cursor: "pointer", background: active ? "rgba(243,186,47,0.12)" : "rgba(255,255,255,0.04)", border: active ? `1px solid rgba(243,186,47,0.4)` : `1px solid ${BORDER}`, color: active ? GOLD : "#8B93A7", whiteSpace: "nowrap" }}>
        {current} <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
          <div style={{ position: "absolute", top: 40, left: 0, background: "#0D1421", border: `1px solid rgba(243,186,47,0.2)`, borderRadius: 14, zIndex: 100, minWidth: 160, boxShadow: "0 10px 40px rgba(0,0,0,0.6)", overflow: "hidden" }}>
            {options.map(opt => (
              <div key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer", color: value === opt.value ? GOLD : "#8B93A7", fontWeight: value === opt.value ? 700 : 400, background: value === opt.value ? "rgba(243,186,47,0.08)" : "none" }}
                onMouseEnter={e => { if (value !== opt.value) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = value === opt.value ? "rgba(243,186,47,0.08)" : "none"; }}>
                {opt.value === value && "✓ "}{opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Projects Component ───────────────────────────────────────────────────
export default function Projects() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All Cities");
  const [type, setType] = useState("All Types");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const toggleBookmark = (id: number) => {
    setBookmarked(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const filtered = useMemo(() => {
    let list = [...MOCK_PROJECTS];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (city !== "All Cities") list = list.filter(p => p.city === city);
    if (type !== "All Types") list = list.filter(p => p.type === type);
    if (priceRange !== "all") list = list.filter(p => p.priceRange === priceRange);

    list.sort((a, b) => {
      if (sortBy === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (sortBy === "roi") return parseFloat(b.roi) - parseFloat(a.roi);
      if (sortBy === "funded") return b.funded - a.funded;
      if (sortBy === "minInvest") return a.minInvestment - b.minInvestment;
      return 0;
    });

    return list;
  }, [search, city, type, priceRange, sortBy]);

  const hasFilters = city !== "All Cities" || type !== "All Types" || priceRange !== "all";
  const clearFilters = () => { setCity("All Cities"); setType("All Types"); setPriceRange("all"); setSearch(""); };

  const totalInvestors = filtered.reduce((s, p) => s + p.investors, 0);
  const avgRoi = filtered.length ? (filtered.reduce((s, p) => s + parseFloat(p.roi), 0) / filtered.length).toFixed(1) : "0";
  const minInvest = filtered.length ? Math.min(...filtered.map(p => p.minInvestment)) : 0;

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: "#F5F5F5", fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 100 }}>
      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "5%", left: "20%", width: 300, height: 300, borderRadius: "50%", background: "rgba(243,186,47,0.05)", filter: "blur(100px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>

        {/* ── HEADER ──────────────────────────────────────────────────────────── */}
        <div style={{ paddingTop: 52, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(243,186,47,0.12)", border: `1px solid rgba(243,186,47,0.25)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={16} color={GOLD} />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, margin: 0, color: "#fff" }}>
                Investment Projects
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Premium real estate opportunities</p>
            </div>
          </div>
        </div>

        {/* ── LIVE STATS ──────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Active Projects", value: `${filtered.length}` },
            { label: "Min. Investment", value: filtered.length ? (minInvest >= 10000000 ? `₨ ${(minInvest / 10000000).toFixed(1)}Cr` : `₨ ${(minInvest / 100000).toFixed(0)}L`) : "—" },
            { label: "Avg. Return", value: `${avgRoi}% p.a.` },
          ].map(s => (
            <div key={s.label} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, textAlign: "center" }}>
              <div style={{ color: GOLD, fontWeight: 800, fontSize: 18, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
              <div style={{ color: "#8B93A7", fontSize: 11, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── SEARCH BAR ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "0 14px", height: 46 }}>
            <Search size={16} color={GOLD} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects, cities, types..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#F5F5F5", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={14} color="#8B93A7" />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            style={{ width: 46, height: 46, borderRadius: 14, background: showFilters || hasFilters ? "rgba(243,186,47,0.15)" : "rgba(255,255,255,0.05)", border: showFilters || hasFilters ? `1px solid rgba(243,186,47,0.4)` : `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Filter size={16} color={showFilters || hasFilters ? GOLD : "#8B93A7"} />
          </button>
        </div>

        {/* ── FILTER ROW ──────────────────────────────────────────────────────── */}
        {showFilters && (
          <div style={{ marginBottom: 14, padding: 16, background: CARD_BG, borderRadius: 16, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8B93A7", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Filters</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Dropdown label="All Cities" value={city} onChange={setCity}
                options={CITIES.map(c => ({ label: c, value: c }))} />
              <Dropdown label="All Types" value={type} onChange={setType}
                options={TYPES.map(t => ({ label: t, value: t }))} />
              <Dropdown label="All Prices" value={priceRange} onChange={setPriceRange}
                options={PRICE_RANGES} />
              <Dropdown label="Sort By" value={sortBy} onChange={setSortBy}
                options={SORT_OPTIONS} />
            </div>
            {hasFilters && (
              <button onClick={clearFilters}
                style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4, color: "#ef4444", fontSize: 12, background: "none", border: "none", cursor: "pointer" }}>
                <X size={12} /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Quick filter pills */}
        {!showFilters && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16, scrollbarWidth: "none" }}>
            <Dropdown label="City" value={city} onChange={setCity}
              options={CITIES.map(c => ({ label: c, value: c }))} />
            <Dropdown label="Type" value={type} onChange={setType}
              options={TYPES.map(t => ({ label: t, value: t }))} />
            <Dropdown label="Price" value={priceRange} onChange={setPriceRange}
              options={PRICE_RANGES} />
            <Dropdown label="Sort" value={sortBy} onChange={setSortBy}
              options={SORT_OPTIONS} />
            {hasFilters && (
              <button onClick={clearFilters}
                style={{ flexShrink: 0, height: 34, padding: "0 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
                <X size={10} /> Clear
              </button>
            )}
          </div>
        )}

        {/* ── RESULTS HEADER ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <span style={{ color: "#8B93A7", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
              {search ? `Results for "${search}"` : "All Projects"}
            </span>
            <div style={{ color: "#F5F5F5", fontSize: 15, fontWeight: 700, marginTop: 2 }}>
              {filtered.length} {filtered.length === 1 ? "project" : "projects"} · {totalInvestors.toLocaleString()} investors
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setViewMode("cards")}
              style={{ width: 32, height: 32, borderRadius: 8, background: viewMode === "cards" ? "rgba(243,186,47,0.15)" : "rgba(255,255,255,0.04)", border: viewMode === "cards" ? `1px solid rgba(243,186,47,0.4)` : `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SlidersHorizontal size={14} color={viewMode === "cards" ? GOLD : "#8B93A7"} />
            </button>
            <button onClick={() => setViewMode("list")}
              style={{ width: 32, height: 32, borderRadius: 8, background: viewMode === "list" ? "rgba(243,186,47,0.15)" : "rgba(255,255,255,0.04)", border: viewMode === "list" ? `1px solid rgba(243,186,47,0.4)` : `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={14} color={viewMode === "list" ? GOLD : "#8B93A7"} />
            </button>
          </div>
        </div>

        {/* ── PROJECT LIST ──────────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", background: CARD_BG, borderRadius: 20, border: `1px solid ${BORDER}` }}>
            <HardHat size={32} color="#8B93A7" style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ color: "#8B93A7", fontSize: 14 }}>No projects match your filters</div>
            <button onClick={clearFilters}
              style={{ marginTop: 16, padding: "8px 20px", borderRadius: 20, background: GOLD, color: "#070B14", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>
              Clear Filters
            </button>
          </div>
        ) : viewMode === "cards" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map(p => (
              <ProjectCard key={p.id} p={p} bookmarked={bookmarked.has(p.id)} onBookmark={() => toggleBookmark(p.id)} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 11, color: "#8B93A7", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, paddingLeft: 4 }}>
              <ArrowUpRight size={10} style={{ display: "inline", marginRight: 4 }} />ALL PROJECTS
            </div>
            {filtered.map(p => (
              <ProjectRow key={p.id} p={p} bookmarked={bookmarked.has(p.id)} onBookmark={() => toggleBookmark(p.id)} />
            ))}
          </div>
        )}

        {/* ── INVEST CTA ───────────────────────────────────────────────────────── */}
        {filtered.length > 0 && (
          <div style={{ marginTop: 24, background: "linear-gradient(135deg, rgba(243,186,47,0.12), rgba(243,186,47,0.04))", border: `1px solid rgba(243,186,47,0.25)`, borderRadius: 20, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#F5F5F5", fontWeight: 700, fontSize: 15 }}>Start Investing Today</div>
              <div style={{ color: "#8B93A7", fontSize: 12, marginTop: 3 }}>Min. ₨ {(minInvest / 100000).toFixed(0)}L · {avgRoi}% avg return</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: GOLD, color: "#070B14", fontWeight: 700, fontSize: 13, padding: "10px 18px", borderRadius: 12, cursor: "pointer" }}
              onClick={() => filtered[0] && window.location.assign(`/invest/${filtered[0].id}`)}>
              Invest <ArrowUpRight size={14} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
