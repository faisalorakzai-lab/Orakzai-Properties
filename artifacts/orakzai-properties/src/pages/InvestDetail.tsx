import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "wouter";
import {
  TrendingUp, Clock, MapPin, ChevronLeft, Shield, CheckCircle2,
  Circle, Loader2, Building2, Zap, BarChart3, Minus, Plus,
  MessageCircle, AlertCircle, ChevronDown, ChevronUp, Activity,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import InvestModal from "@/components/InvestModal";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  funding:      { label: "Funding Open",        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-400" },
  construction: { label: "Under Construction",  color: "text-amber-400 bg-amber-500/10 border-amber-500/30",   dot: "bg-amber-400" },
  completed:    { label: "Completed",           color: "text-sky-400 bg-sky-500/10 border-sky-500/30",         dot: "bg-sky-400" },
};

const PHASE_STATUS_ICONS = {
  completed:   { icon: CheckCircle2, color: "text-emerald-400",  ring: "border-emerald-500/50", bg: "bg-emerald-500/15" },
  in_progress: { icon: Loader2,      color: "text-[#C9A84C]",    ring: "border-[#C9A84C]/50",   bg: "bg-[#C9A84C]/15" },
  pending:     { icon: Circle,       color: "text-[#2a4060]",    ring: "border-[#1e3a5f]",      bg: "bg-[#0a1628]" },
};

function formatPKR(n: number) {
  if (n >= 1_000_000_000) return `PKR ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 10_000_000)    return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)       return `PKR ${(n / 100_000).toFixed(1)}L`;
  return `PKR ${n.toLocaleString()}`;
}

function parseRoiPercent(roi: string): number {
  const m = roi.match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : 15;
}

function parseDurationMonths(duration: string): number {
  const m = duration.match(/(\d+)/);
  return m ? parseInt(m[1]) : 24;
}

const DEMO_PROJECT = {
  id: 0,
  title: "Orakzai Heights — Premium Tower",
  description:
    "A 25-storey luxury mixed-use tower in the heart of DHA Lahore, combining premium residences with high-yield commercial floors. Each fractional token represents a proportional ownership stake in the asset, entitling holders to rental income distribution and capital appreciation on exit.",
  location: "DHA Phase 6, Lahore",
  bannerImage: null,
  totalValue: 2500000000,
  minInvestment: 500000,
  totalShares: 500,
  fundedShares: 312,
  roi: "22% Annually",
  duration: "36 Months",
  status: "funding",
  type: "tower",
  features: [
    "Rooftop Infinity Pool",
    "Smart Home Automation",
    "3-Level Underground Parking",
    "CCTV & 24/7 Security",
    "High-speed Fibre Internet",
    "Backup Power Generation",
  ],
  roadmap: [
    { phase: "Land Acquisition & Legal",  description: "Title cleared, NOC obtained from DHA Lahore.", status: "completed",   date: "Q1 2024" },
    { phase: "Foundation & Piling",       description: "Deep piling completed to 30-metre depth.",      status: "completed",   date: "Q3 2024" },
    { phase: "Structural Framework",      description: "Steel framework construction floors 1–10.",      status: "in_progress", date: "Q1 2025" },
    { phase: "MEP & Interiors",           description: "Mechanical, electrical and plumbing installation.", status: "pending", date: "Q3 2025" },
    { phase: "Finishing & Handover",      description: "Premium finishing and investor handover.",        status: "pending",    date: "Q1 2026" },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function InvestDetail() {
  const { id } = useParams<{ id: string }>();
  const numId = Number(id);
  const [dbProject, setDbProject] = useState<typeof DEMO_PROJECT | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!numId || isNaN(numId)) { setIsLoading(false); return; }
    setIsLoading(true);
    supabase.from("investment_projects").select("*").eq("id", numId).single()
      .then(({ data, error }) => {
        if (!error && data) setDbProject(data as typeof DEMO_PROJECT);
        setIsLoading(false);
      });
  }, [numId]);

  const project = dbProject ?? DEMO_PROJECT;

  const roiPct = parseRoiPercent(project.roi);
  const durationMonths = parseDurationMonths(project.duration);
  const sharePrice = project.totalShares > 0 ? project.totalValue / project.totalShares : project.minInvestment;

  const [investAmount, setInvestAmount] = useState(project.minInvestment);
  const [shares, setShares] = useState(1);
  const [roadmapOpen, setRoadmapOpen] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);

  const annualProfit  = useMemo(() => investAmount * (roiPct / 100), [investAmount, roiPct]);
  const monthlyProfit = useMemo(() => annualProfit / 12, [annualProfit]);
  const totalReturn   = useMemo(() => investAmount + annualProfit * (durationMonths / 12), [investAmount, annualProfit, durationMonths]);

  const sliderMin = project.minInvestment;
  const sliderMax = project.minInvestment * 50;

  const fundedPct = project.totalShares > 0
    ? Math.min(100, Math.round((project.fundedShares / project.totalShares) * 100))
    : 0;

  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.funding;


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050d1a" }}>
        <Navbar />
        <div className="text-center mt-14">
          <div className="w-10 h-10 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6a7f99] text-sm">Loading investment details…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #050d1a 0%, #07111e 40%, #060e1a 100%)" }}>
      <Navbar />
      <div className="pt-14">
        <div className="relative h-56 sm:h-72 bg-gradient-to-br from-[#0f2040] via-[#0c1830] to-[#06101a] flex items-end overflow-hidden">
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(ellipse 60% 80% at 20% 50%, #C9A84C14 0%, transparent 60%), radial-gradient(circle at 85% 20%, #1e4a8022 0%, transparent 50%)" }} />
          {project.bannerImage && (
            <img src={project.bannerImage} alt={project.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050d1a] via-transparent to-transparent" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pb-6 w-full">
            <Link href="/invest">
              <button className="flex items-center gap-1.5 text-xs text-[#6a7f99] hover:text-[#C9A84C] mb-4 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Back to Investment Portal
              </button>
            </Link>
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border mb-3 ${status.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
              {status.label}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">{project.title}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span className="text-sm text-[#6a7f99]">{project.location}</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Total Value",    value: formatPKR(project.totalValue),    sub: "Project size" },
              { label: "Min. Investment",value: formatPKR(project.minInvestment), sub: "Per share" },
              { label: "Target ROI",     value: project.roi,                      sub: "Annual return", gold: true },
              { label: "Exit Duration",  value: project.duration,                 sub: "Investment period", gold: true },
            ].map(({ label, value, sub, gold }) => (
              <div key={label} className={`rounded-2xl p-4 border ${gold ? "border-[#C9A84C]/30 bg-[#C9A84C]/5" : "border-[#1e3a5f]/40 bg-[#0a1628]/60"}`}>
                <div className="text-[10px] text-[#4a6080] uppercase tracking-wider mb-1">{label}</div>
                <div className={`text-base font-bold ${gold ? "text-[#C9A84C]" : "text-white"}`}>{value}</div>
                <div className="text-[10px] text-[#4a6080] mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
            <div className="space-y-8">
              <div className="rounded-2xl border border-[#1e3a5f]/40 bg-[#0a1628]/60 p-6">
                <h2 className="font-serif text-lg text-white font-semibold mb-3">About This Project</h2>
                <p className="text-[#6a7f99] text-sm leading-relaxed">{project.description}</p>
                {project.features.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    {project.features.map((f: string) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-[#94a3b8]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {project.roadmap.length > 0 && (
                <div className="rounded-2xl border border-[#1e3a5f]/40 bg-[#0a1628]/60 p-6">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setRoadmapOpen((v) => !v)}
                  >
                    <h2 className="font-serif text-lg text-white font-semibold">Construction Roadmap</h2>
                    {roadmapOpen ? <ChevronUp className="w-4 h-4 text-[#6a7f99]" /> : <ChevronDown className="w-4 h-4 text-[#6a7f99]" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {roadmapOpen && (
                      <motion.div
                        key="roadmap"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 space-y-0">
                          {project.roadmap.map((phase: any, i: number) => {
                            const cfg = PHASE_STATUS_ICONS[phase.status as keyof typeof PHASE_STATUS_ICONS] ?? PHASE_STATUS_ICONS.pending;
                            const Icon = cfg.icon;
                            const isLast = i === project.roadmap.length - 1;
                            return (
                              <div key={i} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 ${cfg.ring} ${cfg.bg}`}>
                                    <Icon className={`w-4 h-4 ${cfg.color} ${phase.status === "in_progress" ? "animate-spin" : ""}`} />
                                  </div>
                                  {!isLast && <div className="w-px flex-1 my-1 bg-[#1e3a5f]" />}
                                </div>
                                <div className={`pb-7 ${isLast ? "pb-0" : ""}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-white">{phase.phase}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium
                                      ${phase.status === "completed" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                      : phase.status === "in_progress" ? "text-[#C9A84C] border-[#C9A84C]/30 bg-[#C9A84C]/10"
                                      : "text-[#4a6080] border-[#1e3a5f] bg-[#0a1628]"}`}>
                                      {phase.status === "in_progress" ? "In Progress" : phase.status === "completed" ? "Done" : "Upcoming"}
                                    </span>
                                    <span className="text-xs text-[#4a6080] ml-auto">{phase.date}</span>
                                  </div>
                                  <p className="text-xs text-[#6a7f99] leading-relaxed">{phase.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#0d1e35] to-[#08111f] p-6">
                <h2 className="font-serif text-lg text-white font-semibold mb-1">ROI Calculator</h2>
                <p className="text-xs text-[#4a6080] mb-6">Adjust your investment amount to see projected returns</p>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-[#6a7f99] uppercase tracking-wider">Investment Amount</label>
                    <span className="text-sm font-bold text-[#C9A84C]">{formatPKR(investAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min={sliderMin}
                    max={sliderMax}
                    step={project.minInvestment}
                    value={investAmount}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setInvestAmount(v);
                      setShares(Math.round(v / sharePrice));
                    }}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #C9A84C ${((investAmount - sliderMin) / (sliderMax - sliderMin)) * 100}%, #0d1e35 0%)`,
                    }}
                  />
                  <div className="flex justify-between text-[10px] text-[#2a4060] mt-1">
                    <span>{formatPKR(sliderMin)}</span>
                    <span>{formatPKR(sliderMax)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Monthly Profit",  value: formatPKR(monthlyProfit),  accent: false },
                    { label: "Annual Profit",   value: formatPKR(annualProfit),   accent: true  },
                    { label: "Total at Exit",   value: formatPKR(totalReturn),    accent: false },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className={`rounded-xl p-3.5 border text-center ${accent ? "border-[#C9A84C]/30 bg-[#C9A84C]/8" : "border-[#1e3a5f]/40 bg-[#060f1c]"}`}>
                      <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-1">{label}</div>
                      <div className={`text-xs font-bold leading-tight ${accent ? "text-[#C9A84C]" : "text-white"}`}>{value}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[#2a4060] mt-3 text-center">
                  Based on {project.roi} return over {project.duration}. Projections are indicative.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-b from-[#0d1e35] to-[#08111f] p-5 sticky top-20">
                <h3 className="font-serif text-base text-white font-semibold mb-4">Funding Progress</h3>
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#6a7f99]">{fundedPct}% Funded</span>
                    <span className="text-[#C9A84C] font-medium">{project.totalShares - project.fundedShares} of {project.totalShares} shares left</span>
                  </div>
                  <div className="h-2 bg-[#0a1628] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #C9A84C, #e8c060)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${fundedPct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-[10px] text-[#4a6080]">{project.fundedShares} investors have already secured their stake</div>
                </div>

                <div className="border-t border-[#1e3a5f]/40 pt-4 mb-4">
                  <label className="text-xs text-[#6a7f99] uppercase tracking-wider block mb-3">Select Number of Shares</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const next = Math.max(1, shares - 1);
                        setShares(next);
                        setInvestAmount(Math.round(next * sharePrice));
                      }}
                      className="w-9 h-9 rounded-xl border border-[#1e3a5f] flex items-center justify-center text-[#6a7f99] hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-bold text-white">{shares}</div>
                      <div className="text-[10px] text-[#4a6080]">share{shares !== 1 ? "s" : ""}</div>
                    </div>
                    <button
                      onClick={() => {
                        const next = shares + 1;
                        setShares(next);
                        setInvestAmount(Math.round(next * sharePrice));
                      }}
                      className="w-9 h-9 rounded-xl border border-[#1e3a5f] flex items-center justify-center text-[#6a7f99] hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/40 p-3 text-center">
                    <div className="text-[10px] text-[#4a6080] mb-1">Total Investment</div>
                    <div className="text-lg font-bold text-[#C9A84C]">{formatPKR(shares * sharePrice)}</div>
                    <div className="text-[10px] text-[#4a6080] mt-0.5">{formatPKR(sharePrice)} × {shares} share{shares !== 1 ? "s" : ""}</div>
                  </div>
                </div>

                <button
                  onClick={() => setShowInvestModal(true)}
                  disabled={project.fundedShares >= project.totalShares}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-xl hover:shadow-[#C9A84C]/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e8c060 50%, #C9A84C 100%)", color: "#0a1220" }}
                >
                  <Shield className="w-4 h-4" />
                  {project.fundedShares >= project.totalShares ? "Fully Funded" : "Secure My Investment"}
                </button>

                <p className="text-[10px] text-[#2a4060] text-center mt-3">
                  Instant on-grid transaction · Sovereign guarantee
                </p>

                <Link href={`/trade/${project.id}`}>
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/8 hover:border-[#C9A84C]/50 transition-all mt-1">
                    <Activity className="w-3.5 h-3.5" />
                    Trade on Secondary Market
                  </button>
                </Link>

                <div className="mt-3 pt-3 border-t border-[#1e3a5f]/30 space-y-2">
                  {[
                    "Legally verified asset-backed tokens",
                    "Quarterly profit distribution",
                    "Exit at market rate on maturity",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2 text-[10px] text-[#4a6080]">
                      <CheckCircle2 className="w-3 h-3 text-[#C9A84C] mt-0.5 shrink-0" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInvestModal && (
        <InvestModal
          project={project}
          onClose={() => setShowInvestModal(false)}
        />
      )}
    </div>
  );
}
