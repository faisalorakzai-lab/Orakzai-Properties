import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  Coins,
  Clock,
  CheckCircle2,
  HelpCircle,
  History,
  Lock,
  ChevronRight,
  Sparkles,
  Building2,
  Landmark,
  Wallet,
  AlertCircle,
  X,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StakingPool {
  id: string;
  symbol: string;
  name: string;
  category: "real-estate" | "land-bonds" | "high-yield";
  apy: number;
  minStake: string;
  minStakeUsdt: number;
  tvl: string;
  progress: number;
  durations: string[];
  tag: string;
  tagColor: string;
  description: string;
  iconBg: string;
}

interface ActiveStake {
  id: string;
  poolName: string;
  symbol: string;
  amountUsdt: number;
  amountPkr: string;
  apy: number;
  duration: string;
  earnedUsdt: number;
  startDate: string;
}

const POOLS: StakingPool[] = [
  {
    id: "dhaisb",
    symbol: "DHAISB",
    name: "DHAISB - DHA Islamabad Phase 1",
    category: "real-estate",
    apy: 18.5,
    minStake: "100 USDT (Rs 28,000)",
    minStakeUsdt: 100,
    tvl: "$5.0M",
    progress: 78,
    durations: ["Flexible", "30 Days", "90 Days", "365 Days"],
    tag: "Hot / 18.5% APY",
    tagColor: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    description: "Secured by prime residential land holdings in DHA Islamabad Phase 1 with monthly rental yield distribution.",
    iconBg: "bg-emerald-500/20 text-emerald-400",
  },
  {
    id: "asc",
    symbol: "ASC",
    name: "ASC - Azan Smart Center",
    category: "real-estate",
    apy: 22.0,
    minStake: "50 USDT",
    minStakeUsdt: 50,
    tvl: "$3.8M",
    progress: 92,
    durations: ["30 Days", "90 Days", "180 Days Lock"],
    tag: "Fixed 22.0% APY",
    tagColor: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    description: "Commercial retail spaces in Azan Smart City with guaranteed developer buy-back and high footfall rental return.",
    iconBg: "bg-amber-500/20 text-amber-400",
  },
  {
    id: "lnd-rwa",
    symbol: "LND-RWA",
    name: "Commercial Land Yield Note",
    category: "land-bonds",
    apy: 14.2,
    minStake: "25 USDT",
    minStakeUsdt: 25,
    tvl: "$12.4M",
    progress: 65,
    durations: ["Flexible Unstake", "90 Days", "365 Days"],
    tag: "Guaranteed Backing",
    tagColor: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    description: "Backed by title deeds of commercial acreage in Lahore and Karachi financial districts. Liquid daily rewards.",
    iconBg: "bg-blue-500/20 text-blue-400",
  },
  {
    id: "okb-vault",
    symbol: "OKBOND",
    name: "OkzByte Luxury Tower RWA Fund",
    category: "high-yield",
    apy: 24.5,
    minStake: "500 USDT",
    minStakeUsdt: 500,
    tvl: "$18.2M",
    progress: 64,
    durations: ["90 Days", "180 Days", "365 Days Lock"],
    tag: "Institutional Tier",
    tagColor: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
    description: "Flagship institutional vault pooling luxury high-rise commercial assets across Dubai Marina and Islamabad.",
    iconBg: "bg-purple-500/20 text-purple-400",
  },
];

