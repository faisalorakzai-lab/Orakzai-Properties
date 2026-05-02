import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, X, LayoutGrid, List,
  ChevronDown, MapPin, Home as HomeIcon, Building2, Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { useListProperties } from "@workspace/api-client-react";
import { Link } from "wouter";

const CITIES = ["Lahore", "Islamabad", "Karachi", "Rawalpindi", "Peshawar"];
const TYPES = [
  { value: "house", label: "Residential", icon: HomeIcon },
  { value: "commercial", label: "Commercial", icon: Building2 },
  { value: "plot", label: "Industrial / Plot", icon: Layers },
];
const CATEGORIES = [
  { value: "buy", label: "Buy", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
  { value: "sell", label: "Sell", color: "text-blue-400 border-blue-500/40 bg-blue-500/10" },
  { value: "rent", label: "Rent", color: "text-violet-400 border-violet-500/40 bg-violet-500/10" },
];
const PRICE_PRESETS = [
  { label: "Any", min: 0, max: 0 },
  { label: "Under 50L", min: 0, max: 5000000 },
  { label: "50L – 1Cr", min: 5000000, max: 10000000 },
  { label: "1Cr – 5Cr", min: 10000000, max: 50000000 },
  { label: "5Cr – 10Cr", min: 50000000, max: 100000000 },
  { label: "Above 10Cr", min: 100000000, max: 0 },
];
const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
];

function PriceInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type="number"
      className="h-9 bg-[#0a1422] border-white/10 text-[#f1f5f9] placeholder:text-[#2a3a50] text-sm rounded-xl focus:border-[#C9A84C]/50"
    />
  );
}

