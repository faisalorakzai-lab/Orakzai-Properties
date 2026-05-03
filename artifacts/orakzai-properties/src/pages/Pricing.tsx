import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Check, Crown, Zap, Shield, Star,
  Building2, Users, Headphones, Sparkles, ArrowRight, BadgeCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Show } from "@clerk/react";
import { useGetSubscriptionMe } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/* ── Plan data ───────────────────────────────────────────────────────────── */
const PLANS = [
  {
    id: "free",
    name: "Free",
    icon: Shield,
    iconColor: "text-slate-400",
    monthlyPkr: 0,
    annualPkr: 0,
    tagline: "Start your journey",
    border: "border-white/8",
    glow: "",
    bg: "from-[#0a1628]/60 to-[#060d16]/60",
    badge: null,
    cta: "Current Plan",
    ctaStyle: "bg-white/8 text-[#6a7f99] cursor-default",
    perks: [
      { text: "2 Active Listings", ok: true },
      { text: "Standard Visibility", ok: true },
      { text: "Community Support", ok: true },
      { text: "Verified Agent Badge", ok: false },
      { text: "Hot Tags", ok: false },
      { text: "Featured on Home", ok: false },
      { text: "Direct Lead Notifications", ok: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    icon: Star,
    iconColor: "text-[#C9A84C]",
    monthlyPkr: 9_900,
    annualPkr: 100_980,
    tagline: "For active agents",
    border: "border-[#C9A84C]/30",
    glow: "",
    bg: "from-[#140e03]/80 to-[#0a0800]/80",
    badge: null,
    cta: "Upgrade to Premium",
    ctaStyle: "bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/25",
    perks: [
      { text: "20 Active Listings", ok: true },
      { text: "Priority Search Placement", ok: true },
      { text: "Email Support", ok: true },
      { text: "Verified Agent Badge ✓", ok: true },
      { text: "5 Hot Tags per listing", ok: true },
      { text: "Featured on Home", ok: false },
      { text: "Direct Lead Notifications", ok: false },
    ],
  },
  {
    id: "sovereign",
    name: "Sovereign",
    icon: Crown,
    iconColor: "text-amber-300",
    monthlyPkr: 24_900,
    annualPkr: 253_980,
    tagline: "The pinnacle of visibility",
    border: "border-[#C9A84C]",
    glow: "shadow-[0_0_60px_rgba(201,168,76,0.25),0_0_120px_rgba(201,168,76,0.10)]",
    bg: "from-[#1a1200]/90 to-[#0d0900]/90",
    badge: "RECOMMENDED",
    cta: "Go Sovereign",
    ctaStyle: "bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#080f1a] font-black hover:shadow-[0_0_30px_rgba(201,168,76,0.4)]",
    perks: [
      { text: "Unlimited Active Listings", ok: true },
      { text: "Featured on Home Dashboard", ok: true },
      { text: "24/7 Priority Support", ok: true },
      { text: "Verified Agent Badge ✓", ok: true },
      { text: "Unlimited Hot Tags", ok: true },
      { text: "Featured on Home ✓", ok: true },
      { text: "Direct Lead Notifications ✓", ok: true },
    ],
  },
];

const FEATURES = [
  { icon: Building2, label: "Listing Capacity",   free: "2",         premium: "20",       sovereign: "Unlimited" },
  { icon: BadgeCheck, label: "Verified Badge",    free: "—",         premium: "✓",        sovereign: "✓" },
  { icon: Star,       label: "Hot Tags",          free: "—",         premium: "5",        sovereign: "Unlimited" },
  { icon: Sparkles,   label: "Home Feature",      free: "—",         premium: "—",        sovereign: "✓" },
  { icon: Zap,        label: "Direct Leads",      free: "—",         premium: "—",        sovereign: "✓" },
  { icon: Headphones, label: "Support",           free: "Community", premium: "Email",    sovereign: "24/7" },
  { icon: Users,      label: "Search Rank",       free: "Standard",  premium: "Priority", sovereign: "Top" },
];

function fmtPkr(n: number) {
  return n === 0 ? "Free" : `PKR ${n.toLocaleString("en-PK")}`;
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const { data: subData } = useGetSubscriptionMe();
  const currentPlan = subData?.planId ?? "free";

  return (
    <div className="min-h-screen bg-[#040b14]">
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden pt-24 pb-16 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(201,168,76,0.08),transparent)]" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C9A84C]/20 bg-[#C9A84C]/5 text-[#C9A84C] text-xs font-bold tracking-widest uppercase mb-6">
            <Crown className="h-3 w-3" /> Sovereign Plans
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Choose Your<br />
            <span className="bg-gradient-to-r from-[#C9A84C] via-[#e8c060] to-[#C9A84C] bg-clip-text text-transparent">Command Level</span>
          </h1>
          <p className="text-[#4a6080] max-w-md mx-auto text-sm leading-relaxed">
            From your first listing to running a full brokerage empire. Every tier forged in gold.
          </p>
        </motion.div>

        {/* ── Billing toggle ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 inline-flex items-center gap-3 bg-[#070e1a] border border-white/8 rounded-full p-1.5"
        >
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${!annual ? "bg-[#C9A84C] text-[#080f1a]" : "text-[#4a6080] hover:text-white"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all relative ${annual ? "bg-[#C9A84C] text-[#080f1a]" : "text-[#4a6080] hover:text-white"}`}
          >
            Annual
            {!annual && (
              <span className="absolute -top-2.5 -right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                −15%
              </span>
            )}
          </button>
        </motion.div>
      </div>

      {/* ── Plan Cards ── */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            const price = annual ? plan.annualPkr : plan.monthlyPkr;
            const monthlyEquiv = annual && plan.annualPkr > 0
              ? Math.round(plan.annualPkr / 12)
              : null;
            const isCurrent = currentPlan === plan.id;
            const isSovereign = plan.id === "sovereign";

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                className={`relative rounded-2xl border-2 bg-gradient-to-b ${plan.bg} ${plan.border} ${plan.glow} backdrop-blur-sm overflow-hidden ${isSovereign ? "md:-mt-4 md:mb-4" : ""}`}
              >
                {/* Sovereign shimmer */}
                {isSovereign && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/60 to-transparent" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_30%_at_50%_0%,rgba(201,168,76,0.06),transparent)]" />
                  </div>
                )}

                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-[#C9A84C] text-[#080f1a] text-[9px] font-black px-2 py-1 rounded-full tracking-widest uppercase">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-7">
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${isSovereign ? "border-[#C9A84C]/40 bg-[#C9A84C]/10" : "border-white/10 bg-white/5"}`}>
                      <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                    </div>
                    <div>
                      <div className={`font-black text-lg ${isSovereign ? "text-[#C9A84C]" : "text-white"}`}>{plan.name}</div>
                      <div className="text-[#3a5070] text-xs">{plan.tagline}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={annual ? "annual" : "monthly"}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className={`text-3xl font-black ${plan.monthlyPkr === 0 ? "text-[#6a7f99]" : isSovereign ? "text-[#C9A84C]" : "text-white"}`}>
                          {plan.monthlyPkr === 0 ? "Free" : fmtPkr(price)}
                        </div>
                        {plan.monthlyPkr > 0 && (
                          <div className="text-[#3a5070] text-xs mt-0.5">
                            {annual ? `${fmtPkr(monthlyEquiv!)}/mo · billed annually` : "per month"}
                          </div>
                        )}
                        {annual && plan.annualPkr > 0 && (
                          <div className="text-emerald-400 text-xs font-semibold mt-1">
                            Save PKR {(plan.monthlyPkr * 12 - plan.annualPkr).toLocaleString("en-PK")} vs monthly
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* CTA */}
                  {plan.id === "free" ? (
                    <div className={`w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center ${plan.ctaStyle}`}>
                      {isCurrent ? "Current Plan" : "Free Forever"}
                    </div>
                  ) : (
                    <Show
                      when="signed-in"
                      fallback={
                        <Link href={`${basePath}/sign-up`}>
                          <button className={`w-full h-11 rounded-xl text-sm transition-all ${plan.ctaStyle}`}>
                            Sign Up to Subscribe
                          </button>
                        </Link>
                      }
                    >
                      {isCurrent ? (
                        <div className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          ✓ Current Plan
                        </div>
                      ) : (
                        <Link href={`${basePath}/subscribe/${plan.id}?cycle=${annual ? "annual" : "monthly"}`}>
                          <button className={`w-full h-11 rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${plan.ctaStyle}`}>
                            {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      )}
                    </Show>
                  )}

                  {/* Perks */}
                  <ul className="mt-6 space-y-2.5">
                    {plan.perks.map((perk, j) => (
                      <li key={j} className="flex items-center gap-2.5">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${perk.ok ? (isSovereign ? "bg-[#C9A84C]/20" : "bg-emerald-500/15") : "bg-white/4"}`}>
                          {perk.ok
                            ? <Check className={`h-2.5 w-2.5 ${isSovereign ? "text-[#C9A84C]" : "text-emerald-400"}`} />
                            : <span className="text-[#2a3a50] text-[10px] font-bold">×</span>
                          }
                        </div>
                        <span className={`text-xs ${perk.ok ? (isSovereign ? "text-[#d4b46a]" : "text-[#94a3b8]") : "text-[#2a3a50] line-through"}`}>
                          {perk.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Feature Comparison Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-20"
        >
          <h2 className="text-center text-2xl font-black text-white mb-2">Full Feature Comparison</h2>
          <p className="text-center text-[#3a5070] text-sm mb-10">Everything side by side, nothing hidden.</p>

          <div className="rounded-2xl border border-white/8 overflow-hidden">
            <div className="grid grid-cols-4 bg-[#070e1a] px-6 py-4 border-b border-white/5">
              <div className="text-[#3a5070] text-xs font-bold uppercase tracking-widest">Feature</div>
              {["Free", "Premium", "Sovereign"].map(n => (
                <div key={n} className={`text-center text-xs font-black uppercase tracking-widest ${n === "Sovereign" ? "text-[#C9A84C]" : "text-white"}`}>{n}</div>
              ))}
            </div>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className={`grid grid-cols-4 px-6 py-4 items-center ${i % 2 === 0 ? "bg-[#060d16]" : "bg-[#070e1a]"} border-b border-white/4 last:border-b-0`}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-[#3a5070]" />
                    <span className="text-[#6a7f99] text-xs">{f.label}</span>
                  </div>
                  <div className="text-center text-xs text-[#3a5070]">{f.free}</div>
                  <div className="text-center text-xs text-[#94a3b8]">{f.premium}</div>
                  <div className={`text-center text-xs font-semibold ${f.sovereign === "✓" || f.sovereign === "Unlimited" || f.sovereign === "Top" || f.sovereign === "24/7" ? "text-[#C9A84C]" : "text-[#94a3b8]"}`}>{f.sovereign}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── FAQ strip ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-16 text-center space-y-3"
        >
          <p className="text-[#3a5070] text-xs">Payments are processed securely through your Orakzai Wallet in PKR.</p>
          <p className="text-[#3a5070] text-xs">Cancel anytime. Auto-renewal can be turned off from the Agent Dashboard.</p>
          <p className="text-[#2a3a50] text-xs">Questions? Contact <span className="text-[#C9A84C]">support@orakzai.pk</span></p>
        </motion.div>
      </div>
    </div>
  );
}
