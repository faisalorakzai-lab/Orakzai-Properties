import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Search, Building2, KeyRound, Layers3, Crown, Globe2, Map,
  Hotel, Palmtree, Home, PartyPopper, Calculator, Construction, Vault,
  Users, BrickWall, Gem, Lightbulb, HardHat, Ruler, Sofa, Wrench,
  SunMedium, Droplets, Zap, Snowflake, Paintbrush, Axe, LandPlot,
  ArrowRight, LayoutGrid,
} from "lucide-react";

const GOLD = "#F0B90B";
const BG = "#0B0E11";
const CARD = "#14171d";
const BORDER = "#262c35";

type ServiceItem = { label: string; icon: React.ElementType; color: string };
type ServiceSection = { title: string; items: ServiceItem[] };

const sections: ServiceSection[] = [
  { title: "Real Estate & Property Hub", items: [
    { label: "Buy & Sell Properties", icon: Building2, color: "#10b981" },
    { label: "Rent & Leases", icon: KeyRound, color: "#06b6d4" },
    { label: "Fractional RWAs", icon: Layers3, color: "#ec4899" },
    { label: "Luxury Estates", icon: Crown, color: GOLD },
    { label: "International Properties", icon: Globe2, color: "#3b82f6" },
    { label: "Land & Plots", icon: Map, color: "#f97316" },
  ] },
  { title: "Hospitality & Stays (Bookings)", items: [
    { label: "Hotels & Resorts", icon: Hotel, color: "#a78bfa" },
    { label: "Luxury Villas & Vacation Stays", icon: Palmtree, color: "#10b981" },
    { label: "Short-term Apartments", icon: Home, color: "#06b6d4" },
    { label: "Banquet & Event Spaces", icon: PartyPopper, color: "#f97316" },
  ] },
  { title: "Investments & Projects", items: [
    { label: "Installment Projects", icon: Calculator, color: GOLD },
    { label: "Off-Plan Developments", icon: Construction, color: "#f97316" },
    { label: "High-Yield RWA Vaults", icon: Vault, color: "#10b981" },
    { label: "Developer Showcases", icon: Users, color: "#8b5cf6" },
  ] },
  { title: "Construction & Materials", items: [
    { label: "Cement, Steel & Bricks", icon: BrickWall, color: "#f97316" },
    { label: "Tiles, Sanitary & Marble", icon: Gem, color: "#06b6d4" },
    { label: "Electrical & Lighting", icon: Lightbulb, color: GOLD },
    { label: "Construction Contractors", icon: HardHat, color: "#ef4444" },
  ] },
  { title: "Design & Engineering", items: [
    { label: "Architects & Floor Planners", icon: Ruler, color: "#3b82f6" },
    { label: "Interior Designers", icon: Sofa, color: "#ec4899" },
    { label: "Turnkey Construction Services", icon: Wrench, color: "#f97316" },
    { label: "Solar Panel Installers", icon: SunMedium, color: "#10b981" },
  ] },
  { title: "Skilled Trades & Local Services", items: [
    { label: "Plumbers", icon: Droplets, color: "#06b6d4" },
    { label: "Electricians", icon: Zap, color: GOLD },
    { label: "HVAC & AC Technicians", icon: Snowflake, color: "#8b5cf6" },
    { label: "Painters & Polishers", icon: Paintbrush, color: "#ec4899" },
    { label: "Carpenters & Woodwork", icon: Axe, color: "#f97316" },
    { label: "Masons & Civil Work", icon: LandPlot, color: "#ef4444" },
  ] },
];

export default function MarketServicesDirectory() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = useMemo(() => sections.map(section => ({
    ...section,
    items: section.items.filter(item => !normalizedQuery || item.label.toLowerCase().includes(normalizedQuery) || section.title.toLowerCase().includes(normalizedQuery)),
  })).filter(section => section.items.length > 0), [normalizedQuery]);

  const openService = (label: string) => {
    setLocation(`/market?service=${encodeURIComponent(label)}`);
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white pb-8" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}>
      <header className="sticky top-0 z-30 border-b border-[#262c35] bg-[#0b0e11]/95 px-4 pb-4 pt-[calc(14px+env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button aria-label="Back to Marketplace" onClick={() => setLocation("/market")} className="rounded-xl border border-[#262c35] bg-[#14171d] p-2.5 text-gray-300 transition-colors hover:text-yellow-400 active:scale-95"><ArrowLeft size={18} /></button>
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold tracking-wide">Services</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500">Market Services Directory</p>
          </div>
          <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/10 p-2 text-yellow-400"><LayoutGrid size={18} /></div>
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-2xl border border-[#2b313a] bg-[#14171d] px-3.5 py-3 focus-within:border-yellow-500/60">
          <Search size={17} className="shrink-0 text-gray-500" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search more services, trades, bookings..." className="w-full bg-transparent text-xs text-white outline-none placeholder:text-gray-500" />
        </label>
      </header>

      <main className="px-3 pt-4">
        {filteredSections.map(section => (
          <section key={section.title} className="mb-4 rounded-2xl border border-[#262c35] bg-[#14171d] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-gray-300">{section.title}</h2>
              <span className="text-[10px] font-mono text-gray-500">{section.items.length} services</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {section.items.map(item => {
                const Icon = item.icon;
                return <button key={item.label} onClick={() => openService(item.label)} className="group flex min-h-[92px] flex-col items-center justify-start gap-2 rounded-xl border border-[#262c35] bg-[#0b0e11] px-1.5 py-3 text-center transition-all hover:border-yellow-500/40 hover:bg-[#1a1e27] active:scale-95">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: item.color, background: `${item.color}18` }}><Icon size={20} strokeWidth={1.8} /></span>
                  <span className="line-clamp-3 text-[10px] font-medium leading-tight text-gray-300 group-hover:text-white">{item.label}</span>
                </button>;
              })}
            </div>
          </section>
        ))}
        {filteredSections.length === 0 && <div className="rounded-2xl border border-[#262c35] bg-[#14171d] px-5 py-12 text-center"><Search size={26} className="mx-auto mb-3 text-gray-600" /><p className="text-sm font-bold text-gray-300">No services found</p><p className="mt-1 text-xs text-gray-500">Try a different trade, booking, or property service.</p></div>}
        <button onClick={() => setLocation("/market")} className="mx-auto mt-2 flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2.5 text-xs font-bold text-yellow-400 transition-colors hover:bg-yellow-500/20 active:scale-95">Back to Marketplace <ArrowRight size={14} /></button>
      </main>
    </div>
  );
}
