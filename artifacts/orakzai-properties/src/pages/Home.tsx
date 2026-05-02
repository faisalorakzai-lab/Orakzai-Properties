import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Building2,
  ArrowRight,
  Bell,
  User,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Shield,
  Home as HomeIcon,
  LogOut,
  Plus,
  LayoutList,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Show, useUser, useClerk } from "@clerk/react";
import ServiceGrid from "@/components/ServiceGrid";
import FeaturedSlider from "@/components/FeaturedSlider";
import MarketPulse from "@/components/MarketPulse";
import ProjectBanner from "@/components/ProjectBanner";
import { useGetPropertyStats } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const notifications = [
  { id: 1, dot: "bg-[#C9A84C]", text: "New property listed in DHA Phase 6", time: "2m ago" },
  { id: 2, dot: "bg-emerald-400", text: "Your inquiry for Plot F-11 was viewed", time: "1h ago" },
  { id: 3, dot: "bg-blue-400", text: "Azan Smart City — Phase 1 update posted", time: "3h ago" },
  { id: 4, dot: "bg-violet-400", text: "Price drop alert: Bahria Town listing", time: "1d ago" },
];

function DashboardHeader() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex items-center justify-between mb-6 md:mb-8">
      {/* Greeting */}
      <div>
        <Show when="signed-in">
          <div className="text-[#6a7f99] text-xs font-medium mb-1">Good day</div>
          <h1 className="font-serif text-xl md:text-2xl font-bold text-white">
            {user?.firstName ?? user?.username ?? "Investor"}
          </h1>
        </Show>
        <Show when="signed-out">
          <div className="text-[#6a7f99] text-xs font-medium mb-1">Welcome to</div>
          <h1 className="font-serif text-xl md:text-2xl font-bold text-white">Orakzai Properties</h1>
        </Show>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }}
            data-testid="button-notifications"
            className="relative h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:border-[#C9A84C]/40 flex items-center justify-center text-[#94a3b8] hover:text-[#C9A84C] transition-all"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C9A84C] border border-[#0a1220]" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-80 bg-[#0f1929] border border-[#C9A84C]/20 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">Notifications</span>
                  <span className="text-[10px] bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/25 rounded-full px-2 py-0.5 font-bold">{notifications.length} NEW</span>
                </div>
                <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${n.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[#d0dcea] text-xs leading-relaxed">{n.text}</p>
                          <p className="text-[#4a6080] text-[10px] mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-white/5">
                  <button className="text-[#C9A84C] text-xs font-medium hover:text-[#e8c060] transition-colors">View all notifications</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile */}
        <Show when="signed-in">
          <div ref={userRef} className="relative">
            <button
              onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
              data-testid="button-user-menu"
              className="flex items-center gap-2 h-9 px-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#C9A84C]/40 transition-all"
            >
              <div className="h-5 w-5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center">
                <User className="h-3 w-3 text-[#C9A84C]" />
              </div>
              <span className="text-[#d0dcea] text-xs font-medium hidden sm:block max-w-[80px] truncate">
                {user?.firstName ?? "Account"}
              </span>
              <ChevronDown className="h-3 w-3 text-[#6a7f99]" />
            </button>

            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-52 bg-[#0f1929] border border-[#C9A84C]/20 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="text-[#f1f5f9] text-sm font-medium truncate">{user?.fullName ?? user?.username}</div>
                    <div className="text-[#4a6080] text-[11px] truncate">{user?.primaryEmailAddress?.emailAddress}</div>
                  </div>
                  <div className="py-1">
                    <Link href="/post-property" onClick={() => setUserOpen(false)}>
                      <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 cursor-pointer text-[#d0dcea] text-sm transition-colors">
                        <Plus className="h-4 w-4 text-[#C9A84C]" /> Post Property
                      </div>
                    </Link>
                    <Link href="/my-properties" onClick={() => setUserOpen(false)}>
                      <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 cursor-pointer text-[#d0dcea] text-sm transition-colors">
                        <LayoutList className="h-4 w-4 text-[#C9A84C]" /> My Listings
                      </div>
                    </Link>
                    <div className="mx-3 my-1 border-t border-white/5" />
                    <button
                      onClick={() => signOut({ redirectUrl: `${window.location.origin}${basePath}/` })}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 cursor-pointer text-red-400 text-sm transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Show>

        <Show when="signed-out">
          <Link href="/sign-in">
            <Button size="sm" className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold h-9 px-4 text-xs">
              Sign In
            </Button>
          </Link>
        </Show>
      </div>
    </div>
  );
}

function HeroSearch() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [budget, setBudget] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (city) params.set("city", city);
    if (propertyType) params.set("type", propertyType);
    if (budget) {
      const budgetMap: Record<string, { min?: number; max?: number }> = {
        "under-1cr": { max: 10000000 },
        "1cr-5cr": { min: 10000000, max: 50000000 },
        "5cr-10cr": { min: 50000000, max: 100000000 },
        "above-10cr": { min: 100000000 },
      };
      const range = budgetMap[budget];
      if (range?.min) params.set("minPrice", String(range.min));
      if (range?.max) params.set("maxPrice", String(range.max));
    }
    setLocation(`/browse?${params.toString()}`);
  };

  const hasFilters = city || propertyType || budget;

  return (
    <div className="relative rounded-2xl overflow-hidden mb-6">
      {/* Glassmorphism container */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-xl" />
      <div className="absolute inset-0 border border-[#C9A84C]/25 rounded-2xl" />
      <div className="absolute inset-0 rounded-2xl"
        style={{ boxShadow: "inset 0 1px 0 rgba(201,168,76,0.15), inset 0 -1px 0 rgba(0,0,0,0.2)" }} />

      <div className="relative z-10 p-4 md:p-5">
        {/* Main search row */}
        <div className="flex gap-2.5">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#C9A84C]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by area, project, city..."
              className="pl-10 h-11 bg-white/5 border-white/10 text-[#f1f5f9] placeholder:text-[#4a6080] focus:border-[#C9A84C]/50 transition-colors rounded-xl"
              data-testid="input-hero-search"
            />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            data-testid="button-hero-filters"
            className={`h-11 px-3.5 rounded-xl border flex items-center gap-1.5 text-sm font-medium transition-all ${filtersOpen || hasFilters ? "border-[#C9A84C]/60 bg-[#C9A84C]/10 text-[#C9A84C]" : "border-white/10 bg-white/5 text-[#6a7f99] hover:text-[#C9A84C] hover:border-[#C9A84C]/30"}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:block">Filters</span>
            {hasFilters && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9A84C]" />
            )}
          </button>
          <Button
            onClick={handleSearch}
            className="h-11 px-5 bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold rounded-xl text-sm"
            data-testid="button-hero-search-submit"
          >
            Search
          </Button>
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
              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/8">
                <div>
                  <div className="text-[#6a7f99] text-[10px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </div>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="h-9 bg-white/5 border-white/10 text-[#f1f5f9] text-sm rounded-xl" data-testid="filter-location">
                      <SelectValue placeholder="Any City" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1929] border-[#1e3a5f] text-[#f1f5f9]">
                      <SelectItem value="Lahore">Lahore</SelectItem>
                      <SelectItem value="Islamabad">Islamabad</SelectItem>
                      <SelectItem value="Karachi">Karachi</SelectItem>
                      <SelectItem value="Rawalpindi">Rawalpindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-[#6a7f99] text-[10px] font-semibold uppercase tracking-wider mb-1.5">Property Type</div>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="h-9 bg-white/5 border-white/10 text-[#f1f5f9] text-sm rounded-xl" data-testid="filter-property-type">
                      <SelectValue placeholder="Any Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1929] border-[#1e3a5f] text-[#f1f5f9]">
                      <SelectItem value="plot">Plot</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-[#6a7f99] text-[10px] font-semibold uppercase tracking-wider mb-1.5">Budget</div>
                  <Select value={budget} onValueChange={setBudget}>
                    <SelectTrigger className="h-9 bg-white/5 border-white/10 text-[#f1f5f9] text-sm rounded-xl" data-testid="filter-budget">
                      <SelectValue placeholder="Any Budget" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1929] border-[#1e3a5f] text-[#f1f5f9]">
                      <SelectItem value="under-1cr">Under 1 Crore</SelectItem>
                      <SelectItem value="1cr-5cr">1 – 5 Crore</SelectItem>
                      <SelectItem value="5cr-10cr">5 – 10 Crore</SelectItem>
                      <SelectItem value="above-10cr">Above 10 Crore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setCity(""); setPropertyType(""); setBudget(""); }}
                  className="mt-2 text-[#6a7f99] text-xs hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <X className="h-3 w-3" /> Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick filter pills */}
        {!filtersOpen && (
          <div className="flex flex-wrap gap-2 mt-3">
            {["DHA Lahore", "Bahria Town", "F-11 Islamabad", "Gulberg", "Blue Area"].map((loc) => (
              <button
                key={loc}
                onClick={() => { setSearch(loc); handleSearch(); }}
                className="text-[10px] px-2.5 py-1 rounded-full border border-white/8 bg-white/4 text-[#6a7f99] hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-all"
              >
                {loc}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsStrip() {
  const { data: stats } = useGetPropertyStats();
  const items = [
    { label: "Live Listings", value: `${stats?.total ?? "—"}` },
    { label: "Lahore", value: `${stats?.byCity?.find((c) => c.label === "Lahore")?.count ?? "—"}` },
    { label: "Islamabad", value: `${stats?.byCity?.find((c) => c.label === "Islamabad")?.count ?? "—"}` },
    { label: "Verified", value: "100%" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-6">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 text-center"
        >
          <div className="text-[#C9A84C] font-bold text-base md:text-lg font-serif leading-none">{item.value}</div>
          <div className="text-[#4a6080] text-[10px] mt-1">{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#070e1a] text-foreground">
      {/* Full-page ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#C9A84C]/4 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#1e3a8a]/8 blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-72 h-72 rounded-full bg-[#C9A84C]/3 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-20">
        {/* Dashboard Header with auth */}
        <DashboardHeader />

        {/* Premium Search Bar */}
        <HeroSearch />

        {/* Stats Strip */}
        <StatsStrip />

        {/* Auto-rotating Project Banner */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-[#C9A84C]" />
            <span className="text-[#6a7f99] text-xs font-semibold uppercase tracking-wider">Featured Project</span>
          </div>
          <ProjectBanner />
        </div>

        {/* 6 Service Action Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[#6a7f99] text-xs font-semibold uppercase tracking-wider">Services</div>
          </div>
          <ServiceGrid />
        </div>

        {/* Featured Listings Slider */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[#6a7f99] text-xs font-semibold uppercase tracking-wider mb-1">Premium Listings</div>
              <h2 className="font-serif text-lg font-bold text-white">Featured Properties</h2>
            </div>
            <Link href="/browse">
              <button className="text-[#C9A84C] text-xs font-medium hover:text-[#e8c060] flex items-center gap-1 transition-colors">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
          <FeaturedSlider />
        </div>

        {/* Investment Pulse */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-3.5 w-3.5 text-[#C9A84C]" />
            <div className="text-[#6a7f99] text-xs font-semibold uppercase tracking-wider">Market Intelligence</div>
          </div>
          <MarketPulse />
        </div>

        {/* Why Orakzai — compact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { icon: Shield, title: "Verified Listings", desc: "Every property personally vetted" },
            { icon: Building2, title: "Premium Inventory", desc: "Lahore & Islamabad's finest" },
            { icon: TrendingUp, title: "15+ Years", desc: "Market expertise & intelligence" },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/4 border border-white/8 rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="h-9 w-9 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-4 w-4 text-[#C9A84C]" />
              </div>
              <div>
                <div className="text-[#f1f5f9] text-xs font-semibold">{item.title}</div>
                <div className="text-[#4a6080] text-[11px]">{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#C9A84C]" />
            <span className="font-serif text-[#C9A84C] font-semibold text-sm">Orakzai Properties</span>
          </div>
          <p className="text-[#2a3a50] text-[11px]">© 2025 · Lahore & Islamabad</p>
        </div>
      </div>
    </div>
  );
}
