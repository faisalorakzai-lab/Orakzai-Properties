import { useMemo, useState } from "react";
import { Bell, ChevronDown, ChevronRight, CircleHelp, Clock3, Menu, Search, ShieldCheck, Sparkles, Wallet, X, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useUser } from "@/contexts/AuthContext";
import type { LaunchpadProject, LaunchType, UserSubscription } from "@/types/launchpad";

type Status = "Upcoming" | "Active" | "Completed";
type Product = "Token Sale" | "Launchpool" | "HODLer Airdrop" | "Lottery";
type Project = Omit<LaunchpadProject, "status" | "type"> & {
  status: Status;
  type: LaunchType;
  product: Product;
  price: string;
  allocation: string;
  participants: string;
  progress: number;
  end: string;
  accent: string;
  mark: string;
};
type ProjectSeed = {
  name: string;
  symbol: string;
  status: Status;
  product: Product;
  description: string;
  network: string;
  price: string;
  allocation: string;
  participants: string;
  progress: number;
  end: string;
  accent: string;
  mark: string;
};

const launchTypeFor = (product: Product): LaunchType => product === "Launchpool" ? "LAUNCHPOOL" : product === "HODLer Airdrop" ? "AIRDROP" : product === "Lottery" ? "LOTTERY" : "LAUNCHPAD";
const projectFromSeed = (seed: ProjectSeed): Project => ({
  ...seed,
  id: seed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  logoUrl: "/logo-ob-shield.png",
  type: launchTypeFor(seed.product),
  website: "#",
  whitepaper: "#",
  socials: {},
  tokenPriceUSD: Number(seed.price.match(/[0-9.]+/)?.[0] ?? 0),
  totalAllocation: Number(seed.allocation.replace(/[^0-9.]/g, "")) || 0,
  hardCapUSD: 0,
  subscriptionStart: "2025-03-01T00:00:00Z",
  subscriptionEnd: seed.end,
  distributionDate: seed.end,
  minAllocationToken: 0,
  maxAllocationToken: 0,
  totalCommittedTokens: seed.progress,
  participantCount: Number(seed.participants.replace(/[^0-9]/g, "")) || 0,
});

const projectSeeds: ProjectSeed[] = [
  { name: "XTER", symbol: "XTER", status: "Active", product: "Token Sale", description: "Infrastructure for a more open, composable internet.", network: "OKZ Chain", price: "0.024 OKZ", allocation: "18,750,000 XTER", participants: "42,816", progress: 76, end: "Mar 28, 2025", accent: "#D4AF37", mark: "X" },
  { name: "GENIUS", symbol: "GENIUS", status: "Upcoming", product: "Launchpool", description: "A community-owned intelligence protocol for Web3.", network: "Ethereum", price: "0.18 USDT", allocation: "4,200,000 GENIUS", participants: "—", progress: 0, end: "Apr 04, 2025", accent: "#8B9CFF", mark: "G" },
  { name: "AIGENSYN", symbol: "AIGENSYN", status: "Upcoming", product: "HODLer Airdrop", description: "Agentic coordination for the next generation of protocols.", network: "Arbitrum", price: "Snapshot", allocation: "9,600,000 AIGENSYN", participants: "—", progress: 0, end: "Apr 12, 2025", accent: "#9CD8C3", mark: "A" },
  { name: "OPG", symbol: "OPG", status: "Completed", product: "Lottery", description: "A high-throughput settlement layer for real-world value.", network: "OKZ Chain", price: "0.042 USDT", allocation: "12,000,000 OPG", participants: "18,492", progress: 100, end: "Feb 18, 2025", accent: "#DB886D", mark: "O" },
];

const projects: Project[] = projectSeeds.map(projectFromSeed);
const subscriptionDraft: UserSubscription = { projectId: "", committedAmount: 0, estimatedTokens: 0, isClaimed: false, hasParticipated: false };