export default function Browse() {
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [type, setType] = useState(searchParams.get("type") || "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pricePreset, setPricePreset] = useState("Any");
  const [sort, setSort] = useState("default");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Always fetch all, filter client-side for instant no-refresh updates
  const { data: allProperties, isLoading } = useListProperties({});

  // Real-time client-side filtering
  const filtered = useMemo(() => {
    if (!allProperties) return [];
    let result = [...allProperties];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          (p.area ?? "").toLowerCase().includes(q),
      );
    }
    if (city) result = result.filter((p) => p.city === city);
    if (category) result = result.filter((p) => p.category === category);
    if (type) result = result.filter((p) => p.type === type);

    const effectiveMin = minPrice ? Number(minPrice) : 0;
    const effectiveMax = maxPrice ? Number(maxPrice) : 0;
    if (effectiveMin > 0) result = result.filter((p) => Number(p.price) >= effectiveMin);
    if (effectiveMax > 0) result = result.filter((p) => Number(p.price) <= effectiveMax);

    // Sort
    if (sort === "price-asc") result.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price-desc") result.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sort === "newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [allProperties, search, city, category, type, minPrice, maxPrice, sort]);

  const applyPreset = (preset: typeof PRICE_PRESETS[0]) => {
    setPricePreset(preset.label);
    setMinPrice(preset.min > 0 ? String(preset.min) : "");
    setMaxPrice(preset.max > 0 ? String(preset.max) : "");
  };

  const clearAll = () => {
    setSearch(""); setCity(""); setCategory(""); setType("");
    setMinPrice(""); setMaxPrice(""); setPricePreset("Any"); setSort("default");
  };

  const hasFilters = search || city || category || type || minPrice || maxPrice;
  const verifiedCount = filtered.filter((p) => p.isVerified).length;

  return (
    <div className="min-h-screen bg-[#070e1a] text-foreground">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-[#C9A84C]/3 blur-[100px]" />
        <div className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full bg-[#1e3a8a]/6 blur-[80px]" />
      </div>

      <Navbar />

      <div className="relative z-10 pt-14 pb-16">
        {/* Page header */}
        <div className="border-b border-white/5 bg-[#070e1a]/95 backdrop-blur-sm sticky top-14 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3">
            {/* Search + controls row */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C9A84C]/70" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, area, city..."
                  className="pl-10 h-10 bg-white/5 border-white/10 text-[#f1f5f9] placeholder:text-[#2a3a50] focus:border-[#C9A84C]/40 rounded-xl transition-colors text-sm"
                  data-testid="input-browse-search"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a6080] hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setFiltersOpen((v) => !v)}
                data-testid="button-filters"
                className={`flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-sm font-medium transition-all ${filtersOpen || hasFilters ? "border-[#C9A84C]/50 bg-[#C9A84C]/8 text-[#C9A84C]" : "border-white/10 bg-white/5 text-[#6a7f99] hover:text-[#C9A84C] hover:border-[#C9A84C]/30"}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:block">Filters</span>
                {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-[#C9A84C] flex-shrink-0" />}
              </button>

              {/* Sort */}
              <div className="relative hidden sm:block">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  data-testid="select-sort"
                  className="h-10 pl-3 pr-8 rounded-xl border border-white/10 bg-white/5 text-[#6a7f99] text-sm appearance-none cursor-pointer hover:border-[#C9A84C]/30 transition-colors focus:outline-none focus:border-[#C9A84C]/50"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#0f1929] text-[#f1f5f9]">{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4a6080] pointer-events-none" />
              </div>

              {/* View mode */}
              <div className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                {(["grid", "list"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${viewMode === m ? "bg-[#C9A84C]/15 text-[#C9A84C]" : "text-[#4a6080] hover:text-[#94a3b8]"}`}
                  >
                    {m === "grid" ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter drawer */}
            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 pb-2 space-y-4">
                    {/* City filter */}
                    <div>
                      <div className="text-[#4a6080] text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> City
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {CITIES.map((c) => (
                          <button
                            key={c}
                            onClick={() => setCity(city === c ? "" : c)}
                            data-testid={`filter-city-${c}`}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${city === c ? "bg-[#C9A84C] border-[#C9A84C] text-[#080f1a] font-bold" : "border-white/10 text-[#6a7f99] hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Category */}
                      <div>
                        <div className="text-[#4a6080] text-[10px] font-bold uppercase tracking-wider mb-2">Status</div>
                        <div className="flex gap-2">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat.value}
                              onClick={() => setCategory(category === cat.value ? "" : cat.value)}
                              data-testid={`filter-cat-${cat.value}`}
                              className={`flex-1 text-xs py-1.5 rounded-xl border font-semibold transition-all ${category === cat.value ? `${cat.color} font-bold` : "border-white/8 text-[#4a6080] hover:text-[#C9A84C]"}`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Type */}
                      <div>
                        <div className="text-[#4a6080] text-[10px] font-bold uppercase tracking-wider mb-2">Property Type</div>
                        <div className="flex gap-2">
                          {TYPES.map((t) => (
                            <button
                              key={t.value}
                              onClick={() => setType(type === t.value ? "" : t.value)}
                              data-testid={`filter-type-${t.value}`}
                              className={`flex-1 text-xs py-1.5 rounded-xl border transition-all font-medium ${type === t.value ? "bg-[#C9A84C]/15 border-[#C9A84C]/50 text-[#C9A84C] font-bold" : "border-white/8 text-[#4a6080] hover:border-[#C9A84C]/30 hover:text-[#C9A84C]"}`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <div className="text-[#4a6080] text-[10px] font-bold uppercase tracking-wider mb-2">Budget (PKR)</div>
                        <div className="flex gap-2">
                          <PriceInput value={minPrice} onChange={setMinPrice} placeholder="Min" />
                          <PriceInput value={maxPrice} onChange={setMaxPrice} placeholder="Max" />
                        </div>
                      </div>
                    </div>

                    {/* Price presets */}
                    <div>
                      <div className="text-[#4a6080] text-[10px] font-bold uppercase tracking-wider mb-2">Quick Budget</div>
                      <div className="flex flex-wrap gap-2">
                        {PRICE_PRESETS.map((p) => (
                          <button
                            key={p.label}
                            onClick={() => applyPreset(p)}
                            data-testid={`preset-${p.label}`}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${pricePreset === p.label ? "bg-[#C9A84C]/15 border-[#C9A84C]/50 text-[#C9A84C] font-bold" : "border-white/8 text-[#4a6080] hover:border-[#C9A84C]/30 hover:text-[#C9A84C]"}`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {hasFilters && (
                      <button onClick={clearAll} className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors">
                        <X className="h-3 w-3" /> Clear all filters
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Active filter pills */}
            {!filtersOpen && hasFilters && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {city && (
                  <span className="flex items-center gap-1.5 text-xs bg-[#C9A84C]/10 border border-[#C9A84C]/25 text-[#C9A84C] px-2.5 py-1 rounded-full">
                    <MapPin className="h-3 w-3" />{city}
                    <button onClick={() => setCity("")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {category && (
                  <span className="flex items-center gap-1 text-xs bg-white/5 border border-white/10 text-[#94a3b8] px-2.5 py-1 rounded-full capitalize">
                    {category} <button onClick={() => setCategory("")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {type && (
                  <span className="flex items-center gap-1 text-xs bg-white/5 border border-white/10 text-[#94a3b8] px-2.5 py-1 rounded-full capitalize">
                    {type} <button onClick={() => setType("")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {(minPrice || maxPrice) && (
                  <span className="flex items-center gap-1 text-xs bg-white/5 border border-white/10 text-[#94a3b8] px-2.5 py-1 rounded-full">
                    {pricePreset !== "Any" ? pricePreset : `PKR ${minPrice || "0"} – ${maxPrice || "∞"}`}
                    <button onClick={() => { setMinPrice(""); setMaxPrice(""); setPricePreset("Any"); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results area */}
        <div className="max-w-7xl mx-auto px-4 pt-6">
          {/* Results meta */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-white font-semibold text-sm">{isLoading ? "—" : filtered.length}</span>
                <span className="text-[#4a6080] text-sm"> properties</span>
              </div>
              {verifiedCount > 0 && (
                <span className="text-[10px] bg-[#C9A84C]/10 border border-[#C9A84C]/25 text-[#C9A84C] px-2 py-0.5 rounded-full font-semibold">
                  {verifiedCount} Verified
                </span>
              )}
            </div>
            {hasFilters && (
              <button onClick={clearAll} className="text-xs text-[#4a6080] hover:text-red-400 flex items-center gap-1 transition-colors">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-white/4 animate-pulse" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  >
                    <PropertyCard
                      {...p}
                      price={Number(p.price)}
                      isVerified={p.isVerified}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              /* List mode */
              <div className="space-y-3">
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.2) }}
                  >
                    <Link href={`/property/${p.id}`}>
                      <div
                        data-testid={`list-row-${p.id}`}
                        className="group flex items-center gap-4 bg-gradient-to-r from-[#0d1e30] to-[#080f1a] border border-[#C9A84C]/15 hover:border-[#C9A84C]/40 rounded-2xl p-4 transition-all cursor-pointer"
                      >
                        <div className="h-16 w-20 rounded-xl overflow-hidden bg-gradient-to-br from-[#0f2040] to-[#162a4a] flex-shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <HomeIcon className="h-6 w-6 text-[#C9A84C]/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-[#e8edf5] text-sm truncate group-hover:text-[#C9A84C] transition-colors">{p.title}</h3>
                            {p.isVerified && (
                              <span className="text-[9px] font-black text-[#C9A84C] border border-[#C9A84C]/40 px-1.5 py-0.5 rounded-full flex-shrink-0">VERIFIED</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[#4a6080] text-xs">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}{p.area ? `, ${p.area}` : ""}</span>
                            <span className="capitalize">{p.type}</span>
                            <span className="capitalize">{p.category}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[#C9A84C] font-bold text-sm">{Number(p.price) >= 10000000 ? `PKR ${(Number(p.price) / 10000000).toFixed(1)} Cr` : `PKR ${(Number(p.price) / 100000).toFixed(0)}L`}</div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-28">
              <div className="h-16 w-16 rounded-2xl bg-white/4 border border-[#C9A84C]/15 flex items-center justify-center mx-auto mb-5">
                <Search className="h-7 w-7 text-[#C9A84C]/30" />
              </div>
              <h3 className="font-serif text-xl text-white mb-2">No Properties Found</h3>
              <p className="text-[#4a6080] text-sm mb-6 max-w-sm mx-auto">Try adjusting your filters or search query to see more listings.</p>
              <Button onClick={clearAll} className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#080f1a] font-bold px-6">
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
