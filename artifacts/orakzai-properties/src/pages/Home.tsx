import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search, SlidersHorizontal, Bell, User, ChevronDown,
  Plus, LayoutList, Home as HomeIcon, Building2, KeyRound,
  BookOpen, Shuffle, BarChart3, HardHat, Hammer, MapPin,
  TrendingUp, TrendingDown, Heart, ArrowRight, ShieldCheck,
  Star, Bed, Bath, Maximize2, X,
} from "lucide-react";
import { useUser } from "@/contexts/AuthContext";
import { useKYCStatus } from "@/lib/useKYCStatus";
import KYCGateModal from "@/components/KYCGateModal";

const GOLD = "#F3BA2F";
const BG = "#070B14";
const CARD_BG = "#0D1421";
const BORDER = "rgba(255,255,255,0.08)";

const MOCK_PROPERTIES = [
  {
    id: 1, category: "Buy", type: "buy",
    title: "DHA Phase 6 – 1 Kanal Bungalow",
    location: "DHA Phase 6, Lahore",
    priceLabel: "₨ 4.5 Cr", price: 45000000,
    beds: 5, baths: 5, areaSqFt: 4500,
    roi: null, status: "Available",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80",
    tag: "Hot Deal", tagColor: "#ef4444", verified: true,
  },
  {
    id: 2, category: "Buy", type: "buy",
    title: "Bahria Town Phase 4 – 10 Marla House",
    location: "Bahria Town Phase 4, Lahore",
    priceLabel: "₨ 2.8 Cr", price: 28000000,
    beds: 4, baths: 3, areaSqFt: 2250,
    roi: null, status: "Available",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80",
    tag: "New", tagColor: GOLD, verified: true,
  },
  {
    id: 3, category: "Sell", type: "sell",
    title: "Gulberg III – 5 Marla Commercial Plot",
    location: "Gulberg III, Lahore",
    priceLabel: "₨ 1.5 Cr", price: 15000000,
    beds: 0, baths: 0, areaSqFt: 1125,
    roi: null, status: "Urgent Sale",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80",
    tag: "Urgent", tagColor: "#f97316", verified: true,
  },
  {
    id: 4, category: "Sell", type: "sell",
    title: "Johar Town – 1 Kanal Corner Plot",
    location: "Johar Town, Lahore",
    priceLabel: "₨ 3.2 Cr", price: 32000000,
    beds: 0, baths: 0, areaSqFt: 4500,
    roi: null, status: "Available",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=400&q=80",
    tag: "Corner", tagColor: "#3b82f6", verified: true,
  },
  {
    id: 5, category: "Rent", type: "rent",
    title: "DHA Phase 5 – 2 Bed Apartment",
    location: "DHA Phase 5, Lahore",
    priceLabel: "₨ 85K/mo", price: 85000,
    beds: 2, baths: 2, areaSqFt: 1100,
    roi: null, status: "Available",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80",
    tag: "Furnished", tagColor: "#10b981", verified: true,
  },
  {
    id: 6, category: "Rent", type: "rent",
    title: "Gulberg – 10 Marla Upper Portion",
    location: "Gulberg II, Lahore",
    priceLabel: "₨ 65K/mo", price: 65000,
    beds: 3, baths: 2, areaSqFt: 2000,
    roi: null, status: "Available",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&q=80",
    tag: "Semi-Furnished", tagColor: "#8b5cf6", verified: false,
  },
  {
    id: 7, category: "Booking", type: "booking",
    title: "Azan Smart City – 5 Marla Plot",
    location: "Chakri Road, Rawalpindi",
    priceLabel: "₨ 35L", price: 3500000,
    beds: 0, baths: 0, areaSqFt: 1125,
    roi: "22% p.a.", status: "Phase 1",
    image: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=400&q=80",
    tag: "Pre-Launch", tagColor: GOLD, verified: true,
  },
  {
    id: 8, category: "Booking", type: "booking",
    title: "Capital Smart City – 8 Marla Plot",
    location: "CPEC Route, Islamabad",
    priceLabel: "₨ 55L", price: 5500000,
    beds: 0, baths: 0, areaSqFt: 1800,
    roi: "18% p.a.", status: "Available",
    image: "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=400&q=80",
    tag: "CPEC", tagColor: "#3b82f6", verified: true,
  },
  {
    id: 9, category: "Investment", type: "investment",
    title: "DHA Lahore Phase 9 – Fractional Share",
    location: "DHA Phase 9, Lahore",
    priceLabel: "From ₨ 10L", price: 1000000,
    beds: 0, baths: 0, areaSqFt: 0,
    roi: "16% p.a.", status: "Active",
    image: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=400&q=80",
    tag: "16% ROI", tagColor: "#10b981", verified: true,
  },
  {
    id: 10, category: "Investment", type: "investment",
    title: "Bahria Heights – Commercial Unit",
    location: "Bahria Town, Karachi",
    priceLabel: "From ₨ 25L", price: 2500000,
    beds: 0, baths: 0, areaSqFt: 0,
    roi: "20% p.a.", status: "Funding",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80",
    tag: "20% ROI", tagColor: "#10b981", verified: true,
  },
  {
    id: 11, category: "Construction", type: "construction",
    title: "Grey Structure – 10 Marla DHA",
    location: "DHA Phase 8, Lahore",
    priceLabel: "₨ 85L", price: 8500000,
    beds: 4, baths: 4, areaSqFt: 2250,
    roi: null, status: "In Progress",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=80",
    tag: "70% Done", tagColor: "#f97316", verified: true,
  },
  {
    id: 12, category: "Construction", type: "construction",
    title: "Full Construction – 5 Marla Model Town",
    location: "Model Town, Lahore",
    priceLabel: "₨ 62L", price: 6200000,
    beds: 3, baths: 3, areaSqFt: 1125,
    roi: null, status: "Starting",
    image: "https://images.unsplash.com/photo-1503594384566-461fe158e797?w=400&q=80",
    tag: "New Project", tagColor: "#a78bfa", verified: false,
  },
];

