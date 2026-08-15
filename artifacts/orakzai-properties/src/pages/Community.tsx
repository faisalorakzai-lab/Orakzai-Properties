import { useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Bell,
  Bookmark,
  ChevronLeft,
  CircleDollarSign,
  Clock3,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Megaphone,
  Pin,
  Radio,
  Repeat2,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Tag,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const TABS = ["Community", "Bond Dispatch", "Live Participation", "Think Tank"];

type FeedPost = {
  id: string;
  official?: boolean;
  name: string;
  handle: string;
  time: string;
  body: string;
  tags: string[];
  sentiment?: "Bullish" | "Bearish";
  likes: number;
  comments: number;
};

const INITIAL_POSTS: FeedPost[] = [
  {
    id: "okbond-phase-ii",
    official: true,
    name: "Orakzai Bond Network",
    handle: "@okbond_official",
    time: "Pinned dispatch",
    body: "Orakzai Bond (OKBOND) Staking Vault Phase II is now live with boosted APY rewards. Review the vault terms, verified deed information, and settlement disclosures before participating.",
    tags: ["#OKBOND", "#StakingVault", "#OrakzaiBond"],
    likes: 247,
    comments: 38,
  },
  {
    id: "bond-holder-update",
    official: true,
    name: "Orakzai Bond Treasury",
    handle: "@orakzaibond",
    time: "Today",
    body: "The Bond Community Command Center is now connected to the OkzByte ecosystem. Use the RWA Vaults section to review eligible property-backed pools and their published terms.",
    tags: ["#BondCommunity", "#RWAVaults", "#OkzByte"],
    likes: 186,
    comments: 24,
  },
  {
    id: "holder-think-tank",
    name: "Bond Holder",
    handle: "@sovereign_holder",
    time: "2h ago",
    body: "The strongest RWA conversations are the ones that start with verified documentation, transparent cash-flow reporting, and clear settlement terms. Looking forward to the next OKBOND disclosure.",
    tags: ["#ThinkTank", "#DueDiligence"],
    sentiment: "Bullish",
    likes: 94,
    comments: 12,
  },
];

function BrandMark() {
  return (
    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#d4af37]/60 bg-black/40 shadow-[0_0_22px_rgba(212,175,55,0.24)]">
      <img src="/token-okbond-official.png" alt="OKBOND" className="h-full w-full object-cover" />
    </div>
  );
}

function StatusBar() {
  return (
    <div className="grid gap-2 rounded-xl border border-[#d4af37]/30 bg-[#15120b]/80 px-3 py-2.5 sm:grid-cols-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0ecb81] opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#0ecb81]" /></span>
        <Users size={13} className="text-[#f4ce45]" />
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#d4af37]/75">Bond Holders</span>
        <span className="ml-auto text-[11px] font-black text-[#f4ce45]">Network active</span>
      </div>
      <div className="flex items-center gap-2 border-[#d4af37]/20 sm:border-l sm:pl-3">
        <Radio size={13} className="text-[#f4ce45]" />
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#d4af37]/75">Grid Pulse</span>
        <span className="ml-auto text-[11px] font-black text-[#0ecb81]">Connected</span>
      </div>
      <div className="flex items-center gap-2 border-[#d4af37]/20 sm:border-l sm:pl-3">
        <Clock3 size={13} className="text-[#f4ce45]" />
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#d4af37]/75">Settlement</span>
        <span className="ml-auto text-[11px] font-black text-[#f4ce45]">On-chain</span>
      </div>
    </div>
  );
}

function Avatar({ official = false, name }: { official?: boolean; name: string }) {
  return (
    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10px] font-black ${official ? "bg-[#f0b90b] text-black" : "border border-[#d4af37]/30 bg-[#242b33] text-[#f4ce45]"}`}>
      {official ? <CircleDollarSign size={17} /> : name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}
    </div>
  );
}

function Action({ icon: Icon, label, onClick, active = false }: { icon: typeof Heart; label: string; onClick: () => void; active?: boolean }) {
  return <button onClick={onClick} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold ${active ? "bg-[#f6465d]/10 text-[#f6465d]" : "text-[#929aa5] hover:bg-white/5 hover:text-white"}`}><Icon size={14} fill={active ? "currentColor" : "none"} />{label}</button>;
}

