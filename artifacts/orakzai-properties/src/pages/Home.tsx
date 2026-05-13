import { Component, type ReactNode, useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, User, ChevronDown, TrendingUp, TrendingDown,
  ArrowRight, LogOut, Plus, LayoutList, Home as HomeIcon,
  Building2, KeyRound, BookOpen, Shuffle, BarChart3,
  HardHat, Hammer, ShieldCheck, MapPin, Wallet, Activity,
  SlidersHorizontal, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Show, useUser, useClerk } from "@clerk/react";
import ProjectBanner from "@/components/ProjectBanner";
import MarketPulse from "@/components/MarketPulse";
import FeaturedSlider from "@/components/FeaturedSlider";
import {
  useGetPropertyStats,
  useListInvestmentProjects,
  useGetPortfolioDashboard,
} from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const GOLD = "#F3BA2F";

// ─── Error Boundary ───────────────────────────────────────────────────────────
class SectionBoundary extends Component<{ children: ReactNode; name: string }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-xs">Could not load {this.props.name}</span>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Notifications ────────────────────────────────────────────────────────────
const NOTIFS = [
  { id: 1, dot: "bg-[#F3BA2F]", text: "New property listed in DHA Phase 6", time: "2m ago" },
  { id: 2, dot: "bg-emerald-400", text: "Your inquiry for Plot F-11 was viewed", time: "1h ago" },
  { id: 3, dot: "bg-blue-400", text: "Azan Smart City — Phase 1 update posted", time: "3h ago" },
  { id: 4, dot: "bg-violet-400", text: "Price drop alert: Bahria Town listing", time: "1d ago" },
];