const CATEGORIES = ["All", "Buy", "Sell", "Rent", "Booking", "Investment", "Construction"];

// Services that require KYC verification
const KYC_REQUIRED_TYPES = new Set(["buy", "sell", "booking", "construction"]);

const SERVICES = [
  { icon: HomeIcon, label: "Buy", type: "buy", color: GOLD, bg: "rgba(243,186,47,0.12)", kycRequired: true },
  { icon: ArrowRight, label: "Sell", type: "sell", color: "#10b981", bg: "rgba(16,185,129,0.12)", kycRequired: true },
  { icon: KeyRound, label: "Rent", type: "rent", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", kycRequired: false },
  { icon: BookOpen, label: "Booking", type: "booking", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", kycRequired: true },
  { icon: Shuffle, label: "Token Trade", type: null, color: "#f97316", bg: "rgba(249,115,22,0.12)", href: "/trades", kycRequired: true },
  { icon: BarChart3, label: "Investment", type: "investment", color: "#06b6d4", bg: "rgba(6,182,212,0.12)", kycRequired: false },
  { icon: HardHat, label: "Projects", type: null, color: "#ec4899", bg: "rgba(236,72,153,0.12)", href: "/projects", kycRequired: false },
  { icon: Hammer, label: "Construction", type: "construction", color: "#a78bfa", bg: "rgba(167,139,250,0.12)", kycRequired: true },
];

const MARKET_PULSE = [
  { city: "DHA Lahore", trend: "+12.4%", up: true, desc: "Residential plots" },
  { city: "Bahria Town", trend: "+8.7%", up: true, desc: "Luxury villas" },
  { city: "Gulberg", trend: "+5.2%", up: true, desc: "Commercial units" },
  { city: "Johar Town", trend: "-2.1%", up: false, desc: "Apartments" },
  { city: "Islamabad F-7", trend: "+15.3%", up: true, desc: "Prime plots" },
];

function PropertyCard({ p, onSave, saved }: { p: typeof MOCK_PROPERTIES[0]; onSave: () => void; saved: boolean }) {
  const [, nav] = useLocation();
  const isInvest = p.type === "investment" || p.type === "booking";
  const handleClick = () => isInvest ? nav(`/invest/${p.id}`) : nav(`/property/${p.id}`);
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: "hidden", position: "relative", flexShrink: 0, width: 240, cursor: "pointer" }}
      onClick={handleClick}>
      <div style={{ position: "relative", height: 140 }}>
        <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80"; }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(7,11,20,0.9) 100%)" }} />
        <div style={{ position: "absolute", top: 10, left: 10, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: p.tagColor, color: "#070B14" }}>{p.tag}</div>
        <button onClick={(e) => { e.stopPropagation(); onSave(); }}
          style={{ position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Heart size={14} color={saved ? "#ef4444" : "#fff"} fill={saved ? "#ef4444" : "none"} />
        </button>
        <div style={{ position: "absolute", bottom: 8, left: 10 }}>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 15 }}>{p.priceLabel}</div>
          {p.roi && <div style={{ color: "#10b981", fontSize: 11, fontWeight: 700 }}>{p.roi}</div>}
        </div>
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ color: "#F5F5F5", fontWeight: 600, fontSize: 13, marginBottom: 4, lineHeight: 1.3 }}>{p.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#8B93A7", fontSize: 11, marginBottom: 8 }}>
          <MapPin size={10} color={GOLD} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.location}</span>
        </div>
        {!isInvest && p.beds > 0 && (
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#8B93A7", fontSize: 11 }}><Bed size={10} />{p.beds}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#8B93A7", fontSize: 11 }}><Bath size={10} />{p.baths}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#8B93A7", fontSize: 11 }}><Maximize2 size={10} />{p.areaSqFt.toLocaleString()} ft²</span>
          </div>
        )}
        {isInvest && (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(16,185,129,0.12)", color: "#10b981", fontWeight: 700 }}>{p.status}</span>
        )}
        {p.verified && (
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 6, color: GOLD, fontSize: 10 }}>
            <ShieldCheck size={10} /> Verified
          </div>
        )}
      </div>
    </div>
  );
}