const faqs = [
  ["What is OkzByte Launchpad?", "OkzByte Launchpad is the access point for vetted token launches, Launchpools and HODLer Airdrops across the OkzByte / Orakzai ecosystem."],
  ["How does allocation work?", "Each project publishes its eligibility rules, subscription window and allocation method. Any allocation shown before finalization is an estimate, not a guarantee."],
  ["Who can participate?", "Eligibility varies by project, supported network and jurisdiction. Review the project details and complete any required account verification before participating."],
  ["What is the difference between Launchpool and a Token Sale?", "A Token Sale uses a subscription or lottery model. Launchpool distributes rewards to users who lock supported assets for the published farming period."],
  ["What are HODLer Airdrops?", "HODLer Airdrops reward eligible holders based on a published snapshot. No separate subscription is required when the eligibility conditions are met."],
  ["Are token launches risky?", "Yes. Digital assets are volatile and participation can result in loss. Review official project documents and participate only with funds you can afford to lose."],
];

function Logo() {
  return <Link href="/" className="flex min-w-0 items-center gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-[#D4AF37]/70 bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37]">OZ</span><span className="truncate text-[15px] font-semibold tracking-[0.2em] text-[#EEF2FF]">OKZBYTE</span></Link>;
}

function StatusBadge({ status }: { status: Status }) {
  const style = status === "Active" ? "border-[#0ECB81]/30 bg-[#0ECB81]/10 text-[#0ECB81]" : status === "Upcoming" ? "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/10 bg-white/[.04] text-white/50";
  return <span className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[.14em] ${style}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

function ProjectMark({ project, size = "h-12 w-12" }: { project: Project; size?: string }) {
  return <span className={`grid ${size} shrink-0 place-items-center rounded-sm border text-base font-bold`} style={{ color: project.accent, borderColor: `${project.accent}66`, background: `${project.accent}12` }}>{project.mark}</span>;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="min-w-0 border-b border-white/[.08] p-4 first:pl-0 sm:border-b-0 sm:border-r sm:p-5 sm:last:border-r-0"><p className="truncate text-[10px] font-semibold uppercase tracking-[.16em] text-white/45">{label}</p><p className="mt-2 truncate font-mono text-xl font-semibold tabular-nums text-[#EEF2FF] sm:text-2xl">{value}</p><p className="mt-1 truncate text-[11px] text-white/35">{note}</p></div>;
}

function DetailPanel({ project, onClose, onSubscribe }: { project: Project; onClose: () => void; onSubscribe: () => void }) {
  const fields = [["Token price", project.price], ["Total allocation", project.allocation], ["Participants", project.participants], ["Network", project.network], ["Sale type", project.product], ["End date", project.end]];
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#02050a]/80 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-xl border border-white/10 bg-[#0B111B] p-5 shadow-2xl sm:rounded-xl sm:p-7"><div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5"><div className="flex min-w-0 items-center gap-3"><ProjectMark project={project} /><div className="min-w-0"><StatusBadge status={project.status} /><h2 className="mt-2 truncate font-serif text-2xl font-bold text-[#EEF2FF]">{project.name}</h2><p className="mt-1 truncate font-mono text-xs text-white/45">{project.symbol} · {project.network}</p></div></div><button aria-label="Close project details" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-white/50 hover:bg-white/[.05] hover:text-white"><X size={18} /></button></div><p className="mt-5 text-sm leading-6 text-white/65">{project.description}</p><div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/10 bg-white/10 sm:grid-cols-3">{fields.map(([label, value]) => <div key={label} className="min-w-0 bg-[#101925] p-4"><p className="truncate text-[10px] uppercase tracking-[.12em] text-white/40">{label}</p><p className="mt-2 truncate font-mono text-xs text-[#EEF2FF]">{value}</p></div>)}</div><div className="mt-6 flex flex-col gap-3 sm:flex-row"><button disabled={project.status !== "Active"} onClick={onSubscribe} className="min-h-12 flex-1 rounded-md bg-[#D4AF37] px-5 text-sm font-semibold text-[#080B10] transition hover:bg-[#E2C04F] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35">{project.status === "Active" ? "Subscribe" : project.status === "Upcoming" ? "Coming soon" : "Ended"}</button><button onClick={onClose} className="min-h-12 rounded-md border border-white/10 px-5 text-sm font-semibold text-white/70 hover:border-white/25 hover:text-white">Close</button></div><p className="mt-4 text-xs leading-5 text-white/35">Review the official project documents, eligibility requirements and risk disclosure before participating.</p></div></div>;
}

function SubscriptionPanel({ project, connected, onClose }: { project: Project; connected: boolean; onClose: () => void }) {
  const [percent, setPercent] = useState(50);
  const [subscription, setSubscription] = useState<UserSubscription>({ ...subscriptionDraft, projectId: project.id, committedAmount: 7500, estimatedTokens: 1245 });
  const amount = subscription.committedAmount.toLocaleString();
  const allocation = Math.round(subscription.estimatedTokens).toLocaleString();
  const selectPercent = (value: number) => {
    setPercent(value);
    setSubscription((current) => ({ ...current, committedAmount: 15000 * value / 100, estimatedTokens: 2490 * value / 100 }));
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#02050a]/80 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="w-full max-w-lg rounded-t-xl border border-white/10 bg-[#0B111B] p-5 shadow-2xl sm:rounded-xl sm:p-7"><div className="flex items-start justify-between border-b border-white/10 pb-5"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#D4AF37]">Subscription</p><h2 className="mt-2 font-serif text-2xl font-bold text-[#EEF2FF]">{project.name} <span className="font-sans text-sm font-normal text-white/40">/ {project.symbol}</span></h2></div><button aria-label="Close subscription" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-md text-white/50 hover:bg-white/[.05] hover:text-white"><X size={18} /></button></div><div className="mt-5 flex justify-between text-sm"><span className="text-white/50">Available balance</span><span className="font-mono text-[#EEF2FF]">{connected ? "15,000 OKZ" : "Connect wallet"}</span></div><div className="mt-4 rounded-md border border-white/10 bg-[#101925] p-4"><div className="flex justify-between text-xs"><span className="text-white/50">Your subscription</span><span className="font-mono text-[#EEF2FF]">{amount} OKZ</span></div><div className="mt-4 grid grid-cols-4 gap-2">{[25, 50, 75, 100].map((v) => <button key={v} onClick={() => selectPercent(v)} className={`min-h-10 rounded-sm border text-xs font-semibold ${percent === v ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]" : "border-white/10 text-white/50 hover:border-white/25"}`}>{v === 100 ? "MAX" : `${v}%`}</button>)}</div></div><div className="mt-3 grid grid-cols-2 overflow-hidden rounded-md border border-white/10"><div className="min-w-0 border-r border-white/10 p-4"><p className="truncate text-xs text-white/45">Estimated allocation</p><p className="mt-2 truncate font-mono text-lg text-[#D4AF37]">{allocation} XTER</p></div><div className="min-w-0 p-4"><p className="truncate text-xs text-white/45">Maximum allocation</p><p className="mt-2 truncate font-mono text-lg text-[#EEF2FF]">1,500 XTER</p></div></div><p className="mt-4 text-xs leading-5 text-white/35">The estimate can change as subscriptions are added. Final allocation is determined after the subscription period closes.</p><button className="mt-5 min-h-12 w-full rounded-md bg-[#D4AF37] text-sm font-semibold text-[#080B10] hover:bg-[#E2C04F]">Confirm subscription</button></div></div>;
}

export default function Launchpad() {
  const { isSignedIn } = useUser();
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [product, setProduct] = useState<"All" | Product>("All");
  const [faq, setFaq] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [detail, setDetail] = useState<Project | null>(null);
  const [subscribe, setSubscribe] = useState<Project | null>(null);
  const filtered = useMemo(() => projects.filter((p) => (filter === "All" || p.status === filter) && (product === "All" || p.product === product)), [filter, product]);
  const active = projects.find((p) => p.status === "Active");
  const upcoming = filtered.filter((p) => p.status === "Upcoming");
  const completed = filtered.filter((p) => p.status === "Completed");

  return <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#040B14] pb-24 font-sans text-[#EEF2FF]">
    <header className="sticky top-0 z-30 border-b border-white/[.08] bg-[#040B14]/95 backdrop-blur-xl"><div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"><Logo /><nav className="hidden items-center gap-6 text-sm text-white/50 lg:flex"><Link href="/markets" className="hover:text-white">Markets</Link><Link href="/trade" className="hover:text-white">Trade</Link><Link href="/launchpad" className="relative py-5 font-semibold text-[#D4AF37]">Launchpad<span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#D4AF37]" /></Link><Link href="/rwa-staking" className="hover:text-white">Earn</Link><Link href="/projects" className="hover:text-white">Projects</Link></nav><div className="flex shrink-0 items-center gap-1 sm:gap-2"><button aria-label="Search" className="grid h-10 w-10 place-items-center rounded-md text-white/55 hover:bg-white/[.05] hover:text-white"><Search size={19} /></button><button aria-label="Notifications" onClick={() => navigate("/notifications")} className="relative grid h-10 w-10 place-items-center rounded-md text-white/55 hover:bg-white/[.05] hover:text-white"><Bell size={19} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#D4AF37]" /></button><button aria-label="Connect wallet" onClick={() => setConnected(true)} className="hidden min-h-10 rounded-md border border-[#D4AF37]/70 px-4 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10 sm:block">{connected ? "0x71…B4A2" : "Connect wallet"}</button><button aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-md text-white/55 hover:bg-white/[.05] lg:hidden"><Menu size={20} /></button></div></div></header>
    <main className="mx-auto min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="border-b border-white/[.08] py-10 sm:py-14"><div className="max-w-3xl"><div className="mb-4 inline-flex items-center gap-2 rounded-sm border border-[#D4AF37]/25 bg-[#D4AF37]/[.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-[#D4AF37]"><Sparkles size={12} />OkzByte Launchpad</div><h1 className="font-serif text-4xl font-bold tracking-tight text-[#EEF2FF] sm:text-5xl">Launchpad</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">Discover and participate in carefully presented token launches across the OkzByte ecosystem.</p><div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/50"><span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-[#0ECB81]" />Vetted project information</span><span className="inline-flex items-center gap-2"><Zap size={15} className="text-[#0ECB81]" />Clear participation rules</span><span className="inline-flex items-center gap-2"><Wallet size={15} className="text-[#0ECB81]" />Account-linked progress</span></div></div></section>
      <section aria-label="Platform statistics" className="grid grid-cols-2 border-b border-white/[.08] sm:grid-cols-4"><Stat label="Total committed" value="$4.34B" note="All-time platform volume" /><Stat label="Average growth" value="645%" note="Completed launches" /><Stat label="Participants" value="2.3M" note="Verified participants" /><Stat label="Projects" value="32" note="Across launch products" /></section>
      <section className="py-10 sm:py-14"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#D4AF37]">Featured launch</p><h2 className="mt-2 font-serif text-2xl font-bold text-[#EEF2FF] sm:text-3xl">Participate in the next project</h2></div><span className="inline-flex items-center gap-2 text-xs text-white/40"><Clock3 size={14} />All times UTC</span></div>{active && <div className="mt-6 grid overflow-hidden rounded-lg border border-white/10 bg-[#0B111B] lg:grid-cols-[1.25fr_.75fr]"><div className="min-w-0 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><ProjectMark project={active} size="h-14 w-14" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-serif text-2xl font-bold">{active.name}</h3><StatusBadge status={active.status} /></div><p className="mt-1 truncate font-mono text-xs text-white/45">{active.symbol} · {active.network} · {active.product}</p></div></div></div><p className="mt-6 max-w-xl text-sm leading-6 text-white/60">{active.description}</p><div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-4"><div><p className="text-[10px] uppercase tracking-[.12em] text-white/35">Token price</p><p className="mt-2 font-mono text-sm">{active.price}</p></div><div><p className="text-[10px] uppercase tracking-[.12em] text-white/35">Allocation</p><p className="mt-2 truncate font-mono text-sm">{active.allocation}</p></div><div><p className="text-[10px] uppercase tracking-[.12em] text-white/35">Participants</p><p className="mt-2 font-mono text-sm">{active.participants}</p></div><div><p className="text-[10px] uppercase tracking-[.12em] text-white/35">Ends</p><p className="mt-2 font-mono text-sm">{active.end}</p></div></div></div><div className="border-t border-white/10 bg-[#101925] p-5 sm:p-7 lg:border-l lg:border-t-0"><div className="flex items-center justify-between"><span className="text-xs text-white/45">Subscription progress</span><span className="font-mono text-sm text-[#D4AF37]">{active.progress}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${active.progress}%` }} /></div><div className="mt-7 border-t border-white/10 pt-5"><p className="text-xs text-white/45">Your participation</p><p className="mt-2 text-sm text-white/70">{isSignedIn ? "Account connected. Review your eligibility before subscribing." : "Connect your account to keep participation state synced."}</p><button onClick={() => { if (!connected) setConnected(true); setSubscribe(active); }} className="mt-5 min-h-11 w-full rounded-md bg-[#D4AF37] px-4 text-sm font-semibold text-[#080B10] hover:bg-[#E2C04F]">Subscribe</button><button onClick={() => setDetail(active)} className="mt-2 min-h-10 w-full rounded-md border border-white/10 px-4 text-xs font-semibold text-white/65 hover:border-white/25 hover:text-white">View project details</button></div></div></div>}</section>
      <section className="border-y border-white/[.08] py-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 gap-1 overflow-x-auto pb-1">{(["All", "Upcoming", "Active", "Completed"] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`min-h-10 shrink-0 rounded-md px-4 text-sm font-semibold transition ${filter === value ? "bg-[#D4AF37] text-[#080B10]" : "text-white/50 hover:bg-white/[.05] hover:text-white"}`}>{value}</button>)}</div><select aria-label="Filter product type" value={product} onChange={(e) => setProduct(e.target.value as "All" | Product)} className="min-h-10 w-full rounded-md border border-white/10 bg-[#101925] px-3 text-sm text-white/60 outline-none focus:border-[#D4AF37] lg:w-52"><option>All</option><option>Token Sale</option><option>Launchpool</option><option>HODLer Airdrop</option><option>Lottery</option></select></div></section>
      <section className="py-10 sm:py-14"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#D4AF37]">Project pipeline</p><h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">Upcoming launches</h2></div><span className="text-xs text-white/35">{upcoming.length} projects</span></div><div className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-[#0B111B]">{upcoming.length ? upcoming.map((project, index) => <button key={project.name} onClick={() => setDetail(project)} className={`flex w-full min-w-0 items-center gap-3 p-4 text-left transition hover:bg-white/[.03] sm:gap-5 sm:p-5 ${index ? "border-t border-white/[.08]" : ""}`}><ProjectMark project={project} size="h-11 w-11" /><div className="min-w-0 flex-1"><div className="flex min-w-0 flex-wrap items-center gap-2"><span className="truncate font-semibold text-[#EEF2FF]">{project.name}</span><StatusBadge status={project.status} /></div><p className="mt-1 truncate text-xs text-white/40">{project.product} · {project.network}</p></div><div className="hidden text-right sm:block"><p className="text-[10px] uppercase tracking-[.12em] text-white/35">Total rewards</p><p className="mt-1 font-mono text-xs text-white/70">{project.allocation}</p></div><div className="hidden text-right md:block"><p className="text-[10px] uppercase tracking-[.12em] text-white/35">Starts / ends</p><p className="mt-1 font-mono text-xs text-white/70">{project.end}</p></div><ChevronRight size={16} className="shrink-0 text-white/30" /></button>) : <div className="p-10 text-center text-sm text-white/45"><CircleHelp className="mx-auto mb-3 text-[#D4AF37]" />No projects match this filter.</div>}</div></section>
      <section className="border-t border-white/[.08] py-10 sm:py-14"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/35">Archive</p><h2 className="mt-2 font-serif text-2xl font-bold">Completed projects</h2></div><button onClick={() => setFilter("Completed")} className="inline-flex items-center gap-1 text-xs font-semibold text-[#D4AF37]">View all <ChevronRight size={14} /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{completed.map((project) => <button key={project.name} onClick={() => setDetail(project)} className="flex min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-[#0B111B] p-4 text-left hover:border-white/25"><ProjectMark project={project} size="h-10 w-10" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{project.name}</p><p className="mt-1 truncate text-xs text-white/40">{project.participants} participants</p></div><span className="text-xs text-[#0ECB81]">Ended</span></button>)}</div></section>
      <section className="border-t border-white/[.08] py-10 sm:py-14"><div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#D4AF37]">Participation guide</p><h2 className="mt-2 max-w-sm font-serif text-2xl font-bold sm:text-3xl">Simple rules. Clear steps.</h2><p className="mt-4 max-w-md text-sm leading-6 text-white/50">Review eligibility, understand the allocation model and participate only after you have read the project information.</p></div><div className="grid gap-3 sm:grid-cols-4">{[["01", "Connect", "Sign in and connect a supported wallet."], ["02", "Verify", "Meet the project eligibility rules."], ["03", "Participate", "Subscribe, lock or claim as specified."], ["04", "Receive", "Track allocation and distribution." ]].map(([number, title, description]) => <div key={number} className="rounded-lg border border-white/10 bg-[#0B111B] p-4"><span className="font-mono text-xs text-[#D4AF37]">{number}</span><h3 className="mt-8 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-5 text-white/45">{description}</p></div>)}</div></div></section>
      <section className="border-t border-white/[.08] py-10 sm:py-14"><div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#D4AF37]">Help center</p><h2 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">Launchpad FAQ</h2><p className="mt-3 max-w-sm text-sm leading-6 text-white/50">Understand the participation models before you commit funds or lock assets.</p></div><div className="border-t border-white/10">{faqs.map(([question, answer], index) => <div key={question} className="border-b border-white/10"><button onClick={() => setFaq(faq === index ? null : index)} className="flex min-h-14 w-full items-center justify-between gap-4 text-left text-sm font-semibold text-white/80 hover:text-[#D4AF37]"><span>{question}</span><ChevronDown size={16} className={`shrink-0 text-white/40 transition-transform ${faq === index ? "rotate-180 text-[#D4AF37]" : ""}`} /></button>{faq === index && <p className="max-w-2xl pb-5 pr-8 text-sm leading-6 text-white/50">{answer}</p>}</div>)}</div></div></section>
    </main>
    <footer className="border-t border-white/[.08] bg-[#03070D]"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8"><div><Logo /><p className="mt-3 text-xs text-white/35">OkzByte Exchange · Trade · Grow</p></div><div className="flex flex-wrap gap-5 text-xs text-white/45"><Link href="/projects" className="hover:text-[#D4AF37]">Projects</Link><Link href="/feedback" className="hover:text-[#D4AF37]">Support</Link><a href="#risk" className="hover:text-[#D4AF37]">Risk disclosure</a></div><p className="text-xs text-white/30">© 2026 OkzByte</p></div></footer>
    {detail && <DetailPanel project={detail} onClose={() => setDetail(null)} onSubscribe={() => { setDetail(null); setSubscribe(detail); }} />}{subscribe && <SubscriptionPanel project={subscribe} connected={connected} onClose={() => setSubscribe(null)} />}
  </div>;
}
