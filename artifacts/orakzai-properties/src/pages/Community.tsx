import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  BadgeCheck,
  Bookmark,
  Check,
  CheckCircle2,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Repeat2,
  Search,
  Share2,
  ThumbsUp,
  TrendingUp,
  X,
} from "lucide-react";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";

const tabs = ["Discover", "Following", "RWA & Bonds", "News & Analytics"] as const;
type Tab = typeof tabs[number];

type FeedPost = {
  id: string;
  author: string;
  role: string;
  influence: string;
  title: string;
  time: string;
  sentiment: "Bullish" | "Bearish";
  body: string;
  tags: string[];
  symbols?: { label: string; value: string; tone: "gold" | "green" | "red" }[];
  media?: string;
  official?: boolean;
  metric?: { label: string; value: string; detail: string };
  likes: number;
  comments: number;
  reposts: number;
};

const seedPosts: FeedPost[] = [
  { id: "okbond-phase-ii", author: "Orakzai Bond", role: "Official · OKBOND Network", influence: "Institutional RWA desk", title: "Orakzai Bond Phase II vault is now live", time: "2h ago", sentiment: "Bullish", body: "Orakzai Bond (OKBOND) Staking Vault Phase II is now live with boosted APY rewards. Review the published vault terms, verified deed information, and settlement disclosures before participating.", tags: ["#OKBOND", "#RWAVaults", "#OrakzaiBond"], symbols: [{ label: "OKBOND", value: "+10.50% APY", tone: "gold" }, { label: "RWA", value: "Verified", tone: "green" }], media: "/orakzai-bond-logo.png", official: true, metric: { label: "Phase II Vault", value: "10.50% APY", detail: "Verified on-chain settlement" }, likes: 428, comments: 64, reposts: 91 },
  { id: "faisal-rwa", author: "Faisal Orakzai", role: "Founder · Orakzai Group", influence: "142.70 influence score", title: "Building the infrastructure behind responsible RWA markets", time: "4h ago", sentiment: "Bullish", body: "RWA markets need infrastructure before they need noise: transparent property records, disciplined settlement, and useful liquidity. That is the standard we are building across OkzByte and Orakzai Bond.", tags: ["#RealWorldAssets", "#PropertyTokenization", "#Pakistan"], symbols: [{ label: "RWA DESK", value: "$14.85M TVL", tone: "green" }], media: "/faisal-orakzai-profile.jpg", metric: { label: "OkzByte RWA Desk", value: "$14.85M TVL", detail: "Real estate and land-bond vaults" }, likes: 242, comments: 38, reposts: 52 },
  { id: "bond-holder", author: "Bond Holder PK", role: "Verified bond holder", influence: "Community contributor", title: "What serious bond communities should verify first", time: "Yesterday", sentiment: "Bullish", body: "The strongest RWA conversations start with verified documentation, transparent cash-flow reporting, and clear settlement terms. Looking forward to the next OKBOND disclosure.", tags: ["#BondCommunity", "#DueDiligence"], symbols: [{ label: "OKBOND", value: "Community", tone: "gold" }], likes: 118, comments: 21, reposts: 14 },
  { id: "market-desk", author: "OkzByte Research", role: "Market & risk desk", influence: "Risk intelligence", title: "Volatility is elevated — protect the downside", time: "Yesterday", sentiment: "Bearish", body: "Volatility remains elevated across major assets. Keep position sizing disciplined and separate short-term market views from long-duration property-backed allocations.", tags: ["#MarketStructure", "#RiskManagement"], symbols: [{ label: "MARKET PULSE", value: "Risk controlled", tone: "red" }], likes: 86, comments: 17, reposts: 9 },
];