function PropertyListCard({ p, onSave, saved }: { p: typeof MOCK_PROPERTIES[0]; onSave: () => void; saved: boolean }) {
  const [, nav] = useLocation();
  const isInvest = p.type === "investment" || p.type === "booking";
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, display: "flex", gap: 12, padding: 12, cursor: "pointer", alignItems: "flex-start" }}
      onClick={() => isInvest ? nav(`/invest/${p.id}`) : nav(`/property/${p.id}`)}>
      <div style={{ flexShrink: 0, width: 90, height: 80, borderRadius: 12, overflow: "hidden" }}>
        <img src={p.image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80"; }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ color: "#F5F5F5", fontWeight: 600, fontSize: 13, lineHeight: 1.3, flex: 1, marginRight: 8 }}>{p.title}</div>
          <button onClick={(e) => { e.stopPropagation(); onSave(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
            <Heart size={14} color={saved ? "#ef4444" : "#8B93A7"} fill={saved ? "#ef4444" : "none"} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
          <MapPin size={10} color={GOLD} />
          <span style={{ color: "#8B93A7", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.location}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: GOLD, fontWeight: 800, fontSize: 15 }}>{p.priceLabel}</span>
          {p.roi && <span style={{ color: "#10b981", fontSize: 11, fontWeight: 700 }}>{p.roi}</span>}
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: p.tagColor, color: "#070B14" }}>{p.tag}</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { isVerified } = useKYCStatus();

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"scroll" | "list">("scroll");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [priceFilter, setPriceFilter] = useState("all");
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // KYC Gate state
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycModalFeature, setKycModalFeature] = useState<string | undefined>(undefined);

  const filtered = useMemo(() => {
    let list = MOCK_PROPERTIES;
    if (activeCategory !== "All") list = list.filter(p => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    if (priceFilter === "low") list = list.filter(p => p.price < 5000000);
    if (priceFilter === "mid") list = list.filter(p => p.price >= 5000000 && p.price < 30000000);
    if (priceFilter === "high") list = list.filter(p => p.price >= 30000000);
    return list;
  }, [activeCategory, search, priceFilter]);

  const toggleSave = (id: number) => {
    setSavedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleServiceClick = (svc: typeof SERVICES[0]) => {
    // Check KYC for restricted services
    if (svc.kycRequired && !isVerified) {
      setKycModalFeature(svc.label);
      setKycModalOpen(true);
      return;
    }

    if (svc.href) { setLocation(svc.href); return; }
    if (svc.type) {
      const cat = CATEGORIES.find(c => c.toLowerCase() === svc.type!.toLowerCase());
      if (cat) setActiveCategory(cat);
      document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleWalletClick = () => {
    if (!isVerified) {
      setKycModalFeature("Wallet & Deposits");
      setKycModalOpen(true);
      return;
    }
    setLocation("/wallet");
  };

  const cyclePriceFilter = () => {
    const cycle: Record<string, string> = { all: "low", low: "mid", mid: "high", high: "all" };
    setPriceFilter(f => cycle[f]);
  };

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: "#F5F5F5", fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 90 }}>
      {/* KYC Gate Modal */}
      <KYCGateModal
        open={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        featureName={kycModalFeature}
      />

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: 0, right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(243,186,47,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "30%", left: 0, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>

        {/* ── HEADER ── */}
        <div style={{ paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(243,186,47,0.15)", border: "1px solid rgba(243,186,47,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={18} color={GOLD} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 14, color: GOLD, fontFamily: "'Playfair Display', serif", letterSpacing: 1 }}>ORAKZAI</div>
              <div style={{ fontSize: 9, color: "#8B93A7", letterSpacing: 2, textTransform: "uppercase" }}>Properties</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button onClick={() => { setNotifOpen(v => !v); setMenuOpen(false); }}
                style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Bell size={16} color="#8B93A7" />
                <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: GOLD, border: "1.5px solid #070B14" }} />
              </button>
              {notifOpen && (
                <div style={{ position: "absolute", right: 0, top: 44, width: 260, background: "#0D1421", border: "1px solid rgba(243,186,47,0.2)", borderRadius: 16, zIndex: 100, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
                    <button onClick={() => setNotifOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} color="#8B93A7" /></button>
                  </div>
                  {["New listing in DHA Phase 6", "Azan Smart City Phase 1 update", "Price drop: Bahria Town plot"].map((n, i) => (
                    <div key={i} onClick={() => setLocation("/notifications")} style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, flexShrink: 0 }} />
                      <span style={{ color: "#8B93A7", fontSize: 12 }}>{n}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User menu */}
            <div style={{ position: "relative" }}>
              <button onClick={() => { setMenuOpen(v => !v); setNotifOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, cursor: "pointer" }}>
                <User size={14} color={GOLD} />
                <span style={{ color: "#8B93A7", fontSize: 12 }}>{user?.firstName ?? "Menu"}</span>
                <ChevronDown size={12} color="#8B93A7" />
              </button>
              {menuOpen && (
                <div style={{ position: "absolute", right: 0, top: 44, width: 200, background: "#0D1421", border: "1px solid rgba(243,186,47,0.2)", borderRadius: 16, zIndex: 100, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", overflow: "hidden" }}>
                  {[
                    { label: "Post Property", href: "/post-property" },
                    { label: "My Listings", href: "/my-properties" },
                    { label: "Portfolio", href: "/portfolio" },
                    { label: "Wallet", href: "/wallet", kycRequired: true },
                    { label: "Profile", href: "/profile" },
                    { label: "KYC Verification", href: "/kyc" },
                  ].map(item => (
                    <div key={item.label} onClick={() => {
                      if (item.kycRequired && !isVerified) {
                        setMenuOpen(false);
                        setKycModalFeature(item.label);
                        setKycModalOpen(true);
                        return;
                      }
                      setLocation(item.href);
                      setMenuOpen(false);
                    }}
                      style={{ padding: "11px 16px", cursor: "pointer", color: "#8B93A7", fontSize: 13, borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "none")}>
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SEARCH BAR ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "0 14px", height: 46 }}>
            <Search size={16} color={GOLD} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search properties, locations..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#F5F5F5", fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={14} color="#8B93A7" /></button>}
          </div>
          <button onClick={cyclePriceFilter}
            style={{ width: 46, height: 46, borderRadius: 14, background: priceFilter !== "all" ? "rgba(243,186,47,0.15)" : "rgba(255,255,255,0.05)", border: priceFilter !== "all" ? "1px solid rgba(243,186,47,0.4)" : `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <SlidersHorizontal size={16} color={priceFilter !== "all" ? GOLD : "#8B93A7"} />
          </button>
        </div>
        {priceFilter !== "all" && (
          <div style={{ marginBottom: 8, fontSize: 11, color: GOLD, display: "flex", alignItems: "center", gap: 6 }}>
            Price: {priceFilter === "low" ? "Under ₨ 50L" : priceFilter === "mid" ? "₨ 50L – ₨ 3Cr" : "Above ₨ 3Cr"}
            <button onClick={() => setPriceFilter("all")} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={11} color={GOLD} /></button>
          </div>
        )}

        {/* ── CATEGORY FILTER BAR ── */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 16, scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => {
            const active = cat === activeCategory;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ flexShrink: 0, height: 32, padding: "0 16px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", background: active ? "rgba(243,186,47,0.15)" : "rgba(255,255,255,0.04)", border: active ? "1px solid rgba(243,186,47,0.5)" : `1px solid ${BORDER}`, color: active ? GOLD : "#8B93A7", boxShadow: active ? "0 0 16px rgba(243,186,47,0.15)" : "none", transition: "all 0.15s" }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Listings", value: `${filtered.length}` },
            { label: "Verified", value: `${filtered.filter(p => p.verified).length}` },
            { label: "Cities", value: "8" },
            { label: "Saved", value: `${savedIds.size}` },
          ].map(stat => (
            <div key={stat.label} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: GOLD, fontFamily: "'Playfair Display', serif" }}>{stat.value}</div>
              <div style={{ color: "#8B93A7", fontSize: 10, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── SERVICE GRID ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#8B93A7", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Quick Access</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {SERVICES.map(svc => (
              <button key={svc.label} onClick={() => handleServiceClick(svc)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 6px", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, cursor: "pointer", position: "relative" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = svc.color; (e.currentTarget as HTMLElement).style.background = svc.bg; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: svc.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svc.icon size={18} color={svc.color} />
                </div>
                <span style={{ color: "#F5F5F5", fontSize: 10, fontWeight: 600, textAlign: "center" }}>{svc.label}</span>
                {svc.kycRequired && !isVerified && (
                  <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 6px rgba(245,158,11,0.6)" }} />
                )}
              </button>
            ))}
          </div>
          {!isVerified && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(245,158,11,0.7)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
              KYC required for marked services — <button onClick={() => { setKycModalOpen(true); setKycModalFeature("KYC Verification"); }} style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontWeight: 700, fontSize: 11, padding: 0 }}>Verify Now</button>
            </div>
          )}
        </div>

        {/* ── MARKET PULSE ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#8B93A7", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Market Pulse</div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
            {MARKET_PULSE.map(m => (
              <div key={m.city} style={{ flexShrink: 0, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "12px 14px", minWidth: 140 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F5F5F5", marginBottom: 4 }}>{m.city}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {m.up ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
                  <span style={{ fontSize: 13, fontWeight: 800, color: m.up ? "#10b981" : "#ef4444" }}>{m.trend}</span>
                </div>
                <div style={{ fontSize: 10, color: "#8B93A7", marginTop: 2 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── LISTINGS ── */}
        <div id="listings-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#8B93A7", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              {activeCategory === "All" ? "All Listings" : activeCategory} ({filtered.length})
            </div>
            <button onClick={() => setViewMode(v => v === "scroll" ? "list" : "scroll")}
              style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <LayoutList size={14} color="#8B93A7" />
            </button>
          </div>

          {viewMode === "scroll" ? (
            <div style={{ display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 8 }}>
              {filtered.map(p => (
                <PropertyCard key={p.id} p={p} onSave={() => toggleSave(p.id)} saved={savedIds.has(p.id)} />
              ))}
              {filtered.length === 0 && (
                <div style={{ color: "#8B93A7", fontSize: 13, padding: "24px 0" }}>No listings match your filter</div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(p => (
                <PropertyListCard key={p.id} p={p} onSave={() => toggleSave(p.id)} saved={savedIds.has(p.id)} />
              ))}
              {filtered.length === 0 && (
                <div style={{ color: "#8B93A7", fontSize: 13, textAlign: "center", padding: "32px 0" }}>No listings match your filter</div>
              )}
            </div>
          )}
        </div>

        {/* ── POST PROPERTY CTA ── */}
        <div style={{ marginTop: 28 }}>
          <button onClick={() => setLocation("/post-property")}
            style={{ width: "100%", padding: "16px", borderRadius: 18, background: `linear-gradient(135deg, rgba(243,186,47,0.12) 0%, rgba(243,186,47,0.06) 100%)`, border: "1px solid rgba(243,186,47,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Plus size={18} color={GOLD} />
            <span style={{ color: GOLD, fontWeight: 700, fontSize: 14 }}>List Your Property</span>
          </button>
        </div>
      </div>
    </div>
  );
}
