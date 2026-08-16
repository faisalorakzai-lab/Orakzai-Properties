import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  Inbox as InboxIcon,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Plus,
  Repeat2,
  Search,
  Send,
  Share2,
  ThumbsUp,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { useAuth } from "@/contexts/AuthContext";

const tabs = ["Discover", "Following", "RWA & Bonds", "News & Analytics"] as const;
type Tab = typeof tabs[number];

type FeedPost = {
  id: string;
  author: string;
  role: string;
  time: string;
  sentiment: "Bullish" | "Bearish";
  body: string;
  tags: string[];
  official?: boolean;
  metric?: { label: string; value: string; detail: string };
  likes: number;
  comments: number;
  reposts: number;
};

const seedPosts: FeedPost[] = [
  { id: "okbond-phase-ii", author: "Orakzai Bond", role: "Official · OKBOND Network", time: "2h ago", sentiment: "Bullish", body: "Orakzai Bond (OKBOND) Staking Vault Phase II is now live with boosted APY rewards. Review the published vault terms, verified deed information, and settlement disclosures before participating.", tags: ["#OKBOND", "#RWAVaults", "#OrakzaiBond"], official: true, metric: { label: "Phase II Vault", value: "10.50% APY", detail: "Verified on-chain settlement" }, likes: 428, comments: 64, reposts: 91 },
  { id: "faisal-rwa", author: "Faisal Orakzai", role: "Founder · Orakzai Group", time: "4h ago", sentiment: "Bullish", body: "RWA markets need infrastructure before they need noise: transparent property records, disciplined settlement, and useful liquidity. That is the standard we are building across OkzByte and Orakzai Bond.", tags: ["#RealWorldAssets", "#PropertyTokenization", "#Pakistan"], metric: { label: "OkzByte RWA Desk", value: "$14.85M TVL", detail: "Real estate and land-bond vaults" }, likes: 242, comments: 38, reposts: 52 },
  { id: "bond-holder", author: "Bond Holder PK", role: "Verified bond holder", time: "Yesterday", sentiment: "Bullish", body: "The strongest RWA conversations start with verified documentation, transparent cash-flow reporting, and clear settlement terms. Looking forward to the next OKBOND disclosure.", tags: ["#BondCommunity", "#DueDiligence"], likes: 118, comments: 21, reposts: 14 },
  { id: "market-desk", author: "OkzByte Research", role: "Market & risk desk", time: "Yesterday", sentiment: "Bearish", body: "Volatility remains elevated across major assets. Keep position sizing disciplined and separate short-term market views from long-duration property-backed allocations.", tags: ["#MarketStructure", "#RiskManagement"], metric: { label: "Market Pulse", value: "Risk controlled", detail: "Review liquidity before entry" }, likes: 86, comments: 17, reposts: 9 },
];

