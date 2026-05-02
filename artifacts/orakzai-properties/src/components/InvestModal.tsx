import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  X, Minus, Plus, Shield, CheckCircle2, TrendingUp, Clock,
  Award, Star, Coins, ArrowRight, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBuyShares } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function formatPKR(n: number) {
  if (n >= 1_000_000_000) return `PKR ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 10_000_000)    return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)       return `PKR ${(n / 100_000).toFixed(1)}L`;
  return `PKR ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function parseRoiPct(roi: string) {
  const m = roi.match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : 15;
}

type Props = {
  project: {
    id: number;
    title: string;
    location: string;
    totalValue: number;
    totalShares: number;
    fundedShares: number;
    minInvestment: number;
    roi: string;
    duration: string;
    status: string;
  };
  onClose: () => void;
};

type Step = "select" | "confirm" | "success";

function GoldCoinBurst() {
  const coins = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {coins.map((_, i) => {
        const angle = (i / 12) * 360;
        const rad = (angle * Math.PI) / 180;
        const tx = Math.cos(rad) * 140;
        const ty = Math.sin(rad) * 140;
        return (
          <motion.div
            key={i}
            className="absolute w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
            style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060, #a07030)", color: "#0a1220" }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: tx, y: ty, scale: [0, 1.4, 0.9], opacity: [1, 1, 0] }}
            transition={{ duration: 1.1, delay: i * 0.04, ease: "easeOut" }}
          >
            ₿
          </motion.div>
        );
      })}
    </div>
  );
}

function CertificateFlash({ transactionId, title }: { transactionId: string; title: string }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.6 }}
      className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-[#C9A84C]/60 shadow-2xl shadow-[#C9A84C]/30"
      style={{ background: "linear-gradient(135deg, #0d1e35 0%, #0a1628 50%, #0f2040 100%)" }}
    >
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #C9A84C 0, #C9A84C 1px, transparent 0, transparent 50%)", backgroundSize: "12px 12px" }} />
      <div className="relative p-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-[#C9A84C]/50"
            style={{ background: "linear-gradient(135deg, #C9A84C22, #e8c06011)" }}>
            <Award className="w-7 h-7 text-[#C9A84C]" />
          </div>
        </div>
        <div className="text-[10px] text-[#C9A84C] uppercase tracking-[0.3em] mb-1">Orakzai Investment Grid</div>
        <div className="text-[10px] text-[#4a6080] mb-3">Digital Certificate of Ownership</div>
        <div className="font-serif text-base text-white font-bold mb-1 leading-snug">{title}</div>
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-[#C9A84C] fill-[#C9A84C]" />)}
        </div>
        <div className="border-t border-[#C9A84C]/20 pt-3">
          <div className="text-[9px] text-[#2a4060] font-mono break-all">TXN: {transactionId}</div>
        </div>
      </div>
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #C9A84C, #e8c060, #C9A84C)" }} />
    </motion.div>
  );
}

