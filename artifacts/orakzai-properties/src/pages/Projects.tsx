import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { createClient } from "@supabase/supabase-js";
import {
  Search, MapPin, X, Filter,
  Building2, HardHat, Star, Users, ArrowUpRight,
  ChevronDown, SlidersHorizontal, Bookmark, BookmarkCheck,
  ShoppingCart, KeyRound, CreditCard, ChevronRight,
} from "lucide-react";

const GOLD = "#F3BA2F";
const BG = "#070B14";
const CARD_BG = "#0D1421";
const BORDER = "rgba(255,255,255,0.08)";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const SEED_PROJECTS = [
  { id: 1, title: "Azan Smart City", subtitle: "Pakistan's first fully integrated smart city development", location: "Chakri Road, Rawalpindi", city: "Rawalpindi", type: "Residential", listing_type: "marketplace", transaction_type: "buy", min_investment: 2500000, min_label: "₨ 25L", roi: "22% p.a.", duration: "3 Years", status: "Phase 1", funded_percent: 68, total_value: 5000000000, investors: 342, featured: true, image: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&q=80" },
  { id: 2, title: "DHA Lahore Phase 9", subtitle: "Premium residential plots in the most sought-after address", location: "DHA Phase 9, Lahore", city: "Lahore", type: "Residential", listing_type: "marketplace", transaction_type: "buy", min_investment: 5000000, min_label: "₨ 50L", roi: "16% p.a.", duration: "2 Years", status: "Active", funded_percent: 81, total_value: 2000000000, investors: 218, featured: false, image: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&q=80" },
  { id: 3, title: "Capital Smart City", subtitle: "Award-winning smart city on the CPEC corridor", location: "CPEC Route, Islamabad", city: "Islamabad", type: "Mixed Use", listing_type: "marketplace", transaction_type: "installment", min_investment: 3500000, min_label: "₨ 35L", roi: "18% p.a.", duration: "4 Years", status: "Funding", funded_percent: 54, total_value: 8000000000, investors: 507, featured: true, image: "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=600&q=80" },
  { id: 4, title: "Bahria Heights – Karachi", subtitle: "High-rise commercial & residential units in Pakistan's mega city", location: "Bahria Town, Karachi", city: "Karachi", type: "Commercial", listing_type: "marketplace", transaction_type: "rent", min_investment: 1000000, min_label: "₨ 10L", roi: "20% p.a.", duration: "2 Years", status: "Active", funded_percent: 73, total_value: 1500000000, investors: 891, featured: false, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80" },
  { id: 5, title: "Gulberg Galleria Lahore", subtitle: "Prime commercial plaza in Lahore's business hub", location: "Gulberg III, Lahore", city: "Lahore", type: "Commercial", listing_type: "marketplace", transaction_type: "rent", min_investment: 2000000, min_label: "₨ 20L", roi: "19% p.a.", duration: "3 Years", status: "Pre-Launch", funded_percent: 22, total_value: 900000000, investors: 97, featured: false, image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80" },
  { id: 6, title: "Blue World City – Overseas", subtitle: "Pakistan's largest tourism project on CPEC route", location: "Chakri Interchange, Islamabad", city: "Islamabad", type: "Residential", listing_type: "marketplace", transaction_type: "installment", min_investment: 500000, min_label: "₨ 5L", roi: "14% p.a.", duration: "5 Years", status: "Active", funded_percent: 61, total_value: 3000000000, investors: 1240, featured: false, image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80" },
  { id: 7, title: "Orakzai Heights – Tower", subtitle: "25-storey luxury mixed-use tower in DHA Lahore", location: "DHA Phase 6, Lahore", city: "Lahore", type: "Mixed Use", listing_type: "construction", transaction_type: "buy", min_investment: 5000000, min_label: "₨ 50L", roi: "22% p.a.", duration: "36 Months", status: "Phase 2", funded_percent: 55, total_value: 2500000000, investors: 189, featured: true, image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80" },
  { id: 8, title: "Ring Road Corridor", subtitle: "Industrial & commercial plots along the new ring road", location: "Ring Road, Rawalpindi", city: "Rawalpindi", type: "Industrial", listing_type: "construction", transaction_type: "buy", min_investment: 1500000, min_label: "₨ 15L", roi: "21% p.a.", duration: "3 Years", status: "Active", funded_percent: 47, total_value: 1200000000, investors: 183, featured: false, image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80" },
];

type Project = typeof SEED_PROJECTS[0];

function FundingBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? "#10b981" : pct > 60 ? GOLD : "#3b82f6";
  return (
    <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, borderRadius: 3, background: `linear-gradient(90deg, ${color}, ${color}aa)`, transition: "width 0.5s ease" }} />
    </div>
  );
}

function ProjectCard({ p, bookmarked, onBookmark }: { p: Project; bookmarked: boolean; onBookmark: () => void }) {
  const [, setLocation] = useLocation();
  const statusColor = p.status === "Active" ? "#10b981" : p.status === "Funded" ? "#8b5cf6" : p.status === "Funding" ? "#f97316" : GOLD;
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${p.featured ? "rgba(243,186,47,0.3)" : BORDER}`, borderRadius: 20, overflow: "hidden", cursor: "pointer" }}
      onClick={() => setLocation(`/invest/${p.id}`)}>
      <div style={{ position: "relative", height: 160 }}>
        <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
      <div style={{ padding: "14px 16px" }}>
        <p style={{ color: "#8B93A7", fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>{p.subtitle}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
          {[
            { label: "Min. Invest", value: p.min_label, color: GOLD },
            { label: "Expected ROI", value: p.roi, color: "#10b981" },
            { label: "Duration", value: p.duration, color: "#F5F5F5" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
              <div style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.value}</div>
              <div style={{ color: "#8B93A7", fontSize: 10, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#8B93A7", fontSize: 11 }}>Funding Progress</span>
            <span style={{ color: GOLD, fontWeight: 700, fontSize: 12 }}>{p.funded_percent}%</span>
          </div>
          <FundingBar pct={p.funded_percent} />
        </div>
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

function ProjectRow({ p, bookmarked, onBookmark }: { p: Project; bookmarked: boolean; onBookmark: () => void }) {
  const [, setLocation] = useLocation();
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, display: "flex", gap: 12, padding: 12, cursor: "pointer", alignItems: "center" }}
      onClick={() => setLocation(`/invest/${p.id}`)}>
      <div style={{ width: 60, height: 60, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
        <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#F5F5F5", fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{p.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B93A7", fontSize: 11, marginBottom: 4 }}>
          <MapPin size={9} color={GOLD} />{p.location}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>{p.min_label}</span>
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

function Dropdown({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
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
                style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer", color: value === opt.value ? GOLD : "#8B93A7", fontWeight: value === opt.value ? 700 : 400, background: value === opt.value ? "rgba(243,186,47,0.08)" : "none" }}>
                {opt.value === value && "✓ "}{opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const SECTION_TABS = [
  { key: "marketplace", label: "Marketplace", icon: ShoppingCart, color: GOLD, bg: "rgba(243,186,47,0.12)" },
  { key: "construction", label: "Construction", icon: HardHat, color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
];

const MARKETPLACE_TABS = [
  { key: "all",         label: "All",         icon: Building2,    color: GOLD,      activeBg: "rgba(243,186,47,0.12)" },
  { key: "buy",         label: "Buy",         icon: ShoppingCart, color: "#10b981", activeBg: "rgba(16,185,129,0.12)" },
  { key: "rent",        label: "Rent",        icon: KeyRound,     color: "#8b5cf6", activeBg: "rgba(139,92,246,0.12)" },
  { key: "installment", label: "Installment", icon: CreditCard,   color: "#3b82f6", activeBg: "rgba(59,130,246,0.12)" },
];

const CITIES = ["All Cities", "Lahore", "Islamabad", "Karachi", "Rawalpindi"];
const TYPES  = ["All Types", "Residential", "Commercial", "Mixed Use", "Industrial"];

export default function Projects() {
  const [section, setSection]     = useState<"marketplace" | "construction">("marketplace");
  const [subCat, setSubCat]       = useState("all");
  const [search, setSearch]       = useState("");
  const [city, setCity]           = useState("All Cities");
  const [type, setType]           = useState("All Types");
  const [sortBy, setSortBy]       = useState("featured");
  const [viewMode, setViewMode]   = useState<"cards" | "list">("cards");
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [projects, setProjects]   = useState<Project[]>(SEED_PROJECTS);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    supabase.from("investment_projects").select("*").order("featured", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setProjects(data as Project[]);
        setLoading(false);
      });
  }, []);

  const toggleBookmark = (id: number) =>
    setBookmarked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = useMemo(() => {
    let list = projects.filter(p =>
      section === "construction"
        ? p.listing_type === "construction"
        : p.listing_type === "marketplace" || !p.listing_type
    );
    if (section === "marketplace" && subCat !== "all")
      list = list.filter(p => p.transaction_type === subCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.city.toLowerCase().includes(q));
    }
    if (city !== "All Cities") list = list.filter(p => p.city === city);
    if (type !== "All Types") list = list.filter(p => p.type === type);
    list.sort((a, b) => {
      if (sortBy === "featured") return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (sortBy === "roi") return parseFloat(b.roi) - parseFloat(a.roi);
      if (sortBy === "funded") return b.funded_percent - a.funded_percent;
      if (sortBy === "minInvest") return a.min_investment - b.min_investment;
      return 0;
    });
    return list;
  }, [projects, section, subCat, search, city, type, sortBy]);

  const totalInvestors = filtered.reduce((s, p) => s + p.investors, 0);
  const avgRoi = filtered.length ? (filtered.reduce((s, p) => s + parseFloat(p.roi), 0) / filtered.length).toFixed(1) : "0";
  const minInvest = filtered.length ? Math.min(...filtered.map(p => p.min_investment)) : 0;
  const hasFilters = city !== "All Cities" || type !== "All Types";
  const clearFilters = () => { setCity("All Cities"); setType("All Types"); setSearch(""); };

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: "#F5F5F5", fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 100 }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "5%", left: "20%", width: 300, height: 300, borderRadius: "50%", background: "rgba(243,186,47,0.05)", filter: "blur(100px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>

        {/* HEADER */}
        <div style={{ paddingTop: 52, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(243,186,47,0.12)", border: `1px solid rgba(243,186,47,0.25)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={16} color={GOLD} />
            </div>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, margin: 0, color: "#fff" }}>Investment Projects</h1>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Premium real estate opportunities</p>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Active Projects", value: `${filtered.length}` },
            { label: "Min. Investment", value: filtered.length ? (minInvest >= 10000000 ? `₨ ${(minInvest/10000000).toFixed(1)}Cr` : `₨ ${(minInvest/100000).toFixed(0)}L`) : "—" },
            { label: "Avg. Return", value: `${avgRoi}% p.a.` },
          ].map(s => (
            <div key={s.label} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, textAlign: "center" }}>
              <div style={{ color: GOLD, fontWeight: 800, fontSize: 18, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
              <div style={{ color: "#8B93A7", fontSize: 11, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* SECTION TABS: Marketplace | Construction */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {SECTION_TABS.map(tab => {
            const active = section === tab.key;
            const Icon = tab.icon;
            return (
              <button key={tab.key}
                onClick={() => { setSection(tab.key as "marketplace" | "construction"); setSubCat("all"); }}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 10px", borderRadius: 16, cursor: "pointer", background: active ? tab.bg : "rgba(255,255,255,0.04)", border: `1.5px solid ${active ? tab.color : BORDER}`, boxShadow: active ? `0 0 20px ${tab.color}22` : "none", transition: "all 0.15s" }}>
                <Icon size={16} color={active ? tab.color : "#8B93A7"} />
                <span style={{ fontWeight: 700, fontSize: 14, color: active ? tab.color : "#8B93A7" }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* MARKETPLACE SUB-TABS */}
        {section === "marketplace" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {MARKETPLACE_TABS.map(tab => {
              const active = subCat === tab.key;
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setSubCat(tab.key)}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 6px", borderRadius: 14, cursor: "pointer", background: active ? tab.activeBg : "rgba(255,255,255,0.04)", border: `1.5px solid ${active ? tab.color : BORDER}`, transition: "all 0.15s" }}>
                  <Icon size={14} color={active ? tab.color : "#8B93A7"} />
                  <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? tab.color : "#8B93A7" }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* CONSTRUCTION HEADER */}
        {section === "construction" && (
          <div style={{ marginBottom: 16, padding: "14px 16px", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <HardHat size={20} color="#a78bfa" />
            <div>
              <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 13 }}>Construction Projects</div>
              <div style={{ color: "#8B93A7", fontSize: 11 }}>Active building & development — invest in ongoing construction</div>
            </div>
          </div>
        )}

        {/* SEARCH */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "0 14px", height: 46 }}>
            <Search size={16} color={GOLD} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects, cities, types..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#F5F5F5", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} color="#8B93A7" /></button>}
          </div>
        </div>

        {/* FILTER ROW */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16, scrollbarWidth: "none" }}>
          <Dropdown label="City" value={city} onChange={setCity} options={CITIES.map(c => ({ label: c, value: c }))} />
          <Dropdown label="Type" value={type} onChange={setType} options={TYPES.map(t => ({ label: t, value: t }))} />
          <Dropdown label="Sort" value={sortBy} onChange={setSortBy}
            options={[{ label: "Featured First", value: "featured" }, { label: "Highest ROI", value: "roi" }, { label: "Most Funded", value: "funded" }, { label: "Lowest Min.", value: "minInvest" }]} />
          {hasFilters && (
            <button onClick={clearFilters} style={{ flexShrink: 0, height: 34, padding: "0 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
              <X size={10} /> Clear
            </button>
          )}
        </div>

        {/* RESULTS HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <span style={{ color: "#8B93A7", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>All Projects</span>
            <div style={{ color: "#F5F5F5", fontSize: 15, fontWeight: 700, marginTop: 2 }}>
              {loading ? "Loading..." : `${filtered.length} ${filtered.length === 1 ? "project" : "projects"} · ${totalInvestors.toLocaleString()} investors`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["cards", "list"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                style={{ width: 32, height: 32, borderRadius: 8, background: viewMode === m ? "rgba(243,186,47,0.15)" : "rgba(255,255,255,0.04)", border: viewMode === m ? `1px solid rgba(243,186,47,0.4)` : `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m === "cards" ? <SlidersHorizontal size={14} color={viewMode === m ? GOLD : "#8B93A7"} /> : <Filter size={14} color={viewMode === m ? GOLD : "#8B93A7"} />}
              </button>
            ))}
          </div>
        </div>

        {/* PROJECT LIST */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 16px" }}>
            <div style={{ width: 36, height: 36, border: `2px solid ${GOLD}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ color: "#8B93A7", fontSize: 13 }}>Loading projects...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px", background: CARD_BG, borderRadius: 20, border: `1px solid ${BORDER}` }}>
            <HardHat size={32} color="#8B93A7" style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ color: "#8B93A7", fontSize: 14 }}>No projects match your filters</div>
            <button onClick={clearFilters} style={{ marginTop: 16, padding: "8px 20px", borderRadius: 20, background: GOLD, color: "#070B14", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>Clear Filters</button>
          </div>
        ) : viewMode === "cards" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map(p => <ProjectCard key={p.id} p={p} bookmarked={bookmarked.has(p.id)} onBookmark={() => toggleBookmark(p.id)} />)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(p => <ProjectRow key={p.id} p={p} bookmarked={bookmarked.has(p.id)} onBookmark={() => toggleBookmark(p.id)} />)}
          </div>
        )}
      </div>
    </div>
  );
}
