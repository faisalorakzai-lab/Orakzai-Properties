import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  TrendingUp, Clock, MapPin, Building2, ChevronRight,
  Shield, Zap, BarChart3, Coins, Filter,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useListInvestmentProjects } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  funding:      { label: "Funding Open",  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", dot: "bg-emerald-400" },
  construction: { label: "Under Construction", color: "text-amber-400 bg-amber-500/10 border-amber-500/30", dot: "bg-amber-400" },
  completed:    { label: "Completed",     color: "text-sky-400 bg-sky-500/10 border-sky-500/30",   dot: "bg-sky-400" },
};

const TYPE_ICONS: Record<string, typeof Building2> = {
  plaza:      Building2,
  tower:      Building2,
  smart_city: Zap,
  commercial: BarChart3,
};

function formatPKR(n: number) {
  if (n >= 1_000_000_000) return `PKR ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 10_000_000)    return `PKR ${(n / 10_000_000).toFixed(1)} Crore`;
  if (n >= 100_000)       return `PKR ${(n / 100_000).toFixed(0)}L`;
  return `PKR ${n.toLocaleString()}`;
}

function FundingBar({ funded, total }: { funded: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((funded / total) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[#6a7f99]">{pct}% Funded</span>
        <span className="text-[#C9A84C] font-medium">{total - funded} shares left</span>
      </div>
      <div className="h-1.5 bg-[#0d1e35] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #C9A84C, #e8c060)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function InvestCard({ project, index }: { project: any; index: number }) {
  const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.funding;
  const Icon = TYPE_ICONS[project.type] ?? Building2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="group relative rounded-2xl overflow-hidden border border-[#C9A84C]/15 bg-gradient-to-b from-[#0c1830] to-[#08111f] hover:border-[#C9A84C]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#C9A84C]/8"
    >
      <div className="relative h-44 bg-gradient-to-br from-[#0f2040] via-[#0c1830] to-[#06101a] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #C9A84C22 0%, transparent 60%), radial-gradient(circle at 80% 20%, #1e4a8022 0%, transparent 50%)" }} />
        {project.bannerImage ? (
          <img src={project.bannerImage} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-30">
            <Icon className="w-12 h-12 text-[#C9A84C]" />
            <span className="text-xs text-[#C9A84C] tracking-widest uppercase">{project.type}</span>
          </div>
        )}

        <div className="absolute top-3 left-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`} />
            {status.label}
          </div>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 bg-[#C9A84C] text-[#0a1220] text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">
            <TrendingUp className="w-3 h-3" />
            {project.roi}
          </div>
          <div className="flex items-center gap-1 bg-[#0a1220]/90 border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-medium px-2.5 py-1 rounded-lg">
            <Clock className="w-3 h-3" />
            {project.duration}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-serif text-white text-lg font-semibold leading-snug group-hover:text-[#C9A84C] transition-colors">
            {project.title}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-[#C9A84C]" />
            <span className="text-xs text-[#6a7f99]">{project.location}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#06101a] rounded-xl p-3 border border-[#1e3a5f]/40">
            <div className="text-[10px] text-[#4a6080] uppercase tracking-wider mb-1">Total Value</div>
            <div className="text-sm font-semibold text-white">{formatPKR(project.totalValue)}</div>
          </div>
          <div className="bg-[#06101a] rounded-xl p-3 border border-[#1e3a5f]/40">
            <div className="text-[10px] text-[#4a6080] uppercase tracking-wider mb-1">Min. Investment</div>
            <div className="text-sm font-semibold text-[#C9A84C]">{formatPKR(project.minInvestment)}</div>
          </div>
        </div>

        <FundingBar funded={project.fundedShares} total={project.totalShares} />

        <Link href={`/invest/${project.id}`}>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] hover:shadow-lg hover:shadow-[#C9A84C]/25 hover:scale-[1.02]">
            View Investment
            <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

const DEMO_PROJECTS = [
  {
    id: "demo-1",
    title: "Orakzai Heights — Premium Tower",
    description: "A 25-storey luxury residential and commercial tower in the heart of DHA Lahore.",
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
    roadmap: [],
    features: ["Rooftop Pool", "Underground Parking", "Smart Home System"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "Azan Business Plaza",
    description: "A world-class commercial plaza with 200+ premium retail and office units.",
    location: "Blue Area, Islamabad",
    bannerImage: null,
    totalValue: 1800000000,
    minInvestment: 250000,
    totalShares: 720,
    fundedShares: 580,
    roi: "18% Annually",
    duration: "24 Months",
    status: "construction",
    type: "plaza",
    roadmap: [],
    features: ["Central Atrium", "Basement Parking x3", "High-speed Elevators"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-3",
    title: "Orakzai Smart City — Phase 2",
    description: "Pakistan's first fully integrated smart township with solar infrastructure.",
    location: "Ring Road, Peshawar",
    bannerImage: null,
    totalValue: 8000000000,
    minInvestment: 1000000,
    totalShares: 800,
    fundedShares: 120,
    roi: "28% Annually",
    duration: "60 Months",
    status: "funding",
    type: "smart_city",
    roadmap: [],
    features: ["Solar Grid", "Smart Security", "EV Charging Stations"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function InvestPortal() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: apiProjects = [], isLoading } = useListInvestmentProjects();

  const projects = apiProjects.length > 0 ? apiProjects : DEMO_PROJECTS;
  const filtered = statusFilter === "all"
    ? projects
    : projects.filter((p: any) => p.status === statusFilter);

  const totalValue = projects.reduce((s: number, p: any) => s + p.totalValue, 0);
  const avgRoi = "18–28%";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #050d1a 0%, #07111e 40%, #060e1a 100%)" }}>
      <Navbar />

      <div className="pt-14">
        <div className="relative overflow-hidden border-b border-[#C9A84C]/10">
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -20%, #C9A84C18 0%, transparent 70%)" }} />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center relative">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/25 rounded-full px-4 py-1.5 mb-6">
                <Coins className="w-3.5 h-3.5 text-[#C9A84C]" />
                <span className="text-xs font-medium text-[#C9A84C] tracking-wider uppercase">Fractional Investment</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                Invest in Pakistan's<br />
                <span className="text-[#C9A84C]">Iconic Mega-Projects</span>
              </h1>
              <p className="text-[#6a7f99] text-base sm:text-lg max-w-2xl mx-auto mb-10">
                Own fractional stakes in Plazas, Towers, and Smart Cities. Institutional-grade
                returns with full transparency — starting from PKR 2.5 Lakh.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-3 gap-4 max-w-xl mx-auto"
            >
              {[
                { icon: TrendingUp, label: "Avg. ROI", value: avgRoi },
                { icon: Shield, label: "Secured by", value: "Real Assets" },
                { icon: BarChart3, label: "Total AUM", value: formatPKR(totalValue) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-[#0a1628]/60 border border-[#C9A84C]/15 rounded-2xl p-4">
                  <Icon className="w-5 h-5 text-[#C9A84C] mx-auto mb-2" />
                  <div className="text-[10px] text-[#4a6080] uppercase tracking-wider">{label}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{value}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-white">Active Investment Opportunities</h2>
              <p className="text-sm text-[#4a6080] mt-0.5">{filtered.length} projects available</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#6a7f99]" />
              {["all", "funding", "construction", "completed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === s
                      ? "bg-[#C9A84C] text-[#0a1220]"
                      : "text-[#6a7f99] border border-[#1e3a5f] hover:border-[#C9A84C]/30 hover:text-white"
                  }`}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[440px] rounded-2xl bg-[#0c1830] animate-pulse border border-[#1e3a5f]/30" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <BarChart3 className="w-10 h-10 text-[#1e3a5f] mx-auto mb-3" />
              <p className="text-[#4a6080]">No projects match this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p: any, i: number) => (
                <InvestCard key={p.id} project={p} index={i} />
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-r from-[#0c1830] via-[#0f2040] to-[#0c1830] p-8 text-center"
          >
            <h3 className="font-serif text-2xl text-white mb-2">Ready to Start Investing?</h3>
            <p className="text-[#6a7f99] text-sm mb-6 max-w-lg mx-auto">
              Speak directly with our Investment Desk. Our experts will guide you through
              portfolio composition, risk profiling, and documentation.
            </p>
            <a
              href="https://wa.me/923001234567?text=Hello%2C%20I%20am%20interested%20in%20fractional%20investment%20opportunities%20with%20Orakzai%20Properties."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-[#C9A84C]/20"
              style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e8c060 50%, #C9A84C 100%)", color: "#0a1220" }}
            >
              <Shield className="w-4 h-4" />
              Contact Investment Desk
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