export default function InvestModal({ project, onClose }: Props) {
  const { user } = useUser();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const available = project.totalShares - project.fundedShares;
  const sharePrice = project.totalShares > 0 ? project.totalValue / project.totalShares : project.minInvestment;
  const roiPct = parseRoiPct(project.roi);

  const [step, setStep] = useState<Step>("select");
  const [shares, setShares] = useState(1);
  const [transaction, setTransaction] = useState<any>(null);

  const totalCost       = useMemo(() => shares * sharePrice, [shares, sharePrice]);
  const monthlyRoi      = useMemo(() => (totalCost * (roiPct / 100)) / 12, [totalCost, roiPct]);
  const annualRoi       = useMemo(() => totalCost * (roiPct / 100), [totalCost, roiPct]);
  const urgencyPct      = useMemo(() => Math.round(((project.totalShares - available) / project.totalShares) * 100), [project, available]);

  const { mutate: buyShares, isPending } = useBuyShares();

  const incrementShares = useCallback(() => {
    if (shares < available) setShares((s) => s + 1);
  }, [shares, available]);

  const decrementShares = useCallback(() => {
    setShares((s) => Math.max(1, s - 1));
  }, []);

  const handleConfirm = useCallback(() => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to invest.", variant: "destructive" });
      return;
    }
    buyShares(
      { id: project.id, data: { shares } },
      {
        onSuccess: (data: any) => {
          setTransaction(data);
          setStep("success");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error ?? err?.message ?? "Transaction failed";
          toast({ title: "Investment failed", description: msg, variant: "destructive" });
          setStep("select");
        },
      },
    );
  }, [user, project.id, shares, buyShares, toast]);

  const handleViewPortfolio = useCallback(() => {
    onClose();
    const userName = user?.firstName ?? user?.username ?? "Chairman";
    toast({
      title: `Congratulations Chairman ${userName}!`,
      description: "Your investment is now active on the Orakzai Grid.",
    });
    navigate("/portfolio");
  }, [onClose, user, toast, navigate]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={step !== "success" ? onClose : undefined}
        />

        <motion.div
          className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl shadow-[#C9A84C]/15 border border-[#C9A84C]/20"
          style={{ background: "linear-gradient(160deg, #0d1e35 0%, #08111f 60%, #0c1830 100%)" }}
          initial={{ scale: 0.9, y: 24, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 24, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #C9A84C, #e8c060, #C9A84C)" }} />

          {step !== "success" && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#1e3a5f]/60 flex items-center justify-center text-[#6a7f99] hover:text-white hover:bg-[#1e3a5f] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <AnimatePresence mode="wait">
            {step === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6"
              >
                <div className="mb-5">
                  <div className="text-[10px] text-[#C9A84C] uppercase tracking-widest mb-1">Secure Your Stake</div>
                  <h2 className="font-serif text-xl text-white font-bold leading-snug">{project.title}</h2>
                  <p className="text-xs text-[#6a7f99] mt-0.5">{project.location}</p>
                </div>

                <div className="flex items-center gap-2 mb-5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-xs text-amber-300">
                    <strong>{available}</strong> of {project.totalShares} shares remaining — {urgencyPct}% funded
                  </span>
                </div>

                <div className="mb-5">
                  <label className="text-xs text-[#6a7f99] uppercase tracking-wider block mb-3">Number of Shares</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={decrementShares}
                      className="w-11 h-11 rounded-xl border border-[#1e3a5f] flex items-center justify-center text-[#6a7f99] hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors disabled:opacity-30"
                      disabled={shares <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center">
                      <div className="text-4xl font-bold text-white font-mono">{shares}</div>
                      <div className="text-[10px] text-[#4a6080] mt-0.5">share{shares !== 1 ? "s" : ""} @ {formatPKR(sharePrice)} each</div>
                    </div>
                    <button
                      onClick={incrementShares}
                      className="w-11 h-11 rounded-xl border border-[#1e3a5f] flex items-center justify-center text-[#6a7f99] hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-colors disabled:opacity-30"
                      disabled={shares >= available}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl bg-[#060f1c] border border-[#C9A84C]/25 p-3 text-center">
                    <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-1">Total Cost</div>
                    <div className="text-sm font-bold text-[#C9A84C] leading-tight">{formatPKR(totalCost)}</div>
                  </div>
                  <div className="rounded-xl bg-[#060f1c] border border-emerald-500/20 p-3 text-center">
                    <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-1">Monthly ROI</div>
                    <div className="text-sm font-bold text-emerald-400 leading-tight">{formatPKR(monthlyRoi)}</div>
                  </div>
                  <div className="rounded-xl bg-[#060f1c] border border-[#1e3a5f]/40 p-3 text-center">
                    <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-1">Annual ROI</div>
                    <div className="text-sm font-bold text-white leading-tight">{formatPKR(annualRoi)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-5 text-[10px] text-[#4a6080]">
                  <TrendingUp className="w-3 h-3 text-[#C9A84C]" />
                  <span>{project.roi} return over {project.duration}</span>
                  <span className="mx-1">·</span>
                  <Clock className="w-3 h-3 text-[#C9A84C]" />
                  <span>Quarterly distributions</span>
                </div>

                <button
                  onClick={() => setStep("confirm")}
                  disabled={available === 0}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-xl hover:shadow-[#C9A84C]/20 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e8c060 50%, #C9A84C 100%)", color: "#0a1220" }}
                >
                  <Shield className="w-4 h-4" />
                  Proceed to Confirm
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6"
              >
                <button
                  onClick={() => setStep("select")}
                  className="flex items-center gap-1.5 text-xs text-[#6a7f99] hover:text-[#C9A84C] mb-5 transition-colors"
                >
                  ← Back
                </button>

                <div className="text-[10px] text-[#C9A84C] uppercase tracking-widest mb-1">Confirm Investment</div>
                <h2 className="font-serif text-xl text-white font-bold mb-5">Review & Confirm</h2>

                <div className="rounded-2xl border border-[#C9A84C]/20 bg-[#060f1c] p-5 mb-4 space-y-3">
                  {[
                    { label: "Project", value: project.title },
                    { label: "Location", value: project.location },
                    { label: "Shares", value: `${shares} share${shares !== 1 ? "s" : ""}` },
                    { label: "Total Amount", value: formatPKR(totalCost), gold: true, large: true },
                    { label: "Projected Monthly ROI", value: formatPKR(monthlyRoi), green: true },
                    { label: "Exit Period", value: project.duration },
                    { label: "Target Return", value: project.roi },
                  ].map(({ label, value, gold, green, large }) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <span className="text-xs text-[#6a7f99] shrink-0">{label}</span>
                      <span className={`text-right text-xs font-semibold ${gold ? "text-[#C9A84C]" : green ? "text-emerald-400" : "text-white"} ${large ? "text-base" : ""}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-3 bg-[#C9A84C]/8 border border-[#C9A84C]/25 rounded-xl px-4 py-3 mb-5">
                  <Shield className="w-4 h-4 text-[#C9A84C] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#C9A84C] mb-0.5">Sovereign Guarantee</div>
                    <div className="text-[10px] text-[#4a6080] leading-relaxed">
                      This investment is backed by legally verified, title-cleared real assets under the Orakzai Properties Trust Framework. All transactions are immutably recorded on the Orakzai Grid.
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-xl hover:shadow-[#C9A84C]/25 hover:scale-[1.02] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e8c060 50%, #C9A84C 100%)", color: "#0a1220" }}
                >
                  {isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0a1220]/40 border-t-[#0a1220] rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Confirm Investment — {formatPKR(totalCost)}
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {step === "success" && transaction && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 relative"
              >
                <GoldCoinBurst />

                <div className="relative text-center mb-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 250, damping: 20, delay: 0.3 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#C9A84C]/60"
                    style={{ background: "linear-gradient(135deg, #C9A84C22, #e8c06011)" }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-[#C9A84C]" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="text-[10px] text-[#C9A84C] uppercase tracking-widest mb-1">Investment Confirmed</div>
                    <h2 className="font-serif text-xl text-white font-bold mb-1">
                      Welcome to the Grid, {user?.firstName ?? "Chairman"}!
                    </h2>
                    <p className="text-xs text-[#6a7f99]">
                      {transaction.sharesBought} share{transaction.sharesBought !== 1 ? "s" : ""} in {transaction.projectTitle} — {formatPKR(transaction.amountPaid)} secured.
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mb-5"
                >
                  <CertificateFlash transactionId={transaction.transactionId} title={transaction.projectTitle} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="grid grid-cols-2 gap-3 mb-5"
                >
                  <div className="rounded-xl bg-[#060f1c] border border-emerald-500/20 p-3 text-center">
                    <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-1">Monthly Income</div>
                    <div className="text-sm font-bold text-emerald-400">{formatPKR((transaction.amountPaid * (parseRoiPct(transaction.roi) / 100)) / 12)}</div>
                  </div>
                  <div className="rounded-xl bg-[#060f1c] border border-[#C9A84C]/20 p-3 text-center">
                    <div className="text-[9px] text-[#4a6080] uppercase tracking-wider mb-1">Annual Return</div>
                    <div className="text-sm font-bold text-[#C9A84C]">{transaction.roi}</div>
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  onClick={handleViewPortfolio}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:shadow-xl hover:shadow-[#C9A84C]/25 hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e8c060 50%, #C9A84C 100%)", color: "#0a1220" }}
                >
                  <Coins className="w-4 h-4" />
                  View My Portfolio
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
