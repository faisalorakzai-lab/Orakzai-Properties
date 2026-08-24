import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Search, X, Building2, KeyRound, Layers3, TrendingUp, Map,
  Hotel, Palmtree, Home, PartyPopper, Calculator, Construction, Vault,
  Users, BrickWall, Gem, Lightbulb, HardHat, Ruler, Sofa, Wrench,
  SunMedium, Droplets, Zap, Snowflake, Paintbrush, Axe, LandPlot,
  FileCheck2, SearchCheck, Scale, Landmark, ShieldCheck, Truck, Sparkles, Camera,
} from "lucide-react";

const GOLD = "#C9A84C";
const BG = "#040b14";
const CARD_BG = "#04080F";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(201,168,76,0.25)";

type ServiceItem = { label: string; icon: React.ElementType; color: string; bg: string; keywords?: string[] };
type ServiceSection = { title: string; items: ServiceItem[] };

const item = (label: string, icon: React.ElementType, color: string, keywords: string[] = []): ServiceItem => ({ label, icon, color, bg: `${color}20`, keywords });

const sections: ServiceSection[] = [
  { title: "Real Estate & Property Hub", items: [
    item("Buy & Sell\nProperties", Building2, "#10b981"), item("Rent & Leases", KeyRound, "#06b6d4"), item("Fractional RWAs", Layers3, "#ec4899"), item("Megaprojects", Building2, GOLD), item("Invest Hub", TrendingUp, "#3b82f6"), item("Land & Plots", Map, "#f97316"),
  ] },
  { title: "Hospitality & Stays (Bookings)", items: [
    item("Hotels & Resorts", Hotel, "#a78bfa"), item("Luxury Villas &\nVacation Stays", Palmtree, "#10b981"), item("Short-term\nApartments", Home, "#06b6d4"), item("Banquet & Event\nSpaces", PartyPopper, "#f97316"),
  ] },
  { title: "Investments & Projects", items: [
    item("Installment\nProjects", Calculator, GOLD), item("Off-Plan\nDevelopments", Construction, "#f97316"), item("High-Yield RWA\nVaults", Vault, "#10b981"), item("Developer\nShowcases", Users, "#8b5cf6"),
  ] },
  { title: "Construction & Materials", items: [
    item("Cement, Steel &\nBricks", BrickWall, "#f97316"), item("Tiles, Sanitary &\nMarble", Gem, "#06b6d4"), item("Electrical &\nLighting", Lightbulb, GOLD), item("Construction\nContractors", HardHat, "#ef4444"),
  ] },
  { title: "Design & Engineering", items: [
    item("Architects & Floor\nPlanners", Ruler, "#3b82f6"), item("Interior Designers", Sofa, "#ec4899"), item("Turnkey\nConstruction", Wrench, "#f97316"), item("Solar Panel\nInstallers", SunMedium, "#10b981"),
  ] },
  { title: "Skilled Trades & Local Services", items: [
    item("Plumbers", Droplets, "#06b6d4"), item("Electricians", Zap, GOLD), item("HVAC & AC\nTechnicians", Snowflake, "#8b5cf6"), item("Painters &\nPolishers", Paintbrush, "#ec4899"), item("Carpenters &\nWoodwork", Axe, "#f97316"), item("Masons &\nCivil Work", LandPlot, "#ef4444"),
  ] },
  { title: "Legal, Verification & Valuation", items: [
    item("Property\nVerification", FileCheck2, "#06b6d4", ["NOC check", "Land Dept verification", "registry audit", "title due diligence"]),
    item("Valuation &\nSurvey", SearchCheck, "#a78bfa", ["bank valuation report", "plot boundary survey", "land measurement", "area verification"]),
    item("Property\nLawyers", Scale, "#f59e0b", ["title deed drafting", "court clearance", "sale agreement", "legal consult"]),
  ] },
  { title: "Financing & Insurance", items: [
    item("Home Loans &\nFinance", Landmark, "#22c55e", ["bank mortgage rates", "Islamic finance", "home finance application", "EMI calculator"]),
    item("Property\nInsurance", ShieldCheck, "#38bdf8", ["home structure cover", "theft coverage", "fire coverage", "insurance quote"]),
  ] },
  { title: "Property Maintenance & Logistics", items: [
    item("Movers &\nPackers", Truck, "#fb923c", ["inter-city relocation", "house shifting", "truck rental", "packing"]),
    item("Cleaning & Pest\nControl", Sparkles, "#10b981", ["deep house wash", "termite treatment", "water tank cleaning", "pest control"]),
    item("CCTV & Security\nSystems", Camera, "#ef4444", ["smart lock", "camera installation", "alarm setup", "access control"]),
  ] },
  { title: "Heavy Machinery & Fleet", items: [
    item("Equipment\nRental", Construction, "#eab308", ["excavator", "crane", "concrete mixer", "dumper leasing", "heavy machinery"]),
  ] },
];

