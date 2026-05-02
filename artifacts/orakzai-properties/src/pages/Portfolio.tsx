import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  TrendingUp, Clock, MapPin, BarChart3, Coins, Shield,
  ChevronRight, Building2, Zap, Plus, AlertCircle,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Show, useUser } from "@clerk/react";
import { useGetMyPortfolio } from "@workspace/api-client-react";

function formatPKR(n: number) {
  if (n >= 1_000_000_000) return `PKR ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 10_000_000)    return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)       return `PKR ${(n / 100_000).toFixed(1)}L`;
  return `PKR ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

const STATUS_COLORS: Record<string, string> = {
  funding:      "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  construction: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  completed:    "text-sky-400 bg-sky-500/10 border-sky-500/30",
};

const TYPE_ICONS: Record<string, typeof Building2> = {
  plaza: Building2, tower: Building2, smart_city: Zap, commercial: BarChart3,
};

function PortfolioCard({ item, index }: { item: any; index: number }) {
  const Icon = TYPE_ICONS[item.projectType] ?? Building2;
  const statusColor = STATUS_COLORS[item.projectStatus] ?? STATUS_COLORS.funding;
  const gain = item.currentValue - item.totalInvested;
  const gainPct = item.totalInvested > 0 ? (gain / item.totalInvested) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="rounded-2xl border border-[#C9A84C]/15 bg-gradient-to-b from-[#0c1830] to-[#08111f] hover:border-[#C9A84C]/35 transition-all duration-300 overflow-hidden"
    >
      <div className="relative h-2 w-full" style={{ background: "linear-gradient(90deg, #C9A84C, #e8c060)" }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #C9A84C22, #e8c06011)", border: "1px solid #C9A84C33" }}>
              <Icon className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white leading-snug">{item.projectTitle}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 text-[#C9A84C]" />
                <span className="text-[10px] text-[#6a7f99]">{item.projectLocation}</span>
              </div>
            </div>
          </div>
          <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusColor}`}>
            {item.projectStatus === "funding" ? "Funding" : item.projectStatus === "construction" ? "Building" : "Complete"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-[#060f1c] border border-[#1e3a5f]/40 p-3">
            <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-1">Shares Owned</div>
            <div className="text-lg font-bold text-white">{item.totalShares}</div>
          </div>
          <div className="rounded-xl bg-[#060f1c] border border-[#1e3a5f]/40 p-3">
            <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-1">Invested</div>
            <div className="text-sm font-bold text-white">{formatPKR(item.totalInvested)}</div>
          </div>
          <div className="rounded-xl bg-[#060f1c] border border-emerald-500/20 p-3">
            <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-1">Monthly Income</div>
            <div className="text-sm font-bold text-emerald-400">{formatPKR(item.projectedMonthlyRoi)}</div>
          </div>
          <div className="rounded-xl bg-[#060f1c] border border-[#C9A84C]/20 p-3">
            <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-1">Target ROI</div>
            <div className="text-sm font-bold text-[#C9A84C]">{item.roi}</div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#1e3a5f]/30 pt-3">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-[#4a6080]" />
            <span className="text-[10px] text-[#4a6080]">{item.duration} exit</span>
          </div>
          <Link href={`/invest/${item.projectId}`}>
            <button className="flex items-center gap-1 text-[10px] text-[#C9A84C] hover:text-[#e8c060] font-medium transition-colors">
              View Project <ChevronRight className="w-3 h-3" />
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function SignInGate() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#050d1a" }}>
      <Navbar />
      <div className="text-center mt-14 px-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#C9A84C]/30"
          style={{ background: "linear-gradient(135deg, #C9A84C22, #e8c06011)" }}>
          <Shield className="w-8 h-8 text-[#C9A84C]" />
        </div>
        <h2 className="font-serif text-2xl text-white font-bold mb-2">Sign In Required</h2>
        <p className="text-[#6a7f99] text-sm mb-6 max-w-xs mx-auto">Sign in to access your personal Investment Portfolio on the Orakzai Grid.</p>
        <Link href="/sign-in">
          <button className="px-8 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#0a1220" }}>
            Sign In to Continue
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const { user } = useUser();
  const { data: portfolio = [], isLoading } = useGetMyPortfolio();

  const totalInvested      = portfolio.reduce((s: number, p: any) => s + p.totalInvested, 0);
  const totalMonthlyIncome = portfolio.reduce((s: number, p: any) => s + p.projectedMonthlyRoi, 0);
  const totalShares        = portfolio.reduce((s: number, p: any) => s + p.totalShares, 0);
  const firstName          = user?.firstName ?? user?.username ?? "Chairman";

  return (
    <>
      <Show when="signed-out">
        <SignInGate />
      </Show>
      <Show when="signed-in">
        <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #050d1a 0%, #07111e 40%, #060e1a 100%)" }}>
          <Navbar />
          <div className="pt-14">
            <div className="relative overflow-hidden border-b border-[#C9A84C]/10">
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(ellipse 70% 60% at 50% -10%, #C9A84C18 0%, transparent 70%)" }} />
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 relative">
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/25 rounded-full px-3 py-1 mb-4">
                    <Coins className="w-3 h-3 text-[#C9A84C]" />
                    <span className="text-[10px] font-medium text-[#C9A84C] tracking-wider uppercase">Orakzai Investment Grid</span>
                  </div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-1">
                    Chairman {firstName}'s Portfolio
                  </h1>
                  <p className="text-[#6a7f99] text-sm">Your fractional ownership positions in Pakistan's mega-projects</p>
                </motion.div>

                {portfolio.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="grid grid-cols-3 gap-4 mt-8 max-w-xl"
                  >
                    {[
                      { icon: Coins,      label: "Total Invested",    value: formatPKR(totalInvested),                 gold: true  },
                      { icon: TrendingUp, label: "Monthly Income",     value: formatPKR(totalMonthlyIncome),            green: true },
                      { icon: BarChart3,  label: "Total Shares",       value: totalShares.toLocaleString(),             plain: true },
                    ].map(({ icon: Icon, label, value, gold, green }) => (
                      <div key={label} className="bg-[#0a1628]/60 border border-[#C9A84C]/15 rounded-2xl p-4">
                        <Icon className={`w-4 h-4 mx-auto mb-2 ${gold ? "text-[#C9A84C]" : green ? "text-emerald-400" : "text-[#6a7f99]"}`} />
                        <div className="text-[9px] text-[#4a6080] uppercase tracking-wider text-center">{label}</div>
                        <div className={`text-sm font-bold mt-1 text-center ${gold ? "text-[#C9A84C]" : green ? "text-emerald-400" : "text-white"}`}>{value}</div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-64 rounded-2xl bg-[#0c1830] animate-pulse border border-[#1e3a5f]/30" />
                  ))}
                </div>
              ) : portfolio.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-[#C9A84C]/20"
                    style={{ background: "linear-gradient(135deg, #C9A84C15, transparent)" }}>
                    <BarChart3 className="w-9 h-9 text-[#C9A84C]/50" />
                  </div>
                  <h3 className="font-serif text-xl text-white font-semibold mb-2">No Investments Yet</h3>
                  <p className="text-[#6a7f99] text-sm mb-6 max-w-sm mx-auto">
                    Your portfolio is empty. Browse our premium mega-projects and secure your first stake today.
                  </p>
                  <Link href="/invest">
                    <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold hover:scale-105 transition-transform"
                      style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#0a1220" }}>
                      <Plus className="w-4 h-4" />
                      Browse Investment Projects
                    </button>
                  </Link>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {portfolio.map((item: any, i: number) => (
                    <PortfolioCard key={item.portfolioId} item={item} index={i} />
                  ))}
                </div>
              )}

              {portfolio.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-12 rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-r from-[#0c1830] to-[#0f2040] p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-serif text-lg text-white font-semibold mb-1">Expand Your Portfolio</h3>
                    <p className="text-xs text-[#6a7f99]">Discover more mega-projects and diversify your investment across Pakistan's fastest-growing assets.</p>
                  </div>
                  <Link href="/invest">
                    <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap hover:scale-105 transition-transform"
                      style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#0a1220" }}>
                      <Plus className="w-4 h-4" />
                      Invest More
                    </button>
                  </Link>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 flex items-start gap-2 bg-[#0a1628]/40 border border-[#1e3a5f]/30 rounded-xl p-4"
              >
                <Shield className="w-4 h-4 text-[#C9A84C] mt-0.5 shrink-0" />
                <p className="text-[10px] text-[#4a6080] leading-relaxed">
                  All investments are backed by legally verified, title-cleared real assets under the Orakzai Properties Trust Framework. Projected returns are indicative and based on current market conditions. Past performance does not guarantee future results.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