function Avatar({ name, photo, official = false, size = "h-10 w-10" }: { name: string; photo?: string | null; official?: boolean; size?: string }) {
  const initials = name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "OK";
  return (
    <div className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-full border ${official ? "border-[#f0b90b] bg-[#f0b90b] text-[#111820]" : "border-white/10 bg-[#2a3342] text-[#f0b90b]"} text-[11px] font-black`}>
      {photo ? <img src={photo} alt="Profile" className="h-full w-full object-cover" /> : official ? <WalletCards size={18} /> : initials}
    </div>
  );
}

function InsightCard({ metric }: { metric: NonNullable<FeedPost["metric"]> }) {
  return (
    <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#252e3c] px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8995a8]">{metric.label}</p>
          <p className="mt-0.5 text-lg font-bold tracking-tight text-white">{metric.value}</p>
          <p className="mt-0.5 text-[10px] text-[#0ecb81]">{metric.detail}</p>
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f0b90b]/10 text-[#f0b90b]"><TrendingUp size={17} /></div>
      </div>
      <div className="mt-2.5 flex items-end gap-1 opacity-80" aria-hidden="true">
        {[20, 34, 28, 46, 38, 56, 45, 70, 62, 78, 72, 88].map((height, index) => <span key={index} className="flex-1 rounded-t-sm bg-[#0ecb81]" style={{ height: `${height / 2}px` }} />)}
      </div>
    </div>
  );
}

export default function Community() {
  const { toast } = useToast();
  const { user } = useAuth();
  const profilePhoto = useProfilePhoto();
  const [tab, setTab] = useState<Tab>("Discover");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [composer, setComposer] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [posts, setPosts] = useState(seedPosts);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [followed, setFollowed] = useState<string[]>([]);
  const initials = (user?.firstName?.[0] || user?.email?.[0] || "F").toUpperCase();

  const filtered = useMemo(() => posts.filter((post) => {
    const searchMatch = !query.trim() || `${post.author} ${post.body} ${post.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const tabMatch = tab === "Discover" || (tab === "Following" && followed.includes(post.id)) || (tab === "RWA & Bonds" && post.tags.some((tag) => /rwa|bond|property/i.test(tag))) || (tab === "News & Analytics" && post.id === "market-desk");
    return searchMatch && tabMatch;
  }), [followed, posts, query, tab]);

  const toggle = (items: string[], setter: (value: string[]) => void, id: string) => setter(items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  const publish = () => {
    if (!composer.trim()) { toast({ title: "Add a market insight", description: "Share a considered RWA, bond, or market idea." }); return; }
    setPosts((current) => [{ id: `user-${Date.now()}`, author: "You", role: "OkzByte community member", time: "Just now", sentiment: "Bullish", body: composer.trim(), tags: ["#OkzByteHub"], likes: 0, comments: 0, reposts: 0 }, ...current]);
    setComposer(""); setComposerOpen(false);
    toast({ title: "Post published", description: "Your insight is now visible in the Hub feed." });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#1f2733] pb-[calc(88px+env(safe-area-inset-bottom))] font-sans antialiased text-white">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#1f2733]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[62px] max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#f0b90b] text-[#17202b]"><span className="text-sm font-black">OK</span></div>
            <div><p className="text-[15px] font-extrabold tracking-tight"><span className="text-[#f0b90b]">OKZBYTE</span> <span className="text-white">SQUARE</span></p><p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#8995a8]">Market community</p></div>
          </div>
          <div className="flex items-center gap-1">
            {searchOpen && <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="w-28 rounded-lg border border-white/10 bg-[#273140] px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-[#8995a8]" />}
            <button aria-label="Search Hub" onClick={() => setSearchOpen((value) => !value)} className="rounded-full p-2.5 text-[#d4dbe5] hover:bg-white/5"><Search size={21} /></button>
            <Link href="/inbox" aria-label="Open Inbox" className="relative rounded-full p-2.5 text-[#d4dbe5] hover:bg-white/5"><Bell size={21} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#f0b90b]" /></Link>
          </div>
        </div>
        <nav className="scrollbar-none mx-auto flex max-w-2xl gap-7 overflow-x-auto px-4">
          {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`relative whitespace-nowrap pb-3 pt-1 text-[14px] font-semibold ${tab === item ? "text-white" : "text-[#8995a8]"}`}>{item === "News & Analytics" ? "News" : item}{tab === item && <span className="absolute inset-x-1/4 bottom-0 h-0.5 rounded-full bg-[#f0b90b]" />}</button>)}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between px-4 py-3 text-[11px] text-[#8995a8]"><span className="font-semibold">{tab}</span><button className="flex items-center gap-1 hover:text-white">For you <ChevronDown size={13} /></button></div>
        <section className="divide-y divide-white/[0.07]">
          {filtered.map((post) => {
            const isLiked = liked.includes(post.id); const isSaved = saved.includes(post.id); const isFollowed = followed.includes(post.id);
            return <article key={post.id} className="px-4 py-4">
              <div className="flex items-start gap-3">
                <Avatar name={post.author} official={post.official} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5"><span className="truncate text-[14px] font-bold text-white">{post.author}</span>{post.official && <BadgeCheck size={14} className="shrink-0 text-[#f0b90b]" />}<span className="text-[12px] text-[#8995a8]">· {post.time}</span></div>
                  <p className="mt-0.5 truncate text-[11px] text-[#8995a8]">{post.role}</p>
                </div>
                {!post.official && <button onClick={() => toggle(followed, setFollowed, post.id)} className={`rounded-md px-2 py-1 text-[11px] font-bold ${isFollowed ? "bg-[#0ecb81]/10 text-[#0ecb81]" : "bg-[#f0b90b]/10 text-[#f0b90b]"}`}>{isFollowed ? <Check size={13} /> : "+ Follow"}</button>}
                <button aria-label="Post options" className="p-1 text-[#8995a8]"><MoreHorizontal size={17} /></button>
              </div>
              {post.official && <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#f0b90b]/10 px-2 py-1 text-[11px] font-bold text-[#f0b90b]"><Pin size={12} /> Official Announcement</div>}
              <p className="mt-3 text-[15px] leading-[1.55] text-[#edf1f7]">{post.body}</p>
              {post.metric && <InsightCard metric={post.metric} />}
              <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">{post.tags.map((tag) => <span key={tag} className="text-[13px] font-semibold text-[#f0b90b]">{tag}</span>)}</div>
              <div className="mt-3 flex items-center justify-between text-[#8995a8]">
                <button onClick={() => toggle(liked, setLiked, post.id)} className={`flex items-center gap-1.5 text-xs hover:text-[#f0b90b] ${isLiked ? "text-[#f0b90b]" : ""}`}><ThumbsUp size={16} />{post.likes + (isLiked ? 1 : 0)}</button>
                <button onClick={() => toast({ title: "Discussion thread", description: "Comments are ready for the community backend." })} className="flex items-center gap-1.5 text-xs hover:text-white"><MessageCircle size={17} />{post.comments}</button>
                <button onClick={() => toast({ title: "Post reposted", description: "This insight was added to your Hub feed." })} className="flex items-center gap-1.5 text-xs hover:text-[#0ecb81]"><Repeat2 size={17} />{post.reposts}</button>
                <button onClick={() => toggle(saved, setSaved, post.id)} className={`flex items-center gap-1.5 text-xs hover:text-white ${isSaved ? "text-[#f0b90b]" : ""}`}><Bookmark size={17} />{isSaved ? "Saved" : "Save"}</button>
                <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/hub`); toast({ title: "Link copied", description: "Share this OkzByte Hub post." }); }} className="flex items-center gap-1.5 text-xs hover:text-white"><Share2 size={17} /></button>
              </div>
            </article>;
          })}
        </section>
        {!filtered.length && <div className="p-12 text-center text-xs text-[#8995a8]">No posts match this feed yet.</div>}
        <footer className="flex items-center justify-center gap-2 px-4 py-6 text-[10px] text-[#8995a8]"><CheckCircle2 size={13} className="text-[#0ecb81]" /> Official Bond announcements are marked and sourced from the Orakzai Bond Network.</footer>
      </main>

      <button aria-label="Create post" onClick={() => setComposerOpen(true)} className="fixed bottom-[calc(86px+env(safe-area-inset-bottom))] right-5 z-[60] grid h-14 w-14 place-items-center rounded-full bg-[#f0b90b] text-[#17202b] shadow-[0_8px_24px_rgba(240,185,11,0.28)] transition-transform hover:scale-105 active:scale-95"><Plus size={28} strokeWidth={2.5} /></button>

      {composerOpen && <div className="fixed inset-0 z-[100] flex items-end bg-black/65 backdrop-blur-sm" onClick={() => setComposerOpen(false)}>
        <section className="w-full rounded-t-3xl border-t border-white/10 bg-[#252e3c] p-4 pb-[calc(20px+env(safe-area-inset-bottom))]" onClick={(event) => event.stopPropagation()}>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
          <div className="mb-3 flex items-center justify-between"><div><p className="text-base font-bold">Create a post</p><p className="text-[11px] text-[#8995a8]">Share a market idea with the OkzByte community</p></div><button aria-label="Close composer" onClick={() => setComposerOpen(false)} className="rounded-full p-2 text-[#8995a8] hover:bg-white/5 hover:text-white"><X size={18} /></button></div>
          <textarea autoFocus value={composer} onChange={(event) => setComposer(event.target.value)} rows={5} placeholder="What are you watching in crypto, RWA, or bonds?" className="w-full resize-none rounded-xl border border-white/10 bg-[#1f2733] p-3 text-sm leading-relaxed text-white outline-none placeholder:text-[#8995a8] focus:border-[#f0b90b]/50" />
          <div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-[#8995a8]">Be clear. Be responsible.</span><button onClick={publish} className="flex items-center gap-2 rounded-lg bg-[#f0b90b] px-4 py-2.5 text-xs font-extrabold text-[#17202b] hover:bg-[#ffd15c]"><Send size={14} /> Publish</button></div>
        </section>
      </div>}
    </div>
  );
}

export { seedPosts };