export default function RwaStaking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"all" | "real-estate" | "land-bonds" | "high-yield" | "my-stakes">("all");
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState<string>("1000");
  const [selectedCurrency, setSelectedCurrency] = useState<"USDT" | "PKR">("USDT");
  const [selectedDuration, setSelectedDuration] = useState<string>("90 Days");

  // User financial state
  const [totalStaked, setTotalStaked] = useState<number>(250000); // PKR
  const [totalEarned, setTotalEarned] = useState<number>(18450); // PKR
  const [userStakes, setUserStakes] = useState<ActiveStake[]>([
    {
      id: "stake-1",
      poolName: "DHAISB - DHA Islamabad Phase 1",
      symbol: "DHAISB",
      amountUsdt: 500,
      amountPkr: "Rs 140,000",
      apy: 18.5,
      duration: "90 Days",
      earnedUsdt: 24.5,
      startDate: "2026-07-15",
    },
    {
      id: "stake-2",
      poolName: "ASC - Azan Smart Center",
      symbol: "ASC",
      amountUsdt: 392,
      amountPkr: "Rs 110,000",
      apy: 22.0,
      duration: "180 Days Lock",
      earnedUsdt: 38.2,
      startDate: "2026-08-01",
    },
  ]);

  const handleClaimRewards = () => {
    if (totalEarned <= 0) {
      toast({ title: "No rewards to claim", description: "Your staked vaults are currently accruing daily yield." });
      return;
    }
    toast({
      title: "Rewards Claimed Successfully! 🎉",
      description: `Transferred Rs ${totalEarned.toLocaleString()} (+${(totalEarned / 280).toFixed(2)} USDT) to your spot wallet.`,
    });
    setTotalEarned(0);
  };

  const handleConfirmStake = () => {
    if (!selectedPool) return;
    const numAmt = parseFloat(stakeAmount) || 0;
    if (numAmt < selectedPool.minStakeUsdt) {
      toast({
        title: "Amount below minimum",
        description: `Minimum stake for ${selectedPool.symbol} is ${selectedPool.minStake}`,
        variant: "destructive",
      });
      return;
    }

    const pkrVal = selectedCurrency === "USDT" ? `Rs ${(numAmt * 280).toLocaleString()}` : `Rs ${numAmt.toLocaleString()}`;
    const newStake: ActiveStake = {
      id: `stake-${Date.now()}`,
      poolName: selectedPool.name,
      symbol: selectedPool.symbol,
      amountUsdt: selectedCurrency === "USDT" ? numAmt : numAmt / 280,
      amountPkr: pkrVal,
      apy: selectedPool.apy,
      duration: selectedDuration,
      earnedUsdt: 0,
      startDate: new Date().toISOString().split("T")[0],
    };

    setUserStakes([newStake, ...userStakes]);
    setTotalStaked((prev) => prev + (selectedCurrency === "USDT" ? numAmt * 280 : numAmt));
    setSelectedPool(null);

    toast({
      title: "RWA Stake Locked Successfully!",
      description: `Successfully staked ${stakeAmount} ${selectedCurrency} in ${selectedPool.symbol} (${selectedDuration}).`,
    });
  };

  const filteredPools = POOLS.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "real-estate") return p.category === "real-estate";
    if (activeTab === "land-bonds") return p.category === "land-bonds";
    if (activeTab === "high-yield") return p.category === "high-yield";
    return true;
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0e11] px-4 pt-3 pb-24 font-sans text-slate-100 antialiased selection:bg-amber-500/30">
      {/* ── TOP HEADER & NAVIGATION BAR ──────────────────────────── */}
      <div className="sticky top-0 z-40 -mx-4 mb-4 flex h-12 items-center justify-between border-b border-[#2b313a] bg-[#0b0e11]/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl bg-[#161a1e] border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="truncate text-base font-bold tracking-wide text-white">RWA Staking Vaults</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("my-stakes")}
            title="My Portfolio"
            className="w-9 h-9 rounded-xl bg-[#161a1e] border border-slate-800 flex items-center justify-center text-amber-400 hover:bg-slate-800 transition relative"
          >
            <History className="w-4 h-4" />
            {userStakes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {userStakes.length}
              </span>
            )}
          </button>
          <button
            onClick={() =>
              toast({
                title: "RWA Staking Help",
                description: "Earn passive daily yield backed by certified real estate and commercial land assets in Pakistan and UAE.",
              })
            }
            title="FAQ Help"
            className="w-9 h-9 rounded-xl bg-[#161a1e] border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl space-y-5">
        <section className="rounded-2xl border border-[#2b313a] bg-[#151a21] p-4 sm:p-5">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0b90b]"><Landmark className="h-3.5 w-3.5" /> RWA marketplace</div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Earn from real-world assets.</h2>
          <p className="mt-2 max-w-xl text-xs leading-5 text-slate-400 sm:text-sm">Access transparent property, land-bond and commercial-income vaults through the same secure Exchange experience.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-300"><span className="rounded-md border border-[#2b313a] bg-[#0b0e11] px-2.5 py-1.5">Title-deed reviewed</span><span className="rounded-md border border-[#2b313a] bg-[#0b0e11] px-2.5 py-1.5">Daily yield estimate</span><span className="rounded-md border border-[#2b313a] bg-[#0b0e11] px-2.5 py-1.5">Escrow tracked</span></div>
        </section>
        {/* ── HERO PORTFOLIO & STATS BANNER ──────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl border border-[#2b313a] bg-[#1e2329] p-4 shadow-md sm:p-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* User Staking Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Total Staked Value</div>
              <div className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-2">
                Rs {totalStaked.toLocaleString()} <span className="text-xs text-slate-400 font-normal">(${(totalStaked / 280).toFixed(2)} USDT)</span>
              </div>
              <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                <span>Earned Rewards: +Rs {totalEarned.toLocaleString()}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 ml-1">+14.8% APY avg</span>
              </div>
            </div>
            <button
              onClick={handleClaimRewards}
              className="bg-amber-400 hover:bg-amber-300 text-black font-semibold text-sm rounded-xl px-4 py-2 transition shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              Claim Rewards
            </button>
          </div>

          {/* Global Staking Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-xl border border-[#2b313a] bg-[#0b0e11]/60 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total Value Locked (TVL)</div>
              <div className="mt-0.5 text-base font-bold text-white">$48,250,000</div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#0ecb81]"><TrendingUp className="h-3 w-3" /> +5.4% this month</div>
            </div>
            <div className="rounded-xl border border-[#2b313a] bg-[#0b0e11]/60 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Max APY Offered</div>
              <div className="mt-0.5 text-base font-bold text-[#0ecb81]">24.5% APY</div>
              <div className="mt-0.5 text-[10px] text-slate-400">Institutional Grade</div>
            </div>
          </div>
        </section>
        {/* ── CATEGORY FILTER TABS ──────────────────────────── */}
        <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1">
          {[
            { id: "all", label: "All Vaults" },
            { id: "real-estate", label: "Real Estate RWAs" },
            { id: "land-bonds", label: "Land Bonds" },
            { id: "high-yield", label: "High Yield Vaults" },
            { id: "my-stakes", label: `My Active Stakes (${userStakes.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "border-[#f0b90b]/30 bg-[#2b313a] text-[#f0b90b]"
                  : "border-[#2b313a] bg-[#181a20] text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── MY ACTIVE STAKES TAB VIEW ──────────────────────────── */}
        {activeTab === "my-stakes" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Your Active Staked Positions</h2>
              <span className="text-xs text-slate-400">{userStakes.length} Active Vaults</span>
            </div>

            {userStakes.length === 0 ? (
              <div className="bg-[#161a1e] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <Coins className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="text-sm font-semibold text-slate-300">No Active Stakes Found</div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Browse our high-yield real estate and land bond staking pools above to start earning daily rewards.
                </p>
                <button
                  onClick={() => setActiveTab("all")}
                  className="bg-amber-400 text-black text-xs font-bold px-4 py-2 rounded-xl mt-2 inline-block"
                >
                  Explore Staking Pools
                </button>
              </div>
            ) : (
              userStakes.map((stake) => (
                <div key={stake.id} className="bg-[#161a1e] border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                        {stake.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{stake.poolName}</div>
                        <div className="text-[11px] text-slate-400">Locked on {stake.startDate} • {stake.duration}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {stake.apy}% APY
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#0b0e11] rounded-xl p-3 border border-slate-800/60 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400">Staked Principal</div>
                      <div className="text-xs font-bold text-white mt-0.5">{stake.amountPkr}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">USDT Value</div>
                      <div className="text-xs font-bold text-white mt-0.5">${stake.amountUsdt.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Accrued Yield</div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5">+${stake.earnedUsdt.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Title Deed Escrow Protected
                    </div>
                    <button
                      onClick={() => {
                        setUserStakes(userStakes.filter((s) => s.id !== stake.id));
                        toast({ title: "Unstaked Successfully", description: `Returned principal and yield to your wallet.` });
                      }}
                      className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition"
                    >
                      Unstake / Redeem
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* ── RWA STAKING POOLS LIST (CARD DESIGN) ──────────────────────────── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Available RWA Staking Vaults</h2>
              <span className="text-xs text-slate-400">{filteredPools.length} Pools Available</span>
            </div>

            {filteredPools.map((pool) => (
              <div
                key={pool.id}
                className="min-w-0 space-y-4 rounded-2xl border border-[#2b313a]/70 bg-[#181a20] p-4 shadow-md transition-all hover:border-[#f0b90b]/40"
              >
                {/* Header */}
                <div className="mb-1 flex min-w-0 items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${pool.iconBg}`}>
                      {pool.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="truncate text-sm font-bold text-white">{pool.name}</div>
                      <div className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-400">{pool.description}</div>
                    </div>
                  </div>
                  <span className={`shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold ${pool.tagColor}`}>
                    {pool.tag}
                  </span>
                </div>

                {/* Yield Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0b0e11] rounded-xl p-3 border border-slate-800/80">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Est. APY</div>
                    <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{pool.apy}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Min. Stake</div>
                    <div className="text-xs font-bold text-white mt-1">{pool.minStake}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Pool TVL</div>
                    <div className="text-xs font-bold text-white mt-1">{pool.tvl}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Duration Options</div>
                    <div className="text-xs font-bold text-amber-400 mt-1 truncate">{pool.durations[0]}</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Pool Quota Filled</span>
                    <span className="font-semibold text-white">{pool.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2b313a]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#f0b90b] to-[#0ecb81]"
                      style={{ width: `${pool.progress}%` }}
                    />
                  </div>
                </div>

                {/* Primary CTA Button */}
                <button
                  onClick={() => setSelectedPool(pool)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b90b] py-3 text-sm font-bold text-black shadow-lg shadow-[#f0b90b]/20 transition hover:bg-[#d9a507] active:scale-[0.98]"
                >
                  <Lock className="w-4 h-4" />
                  Stake Now in {pool.symbol}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-xl border border-[#2b313a] bg-[#151a21] px-3 py-3 text-[11px] leading-5 text-slate-500">
          RWA vaults are subject to asset, liquidity, counterparty and market risks. Review title-deed, custody, redemption and eligibility information before staking.
        </div>
      </main>

      {/* ── STAKING DEPOSIT MODAL / SLIDE-OVER ──────────────────────────── */}
      <AnimatePresence>
        {selectedPool && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-[#161a1e] border border-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                    {selectedPool.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Stake {selectedPool.symbol}</h3>
                    <p className="text-xs text-slate-400">{selectedPool.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPool(null)}
                  className="w-8 h-8 rounded-full bg-[#0b0e11] text-slate-400 hover:text-white flex items-center justify-center border border-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Enter Staking Amount</span>
                  <span className="text-slate-400">Balance: 12,450 USDT (Rs 3.48M)</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="w-full bg-[#0b0e11] border border-slate-800 focus:border-amber-400 text-white rounded-xl py-3 px-4 text-base font-bold outline-none pr-28"
                    placeholder="1000"
                  />
                  <div className="absolute right-2 flex items-center gap-1.5">
                    <button
                      onClick={() => setStakeAmount("10000")}
                      className="px-2 py-1 bg-[#161a1e] hover:bg-slate-800 text-amber-400 text-[10px] font-bold rounded border border-slate-800 transition"
                    >
                      MAX
                    </button>
                    <select
                      value={selectedCurrency}
                      onChange={(e) => setSelectedCurrency(e.target.value as any)}
                      className="bg-[#161a1e] text-xs font-bold text-white border border-slate-800 rounded-lg px-2 py-1 outline-none"
                    >
                      <option value="USDT">USDT</option>
                      <option value="PKR">PKR</option>
                    </select>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Minimum stake: {selectedPool.minStake}
                </div>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-medium">Select Lock Duration & Yield</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedPool.durations.map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setSelectedDuration(dur)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition ${
                        selectedDuration === dur
                          ? "bg-amber-400 text-black border-amber-400 shadow-md shadow-amber-400/20"
                          : "bg-[#0b0e11] text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div>{dur}</div>
                      <div className={`text-[10px] mt-0.5 ${selectedDuration === dur ? "text-black/80" : "text-emerald-400"}`}>
                        +{selectedPool.apy}% APY
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Yield Calculation Box */}
              <div className="bg-[#0b0e11] rounded-2xl p-4 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Yield Projection & Terms
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Est. Daily Reward</span>
                    <span className="font-bold text-emerald-400">
                      +{(parseFloat(stakeAmount || "0") * (selectedPool.apy / 100) / 365).toFixed(4)} {selectedCurrency} / day
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Est. Maturity Value</span>
                    <span className="font-bold text-white">
                      {(parseFloat(stakeAmount || "0") * (1 + selectedPool.apy / 100 * 0.25)).toLocaleString()} {selectedCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unstake Redemption</span>
                    <span className="font-medium text-slate-300">Instant or 24h Escrow release</span>
                  </div>
                </div>
              </div>

              {/* Confirmation CTA */}
              <button
                onClick={handleConfirmStake}
                className="w-full bg-amber-400 hover:bg-amber-300 text-black font-bold py-3.5 rounded-xl transition shadow-lg shadow-amber-400/20 text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Lock RWA Stake ({stakeAmount} {selectedCurrency})
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
