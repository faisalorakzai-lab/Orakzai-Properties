import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Crown, Star, Check, ArrowLeft, Wallet, AlertTriangle, Sparkles, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Show } from "@clerk/react";
import { Link } from "wouter";
import {
  useGetSubscriptionMe,
  useSubscribeSubscription as useSubscribePlan,
  getGetSubscriptionMeQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const PLAN_META: Record<string, { name: string; icon: typeof Crown; iconColor: string; border: string; glow: string; perks: string[] }> = {
  premium: {
    name: "Premium",
    icon: Star,
    iconColor: "text-[#C9A84C]",
    border: "border-[#C9A84C]/30",
    glow: "",
    perks: ["20 Active Listings", "Verified Agent Badge", "5 Hot Tags per listing", "Priority Search Placement", "Email Support"],
  },
  sovereign: {
    name: "Sovereign",
    icon: Crown,
    iconColor: "text-amber-300",
    border: "border-[#C9A84C]",
    glow: "shadow-[0_0_60px_rgba(201,168,76,0.2)]",
    perks: ["Unlimited Active Listings", "Featured on Home Dashboard", "Direct Lead Notifications", "Verified Agent Badge", "24/7 Priority Support", "Unlimited Hot Tags"],
  },
};

const PRICES: Record<string, { monthly: number; annual: number }> = {
  premium: { monthly: 9_900, annual: 100_980 },
  sovereign: { monthly: 24_900, annual: 253_980 },
};

function fmtPkr(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`;
}

export default function Subscribe() {
  const { planId } = useParams<{ planId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const [cycle, setCycle] = useState<"monthly" | "annual">(
    urlParams.get("cycle") === "annual" ? "annual" : "monthly"
  );

  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetch(`${basePath}/api/wallet/me`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.balance) setWalletBalance(parseFloat(d.balance)); })
      .catch(() => {});
  }, []);

  const { data: subData } = useGetSubscriptionMe();
  const subscribe = useSubscribePlan();

  const meta = PLAN_META[planId ?? ""] ?? PLAN_META.premium;
  const prices = PRICES[planId ?? ""] ?? PRICES.premium;
  const Icon = meta.icon;
  const amount = cycle === "annual" ? prices.annual : prices.monthly;
  const hasEnough = walletBalance >= amount;
  const currentPlan = subData?.planId ?? "free";
  const isCurrent = currentPlan === planId;

  const handleSubscribe = async () => {
    if (!hasEnough) return;
    subscribe.mutate(
      { data: { planId: planId ?? "premium", billingCycle: cycle } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSubscriptionMeQueryKey() });
          setWalletBalance(prev => prev - amount);
          toast({ title: `${meta.name} Plan Activated! 🎉`, description: "Your subscription is now live." });
          setTimeout(() => navigate(`${basePath}/agent/dashboard`), 1500);
        },
        onError: (e: any) => {
          const msg = (e as any)?.response?.data?.error ?? "Subscription failed";
          toast({ title: "Payment failed", description: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#040b14]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-20">
        {/* Back */}
        <Link href={`${basePath}/pricing`}>
          <button className="flex items-center gap-2 text-[#4a6080] hover:text-white text-sm transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Plans
          </button>
        </Link>

        <Show
          when="signed-in"
          fallback={
            <div className="text-center py-24">
              <Lock className="h-10 w-10 text-[#2a3a50] mx-auto mb-4" />
              <p className="text-white font-bold mb-2">Sign in to subscribe</p>
              <Link href={`${basePath}/sign-in`}>
                <button className="mt-4 px-6 py-2.5 rounded-xl bg-[#C9A84C] text-[#080f1a] font-bold text-sm">Sign In</button>
              </Link>
            </div>
          }
        >
          {isCurrent ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
              <div className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <Check className="h-7 w-7 text-emerald-400" />
              </div>
              <p className="text-white font-bold text-xl mb-2">You're already on {meta.name}</p>
              <p className="text-[#4a6080] text-sm mb-6">Manage your plan from the Agent Dashboard.</p>
              <Link href={`${basePath}/agent/dashboard`}>
                <button className="px-6 py-2.5 rounded-xl bg-[#C9A84C] text-[#080f1a] font-bold text-sm">Go to Dashboard</button>
              </Link>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Plan summary card */}
              <div className={`rounded-2xl border-2 bg-gradient-to-b from-[#0a1628]/80 to-[#060d16]/80 ${meta.border} ${meta.glow} p-7 relative overflow-hidden`}>
                {planId === "sovereign" && (
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_30%_at_50%_0%,rgba(201,168,76,0.06),transparent)] pointer-events-none" />
                )}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${planId === "sovereign" ? "border-[#C9A84C]/40 bg-[#C9A84C]/10" : "border-white/10 bg-white/5"}`}>
                    <Icon className={`h-6 w-6 ${meta.iconColor}`} />
                  </div>
                  <div>
                    <div className="text-white font-black text-xl">{meta.name} Plan</div>
                    <div className="text-[#3a5070] text-xs">Billed {cycle}</div>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {meta.perks.map((p, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check className={`h-3.5 w-3.5 flex-shrink-0 ${planId === "sovereign" ? "text-[#C9A84C]" : "text-emerald-400"}`} />
                      <span className="text-[#94a3b8] text-sm">{p}</span>
                    </li>
                  ))}
                </ul>

                {/* Billing toggle */}
                <div className="flex items-center gap-3 p-1.5 bg-[#040b14]/60 rounded-xl border border-white/5 w-fit mb-6">
                  {(["monthly", "annual"] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => setCycle(c)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${cycle === c ? "bg-[#C9A84C] text-[#080f1a]" : "text-[#4a6080] hover:text-white"}`}
                    >
                      {c}
                      {c === "annual" && <span className="ml-1.5 text-[9px] opacity-70">−15%</span>}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div className="flex items-end justify-between border-t border-white/5 pt-5">
                  <div>
                    <div className="text-[#3a5070] text-xs uppercase tracking-wider mb-1">Total Due</div>
                    <div className={`text-3xl font-black ${planId === "sovereign" ? "text-[#C9A84C]" : "text-white"}`}>
                      {fmtPkr(amount)}
                    </div>
                    {cycle === "annual" && (
                      <div className="text-emerald-400 text-xs mt-0.5">
                        ≈ {fmtPkr(Math.round(amount / 12))}/mo — save {fmtPkr(prices.monthly * 12 - prices.annual)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Wallet balance card */}
              <div className={`rounded-xl border p-5 flex items-center justify-between ${hasEnough ? "border-emerald-500/20 bg-emerald-500/4" : "border-rose-500/20 bg-rose-500/4"}`}>
                <div className="flex items-center gap-3">
                  <Wallet className={`h-5 w-5 ${hasEnough ? "text-emerald-400" : "text-rose-400"}`} />
                  <div>
                    <div className="text-white text-sm font-bold">Orakzai Wallet</div>
                    <div className={`text-xs ${hasEnough ? "text-emerald-400" : "text-rose-400"}`}>
                      Balance: {fmtPkr(walletBalance)}
                    </div>
                  </div>
                </div>
                {hasEnough ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                    <Check className="h-4 w-4" /> Sufficient
                  </div>
                ) : (
                  <Link href={`${basePath}/wallet`}>
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-semibold hover:bg-rose-500/25 transition-all">
                      Top Up
                    </button>
                  </Link>
                )}
              </div>

              {/* Insufficient warning */}
              {!hasEnough && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-300 text-sm font-semibold">Insufficient Balance</p>
                    <p className="text-amber-400/70 text-xs mt-0.5">
                      You need {fmtPkr(amount - walletBalance)} more in your wallet.{" "}
                      <Link href={`${basePath}/wallet`}>
                        <span className="underline cursor-pointer">Deposit now →</span>
                      </Link>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Confirm button */}
              <button
                onClick={handleSubscribe}
                disabled={!hasEnough || subscribe.isPending}
                className={`w-full h-14 rounded-xl font-black text-base flex items-center justify-center gap-2.5 transition-all ${
                  hasEnough
                    ? planId === "sovereign"
                      ? "bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#080f1a] shadow-lg shadow-[#C9A84C]/25 hover:shadow-[#C9A84C]/40"
                      : "bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/25"
                    : "bg-white/5 text-[#2a3a50] cursor-not-allowed"
                }`}
              >
                {subscribe.isPending ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="h-5 w-5 border-2 border-current/30 border-t-current rounded-full" />
                    Processing Payment…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Confirm & Pay {fmtPkr(amount)}
                  </>
                )}
              </button>

              <p className="text-center text-[#2a3a50] text-xs">
                Deducted from your Orakzai Wallet · Cancel anytime · Renews {cycle === "annual" ? "yearly" : "monthly"}
              </p>
            </motion.div>
          )}
        </Show>
      </div>
    </div>
  );
}
