import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  User,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  LogOut,
  Plus,
  LayoutList,
  Home as HomeIcon,
  Building2,
  KeyRound,
  BookOpen,
  Shuffle,
  BarChart3,
  HardHat,
  Hammer,
  ShieldCheck,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Activity,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Show, useUser, useClerk } from "@clerk/react";
import ProjectBanner from "@/components/ProjectBanner";
import MarketPulse from "@/components/MarketPulse";
import FeaturedSlider from "@/components/FeaturedSlider";
import { useGetPropertyStats } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const GOLD = "#F3BA2F";
const BG = "#070B14";

// ─── Notification data ───────────────────────────────────────────────────────
const notifications = [
  { id: 1, dot: "bg-[#F3BA2F]", text: "New property listed in DHA Phase 6", time: "2m ago" },
  { id: 2, dot: "bg-emerald-400", text: "Your inquiry for Plot F-11 was viewed", time: "1h ago" },
  { id: 3, dot: "bg-blue-400", text: "Azan Smart City — Phase 1 update posted", time: "3h ago" },
  { id: 4, dot: "bg-violet-400", text: "Price drop alert: Bahria Town listing", time: "1d ago" },
];

// ─── Header ──────────────────────────────────────────────────────────────────
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
      {/* Logo */}
      <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <img
            src="/logo-shield.png"
            alt="Orakzai Properties"
            className="h-9 w-9 object-contain drop-shadow-lg"
          />
          <div>
            <div
              className="font-bold text-sm leading-tight tracking-wide"
              style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}
            >
              ORAKZAI
            </div>
            <div className="text-[#8B93A7] text-[9px] tracking-[0.15em] uppercase leading-tight">
              Properties
            </div>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }}
            className="relative h-9 w-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Bell className="h-4 w-4 text-[#8B93A7]" />
            <span
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border border-[#070B14]"
              style={{ background: GOLD }}
            />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-80 rounded-2xl overflow-hidden z-50 shadow-2xl shadow-black/60"
                style={{ background: "#0D1421", border: `1px solid rgba(243,186,47,0.2)` }}
              >
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-[#F5F5F5] text-sm font-semibold">Notifications</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(243,186,47,0.15)", color: GOLD, border: `1px solid rgba(243,186,47,0.25)` }}
                  >
                    {notifications.length} NEW
                  </span>
                </div>
                <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${n.dot}`} />
                        <div>
                          <p className="text-[#8B93A7] text-xs leading-relaxed">{n.text}</p>
                          <p className="text-white/30 text-[10px] mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <Link href="/notifications">
                    <button className="text-xs font-medium transition-colors" style={{ color: GOLD }}>
                      View all notifications
                    </button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User */}
        <Show when="signed-in">
          <div ref={userRef} className="relative">
            <button
              onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
              className="flex items-center gap-2 h-9 px-3 rounded-xl transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-5 w-5 rounded-full flex items-center justify-center"
                style={{ background: "rgba(243,186,47,0.2)", border: `1px solid rgba(243,186,47,0.4)` }}
              >
                <User className="h-3 w-3" style={{ color: GOLD }} />
              </div>
              <span className="text-[#8B93A7] text-xs font-medium hidden sm:block max-w-[80px] truncate">
                {user?.firstName ?? "Account"}
              </span>
              <ChevronDown className="h-3 w-3 text-[#8B93A7]" />
            </button>

            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-52 rounded-2xl overflow-hidden z-50 shadow-2xl shadow-black/60"
                  style={{ background: "#0D1421", border: `1px solid rgba(243,186,47,0.2)` }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="text-[#F5F5F5] text-sm font-medium truncate">{user?.fullName ?? user?.username}</div>
                    <div className="text-white/30 text-[11px] truncate">{user?.primaryEmailAddress?.emailAddress}</div>
                  </div>
                  <div className="py-1">
                    <Link href="/post-property" onClick={() => setUserOpen(false)}>
                      <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 cursor-pointer text-[#8B93A7] text-sm transition-colors">
                        <Plus className="h-4 w-4" style={{ color: GOLD }} /> Post Property
                      </div>
                    </Link>
                    <Link href="/my-properties" onClick={() => setUserOpen(false)}>
                      <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 cursor-pointer text-[#8B93A7] text-sm transition-colors">
                        <LayoutList className="h-4 w-4" style={{ color: GOLD }} /> My Listings
                      </div>
                    </Link>
                    <div className="mx-3 my-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />
                    <button
                      onClick={() => signOut({ redirectUrl: `${window.location.origin}${basePath}/` })}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 text-red-400 text-sm transition-colors"
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
            <Button
              size="sm"
              className="font-bold h-9 px-4 text-xs rounded-xl"
              style={{ background: GOLD, color: "#070B14" }}
            >
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("category", activeCategory.toLowerCase());
    setLocation(`/browse?${params.toString()}`);
  };

  return (
    <div className="mb-5">
      {/* Search bar */}
      <div
        className="flex gap-2 p-1.5 rounded-2xl mb-3"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: GOLD }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search Properties & Projects"
            className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "transparent",
              color: "#F5F5F5",
            }}
          />
        </div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="h-11 px-3 rounded-xl flex items-center gap-1.5 transition-all"
          style={{
            background: filtersOpen ? "rgba(243,186,47,0.15)" : "rgba(255,255,255,0.05)",
            border: filtersOpen ? `1px solid rgba(243,186,47,0.4)` : "1px solid rgba(255,255,255,0.08)",
            color: filtersOpen ? GOLD : "#8B93A7",
          }}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        <button
          onClick={handleSearch}
          className="h-11 px-5 rounded-xl text-sm font-bold transition-all"
          style={{ background: GOLD, color: "#070B14" }}
        >
          Search
        </button>
      </div>

      {/* Category pills */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {CATEGORIES.map((cat) => {
          const active = cat === activeCategory;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex-shrink-0 h-8 px-4 rounded-full text-xs font-semibold transition-all relative"
              style={{
                background: active ? "rgba(243,186,47,0.15)" : "rgba(255,255,255,0.04)",
                border: active ? `1px solid rgba(243,186,47,0.5)` : "1px solid rgba(255,255,255,0.08)",
                color: active ? GOLD : "#8B93A7",
                boxShadow: active ? `0 0 12px rgba(243,186,47,0.2)` : "none",
              }}
            >
              {cat}
              {active && (
                <motion.div
                  layoutId="cat-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "rgba(243,186,47,0.08)", zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Portfolio Card (Binance-style) ───────────────────────────────────────────
function PortfolioCard() {
  const [visible, setVisible] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-5 mb-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0D1421 0%, #111827 100%)",
        border: `1px solid rgba(243,186,47,0.25)`,
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(243,186,47,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[#8B93A7] text-xs">Est. Total Value (PKR)</span>
            <button onClick={() => setVisible((v) => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B93A7" strokeWidth="2">
                {visible ? (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                ) : (
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                )}
              </svg>
            </button>
          </div>
          <Link href="/wallet">
            <button
              className="text-xs font-bold px-4 py-1.5 rounded-lg"
              style={{ background: GOLD, color: "#070B14" }}
            >
              Add Funds
            </button>
          </Link>
        </div>

        <div className="mb-1">
          <span
            className="font-bold leading-none"
            style={{ fontSize: 28, color: "#F5F5F5", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {visible ? "₨ 42,80,000" : "₨ ••••••"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-5">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-emerald-400 text-xs font-semibold">+₨ 3,24,000</span>
          <span className="text-emerald-400 text-xs">(+8.2%)</span>
          <span className="text-[#8B93A7] text-xs">Today's PnL</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Rental Yield", value: "8.4%", up: true },
            { label: "Total ROI", value: "12.8%", up: true },
            { label: "Monthly", value: "₨35K", up: true },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="text-sm font-bold" style={{ color: GOLD }}>{stat.value}</div>
              <div className="text-[#8B93A7] text-[10px] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Core Business Grid (8 modules) ───────────────────────────────────────────
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
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <Link href={s.href}>
              <div className="flex flex-col items-center gap-2 py-3 rounded-2xl cursor-pointer transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ background: s.bg }}
                >
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

// ─── Token Market List (Binance-style) ───────────────────────────────────────
const TOKENS = [
  { name: "OPT-LHR", full: "Lahore Plot Token", price: "₨ 8,750", change: +3.24, vol: "₨1.2M" },
  { name: "OPT-ISB", full: "Islamabad Plot Token", price: "₨ 12,400", change: +1.87, vol: "₨890K" },
  { name: "OPT-KHI", full: "Karachi Plot Token", price: "₨ 6,200", change: -0.95, vol: "₨650K" },
  { name: "OPT-BAH", full: "Bahria Town Token", price: "₨ 9,150", change: +5.62, vol: "₨2.1M" },
  { name: "OPT-ASC", full: "Azan Smart City", price: "₨ 5,800", change: +8.40, vol: "₨3.4M" },
];

const MiniSparkline = ({ up }: { up: boolean }) => {
  const pts = up
    ? [20, 18, 22, 16, 24, 19, 27, 22, 29, 26, 30]
    : [30, 26, 28, 24, 26, 22, 24, 19, 21, 17, 18];
  const max = Math.max(...pts), min = Math.min(...pts), r = max - min || 1;
  const w = 56, h = 24, step = w / (pts.length - 1);
  const toY = (v: number) => h - ((v - min) / r) * (h - 4) - 2;
  const d = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const color = up ? "#10b981" : "#ef4444";
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${d} L${((pts.length - 1) * step).toFixed(1)},${h} L0,${h} Z`}
        fill={`url(#sg-${up})`}
      />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

function TokenMarketList() {
  const [activeTab, setActiveTab] = useState("Hot");
  const tabs = ["Favorites", "Hot", "New", "Gainers", "Losers"];

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6"
      style={{ background: "#0D1421", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Tab bar */}
      <div
        className="flex overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", scrollbarWidth: "none" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-shrink-0 px-4 py-3 text-xs font-semibold transition-all relative"
            style={{ color: activeTab === tab ? "#F5F5F5" : "#8B93A7" }}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="token-tab"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: GOLD }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-4 py-2">
        <span className="text-[#8B93A7] text-[10px]">Token / Name</span>
        <span className="text-[#8B93A7] text-[10px] text-right">Last Price</span>
        <span className="text-[#8B93A7] text-[10px] text-right">24h chg%</span>
      </div>

      {/* Token rows */}
      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {TOKENS.map((t, i) => {
          const up = t.change >= 0;
          return (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="grid grid-cols-3 px-4 py-3 items-center hover:bg-white/3 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(243,186,47,0.15)", border: `1px solid rgba(243,186,47,0.3)` }}
                >
                  <span className="text-[8px] font-black" style={{ color: GOLD }}>OB</span>
                </div>
                <div>
                  <div className="text-[#F5F5F5] text-xs font-semibold">{t.name}</div>
                  <div className="text-[#8B93A7] text-[10px]">{t.full.slice(0, 12)}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[#F5F5F5] text-xs font-medium">{t.price}</div>
                <div className="text-[#8B93A7] text-[9px]">Vol {t.vol}</div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <MiniSparkline up={up} />
                <div
                  className="text-xs font-bold px-2 py-1 rounded-lg min-w-[58px] text-center"
                  style={{
                    background: up ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                    color: up ? "#10b981" : "#ef4444",
                  }}
                >
                  {up ? "+" : ""}{t.change.toFixed(2)}%
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div
        className="px-4 py-3 flex items-center justify-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Link href="/trades">
          <button className="flex items-center gap-1.5 text-xs font-medium" style={{ color: GOLD }}>
            View All Markets <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>
    </div>
  );
}

// ─── Construction & Developers Section ───────────────────────────────────────
const CONSTRUCTION_PROJECTS = [
  {
    name: "Azan Smart City Phase 1",
    location: "Lahore – Islamabad Motorway",
    pct: 35,
    status: "Active",
    badge: "FLAGSHIP",
    units: "5,000+ Plots",
    eta: "Dec 2026",
  },
  {
    name: "DHA Valley Extension",
    location: "Islamabad, DHA Phase 4",
    pct: 62,
    status: "On Track",
    badge: "VERIFIED",
    units: "1,200 Units",
    eta: "Jun 2025",
  },
  {
    name: "Blue World City – Block H",
    location: "Chakri Road, Rawalpindi",
    pct: 48,
    status: "In Progress",
    badge: "HOT",
    units: "800 Plots",
    eta: "Mar 2026",
  },
];

function ConstructionSection() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[#8B93A7] text-[11px] font-semibold uppercase tracking-wider">Construction</span>
          <h3 className="text-[#F5F5F5] font-semibold text-base mt-0.5">Ongoing Projects</h3>
        </div>
        <Link href="/projects">
          <button className="flex items-center gap-1 text-xs font-medium" style={{ color: GOLD }}>
            All Projects <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>

      <div className="space-y-3">
        {CONSTRUCTION_PROJECTS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl p-4 transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#F5F5F5] text-sm font-semibold truncate">{p.name}</span>
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(243,186,47,0.2)", color: GOLD }}
                  >
                    {p.badge}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#8B93A7] text-[11px]">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{p.location}</span>
                </div>
              </div>
              <div
                className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ml-2"
                style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {p.status}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[#8B93A7] text-[10px]">Work in Progress</span>
                <span className="text-xs font-bold" style={{ color: GOLD }}>{p.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${p.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${GOLD}, #f5d26b)` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <div>
                <span className="text-[#8B93A7] text-[10px]">Units: </span>
                <span className="text-[#F5F5F5] text-[10px] font-semibold">{p.units}</span>
              </div>
              <div>
                <span className="text-[#8B93A7] text-[10px]">Est. Completion: </span>
                <span className="text-[#F5F5F5] text-[10px] font-semibold">{p.eta}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Featured Projects (Luxury Cards) ─────────────────────────────────────────
const FEATURED_PROJECTS = [
  {
    name: "Azan Smart City",
    location: "Lahore–Islamabad Motorway",
    roi: "3x in 5 Years",
    installment: "PKR 44K/mo",
    type: "Mega Project",
    href: "/project/azan-smart-city",
    gradient: "from-[#1a2e10] to-[#0D1421]",
    accentColor: "#10b981",
  },
  {
    name: "DHA Phase 6 Plots",
    location: "DHA Lahore, Block N",
    roi: "+28% Annual",
    installment: "Cash Only",
    type: "Residential Plot",
    href: "/browse",
    gradient: "from-[#0f1f3a] to-[#0D1421]",
    accentColor: "#3b82f6",
  },
  {
    name: "Bahria Enclave Tower",
    location: "Islamabad, Sector C",
    roi: "+18% ROI",
    installment: "PKR 85K/mo",
    type: "Commercial",
    href: "/browse",
    gradient: "from-[#2a1f10] to-[#0D1421]",
    accentColor: "#F3BA2F",
  },
  {
    name: "Blue World City",
    location: "Chakri Road, Rawalpindi",
    roi: "+22% Expected",
    installment: "PKR 32K/mo",
    type: "Smart Township",
    href: "/browse",
    gradient: "from-[#1a0f2a] to-[#0D1421]",
    accentColor: "#8b5cf6",
  },
];

function FeaturedProjectCards() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[#8B93A7] text-[11px] font-semibold uppercase tracking-wider">Featured</span>
          <h3 className="text-[#F5F5F5] font-semibold text-base mt-0.5">Orakzai Featured Projects</h3>
        </div>
        <Link href="/browse">
          <button className="flex items-center gap-1 text-xs font-medium" style={{ color: GOLD }}>
            View All <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", scrollSnapType: "x mandatory" }}
      >
        {FEATURED_PROJECTS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="flex-shrink-0 w-60"
            style={{ scrollSnapAlign: "start" }}
          >
            <Link href={p.href}>
              <div
                className="rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-95"
                style={{ border: `1px solid rgba(255,255,255,0.08)` }}
              >
                {/* Image placeholder with gradient */}
                <div
                  className={`h-36 bg-gradient-to-br ${p.gradient} relative flex items-center justify-center`}
                >
                  <div className="absolute inset-0"
                    style={{ background: "radial-gradient(ellipse at center, rgba(243,186,47,0.1) 0%, transparent 70%)" }} />
                  <Building2 className="h-14 w-14 opacity-10" style={{ color: p.accentColor }} />

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-full"
                    style={{ background: "rgba(0,0,0,0.6)", border: `1px solid rgba(243,186,47,0.4)` }}>
                    <ShieldCheck className="h-2.5 w-2.5" style={{ color: GOLD }} />
                    <span className="text-[8px] font-bold" style={{ color: GOLD }}>ORAKZAI VERIFIED</span>
                  </div>

                  <div className="absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(0,0,0,0.6)", color: p.accentColor, border: `1px solid ${p.accentColor}40` }}>
                    {p.type}
                  </div>

                  {/* Installment tag */}
                  <div className="absolute bottom-2.5 left-2.5 text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(243,186,47,0.2)", color: GOLD }}>
                    📅 {p.installment}
                  </div>
                </div>

                <div
                  className="p-3.5"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <h4 className="text-[#F5F5F5] text-sm font-semibold mb-1 truncate">{p.name}</h4>
                  <div className="flex items-center gap-1 text-[#8B93A7] text-[11px] mb-3">
                    <MapPin className="h-3 w-3 flex-shrink-0" style={{ color: GOLD }} />
                    <span className="truncate">{p.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 text-xs font-bold">{p.roi}</span>
                    </div>
                    <button
                      className="text-[10px] font-bold px-3 py-1.5 rounded-lg"
                      style={{ background: GOLD, color: "#070B14" }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats Strip ─────────────────────────────────────────────────────────────
function StatsStrip() {
  const { data: stats } = useGetPropertyStats();
  const items = [
    { label: "Listings", value: `${stats?.total ?? "2,400+"}` },
    { label: "Lahore", value: `${stats?.byCity?.find((c) => c.label === "Lahore")?.count ?? "980+"}` },
    { label: "Islamabad", value: `${stats?.byCity?.find((c) => c.label === "Islamabad")?.count ?? "740+"}` },
    { label: "Verified", value: "100%" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-5">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="rounded-xl px-2 py-3 text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="font-bold text-base leading-none"
            style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}
          >
            {item.value}
          </div>
          <div className="text-[#8B93A7] text-[10px] mt-1">{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Trust Strip ──────────────────────────────────────────────────────────────
function TrustStrip() {
  return (
    <div className="grid grid-cols-3 gap-2.5 mb-6">
      {[
        { icon: ShieldCheck, title: "Verified Listings", desc: "Every property vetted" },
        { icon: Building2, title: "Premium Stock", desc: "Lahore & Islamabad" },
        { icon: TrendingUp, title: "15+ Years", desc: "Market expertise" },
      ].map((item, i) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl p-3 flex flex-col items-center text-center gap-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(243,186,47,0.12)", border: `1px solid rgba(243,186,47,0.2)` }}
          >
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

// ─── Main Home Page ───────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen text-foreground" style={{ background: BG }}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(243,186,47,0.05) 0%, transparent 70%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)", filter: "blur(60px)" }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pt-5 pb-24" style={{ zIndex: 1 }}>

        {/* 1. Header with Logo */}
        <DashboardHeader />

        {/* 2. Hero Search + Category Filters */}
        <HeroSearch />

        {/* 3. Stats Strip */}
        <StatsStrip />

        {/* 4. Portfolio Card (Binance-style) */}
        <PortfolioCard />

        {/* 5. Core Business Grid (8 modules) */}
        <CoreServicesGrid />

        {/* 6. Token Market List */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[#8B93A7] text-[11px] font-semibold uppercase tracking-wider">Token Market</span>
              <h3 className="text-[#F5F5F5] font-semibold text-base mt-0.5">OB Token Prices</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[10px] font-semibold">LIVE</span>
            </div>
          </div>
          <TokenMarketList />
        </div>

        {/* 7. Featured Project Banner (auto-rotating) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-3.5 w-3.5" style={{ color: GOLD }} />
            <span className="text-[#8B93A7] text-[11px] font-semibold uppercase tracking-wider">Featured Project</span>
          </div>
          <ProjectBanner />
        </div>

        {/* 8. Construction & Developers */}
        <ConstructionSection />

        {/* 9. Market Pulse (Karachi, Lahore, Islamabad) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5" style={{ color: GOLD }} />
            <div>
              <span className="text-[#8B93A7] text-[11px] font-semibold uppercase tracking-wider">Market Pulse</span>
            </div>
          </div>
          <MarketPulse />
        </div>

        {/* 10. Featured Listings (horizontal scroll - from API) */}
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
          <FeaturedSlider />
        </div>

        {/* 11. Orakzai Featured Projects (mock luxury cards) */}
        <FeaturedProjectCards />

        {/* 12. Trust Strip */}
        <TrustStrip />

        {/* Footer with full logo */}
        <div
          className="flex items-center justify-between pt-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <img src="/logo-full.png" alt="Orakzai Properties" className="h-8 object-contain" />
          </div>
          <p className="text-[#8B93A7] text-[10px]">© 2025 · Assets of Today | Legacies of Tomorrow</p>
        </div>
      </div>
    </div>
  );
}