function Avatar({ name, photo, official = false, size = "h-10 w-10" }: { name: string; photo?: string | null; official?: boolean; size?: string }) {
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-full border ${official ? "border-[#f0b90b]/60" : "border-[#2b313a]"}`}>
      <img src={photo || (official ? "/orakzai-bond-logo.png" : "/faisal-orakzai-profile.jpg")} alt={`${name} profile`} className="h-full w-full object-cover" />
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
  const [expandedPosts, setExpandedPosts] = useState<string[]>([]);
  const [commenting, setCommenting] = useState<string[]>([]);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [inlineStatus, setInlineStatus] = useState("");

  const filtered = useMemo(() => posts.filter((post) => {
    const searchMatch = !query.trim() || `${post.author} ${post.body} ${post.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const tabMatch = tab === "Discover" || (tab === "Following" && followed.includes(post.id)) || (tab === "RWA & Bonds" && post.tags.some((tag) => /rwa|bond|property/i.test(tag))) || (tab === "News & Analytics" && post.id === "market-desk");
    return searchMatch && tabMatch;
  }), [followed, posts, query, tab]);

  const toggle = (items: string[], setter: (value: string[]) => void, id: string) => setter(items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  const publish = () => {
    if (!composer.trim()) { setComposerOpen(true); setInlineStatus("Add a market insight before publishing."); return; }
    setPosts((current) => [{ id: `user-${Date.now()}`, author: "You", role: "OkzByte community member", influence: "Community contributor", title: "A new market idea", time: "Just now", sentiment: "Bullish", body: composer.trim(), tags: ["#OkzByteHub"], likes: 0, comments: 0, reposts: 0 }, ...current]);
    setComposer(""); setComposerOpen(false);
    setInlineStatus("Post published to the Hub feed.");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0e11] pb-28 font-sans antialiased text-white">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#1c2127] bg-[#0b0e11] px-4 text-white">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div><p className="text-sm font-extrabold tracking-wide text-white">OKZBYTE HUB</p><p className="-mt-0.5 block text-[9px] text-gray-400">MARKET COMMUNITY</p></div>
          </div>
          <div className="flex items-center gap-1">
            <button aria-label="Search Hub" onClick={() => setSearchOpen((value) => !value)} className="rounded-full p-2.5 text-[#d4dbe5] hover:bg-white/5"><Search size={21} /></button>
            <Link href="/chats" aria-label="Open Marketplace Inbox" className="relative cursor-pointer rounded-full p-2 text-gray-300 hover:text-yellow-400"><MessageCircle size={20} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" /></Link>
          </div>
        </div>
      </header>
      <nav className="scrollbar-none flex gap-5 overflow-x-auto border-b border-[#1c2127] bg-[#0b0e11] px-4 pb-2 pt-2">
          {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`relative whitespace-nowrap pb-2 text-xs font-semibold ${tab === item ? "border-b-2 border-yellow-400 font-bold text-yellow-400" : "text-gray-400 hover:text-white"}`}>{item === "News & Analytics" ? "News" : item}</button>)}
      </nav>

      {searchOpen && <div className="border-b border-[#1c2127] bg-[#0b0e11] px-4 py-2"><div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-[#2b313a] bg-[#181a20] px-3.5 py-1.5"><Search size={15} className="shrink-0 text-gray-500" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search posts, vaults, or traders..." className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-500" /><button aria-label="Clear search" onClick={() => { setSearchOpen(false); setQuery(""); }} className="text-gray-500 hover:text-white"><X size={14} /></button></div></div>}

      <main className="mx-auto w-full max-w-2xl">
        <section className="mx-3 my-3 rounded-2xl border border-[#262c35] bg-[#14171d] p-3"><div className="flex items-center gap-3"><Avatar name="Faisal Orakzai" photo={profilePhoto || "/faisal-orakzai-profile.jpg"} size="h-8 w-8" />{composerOpen ? <textarea autoFocus value={composer} onChange={(event) => setComposer(event.target.value)} rows={2} placeholder="Share market analysis, RWA ideas..." className="min-w-0 flex-1 resize-none bg-transparent text-xs text-white outline-none placeholder:text-gray-500" /> : <button onClick={() => setComposerOpen(true)} className="min-w-0 flex-1 text-left text-xs text-gray-500 outline-none">Share market analysis, RWA ideas...</button>}<button onClick={publish} className="shrink-0 rounded-xl bg-yellow-400 px-3.5 py-1.5 text-xs font-extrabold text-black transition-all hover:bg-yellow-300">Post</button></div></section>
        <section className="divide-y divide-white/[0.07]">
          {filtered.map((post) => {
            const isLiked = liked.includes(post.id); const isSaved = saved.includes(post.id); const isFollowed = followed.includes(post.id);
            return <article key={post.id} onClick={() => setExpandedPosts((current) => current.includes(post.id) ? current.filter((id) => id !== post.id) : [...current, post.id])} className="mx-3 my-3 cursor-pointer space-y-3 rounded-2xl border border-[#262c35] bg-[#14171d] p-4 shadow-sm transition-colors active:bg-[#13171d]">
              <div className="flex items-start gap-3">
                <Avatar name={post.author} official={post.official} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5"><span className="truncate text-sm font-bold text-white">{post.author}</span>{post.official && <BadgeCheck size={14} className="shrink-0 text-[#f0b90b]" />}<span className="text-xs text-gray-500">· {post.time}</span><span className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${post.sentiment === "Bullish" ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"}`}><span className={`h-1.5 w-1.5 rounded-full ${post.sentiment === "Bullish" ? "bg-emerald-400" : "bg-rose-400"}`} />{post.sentiment}</span></div>
                  <p className="mt-0.5 truncate text-[11px] text-gray-500">{post.influence}</p>
                </div>
                {!post.official && <button onClick={(event) => { event.stopPropagation(); toggle(followed, setFollowed, post.id); }} className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold ${isFollowed ? "bg-[#0ecb81]/10 text-[#0ecb81]" : "bg-yellow-400 text-black"}`}>{isFollowed ? <><Check size={13} className="inline" /> Following</> : "+ Follow"}</button>}
                <button aria-label="Post options" onClick={(event) => event.stopPropagation()} className="p-1 text-gray-500"><MoreHorizontal size={17} /></button>
              </div>
              {post.official && <div className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-400/10 px-2 py-1 text-[10px] font-bold text-yellow-400"><Pin size={12} /> Official Announcement</div>}
              <h3 className="text-base font-semibold leading-snug text-white">{post.title}</h3>
              <p className="text-sm font-normal leading-relaxed text-gray-300">{expandedPosts.includes(post.id) ? post.body : `${post.body.slice(0, 148)}${post.body.length > 148 ? "..." : ""}`} {!expandedPosts.includes(post.id) && post.body.length > 148 && <span className="font-semibold text-yellow-400"> Read all</span>}</p>
              {post.symbols && <div className="flex flex-wrap gap-2">{post.symbols.map((symbol) => <span key={symbol.label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${symbol.tone === "green" ? "bg-emerald-400/10 text-emerald-400" : symbol.tone === "red" ? "bg-rose-400/10 text-rose-400" : "bg-yellow-400/10 text-yellow-400"}`}><span>{symbol.label}</span><span className="opacity-80">{symbol.value}</span></span>)}</div>}
              {post.media && <div className="overflow-hidden rounded-xl border border-[#262c35] bg-[#0b0e11]"><img src={post.media} alt={`${post.author} post media`} className={`h-44 w-full ${post.official ? "object-contain p-5" : "object-cover"}`} /></div>}
              {post.metric && <InsightCard metric={post.metric} />}
              <div className="flex flex-wrap gap-x-3 gap-y-1">{post.tags.map((tag) => <span key={tag} className="text-xs font-semibold text-yellow-400">{tag}</span>)}</div>
              {expandedPosts.includes(post.id) && <div className="rounded-xl border border-[#262c35] bg-[#0b0e11] p-3 text-[11px] leading-relaxed text-gray-400"><span className="font-bold text-yellow-400">Market context</span><p className="mt-1">Review the published disclosures, settlement information, and risk context before taking action.</p></div>}
              <div className="flex items-center justify-between border-t border-[#262c35]/50 pt-2 text-xs text-gray-400">
                <button onClick={(event) => { event.stopPropagation(); toggle(liked, setLiked, post.id); }} className={`flex items-center gap-1.5 text-xs hover:text-[#f0b90b] ${isLiked ? "text-[#f0b90b]" : ""}`}><ThumbsUp size={16} />{post.likes + (isLiked ? 1 : 0)}</button><span className="flex items-center gap-1.5 text-xs"><span className="text-gray-500">◉</span>{(post.likes * 7 + 900).toLocaleString()}</span>
                <button onClick={(event) => { event.stopPropagation(); setCommenting((current) => current.includes(post.id) ? current.filter((id) => id !== post.id) : [...current, post.id]); }} className={`flex items-center gap-1.5 text-xs hover:text-white ${commenting.includes(post.id) ? "text-yellow-400" : ""}`}><MessageCircle size={17} />{post.comments}</button>
                <button onClick={(event) => { event.stopPropagation(); setInlineStatus("Post reposted to your Hub feed."); }} className="flex items-center gap-1.5 text-xs hover:text-[#0ecb81]"><Repeat2 size={17} />{post.reposts}</button>
                <button onClick={(event) => { event.stopPropagation(); toggle(saved, setSaved, post.id); }} className={`flex items-center gap-1.5 text-xs hover:text-white ${isSaved ? "text-[#f0b90b]" : ""}`}><Bookmark size={17} />{isSaved ? "Saved" : "Save"}</button>
                <button onClick={(event) => { event.stopPropagation(); navigator.clipboard?.writeText(`${window.location.origin}/hub`); setInlineStatus("Post link copied."); }} className="flex items-center gap-1.5 text-xs hover:text-white"><Share2 size={17} /></button>
              </div>
              {commenting.includes(post.id) && <div className="flex items-center gap-2 rounded-xl border border-[#262c35] bg-[#0b0e11] p-2"><input value={commentDraft[post.id] || ""} onChange={(event) => setCommentDraft((current) => ({ ...current, [post.id]: event.target.value }))} onClick={(event) => event.stopPropagation()} placeholder="Write a comment..." className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-500" /><button onClick={(event) => { event.stopPropagation(); setCommentDraft((current) => ({ ...current, [post.id]: "" })); setCommenting((current) => current.filter((id) => id !== post.id)); setInlineStatus("Comment added inline."); }} className="rounded-lg bg-yellow-400 px-2.5 py-1 text-[10px] font-bold text-black">Send</button></div>}
            </article>;
          })}
        </section>
        {!filtered.length && <div className="p-12 text-center text-xs text-[#8995a8]">No posts match this feed yet.</div>}
        {inlineStatus && <p className="mx-4 mt-2 text-center text-[11px] text-[#0ecb81]">{inlineStatus}</p>}
        <footer className="flex items-center justify-center gap-2 px-4 py-6 text-[10px] text-[#8995a8]"><CheckCircle2 size={13} className="text-[#0ecb81]" /> Official Bond announcements are marked and sourced from the Orakzai Bond Network.</footer>
      </main>

    </div>
  );
}

export { seedPosts };