export default function Community() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState("Community");
  const [query, setQuery] = useState("");
  const [composer, setComposer] = useState("");
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);

  const filtered = useMemo(() => posts.filter((post) => !query.trim() || `${post.name} ${post.handle} ${post.body} ${post.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [posts, query]);
  const toggle = (items: string[], setter: (value: string[]) => void, id: string) => setter(items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  const publish = () => {
    if (!composer.trim()) {
      toast({ title: "Write a dispatch first", description: "Share a considered bond, RWA, or market insight with the community." });
      return;
    }
    setPosts((current) => [{ id: `post-${Date.now()}`, name: "You", handle: "@okzbyte_holder", time: "Just now", body: composer.trim(), tags: ["#BondCommunity"], sentiment: "Bullish", likes: 0, comments: 0 }, ...current]);
    setComposer("");
    toast({ title: "Dispatch published", description: "Your insight is now visible in the Bond Community." });
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#0b0e11] px-3.5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-3 text-[#f5f5f5]">
      <header className="sticky top-0 z-20 mx-auto max-w-4xl bg-[#0b0e11]/95 pb-3 backdrop-blur-xl">
        <div className="flex items-center gap-3 py-2">
          <button onClick={() => navigate("/")} aria-label="Back" className="p-1.5 text-[#929aa5]"><ChevronLeft size={21} /></button>
          <BrandMark />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#d4af37]/80">OKBOND · Command Center</p>
            <h1 className="truncate text-lg font-black tracking-tight text-[#f4ce45] sm:text-xl">Orakzai Bond Community</h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#d4af37]/55">Orakzai Bond Network</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="hidden items-center gap-1.5 rounded-lg border border-[#d4af37]/25 bg-[#181a20] px-2 py-1.5 sm:flex"><Search size={14} className="text-[#d4af37]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members" className="w-24 bg-transparent text-[10px] text-white outline-none" /></div>
            <button onClick={() => toast({ title: "Bond activity", description: "Notifications from the Orakzai Bond Community will appear here." })} aria-label="Notifications" className="relative p-2 text-[#d4af37]"><Bell size={17} /><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#0ecb81]" /></button>
          </div>
        </div>
        <div className="sm:hidden"><div className="flex items-center gap-1.5 rounded-lg border border-[#d4af37]/25 bg-[#181a20] px-2 py-2"><Search size={14} className="text-[#d4af37]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Bond Community" className="min-w-0 flex-1 bg-transparent text-[10px] text-white outline-none" /></div></div>
        <div className="mt-3"><StatusBar /></div>
      </header>

      <main className="mx-auto max-w-4xl">
        <div className="flex gap-1 overflow-x-auto border-b border-[#2b313a] pb-2 pt-1">{TABS.map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-extrabold ${tab === item ? "bg-[#f0b90b]/15 text-[#f0b90b]" : "text-[#929aa5]"}`}>{item}</button>)}</div>

        <section className="mt-3 rounded-2xl border border-[#d4af37]/25 bg-gradient-to-br from-[#211b0d] to-[#181a20] p-3.5">
          <div className="mb-2 flex items-center gap-2"><Megaphone size={15} className="text-[#f4ce45]" /><span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f4ce45]">Share a Bond Dispatch</span></div>
          <div className="flex gap-2.5"><Avatar name="You" /><textarea value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="Share a verified bond insight, RWA idea, or analysis..." rows={2} className="min-w-0 flex-1 resize-none bg-transparent text-xs leading-6 text-white outline-none" /></div>
          <div className="mt-2.5 flex items-center gap-1 border-t border-[#d4af37]/15 pt-2.5"><button onClick={() => toast({ title: "Attach evidence", description: "Image and document attachments can be connected to the Bond Community backend." })} className="p-1.5 text-[#929aa5]"><ImageIcon size={16} /></button><button onClick={() => toast({ title: "Bond sentiment", description: "Add a Bullish or Bearish perspective to your dispatch." })} className="p-1.5 text-[#0ecb81]"><TrendingUp size={16} /></button><button onClick={() => toast({ title: "Attach asset", description: "Attach OKBOND, a vault, or a verified RWA pool." })} className="p-1.5 text-cyan-400"><Tag size={16} /></button><span className="flex-1" /><button onClick={publish} className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0b90b] px-3.5 py-2 text-[11px] font-black text-black"><Send size={13} />Publish</button></div>
        </section>

        <div className="my-4 grid gap-2 sm:grid-cols-3"><div className="rounded-xl border border-[#2b313a] bg-[#151a21] p-3"><ShieldCheck size={16} className="mb-2 text-[#0ecb81]" /><p className="text-[9px] font-bold uppercase tracking-widest text-[#929aa5]">Network principle</p><p className="mt-1 text-xs font-bold">Verify before you participate</p></div><div className="rounded-xl border border-[#2b313a] bg-[#151a21] p-3"><WalletCards size={16} className="mb-2 text-[#f4ce45]" /><p className="text-[9px] font-bold uppercase tracking-widest text-[#929aa5]">Featured asset</p><p className="mt-1 text-xs font-bold">OKBOND · RWA settlement</p></div><div className="rounded-xl border border-[#2b313a] bg-[#151a21] p-3"><Activity size={16} className="mb-2 text-cyan-400" /><p className="text-[9px] font-bold uppercase tracking-widest text-[#929aa5]">Current channel</p><p className="mt-1 text-xs font-bold">{tab}</p></div></div>

        <div className="mb-3 flex items-center gap-1.5 px-0.5 text-[10px] font-extrabold text-[#929aa5]"><Users size={14} className="text-[#f0b90b]" />{tab} feed <span className="ml-auto">{filtered.length} dispatches</span></div>
        <div className="grid gap-2.5">{filtered.map((post) => <article key={post.id} className={`rounded-2xl border p-3.5 ${post.official ? "border-[#f0b90b]/35 bg-gradient-to-br from-[#241f12] to-[#181a20]" : "border-[#2b313a] bg-[#181a20]"}`}>
          {post.official && <div className="mb-2.5 inline-flex items-center gap-1 rounded-md bg-[#f0b90b]/15 px-2 py-1 text-[10px] font-black text-[#f0b90b]"><Pin size={12} />Official Bond Dispatch</div>}
          <div className="flex items-center gap-2.5"><Avatar name={post.name} official={post.official} /><div className="min-w-0 flex-1"><div className="flex items-center gap-1"><strong className="text-xs">{post.name}</strong>{post.official && <BadgeCheck size={14} className="text-[#f0b90b]" />}</div><span className="mt-0.5 block text-[10px] text-[#929aa5]">{post.handle} · {post.time}</span></div>{!post.official && <button onClick={() => toast({ title: "Following updated", description: `${post.handle} was added to your Bond Community following list.` })} className="rounded-md border border-[#2b313a] px-2 py-1.5 text-[9px] font-black text-[#929aa5]">+ Follow</button>}</div>
          {post.sentiment && <span className="mt-3 inline-block rounded bg-[#0ecb81]/10 px-1.5 py-1 text-[10px] font-black text-[#0ecb81]">🟢 {post.sentiment}</span>}
          <p className="my-3 text-[13px] leading-6 text-[#e7e9ed]">{post.body}</p>
          <div className="mb-2.5 flex flex-wrap gap-1.5">{post.tags.map((tag) => <span key={tag} className="rounded-md bg-[#d4af37]/10 px-2 py-1 text-[10px] font-bold text-[#d4af37]">{tag}</span>)}</div>
          {!post.official && <div className="mb-2.5 h-[92px] overflow-hidden rounded-xl border border-[#2b313a] bg-[#10151a]"><svg viewBox="0 0 500 100" preserveAspectRatio="none" className="h-full w-full"><polyline points="0,78 35,70 70,75 105,58 145,64 182,42 220,50 260,34 300,43 340,22 380,30 420,15 455,24 500,8" fill="none" stroke="#0ecb81" strokeWidth="3" /></svg></div>}
          <div className="flex items-center gap-0.5 border-t border-[#2b313a] pt-1.5"><Action icon={Heart} label={`Like (${post.likes + (liked.includes(post.id) ? 1 : 0)})`} active={liked.includes(post.id)} onClick={() => toggle(liked, setLiked, post.id)} /><Action icon={MessageCircle} label={`Comment (${post.comments})`} onClick={() => toast({ title: "Discussion", description: "Open the Bond discussion thread to continue this conversation." })} /><Action icon={Repeat2} label="Repost" onClick={() => toast({ title: "Dispatch reposted", description: "This Bond Community dispatch was added to your feed." })} /><Action icon={Share2} label="Share" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/hub`); toast({ title: "Link copied", description: "Share the Orakzai Bond Community safely." }); }} /><button onClick={() => toggle(saved, setSaved, post.id)} className={`ml-auto p-1.5 ${saved.includes(post.id) ? "text-[#f0b90b]" : "text-[#929aa5]"}`}><Bookmark size={15} fill={saved.includes(post.id) ? "currentColor" : "none"} /></button></div>
        </article>)}</div>
        {!filtered.length && <div className="p-9 text-center text-xs text-[#929aa5]">No Bond Community dispatches match this search.</div>}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-[#929aa5]"><ShieldCheck size={13} className="text-[#f0b90b]" />Review official disclosures and verify information before participating.</div>
      </main>
    </div>
  );
}

export { INITIAL_POSTS };