function ServiceGrid({ items, onNavigate }: { items: ServiceItem[]; onNavigate: (item: ServiceItem) => void }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px 8px", padding: "16px 0 0" }}>
    {items.map((service, index) => {
      const Icon = service.icon;
      return <motion.button key={`${service.label}-${index}`} whileHover={{ y: -2 }} whileTap={{ scale: 0.94 }} onClick={() => onNavigate(service)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
        <div style={{ width: 54, height: 54, borderRadius: 16, background: service.bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${service.color}22` }}><Icon size={22} color={service.color} /></div>
        <span style={{ color: "#EAECEF", fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3, maxWidth: 72, whiteSpace: "pre-line" }}>{service.label}</span>
      </motion.button>;
    })}
  </div>;
}

export default function MarketServicesDirectory() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);
  const [searchFocused, setSearchFocused] = useState(false);
  const query = searchQuery.toLowerCase().trim();
  const filteredSections = useMemo(() => sections.map(section => ({ ...section, items: section.items.filter(service => !query || `${service.label} ${section.title} ${(service.keywords ?? []).join(" ")}`.toLowerCase().includes(query)) })).filter(section => section.items.length > 0), [query]);
  const handleNavigate = (service: ServiceItem) => {
    const label = service.label.replace(/\n/g, " ").trim();
    if (label === "Buy & Sell Properties") {
      setLocation("/market/properties?mode=buy-sell");
      return;
    }
    if (label === "Rent & Leases") {
      setLocation("/market/rent");
      return;
    }
    if (label === "Fractional RWAs") {
      setLocation("/market/fractional");
      return;
    }
    if (label === "Megaprojects") {
      setLocation("/market/megaprojects");
      return;
    }
    if (label === "Invest Hub") {
      setLocation("/market/invest");
      return;
    }
    if (label === "Land & Plots") {
      setLocation("/market/plots");
      return;
    }
    if (label === "Cement, Steel & Bricks") {
      setLocation("/construction/raw-materials");
      return;
    }
    if (label === "Tiles, Sanitary & Marble") {
      setLocation("/construction/tiles-sanitary");
      return;
    }
    if (label === "Electrical & Lighting") {
      setLocation("/construction/electrical-lighting");
      return;
    }
    if (label === "Construction Contractors") {
      setLocation("/construction/contractors");
      return;
    }
    if (label === "Architects & Floor Planners") {
      setLocation("/design/architects");
      return;
    }
    if (label === "Interior Designers") {
      setLocation("/design/interior");
      return;
    }
    if (label === "Turnkey Construction") {
      setLocation("/design/turnkey");
      return;
    }
    if (label === "Solar Panel Installers") {
      setLocation("/design/solar");
      return;
    }
    if (label === "Plumbers") {
      setLocation("/services/plumbers");
      return;
    }
    if (label === "Electricians") {
      setLocation("/services/electricians");
      return;
    }
    if (label === "HVAC & AC Technicians") {
      setLocation("/services/hvac");
      return;
    }
    if (label === "Painters & Polishers") {
      setLocation("/services/painters");
      return;
    }
    if (label === "Carpenters & Woodwork") {
      setLocation("/services/carpenters");
      return;
    }
    if (label === "Masons & Civil Work") {
      setLocation("/services/masons");
      return;
    }
    if (label === "Property Verification") {
      setLocation("/services/verification");
      return;
    }
    if (label === "Valuation & Survey") {
      setLocation("/services/valuation");
      return;
    }
    if (label === "Property Lawyers") {
      setLocation("/services/lawyers");
      return;
    }
    if (label === "Home Loans & Finance") {
      setLocation("/finance/home-loans");
      return;
    }
    if (label === "Property Insurance") {
      setLocation("/finance/insurance");
      return;
    }
    if (label === "Movers & Packers") {
      setLocation("/services/movers");
      return;
    }
    if (label === "Cleaning & Pest Control") {
      setLocation("/services/cleaning");
      return;
    }
    if (label === "CCTV & Security Systems") {
      setLocation("/services/security");
      return;
    }
    if (label === "Equipment Rental") {
      setLocation("/construction/machinery");
      return;
    }
    if (label === "Hotels & Resorts") {
      setLocation("/stays/hotels");
      return;
    }
    if (label === "Luxury Villas & Vacation Stays") {
      setLocation("/stays/villas");
      return;
    }
    if (label === "Short-term Apartments") {
      setLocation("/stays/apartments");
      return;
    }
    if (label === "Banquet & Event Spaces") {
      setLocation("/stays/events");
      return;
    }
    if (label === "Installment Projects") {
      setLocation("/invest/investments/installments");
      return;
    }
    if (label === "Off-Plan Developments") {
      setLocation("/invest/off-plan");
      return;
    }
    if (label === "High-Yield RWA Vaults") {
      setLocation("/invest/rwa-vaults");
      return;
    }
    if (label === "Developer Showcases") {
      setLocation("/invest/developers");
      return;
    }
    setLocation(`/market?service=${encodeURIComponent(label)}`);
  };

  return <div style={{ minHeight: "100dvh", width: "100%", background: BG, color: "#F5F5F5", fontFamily: "'Plus Jakarta Sans',sans-serif", paddingBottom: "calc(100px + env(safe-area-inset-bottom))", boxSizing: "border-box", overflowX: "hidden" }}>
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}><div style={{ position: "absolute", top: -100, right: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.06) 0%,transparent 70%)", filter: "blur(80px)" }} /></div>
    <motion.header initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }} style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(4,8,20,0.95)", backdropFilter: "blur(22px)", borderBottom: `1px solid ${BORDER_GOLD}` }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setLocation("/market")} aria-label="Back to Marketplace" style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 6px 6px 0", display: "flex", alignItems: "center" }}><ArrowLeft size={22} color="#EAECEF" /></motion.button>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#EAECEF", letterSpacing: 0.2 }}>Services</span>
        <div style={{ width: 34 }} />
      </div>
    </motion.header>
    <div style={{ position: "relative", zIndex: 1, maxWidth: 600, width: "100%", margin: "0 auto", padding: "20px 16px 0", boxSizing: "border-box" }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, boxShadow: searchFocused ? `0 0 0 2px ${GOLD}44,0 8px 32px rgba(0,0,0,0.4)` : "0 2px 14px rgba(0,0,0,0.2)" }} transition={{ delay: 0.08 }} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.05)", border: `1px solid ${searchFocused ? BORDER_GOLD : BORDER}`, borderRadius: 14, padding: "0 16px", height: 46, transition: "border-color 0.2s" }}>
        <Search size={15} color={searchFocused ? GOLD : "#8B93A7"} />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} placeholder="Search more services" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#F5F5F5", fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif", minWidth: 0 }} />
        {searchQuery && <button onClick={() => setSearchQuery("")} aria-label="Clear search" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={13} color="#8B93A7" /></button>}
      </motion.div>
      {filteredSections.length === 0 ? <div style={{ textAlign: "center", padding: "48px 0", color: "#8B93A7", fontSize: 14 }}>No services found</div> : <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        {filteredSections.map(section => <section key={section.title}><div style={{ marginTop: 28, marginBottom: 4 }}><span style={{ fontSize: 15, fontWeight: 800, color: "#EAECEF" }}>{section.title}</span></div><div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "8px 12px 16px" }}><ServiceGrid items={section.items} onNavigate={handleNavigate} /></div></section>)}
      </motion.div>}
    </div>
  </div>;
}
