import { useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Gift,
  Globe2,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react";

type Status = "Upcoming" | "Active" | "Completed";
type Product = "Token Sale" | "Launchpool" | "HODLer Airdrop" | "Lottery";
type Project = {
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

const projects: Project[] = [
  { name: "XTER", symbol: "XTER", status: "Active", product: "Token Sale", description: "Infrastructure for a more open, composable internet.", network: "OKZ Chain", price: "0.024 OKZ", allocation: "18,750,000 XTER", participants: "42,816", progress: 76, end: "Mar 28, 2025", accent: "#d9a929", mark: "X" },
  { name: "GENIUS", symbol: "GENIUS", status: "Upcoming", product: "Launchpool", description: "A community-owned intelligence protocol for Web3.", network: "Ethereum", price: "0.18 USDT", allocation: "4,200,000 GENIUS", participants: "—", progress: 0, end: "Apr 04, 2025", accent: "#8b9cff", mark: "G" },
  { name: "AIGENSYN", symbol: "AI", status: "Upcoming", product: "HODLer Airdrop", description: "Agentic coordination for the next generation of protocols.", network: "Arbitrum", price: "Snapshot", allocation: "9,600,000 AI", participants: "—", progress: 0, end: "Apr 12, 2025", accent: "#c1e1d6", mark: "A" },
  { name: "OPG", symbol: "OPG", status: "Completed", product: "Lottery", description: "A high-throughput settlement layer for real-world value.", network: "OKZ Chain", price: "0.042 USDT", allocation: "12,000,000 OPG", participants: "18,492", progress: 100, end: "Feb 18, 2025", accent: "#db886d", mark: "O" },
];

const faqs = [
  ["What is OkzByte Launchpad?", "OkzByte Launchpad is the access point for vetted token launches, Launchpools and HODLer Airdrops across the OkzByte / Orakzai ecosystem."],
  ["How does OkzByte Launchpad work?", "Connect an eligible wallet, review a project’s terms, then subscribe or participate during its registration window. Final allocations are determined by the sale rules."],
  ["Who is eligible to participate?", "Eligibility varies by project and jurisdiction. Each project page lists the required balance, registration window and supported network before you subscribe."],
  ["Which balances are counted during the snapshot period?", "Only eligible balances held in the supported wallet or account during the stated snapshot period are counted."],
  ["How is my token allocation calculated?", "For subscription sales, your estimated allocation is proportional to your subscription against the total eligible pool. The estimate is not guaranteed until finalization."],
  ["What is a lottery-based token sale?", "A lottery sale distributes tickets and selects winners after the participation window closes. Ticket price, probability and rewards are shown before purchase."],
  ["What are HODLer Airdrops?", "HODLer Airdrops reward eligible holders based on a snapshot of supported assets. No subscription is required."],
  ["When are tokens distributed?", "Distribution timing is listed in each project’s sale information and may follow a vesting or claim schedule."],
  ["Are there risks associated with token launches?", "Yes. Token launches are speculative and can lose value. Review project materials and participate only with funds you can afford to lose."],
  ["Can I participate using a mobile device?", "Yes. The Launchpad is designed for mobile browsers with wallet support and clear, touch-friendly controls."],
];

function Logo() {
  return <div className="flex items-center gap-2.5"><div className="grid h-8 w-8 place-items-center border border-[#f0b90b]/60 bg-[#f0b90b]/10 text-[#f0b90b]"><span className="text-[17px] font-black tracking-[-.15em]">OZ</span></div><span className="text-[15px] font-bold tracking-[.17em] text-[#f6f4ed]">OKZBYTE</span></div>;
}

function StatusBadge({ status }: { status: Status }) {
  const tone = status === "Active" ? "text-[#0ecb81] bg-[#0ecb81]/10 border-[#0ecb81]/25" : status === "Upcoming" ? "text-[#f0b90b] bg-[#f0b90b]/10 border-[#f0b90b]/25" : "text-[#929aa5] bg-[#929aa5]/10 border-[#929aa5]/20";
  return <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-bold uppercase tracking-[.14em] ${tone}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

function ProjectMark({ project }: { project: Project }) {
  return <div className="grid h-11 w-11 shrink-0 place-items-center border text-sm font-black" style={{ color: project.accent, borderColor: `${project.accent}55`, backgroundColor: `${project.accent}12` }}>{project.mark}</div>;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="border-l border-[#2b3440] pl-4"><div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[.15em] text-[#929aa5]"><span className="h-1.5 w-1.5 bg-[#f0b90b]" />{label}</div><div className="font-mono text-[19px] font-semibold tabular-nums text-[#f5f5f5]">{value}</div><div className="mt-1 text-xs text-[#68727e]">{note}</div></div>;
}

function ProjectCard({ project, onSubscribe }: { project: Project; onSubscribe: (p: Project) => void }) {
  return <article className="border border-[#2b3440] bg-[#151a21] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#f0b90b]/50 sm:p-5">
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><ProjectMark project={project} /><div><h3 className="font-semibold text-[#f5f5f5]">{project.name}</h3><p className="mt-0.5 font-mono text-[11px] text-[#929aa5]">{project.symbol} · {project.network}</p></div></div><StatusBadge status={project.status} /></div>
    <p className="mt-4 min-h-[38px] text-sm leading-5 text-[#a7afb9]">{project.description}</p>
    <div className="mt-5 grid grid-cols-2 gap-y-4 border-y border-[#2b3440] py-4 text-xs"><div><div className="text-[#68727e]">Token price</div><div className="mt-1 font-medium text-[#f5f5f5]">{project.price}</div></div><div><div className="text-[#68727e]">Total allocation</div><div className="mt-1 font-medium text-[#f5f5f5]">{project.allocation}</div></div><div><div className="text-[#68727e]">Participants</div><div className="mt-1 font-medium text-[#f5f5f5]">{project.participants}</div></div><div><div className="text-[#68727e]">End date</div><div className="mt-1 font-medium text-[#f5f5f5]">{project.end}</div></div></div>
    <div className="mt-4"><div className="mb-2 flex justify-between text-[11px] text-[#929aa5]"><span>Subscription progress</span><span className="font-mono text-[#f0b90b]">{project.progress}%</span></div><div className="h-1 bg-[#2b3440]"><div className="h-full bg-[#f0b90b] transition-all duration-500" style={{ width: `${project.progress}%` }} /></div></div>
    <div className="mt-5 flex gap-2"><button onClick={() => project.status === "Active" ? onSubscribe(project) : undefined} className={`min-h-11 flex-1 border px-3 text-xs font-semibold transition ${project.status === "Active" ? "border-[#f0b90b] bg-[#f0b90b] text-[#0b0e11] hover:bg-[#ffc928]" : "cursor-default border-[#2b3440] text-[#68727e]"}`}>{project.status === "Active" ? "Subscribe" : project.status === "Upcoming" ? "Coming soon" : "Ended"}</button><button className="min-h-11 border border-[#2b3440] px-3 text-xs text-[#f5f5f5] transition hover:border-[#929aa5]">View project</button></div>
  </article>;
}

function SubscriptionPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  const [percent, setPercent] = useState(50);
  const amount = (7500 * percent / 50).toLocaleString();
  const allocation = Math.round(1245 * percent / 50).toLocaleString();
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#080a0d]/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"><div className="w-full max-w-lg border border-[#3a424c] bg-[#151a21] p-5 shadow-2xl sm:p-6">
    <div className="flex items-start justify-between border-b border-[#2b3440] pb-4"><div><div className="mb-1 text-[10px] uppercase tracking-[.16em] text-[#f0b90b]">Subscription</div><h2 className="text-xl font-semibold text-[#f5f5f5]">{project.name} / {project.symbol}</h2></div><button aria-label="Close subscription" onClick={onClose} className="grid h-10 w-10 place-items-center text-[#929aa5] hover:text-[#f5f5f5]"><X size={18} /></button></div>
    <div className="mt-5 flex justify-between text-sm"><span className="text-[#929aa5]">Available balance</span><span className="font-mono text-[#f5f5f5]">15,000 OKZ</span></div>
    <div className="mt-3 border border-[#2b3440] bg-[#101419] p-4"><div className="flex justify-between text-xs text-[#929aa5]"><span>Your subscription</span><span className="font-mono text-[#f5f5f5]">{amount} OKZ</span></div><div className="mt-5 flex gap-2">{[25, 50, 75, 100].map((v) => <button key={v} onClick={() => setPercent(v)} className={`min-h-10 flex-1 border text-xs font-semibold ${percent === v ? "border-[#f0b90b] bg-[#f0b90b]/10 text-[#f0b90b]" : "border-[#2b3440] text-[#929aa5] hover:border-[#929aa5]"}`}>{v === 100 ? "MAX" : `${v}%`}</button>)}</div></div>
    <div className="mt-3 grid grid-cols-2 border border-[#2b3440]"><div className="border-r border-[#2b3440] p-4"><div className="text-xs text-[#929aa5]">Estimated allocation</div><div className="mt-2 font-mono text-lg text-[#f0b90b]">{allocation} XTER</div></div><div className="p-4"><div className="text-xs text-[#929aa5]">Maximum allocation</div><div className="mt-2 font-mono text-lg text-[#f5f5f5]">1,500 XTER</div></div></div><p className="mt-4 text-xs leading-5 text-[#68727e]">Allocation is an estimate based on current subscriptions. Final allocation is determined after the subscription period closes.</p><button className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 bg-[#f0b90b] text-sm font-bold text-[#0b0e11] hover:bg-[#ffc928]"><Check size={16} />Confirm subscription</button>
  </div></div>;
}

export function OkzbyteLaunchpad() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<"All" | Status>("All");
  const [product, setProduct] = useState<"All" | Product>("All");
  const [faq, setFaq] = useState(0);
  const [subscribe, setSubscribe] = useState<Project | null>(null);
  const filtered = useMemo(() => projects.filter((p) => (status === "All" || p.status === status) && (product === "All" || p.product === product)), [status, product]);
  const connect = () => { if (connected || connecting) return; setConnecting(true); window.setTimeout(() => { setConnecting(false); setConnected(true); }, 700); };
  return <div className="min-h-screen overflow-x-hidden bg-[#0b0e11] pb-24 font-['DM_Sans',sans-serif] text-[#f5f5f5] selection:bg-[#f0b90b] selection:text-[#0b0e11]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)", backgroundSize: "48px 48px" }}>
    <header className="sticky top-0 z-30 border-b border-[#2b3440] bg-[#0b0e11]/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6 lg:px-8"><Logo /><nav className="ml-10 hidden items-center gap-7 text-sm text-[#929aa5] lg:flex"><a href="#markets" className="hover:text-[#f5f5f5]">Markets</a><a href="#trade" className="hover:text-[#f5f5f5]">Trade</a><a href="#launchpad" className="relative py-6 text-[#f0b90b]">Launchpad<span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#f0b90b]" /></a><a href="#earn" className="hover:text-[#f5f5f5]">Earn</a><a href="#projects" className="hover:text-[#f5f5f5]">Projects</a></nav><div className="flex items-center gap-2 sm:gap-4"><button className="grid h-10 w-10 place-items-center text-[#929aa5] hover:text-[#f5f5f5]"><Search size={18} /></button><button className="relative grid h-10 w-10 place-items-center text-[#929aa5] hover:text-[#f5f5f5]"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 bg-[#f0b90b]" /></button><button onClick={connect} className="hidden min-h-10 border border-[#f0b90b] px-4 text-xs font-semibold text-[#f0b90b] transition hover:bg-[#f0b90b]/10 sm:block">{connecting ? "Connecting..." : connected ? "0x71…B4A2" : "Connect wallet"}</button><button className="grid h-10 w-10 place-items-center text-[#929aa5] lg:hidden"><Menu size={19} /></button></div></div></header>
    <main id="launchpad" className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
      <section className="relative border-b border-[#2b3440] py-12 sm:py-16"><div className="pointer-events-none absolute right-[-7%] top-8 hidden h-44 w-44 rotate-45 border border-[#f0b90b]/15 md:block" /><div className="pointer-events-none absolute right-[3%] top-20 hidden h-28 w-28 rotate-45 border border-[#f0b90b]/10 md:block" /><div className="relative max-w-2xl"><div className="mb-5 inline-flex items-center gap-2 border border-[#f0b90b]/30 bg-[#f0b90b]/[.06] px-3 py-1.5 text-[10px] font-bold tracking-[.18em] text-[#f0b90b]"><Sparkles size={12} />OKZBYTE LAUNCHPAD</div><h1 className="font-['Space_Grotesk',sans-serif] text-4xl font-semibold tracking-[-.04em] text-[#f5f5f5] sm:text-5xl">Discover what’s<br /><span className="text-[#f0b90b]">next.</span></h1><p className="mt-5 max-w-xl text-sm leading-6 text-[#929aa5] sm:text-base">Discover and participate in new token launches through OkzByte Launchpad — a transparent gateway into the OkzByte / Orakzai ecosystem.</p><div className="mt-7 flex flex-wrap gap-3 text-xs text-[#929aa5]"><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#0ecb81]" />Vetted projects</span><span className="flex items-center gap-2"><Globe2 size={15} className="text-[#0ecb81]" />Global access</span><span className="flex items-center gap-2"><Zap size={15} className="text-[#0ecb81]" />Fast settlement</span></div></div></section>
      <section aria-label="Platform statistics" className="grid grid-cols-2 gap-y-8 border-b border-[#2b3440] py-8 md:grid-cols-4 md:gap-y-0"><Stat label="Total committed" value="$4.34B" note="$4,342,033,765 all time" /><Stat label="Average growth" value="645%" note="Across completed launches" /><Stat label="Participants" value="2,309,207" note="Verified participants" /><Stat label="Projects" value="32" note="Across four products" /></section>
      <section id="projects" className="py-12 sm:py-16"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#f0b90b]">The pipeline</div><h2 className="text-2xl font-semibold tracking-[-.02em] sm:text-3xl">Projects on the radar</h2><p className="mt-2 text-sm text-[#929aa5]">Track launches, pool rewards and claim your place early.</p></div><div className="flex items-center gap-2 text-xs text-[#929aa5]"><Clock3 size={15} />All times in UTC</div></div>
        <div className="mt-8 flex flex-col gap-3 border-b border-[#2b3440] pb-4 md:flex-row md:items-center md:justify-between"><div className="flex gap-1 overflow-x-auto pb-1">{(["All", "Upcoming", "Active", "Completed"] as const).map((v) => <button key={v} onClick={() => setStatus(v)} className={`min-h-10 shrink-0 border px-4 text-xs font-semibold transition ${status === v ? "border-[#f0b90b] bg-[#f0b90b] text-[#0b0e11]" : "border-transparent text-[#929aa5] hover:text-[#f5f5f5]"}`}>{v}</button>)}</div><select aria-label="Filter product type" value={product} onChange={(e) => setProduct(e.target.value as "All" | Product)} className="min-h-10 border border-[#2b3440] bg-[#151a21] px-3 text-xs text-[#929aa5] outline-none"><option>All</option><option>Token Sale</option><option>Launchpool</option><option>HODLer Airdrop</option><option>Lottery</option></select></div>
        {filtered.length ? <><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.filter((p) => p.status !== "Completed").map((p) => <ProjectCard key={p.name} project={p} onSubscribe={setSubscribe} />)}</div><div className="mt-12"><div className="mb-5 flex items-center justify-between"><div><div className="text-[10px] uppercase tracking-[.18em] text-[#68727e]">Archive</div><h3 className="mt-2 text-xl font-semibold">Completed projects</h3></div><button className="flex items-center gap-1 text-xs text-[#f0b90b]">View all <ArrowRight size={14} /></button></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{filtered.filter((p) => p.status === "Completed").map((p) => <div key={p.name} className="flex items-center gap-3 border border-[#2b3440] bg-[#151a21] p-4"><ProjectMark project={p} /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><div className="font-semibold">{p.name}</div><span className="text-[10px] text-[#0ecb81]">+{p.progress}%</span></div><div className="mt-1 text-xs text-[#929aa5]">{p.participants} participants</div><div className="mt-2 text-[11px] text-[#68727e]">{p.allocation}</div></div><ChevronRight size={15} className="text-[#68727e]" /></div>)}</div></div></> : <div className="mt-6 border border-dashed border-[#3a424c] p-10 text-center"><CircleHelp className="mx-auto text-[#f0b90b]" /><h3 className="mt-3 font-semibold">No projects found</h3><p className="mt-1 text-sm text-[#929aa5]">Try another status or product filter.</p></div>}
      </section>
      <section className="border-y border-[#2b3440] py-12 sm:py-16"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><div className="mb-3 text-[10px] uppercase tracking-[.18em] text-[#f0b90b]">Allocation, explained</div><h2 className="max-w-md text-2xl font-semibold leading-tight sm:text-3xl">Transparent by design.<br />Predictable by process.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[#929aa5]">Subscription launches use a proportional allocation model. You’ll always see the rules, your estimated allocation and the finalization window before committing.</p><button className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#f0b90b]">Read launchpad guide <ArrowRight size={15} /></button></div><div className="grid gap-3 sm:grid-cols-3"><div className="border border-[#2b3440] bg-[#151a21] p-4 sm:p-5"><div className="mb-8 grid h-9 w-9 place-items-center bg-[#f0b90b]/10 text-[#f0b90b]"><Wallet size={17} /></div><h3 className="font-semibold">Connect</h3><p className="mt-2 text-xs leading-5 text-[#929aa5]">Verify your wallet and eligibility.</p></div><div className="border border-[#2b3440] bg-[#151a21] p-4 sm:p-5"><div className="mb-8 grid h-9 w-9 place-items-center bg-[#f0b90b]/10 text-[#f0b90b]"><FileText size={17} /></div><h3 className="font-semibold">Subscribe</h3><p className="mt-2 text-xs leading-5 text-[#929aa5]">Choose an amount during the window.</p></div><div className="border border-[#2b3440] bg-[#151a21] p-4 sm:p-5"><div className="mb-8 grid h-9 w-9 place-items-center bg-[#f0b90b]/10 text-[#f0b90b]"><Gift size={17} /></div><h3 className="font-semibold">Receive</h3><p className="mt-2 text-xs leading-5 text-[#929aa5]">Final allocation and claim date follow.</p></div></div></div></section>
      <section className="py-12 sm:py-16"><div className="mb-8"><div className="mb-3 text-[10px] uppercase tracking-[.18em] text-[#f0b90b]">Four steps</div><h2 className="text-2xl font-semibold sm:text-3xl">How it works</h2></div><div className="grid gap-0 border-y border-[#2b3440] sm:grid-cols-2 lg:grid-cols-4">{[["01", "Connect wallet", "Start with a supported, verified wallet."], ["02", "Meet eligibility", "Review the balance and regional requirements."], ["03", "Subscribe / participate", "Commit during the clearly marked window."], ["04", "Receive tokens", "Allocation and distribution happen on schedule."]].map(([n, t, d]) => <div key={n} className="border-b border-[#2b3440] p-5 last:border-0 sm:border-r sm:last:border-r-0 lg:border-b-0"><div className="font-mono text-sm text-[#f0b90b]">{n}</div><h3 className="mt-8 font-semibold">{t}</h3><p className="mt-2 text-sm leading-5 text-[#929aa5]">{d}</p></div>)}</div></section>
      <section className="border-t border-[#2b3440] py-12 sm:py-16"><div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><div className="mb-3 text-[10px] uppercase tracking-[.18em] text-[#f0b90b]">Need to know</div><h2 className="text-2xl font-semibold sm:text-3xl">Launchpad FAQ</h2><p className="mt-3 max-w-xs text-sm leading-6 text-[#929aa5]">Clear answers before you commit. Still have questions? Reach out to the OkzByte team.</p></div><div className="border-t border-[#2b3440]">{faqs.map(([q, a], i) => <div key={q} className="border-b border-[#2b3440]"><button onClick={() => setFaq(faq === i ? -1 : i)} className="flex min-h-14 w-full items-center justify-between gap-4 text-left text-sm font-medium hover:text-[#f0b90b]"><span>{q}</span><ChevronDown size={16} className={`shrink-0 text-[#929aa5] transition-transform ${faq === i ? "rotate-180 text-[#f0b90b]" : ""}`} /></button>{faq === i && <p className="max-w-2xl pb-5 pr-8 text-sm leading-6 text-[#929aa5]">{a}</p>}</div>)}</div></div></section>
    </main>
    <footer className="border-t border-[#2b3440] bg-[#090c0f]"><div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-4 py-9 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8"><div><Logo /><p className="mt-3 max-w-xs text-xs leading-5 text-[#68727e]">A trusted gateway to the next chapter of the OkzByte / Orakzai ecosystem.</p></div><div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#929aa5]"><a href="#projects" className="hover:text-[#f0b90b]">Projects</a><a href="#launchpad" className="hover:text-[#f0b90b]">Launchpad guide</a><a href="#faq" className="hover:text-[#f0b90b]">Risk disclosure</a><a href="#support" className="hover:text-[#f0b90b]">Support</a></div><div className="flex items-center gap-2 text-xs text-[#68727e]"><Copy size={13} />© 2025 OkzByte</div></div></footer>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2b3440] bg-[#101419]/[.98] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:hidden"><div className="grid grid-cols-4"><a href="#launchpad" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[#f0b90b]"><Sparkles size={17} /><span className="text-[10px]">Launchpad</span></a><a href="#projects" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[#929aa5]"><Zap size={17} /><span className="text-[10px]">Projects</span></a><button onClick={connect} className="flex min-h-12 flex-col items-center justify-center gap-1 text-[#929aa5]"><Wallet size={17} /><span className="text-[10px]">{connected ? "Connected" : "Wallet"}</span></button><button className="flex min-h-12 flex-col items-center justify-center gap-1 text-[#929aa5]"><Menu size={17} /><span className="text-[10px]">Menu</span></button></div></nav>
    {subscribe && <SubscriptionPanel project={subscribe} onClose={() => setSubscribe(null)} />}
  </div>;
}

export default OkzbyteLaunchpad;