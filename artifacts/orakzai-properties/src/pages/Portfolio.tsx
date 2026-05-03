import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Wallet, BarChart3, Coins, Shield,
  ChevronRight, Building2, Zap, Plus, ArrowUpRight, ArrowDownRight,
  Activity, Clock, MapPin, Star, RefreshCw, CheckCircle2,
  Layers, PieChart, DollarSign, Calendar, ArrowLeftRight,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from "recharts";
import Navbar from "@/components/Navbar";
import { Show, useUser } from "@clerk/react";
import {
  useGetPortfolioDashboard,
  getGetPortfolioDashboardQueryKey,
} from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/* ─── Formatters ─── */
function fmtPKR(n: number, compact = false): string {
  if (!isFinite(n)) return "PKR 0";
  if (compact) {
    if (Math.abs(n) >= 1_000_000_000) return `PKR ${(n / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(n) >= 10_000_000)    return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
    if (Math.abs(n) >= 100_000)       return `PKR ${(n / 100_000).toFixed(1)}L`;
  }
  return `PKR ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

/* ─── Status config ─── */
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  funding:      { label: "Funding",      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  construction: { label: "Building",     color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  completed:    { label: "Complete",     color: "text-sky-400 bg-sky-500/10 border-sky-500/30" },
};

const TYPE_ICON: Record<string, typeof Building2> = {
  plaza: Building2, tower: Building2, smart_city: Zap, commercial: BarChart3,
};

/* ─── Custom chart tooltip ─── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-[#C9A84C]/30 px-4 py-3 shadow-2xl shadow-black/60"
      style={{ background: "linear-gradient(135deg, #0c1828, #060d16)" }}>
      <p className="text-[#C9A84C] text-xs font-bold mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#6a7f99]">{p.name === "value" ? "Portfolio" : "Invested"}:</span>
          <span className="text-white font-medium">{fmtPKR(p.value, true)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Executive Summary Card ─── */
function SummaryCard({
  icon: Icon, label, value, sub, trend, color, delay = 0, href
}: {
  icon: typeof Wallet; label: string; value: string; sub?: string;
  trend?: "up" | "down" | "neutral"; color: "gold" | "emerald" | "rose" | "blue";
  delay?: number; href?: string;
}) {
  const colors = {
    gold:    { text: "text-[#C9A84C]",  bg: "bg-[#C9A84C]/8",   border: "border-[#C9A84C]/25",   glow: "#C9A84C" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/8",  border: "border-emerald-500/25",  glow: "#10b981" },
    rose:    { text: "text-rose-400",    bg: "bg-rose-500/8",     border: "border-rose-500/25",     glow: "#f43f5e" },
    blue:    { text: "text-sky-400",     bg: "bg-sky-500/8",      border: "border-sky-500/25",      glow: "#0ea5e9" },
  }[color];

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className={`relative overflow-hidden rounded-2xl border ${colors.border} p-5 hover:border-opacity-60 transition-all duration-300 group cursor-pointer`}
      style={{ background: "linear-gradient(145deg, #0c1828 0%, #060d16 100%)" }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse 80% 60% at 0% 0%, ${colors.glow}08, transparent)` }} />

      <div className="flex items-start justify-between mb-3">
        <div className={`h-9 w-9 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${colors.text}`} />
        </div>
        {trend === "up"   && <ArrowUpRight   className="h-4 w-4 text-emerald-400" />}
        {trend === "down" && <ArrowDownRight  className="h-4 w-4 text-rose-400"    />}
        {href             && <ChevronRight    className="h-4 w-4 text-[#3a5070] group-hover:text-[#C9A84C] transition-colors" />}
      </div>

      <div className={`font-serif text-2xl font-bold leading-none mb-1 ${colors.text}`}
        style={{ textShadow: `0 0 30px ${colors.glow}30` }}>
        {value}
      </div>
      <div className="text-[#3a5070] text-[10px] uppercase tracking-[.18em] font-semibold">{label}</div>
      {sub && <div className="text-[#4a6080] text-[11px] mt-1.5">{sub}</div>}
    </motion.div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Position row ─── */
function PositionRow({ pos, index }: { pos: any; index: number }) {
  const Icon = TYPE_ICON[pos.projectType] ?? Building2;
  const statusCfg = STATUS_CFG[pos.projectStatus] ?? STATUS_CFG.funding;
  const isGain = pos.gain >= 0;
  const ownershipPct = pos.totalProjectShares > 0
    ? ((pos.totalShares / pos.totalProjectShares) * 100).toFixed(3)
    : "0.000";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.4 }}
      className="group rounded-2xl border border-white/6 hover:border-[#C9A84C]/25 transition-all duration-300 overflow-hidden"
      style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}
    >
      {/* Progress bar top */}
      <div className="h-0.5 w-full" style={{
        background: `linear-gradient(90deg, #C9A84C ${ownershipPct}%, #1e3a5f ${ownershipPct}%)`,
      }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center border border-[#C9A84C]/20"
              style={{ background: "linear-gradient(135deg, #C9A84C15, transparent)" }}>
              <Icon className="h-5 w-5 text-[#C9A84C]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm leading-snug truncate">{pos.projectTitle}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-2.5 w-2.5 text-[#C9A84C]/50 flex-shrink-0" />
                <span className="text-[10px] text-[#4a6080] truncate">{pos.projectLocation}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
          <div className="rounded-xl bg-[#060f1c] border border-[#1e3a5f]/40 p-2.5 text-center">
            <div className="text-[8px] text-[#3a5070] uppercase tracking-wider mb-0.5">Shares</div>
            <div className="text-sm font-bold text-white">{pos.totalShares.toLocaleString()}</div>
          </div>
          <div className="rounded-xl bg-[#060f1c] border border-[#1e3a5f]/40 p-2.5 text-center">
            <div className="text-[8px] text-[#3a5070] uppercase tracking-wider mb-0.5">Invested</div>
            <div className="text-xs font-bold text-white">{fmtPKR(pos.totalInvested, true)}</div>
          </div>
          <div className="rounded-xl bg-[#060f1c] border border-[#1e3a5f]/40 p-2.5 text-center">
            <div className="text-[8px] text-[#3a5070] uppercase tracking-wider mb-0.5">Cur. Value</div>
            <div className="text-xs font-bold text-[#C9A84C]">{fmtPKR(pos.currentValue, true)}</div>
          </div>
          <div className={`rounded-xl border p-2.5 text-center ${
            isGain ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"
          }`}>
            <div className="text-[8px] text-[#3a5070] uppercase tracking-wider mb-0.5">P&L</div>
            <div className={`text-xs font-bold ${isGain ? "text-emerald-400" : "text-rose-400"}`}>
              {isGain ? "+" : ""}{fmtPKR(pos.gain, true)}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${isGain ? "bg-emerald-400" : "bg-rose-400"}`} />
              <span className={`text-xs font-semibold ${isGain ? "text-emerald-400" : "text-rose-400"}`}>
                {fmtPct(pos.gainPct)}
              </span>
            </div>
            <span className="text-[10px] text-[#3a5070]">
              {ownershipPct}% ownership · ROI {pos.roi}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`${basePath}/invest/${pos.projectId}`}>
              <button className="text-[10px] text-[#6a7f99] hover:text-[#C9A84C] transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#C9A84C]/8">
                Details <ChevronRight className="h-3 w-3" />
              </button>
            </Link>
            <Link href={`${basePath}/trade/${pos.projectId}`}>
              <button className="text-[10px] font-semibold text-[#C9A84C] border border-[#C9A84C]/30 bg-[#C9A84C]/8 hover:bg-[#C9A84C]/15 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1">
                <ArrowLeftRight className="h-3 w-3" /> Trade
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Ledger row ─── */
function LedgerRow({ entry, index }: { entry: any; index: number }) {
  const d = new Date(entry.createdAt);
  const dateStr = d.toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.04 }}
      className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0 group hover:bg-white/[0.015] rounded-xl px-2 -mx-2 transition-colors cursor-pointer"
    >
      <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Coins className="h-3.5 w-3.5 text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{entry.projectTitle}</p>
            <p className="text-[#4a6080] text-[10px] mt-0.5">
              {entry.sharesBought} share{entry.sharesBought !== 1 ? "s" : ""} @ {fmtPKR(entry.sharePrice, true)}/share
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-emerald-400 text-sm font-bold">-{fmtPKR(entry.amountPaid, true)}</p>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
              entry.status === "confirmed"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}>{entry.status}</span>
          </div>
        </div>
        <p className="text-[#2a3a50] text-[9px] mt-1 font-mono">{dateStr} · {timeStr}</p>
      </div>
    </motion.div>
  );
}

/* ─── Empty State ─── */
function EmptyState() {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="text-center py-24 px-4">
      <div className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center border border-[#C9A84C]/20"
        style={{ background: "linear-gradient(135deg, #C9A84C12, transparent)" }}>
        <PieChart className="w-11 h-11 text-[#C9A84C]/40" />
      </div>
      <h3 className="font-serif text-2xl text-white font-semibold mb-2">Your Portfolio is Empty</h3>
      <p className="text-[#6a7f99] text-sm mb-8 max-w-sm mx-auto leading-relaxed">
        Secure your first stake in Pakistan's premier mega-projects and start building generational wealth today.
      </p>
      <Link href={`${basePath}/invest`}>
        <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold hover:scale-[1.03] transition-transform"
          style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
          <Plus className="w-4 h-4" />
          Explore Investment Projects
        </button>
      </Link>
    </motion.div>
  );
}

/* ─── Sign-in gate ─── */
function SignInGate() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#040b14" }}>
      <Navbar />
      <div className="text-center mt-14 px-4">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#C9A84C]/30"
          style={{ background: "linear-gradient(135deg, #C9A84C18, transparent)" }}>
          <Shield className="w-10 h-10 text-[#C9A84C]/70" />
        </div>
        <h2 className="font-serif text-3xl text-white font-bold mb-2">Investor Access Required</h2>
        <p className="text-[#6a7f99] text-sm mb-8 max-w-xs mx-auto">Sign in to access your personal Wealth Management Dashboard.</p>
        <Link href={`${basePath}/sign-in`}>
          <button className="px-8 py-3.5 rounded-xl text-sm font-bold hover:scale-[1.03] transition-transform"
            style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
            Sign In to Continue
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════ */
function Dashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"positions" | "ledger">("positions");

  const { data: dash, isLoading, refetch, isFetching } = useGetPortfolioDashboard({
    query: { queryKey: getGetPortfolioDashboardQueryKey(), refetchInterval: 60_000 },
  });

  const firstName = user?.firstName ?? user?.username ?? "Chairman";
  const today = new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const pnlPositive = (dash?.summary.unrealizedPnL ?? 0) >= 0;
  const hasData = (dash?.positions?.length ?? 0) > 0;

  /* ── skeleton ── */
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#040b14" }}>
        <Navbar />
        <div className="pt-14 max-w-6xl mx-auto px-4 py-10 space-y-6">
          <div className="h-20 bg-white/[0.03] rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white/[0.03] rounded-2xl animate-pulse" />)}
          </div>
          <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse" />
          <div className="grid gap-4">
            {[1,2].map(i => <div key={i} className="h-44 bg-white/[0.03] rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #040b14 0%, #060e18 100%)" }}>
      {/* ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-[#C9A84C]/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/3 right-0 w-72 h-72 rounded-full bg-[#1e3a8a]/[0.05] blur-[100px]" />
      </div>

      <Navbar />

      <div className="pt-14 relative z-10">
        {/* ══ Hero Header ══ */}
        <div className="border-b border-[#C9A84C]/8 overflow-hidden relative"
          style={{ background: "linear-gradient(180deg, #06111e 0%, #040b14 100%)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(ellipse 80% 80% at 50% -20%, #C9A84C10 0%, transparent 70%)" }} />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 relative">
            <div className="flex items-start justify-between gap-4">
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/25 rounded-full px-3 py-1 mb-3">
                  <Activity className="w-3 h-3 text-[#C9A84C]" />
                  <span className="text-[10px] font-medium text-[#C9A84C] tracking-wider uppercase">Wealth Management Dashboard</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-1">
                  {firstName}'s Portfolio
                </h1>
                <p className="text-[#4a6080] text-xs flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> {today}
                </p>
              </motion.div>

              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => refetch()}
                  className={`h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[#6a7f99] hover:text-[#C9A84C] hover:border-[#C9A84C]/30 transition-all ${isFetching ? "animate-spin" : ""}`}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <Link href={`${basePath}/invest`}>
                  <button className="h-9 flex items-center gap-2 px-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.03]"
                    style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
                    <Plus className="h-3.5 w-3.5" /> Invest More
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* ══ Executive Summary — 4 cards ══ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={DollarSign}
              label="Total Assets"
              value={fmtPKR(dash?.summary.totalAssets ?? 0, true)}
              sub={`${dash?.summary.totalPositions ?? 0} active position${(dash?.summary.totalPositions ?? 0) !== 1 ? "s" : ""}`}
              color="gold"
              delay={0}
            />
            <SummaryCard
              icon={Coins}
              label="Invested Capital"
              value={fmtPKR(dash?.summary.investedCapital ?? 0, true)}
              sub={`${dash?.summary.totalShares ?? 0} total shares`}
              color="blue"
              delay={0.07}
            />
            <SummaryCard
              icon={pnlPositive ? TrendingUp : TrendingDown}
              label="Unrealized P&L"
              value={`${pnlPositive ? "+" : ""}${fmtPKR(dash?.summary.unrealizedPnL ?? 0, true)}`}
              sub={fmtPct(dash?.summary.unrealizedPnLPct ?? 0)}
              trend={pnlPositive ? "up" : "down"}
              color={pnlPositive ? "emerald" : "rose"}
              delay={0.14}
            />
            <SummaryCard
              icon={Wallet}
              label="Wallet Balance"
              value={fmtPKR(dash?.wallet.balance ?? 0, true)}
              sub="Available to invest"
              color="gold"
              delay={0.21}
              href={`${basePath}/wallet`}
            />
          </div>

          {/* ══ Performance Chart + Income stats ══ */}
          {hasData && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Chart */}
              <div className="lg:col-span-2 rounded-2xl border border-white/8 p-6"
                style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-serif text-base font-bold text-white flex items-center gap-2">
                      <div className="h-4 w-1 rounded-full bg-gradient-to-b from-[#C9A84C] to-[#e8c060]" />
                      Portfolio Performance
                    </h2>
                    <p className="text-[#3a5070] text-[11px] mt-0.5">6-month growth trajectory</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 rounded-full bg-[#C9A84C]" />
                      <span className="text-[#6a7f99]">Portfolio</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 rounded-full bg-[#1e3a5f]" />
                      <span className="text-[#6a7f99]">Invested</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dash?.performanceHistory ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#C9A84C" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f40" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "#4a6080", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#4a6080", fontSize: 9 }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 100_000 ? `${(v/100_000).toFixed(0)}L` : String(v)} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="invested" stroke="#1e3a5f" strokeWidth={1.5}
                      fill="url(#blueGrad)" dot={false} />
                    <Area type="monotone" dataKey="value" stroke="#C9A84C" strokeWidth={2.5}
                      fill="url(#goldGrad)" dot={{ fill: "#C9A84C", r: 3, strokeWidth: 0 }}
                      activeDot={{ fill: "#C9A84C", r: 5, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Income stats */}
              <div className="flex flex-col gap-4">
                <div className="rounded-2xl border border-emerald-500/20 p-5 flex-1"
                  style={{ background: "linear-gradient(145deg, #0a1c12 0%, #060d16 100%)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Projected Annual Income</span>
                  </div>
                  <div className="font-serif text-3xl font-bold text-emerald-400 mb-1">
                    {fmtPKR(dash?.summary.projectedAnnualIncome ?? 0, true)}
                  </div>
                  <div className="text-[#3a5070] text-xs">
                    ≈ {fmtPKR((dash?.summary.projectedAnnualIncome ?? 0) / 12, true)}/month
                  </div>
                </div>

                <div className="rounded-2xl border border-[#C9A84C]/20 p-5 flex-1"
                  style={{ background: "linear-gradient(145deg, #0c1808 0%, #060d16 100%)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 text-[#C9A84C]" />
                    <span className="text-[10px] text-[#C9A84C] font-bold uppercase tracking-wider">Portfolio ROI</span>
                  </div>
                  <div className={`font-serif text-3xl font-bold mb-1 ${pnlPositive ? "text-[#C9A84C]" : "text-rose-400"}`}>
                    {fmtPct(dash?.summary.unrealizedPnLPct ?? 0)}
                  </div>
                  <div className="text-[#3a5070] text-xs">unrealized return</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ Positions / Ledger Tabs ══ */}
          {hasData ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              {/* Tab bar */}
              <div className="flex items-center gap-1 mb-6 border-b border-white/8 pb-0">
                {([
                  { id: "positions", label: "Active Positions", icon: BarChart3, count: dash?.positions?.length },
                  { id: "ledger",    label: "Investment Ledger", icon: Clock,    count: dash?.ledger?.length },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-all ${
                      activeTab === tab.id
                        ? "border-[#C9A84C] text-[#C9A84C]"
                        : "border-transparent text-[#4a6080] hover:text-[#94a3b8]"
                    }`}>
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      activeTab === tab.id ? "bg-[#C9A84C]/15 text-[#C9A84C]" : "bg-white/5 text-[#4a6080]"
                    }`}>{tab.count ?? 0}</span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "positions" && (
                  <motion.div key="positions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {(dash?.positions ?? []).map((pos, i) => (
                      <PositionRow key={pos.portfolioId} pos={pos} index={i} />
                    ))}
                  </motion.div>
                )}
                {activeTab === "ledger" && (
                  <motion.div key="ledger" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl border border-white/8 p-5"
                    style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-4 w-4 text-[#C9A84C]" />
                      <h3 className="font-serif text-sm font-bold text-white">Transaction History</h3>
                      <span className="text-[10px] text-[#3a5070] ml-auto">Last {dash?.ledger?.length ?? 0} transactions</span>
                    </div>
                    {(dash?.ledger?.length ?? 0) === 0 ? (
                      <p className="text-[#3a5070] text-sm text-center py-8">No transactions yet.</p>
                    ) : (
                      <div>
                        {(dash?.ledger ?? []).map((entry, i) => (
                          <LedgerRow key={entry.transactionId} entry={entry} index={i} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState />
          )}

          {/* ══ Income Stream section ══ */}
          {hasData && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Rental Income */}
              <div className="rounded-2xl border border-emerald-500/15 p-5"
                style={{ background: "linear-gradient(145deg, #0a1a10 0%, #060d16 100%)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Layers className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-white">Rental Income Stream</h3>
                    <p className="text-[#3a5070] text-[10px]">Projected monthly cash flow</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {(dash?.positions ?? []).map(pos => (
                    <div key={pos.portfolioId} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-xs font-medium truncate">{pos.projectTitle}</p>
                        <p className="text-[#3a5070] text-[10px]">{pos.totalShares} shares · {pos.roi}</p>
                      </div>
                      <span className="text-emerald-400 text-xs font-bold ml-3 flex-shrink-0">
                        +{fmtPKR(pos.projectedMonthlyRoi, true)}/mo
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[#4a6080] text-xs font-semibold">Total Monthly</span>
                    <span className="text-emerald-400 text-sm font-bold">
                      +{fmtPKR((dash?.summary.projectedAnnualIncome ?? 0) / 12, true)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dividend / Profit Share */}
              <div className="rounded-2xl border border-[#C9A84C]/15 p-5"
                style={{ background: "linear-gradient(145deg, #0c1808 0%, #060d16 100%)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                    <Star className="h-4 w-4 text-[#C9A84C]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-white">Dividend History</h3>
                    <p className="text-[#3a5070] text-[10px]">Profit share payouts from projects</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {(dash?.positions ?? []).filter(p => p.projectStatus === "completed").length === 0 ? (
                    <div className="text-center py-6">
                      <Clock className="h-6 w-6 text-[#2a3a50] mx-auto mb-2" />
                      <p className="text-[#3a5070] text-xs">Dividends will appear when projects reach completion</p>
                    </div>
                  ) : (
                    (dash?.positions ?? []).filter(p => p.projectStatus === "completed").map(pos => (
                      <div key={pos.portfolioId} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-xs font-medium truncate">{pos.projectTitle}</p>
                          <p className="text-[#3a5070] text-[10px]">Completed project</p>
                        </div>
                        <span className="text-[#C9A84C] text-xs font-bold ml-3 flex-shrink-0">
                          +{fmtPKR(pos.projectedMonthlyRoi * 12, true)}/yr
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══ CTA / Expand section ══ */}
          {hasData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="rounded-2xl border border-[#C9A84C]/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{ background: "linear-gradient(135deg, #0c1830 0%, #0f2040 50%, #0c1830 100%)" }}>
              <div>
                <h3 className="font-serif text-lg text-white font-semibold mb-1">Expand Your Portfolio</h3>
                <p className="text-xs text-[#6a7f99] max-w-sm">
                  Diversify across Pakistan's fastest-growing real estate assets and maximize your returns.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`${basePath}/wallet`}>
                  <button className="h-10 flex items-center gap-2 px-4 rounded-xl border border-[#C9A84C]/25 bg-[#C9A84C]/8 text-[#C9A84C] text-xs font-semibold hover:bg-[#C9A84C]/15 transition-colors">
                    <Wallet className="h-3.5 w-3.5" /> Wallet
                  </button>
                </Link>
                <Link href={`${basePath}/invest`}>
                  <button className="h-10 flex items-center gap-2 px-5 rounded-xl text-xs font-bold hover:scale-[1.03] transition-transform"
                    style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
                    <Plus className="h-3.5 w-3.5" /> Invest More
                  </button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ══ Disclaimer ══ */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            className="flex items-start gap-2 bg-white/[0.015] border border-white/6 rounded-2xl p-4">
            <Shield className="w-4 h-4 text-[#C9A84C] mt-0.5 shrink-0" />
            <p className="text-[10px] text-[#2a3a50] leading-relaxed">
              All investments are backed by legally verified, title-cleared real assets under the Orakzai Properties Trust Framework.
              Projected returns are indicative based on current market conditions. Past performance does not guarantee future results.
              Portfolio values are updated in real-time.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ─── Route wrapper ─── */
export default function Portfolio() {
  return (
    <>
      <Show when="signed-out"><SignInGate /></Show>
      <Show when="signed-in"><Dashboard /></Show>
    </>
  );
}