// ─── Header ───────────────────────────────────────────────────────────────────
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
    <div className="flex items-center justify-between mb-5">
      <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <img src="/logo-shield.png" alt="Orakzai" className="h-9 w-9 object-contain drop-shadow-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div>
            <div className="font-bold text-sm leading-tight tracking-wide" style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>
              ORAKZAI
            </div>
            <div className="text-[#8B93A7] text-[9px] tracking-[0.15em] uppercase leading-tight">Properties</div>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(v => !v); setUserOpen(false); }}
            className="relative h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Bell className="h-4 w-4 text-[#8B93A7]" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border border-[#070B14]" style={{ background: GOLD }} />
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-72 rounded-2xl overflow-hidden z-50 shadow-2xl shadow-black/60"
                style={{ background: "#0D1421", border: `1px solid rgba(243,186,47,0.2)` }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[#F5F5F5] text-sm font-semibold">Notifications</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(243,186,47,0.15)", color: GOLD }}>
                    {NOTIFS.length} NEW
                  </span>
                </div>
                {NOTIFS.map(n => (
                  <div key={n.id} className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-start gap-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${n.dot}`} />
                    <div>
                      <p className="text-[#8B93A7] text-xs">{n.text}</p>
                      <p className="text-white/30 text-[10px] mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2.5">
                  <Link href="/notifications">
                    <button className="text-xs font-medium" style={{ color: GOLD }}>View all notifications</button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Show when="signed-in">
          <div ref={userRef} className="relative">
            <button onClick={() => { setUserOpen(v => !v); setNotifOpen(false); }}
              className="flex items-center gap-2 h-9 px-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="h-5 w-5 rounded-full flex items-center justify-center"
                style={{ background: "rgba(243,186,47,0.2)", border: `1px solid rgba(243,186,47,0.4)` }}>
                <User className="h-3 w-3" style={{ color: GOLD }} />
              </div>
              <span className="text-[#8B93A7] text-xs font-medium hidden sm:block max-w-[80px] truncate">
                {user?.firstName ?? "Account"}
              </span>
              <ChevronDown className="h-3 w-3 text-[#8B93A7]" />
            </button>
            <AnimatePresence>
              {userOpen && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-52 rounded-2xl overflow-hidden z-50 shadow-2xl shadow-black/60"
                  style={{ background: "#0D1421", border: `1px solid rgba(243,186,47,0.2)` }}>
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="text-[#F5F5F5] text-sm font-medium truncate">{user?.fullName ?? user?.username}</div>
                    <div className="text-white/30 text-[11px] truncate">{user?.primaryEmailAddress?.emailAddress}</div>
                  </div>
                  <div className="py-1">
                    <Link href="/post-property" onClick={() => setUserOpen(false)}>
                      <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 text-[#8B93A7] text-sm cursor-pointer">
                        <Plus className="h-4 w-4" style={{ color: GOLD }} /> Post Property
                      </div>
                    </Link>
                    <Link href="/my-properties" onClick={() => setUserOpen(false)}>
                      <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 text-[#8B93A7] text-sm cursor-pointer">
                        <LayoutList className="h-4 w-4" style={{ color: GOLD }} /> My Listings
                      </div>
                    </Link>
                    <div className="mx-3 my-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />
                    <button onClick={() => signOut({ redirectUrl: `${window.location.origin}${basePath}/` })}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 text-red-400 text-sm">
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
            <Button size="sm" className="font-bold h-9 px-4 text-xs rounded-xl"
              style={{ background: GOLD, color: "#070B14" }}>
              Sign In
            </Button>
          </Link>
        </Show>
      </div>
    </div>
  );
}

// ─── Hero Search ──────────────────────────────────────────────────────────────
const CATEGORIES = ["Buy", "Sale", "Rent", "Booking", "Trade", "Investment"];

function HeroSearch() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Buy");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("category", activeCategory.toLowerCase());
    setLocation(`/browse?${params.toString()}`);
  };

  return (
    <div className="mb-5">
      <div className="flex gap-2 p-1.5 rounded-2xl mb-3"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: GOLD }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search Properties & Projects"
            className="w-full h-11 pl-10 pr-3 rounded-xl text-sm outline-none bg-transparent"
            style={{ color: "#F5F5F5" }}
          />
        </div>
        <button onClick={() => setLocation("/browse")}
          className="h-11 px-3 rounded-xl flex items-center gap-1.5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#8B93A7" }}>
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        <button onClick={handleSearch}
          className="h-11 px-5 rounded-xl text-sm font-bold"
          style={{ background: GOLD, color: "#070B14" }}>
          Search
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => {
          const active = cat === activeCategory;
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 h-8 px-4 rounded-full text-xs font-semibold transition-all"
              style={{
                background: active ? "rgba(243,186,47,0.15)" : "rgba(255,255,255,0.04)",
                border: active ? "1px solid rgba(243,186,47,0.5)" : "1px solid rgba(255,255,255,0.08)",
                color: active ? GOLD : "#8B93A7",
                boxShadow: active ? "0 0 12px rgba(243,186,47,0.18)" : "none",
              }}>
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────
function StatsStrip() {
  const { data: stats, isLoading } = useGetPropertyStats();

  const items = [
    { label: "Listings", value: isLoading ? "—" : `${stats?.total ?? 0}` },
    { label: "Lahore", value: isLoading ? "—" : `${stats?.byCity?.find(c => c.label === "Lahore")?.count ?? 0}` },
    { label: "Islamabad", value: isLoading ? "—" : `${stats?.byCity?.find(c => c.label === "Islamabad")?.count ?? 0}` },
    { label: "Verified", value: "100%" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-5">
      {items.map((item, i) => (
        <motion.div key={item.label}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="rounded-xl px-2 py-3 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="font-bold text-base leading-none" style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>
            {item.value}
          </div>
          <div className="text-[#8B93A7] text-[10px] mt-1">{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Portfolio Card — real data from API ─────────────────────────────────────
function PortfolioCard() {
  const [hidden, setHidden] = useState(false);
  const { data, isLoading, isError } = useGetPortfolioDashboard();

  const summary = data?.summary;
  const wallet = data?.wallet;

  const formatPKR = (n: number) => {
    if (n >= 10000000) return `₨ ${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₨ ${(n / 100000).toFixed(1)}L`;
    return `₨ ${n.toLocaleString("en-PK")}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-5 mb-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0D1421 0%, #111827 100%)", border: `1px solid rgba(243,186,47,0.25)` }}>
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(243,186,47,0.08) 0%, transparent 70%)" }} />

      <Show when="signed-out">
        <div className="relative z-10 text-center py-4">
          <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" style={{ color: GOLD }} />
          <p className="text-[#8B93A7] text-sm mb-3">Sign in to view your portfolio</p>
          <Link href="/sign-in">
            <button className="text-xs font-bold px-5 py-2 rounded-xl" style={{ background: GOLD, color: "#070B14" }}>
              Sign In
            </button>
          </Link>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-[#8B93A7] text-xs">Est. Portfolio Value (PKR)</span>
              <button onClick={() => setHidden(v => !v)} className="text-[#8B93A7]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {!hidden ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></> :
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />}
                </svg>
              </button>
            </div>
            <Link href="/wallet">
              <button className="text-xs font-bold px-4 py-1.5 rounded-lg" style={{ background: GOLD, color: "#070B14" }}>
                Add Funds
              </button>
            </Link>
          </div>

          {isLoading ? (
            <div className="h-8 w-48 rounded-lg mb-2 animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
          ) : isError ? (
            <div className="text-[#F5F5F5] text-2xl font-bold mb-1">Connect Database</div>
          ) : (
            <div className="text-[#F5F5F5] font-bold mb-1" style={{ fontSize: 28 }}>
              {hidden ? "₨ ••••••" : formatPKR(summary?.totalAssets ?? 0)}
            </div>
          )}

          {!isLoading && !isError && (
            <div className="flex items-center gap-1.5 mb-5">
              {(summary?.unrealizedPnL ?? 0) >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              )}
              <span className={`text-xs font-semibold ${(summary?.unrealizedPnL ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {hidden ? "••••" : formatPKR(Math.abs(summary?.unrealizedPnL ?? 0))}
              </span>
              <span className={`text-xs ${(summary?.unrealizedPnLPct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                ({(summary?.unrealizedPnLPct ?? 0) >= 0 ? "+" : ""}{(summary?.unrealizedPnLPct ?? 0).toFixed(2)}%)
              </span>
              <span className="text-[#8B93A7] text-xs">Unrealized PnL</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Wallet Balance", value: isLoading ? "—" : (hidden ? "••••" : formatPKR(wallet?.balance ?? 0)) },
              { label: "Positions", value: isLoading ? "—" : `${summary?.totalPositions ?? 0}` },
              { label: "Annual Income", value: isLoading ? "—" : (hidden ? "••••" : formatPKR(summary?.projectedAnnualIncome ?? 0)) },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-3 text-center"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-sm font-bold" style={{ color: GOLD }}>{stat.value}</div>
                <div className="text-[#8B93A7] text-[10px] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Show>
    </motion.div>
  );
}

// ─── 8-Module Service Grid ────────────────────────────────────────────────────
const SERVICES = [
  { icon: HomeIcon, label: "Buy Property", href: "/browse?category=buy", color: "#F3BA2F", bg: "rgba(243,186,47,0.12)" },
  { icon: ArrowRight, label: "Sell Property", href: "/post-property", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { icon: KeyRound, label: "Rental Hub", href: "/browse?category=rent", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  { icon: BookOpen, label: "Booking", href: "/project/azan-smart-city", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  { icon: Shuffle, label: "Token Trade", href: "/trades", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  { icon: BarChart3, label: "Investment", href: "/invest", color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  { icon: HardHat, label: "Builder Hub", href: "/projects", color: "#ec4899", bg: "rgba(236,72,153,0.12)" },
  { icon: Hammer, label: "Construction", href: "/projects", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
];

function CoreServicesGrid() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#8B93A7] text-[11px] font-semibold uppercase tracking-wider">Services</span>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {SERVICES.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}>
            <Link href={s.href}>
              <div className="flex flex-col items-center gap-2 py-3 rounded-2xl cursor-pointer active:scale-95 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <span className="text-[#F5F5F5] text-[10px] font-medium text-center leading-tight px-1">{s.label}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Investment Projects — real data ─────────────────────────────────────────
function InvestmentSection() {
  const { data: projects, isLoading } = useListInvestmentProjects({});

  if (isLoading) {
    return (
      <div className="mb-6 space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className="mb-6 rounded-2xl p-5 text-center"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: GOLD }} />
        <p className="text-[#8B93A7] text-sm">No investment projects yet</p>
        <p className="text-[#8B93A7] text-xs mt-1">Projects will appear here once added</p>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {projects.slice(0, 3).map((p, i) => {
        const funded = p.fundedShares ?? 0;
        const total = p.totalShares ?? 1;
        const pct = Math.round((funded / total) * 100);

        return (
          <motion.div key={p.id}
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <Link href={`/invest/${p.id}`}>
              <div className="rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#F5F5F5] text-sm font-semibold truncate">{p.title}</span>
                      {p.status && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "rgba(243,186,47,0.2)", color: GOLD }}>
                          {p.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[#8B93A7] text-[11px]">
                      <MapPin className="h-3 w-3 flex-shrink-0" style={{ color: GOLD }} />
                      <span className="truncate">{p.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
                    style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {p.roi}
                  </div>
                </div>
                <div className="mb-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#8B93A7] text-[10px]">Funded</span>
                    <span className="text-xs font-bold" style={{ color: GOLD }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }} transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${GOLD}, #f5d26b)` }} />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    <span className="text-[#8B93A7] text-[10px]">Min: </span>
                    <span className="text-[#F5F5F5] text-[10px] font-semibold">
                      ₨{Number(p.minInvestment).toLocaleString("en-PK")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8B93A7] text-[10px]">Duration: </span>
                    <span className="text-[#F5F5F5] text-[10px] font-semibold">{p.duration}</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Trust Strip ─────────────────────────────────────────────────────────────
function TrustStrip() {
  return (
    <div className="grid grid-cols-3 gap-2.5 mb-6">
      {[
        { icon: ShieldCheck, title: "Verified Listings", desc: "Every property vetted" },
        { icon: Building2, title: "Premium Stock", desc: "Lahore & Islamabad" },
        { icon: TrendingUp, title: "15+ Years", desc: "Market expertise" },
      ].map((item, i) => (
        <motion.div key={item.title}
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ delay: i * 0.1 }}
          className="rounded-xl p-3 flex flex-col items-center text-center gap-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(243,186,47,0.12)", border: `1px solid rgba(243,186,47,0.2)` }}>
            <item.icon className="h-4 w-4" style={{ color: GOLD }} />
          </div>
          <div>
            <div className="text-[#F5F5F5] text-[11px] font-semibold">{item.title}</div>
            <div className="text-[#8B93A7] text-[10px]">{item.desc}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#070B14", color: "#F5F5F5" }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(243,186,47,0.05) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pt-5 pb-28" style={{ zIndex: 1 }}>

        {/* 1 — Header + Logo */}
        <SectionBoundary name="header">
          <DashboardHeader />
        </SectionBoundary>

        {/* 2 — Search + Category Filters */}
        <SectionBoundary name="search">
          <HeroSearch />
        </SectionBoundary>

        {/* 3 — Stats (real from DB) */}
        <SectionBoundary name="stats">
          <StatsStrip />
        </SectionBoundary>

        {/* 4 — Portfolio Card (real from DB, auth-gated) */}
        <SectionBoundary name="portfolio">
          <PortfolioCard />
        </SectionBoundary>

        {/* 5 — 8-Module Service Grid */}
        <SectionBoundary name="services">
          <CoreServicesGrid />
        </SectionBoundary>

        {/* 6 — Featured Project Banner */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-3.5 w-3.5" style={{ color: GOLD }} />
            <span className="text-[#8B93A7] text-[11px] font-semibold uppercase tracking-wider">Featured Project</span>
          </div>
          <SectionBoundary name="project banner">
            <ProjectBanner />
          </SectionBoundary>
        </div>

        {/* 7 — Investment Projects (real from DB) */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[#8B93A7] text-[11px] font-semibold uppercase tracking-wider">Investment Projects</span>
              <h3 className="text-[#F5F5F5] font-semibold text-base mt-0.5">Active Opportunities</h3>
            </div>
            <Link href="/invest">
              <button className="flex items-center gap-1 text-xs font-medium" style={{ color: GOLD }}>
                View All <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
          <SectionBoundary name="investment projects">
            <InvestmentSection />
          </SectionBoundary>
        </div>

        {/* 8 — Market Pulse */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5" style={{ color: GOLD }} />
            <span className="text-[#8B93A7] text-[11px] font-semibold uppercase tracking-wider">Market Pulse</span>
          </div>
          <SectionBoundary name="market pulse">
            <MarketPulse />
          </SectionBoundary>
        </div>

        {/* 9 — Featured Properties (real from DB) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[#8B93A7] text-[11px] font-semibold uppercase tracking-wider">Premium Listings</span>
              <h3 className="text-[#F5F5F5] font-semibold text-base mt-0.5">Featured Properties</h3>
            </div>
            <Link href="/browse">
              <button className="flex items-center gap-1 text-xs font-medium" style={{ color: GOLD }}>
                View All <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
          <SectionBoundary name="featured listings">
            <FeaturedSlider />
          </SectionBoundary>
        </div>

        {/* 10 — Trust Strip */}
        <SectionBoundary name="trust">
          <TrustStrip />
        </SectionBoundary>

        {/* Footer */}
        <div className="flex items-center justify-between pt-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <img src="/logo-full.png" alt="Orakzai Properties" className="h-7 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p className="text-[#8B93A7] text-[10px]">© 2025 · Assets of Today | Legacies of Tomorrow</p>
        </div>
      </div>
    </div>
  );
}
