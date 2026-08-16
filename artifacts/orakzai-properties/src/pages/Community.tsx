import { useMemo, useState } from "react";
import { Link } from "wouter";
import { BadgeCheck, Bookmark, CheckCircle2, Inbox as InboxIcon, MessageCircle, MoreHorizontal, Pin, Repeat2, Search, Send, Share2, ThumbsUp, TrendingUp, WalletCards, X } from "lucide-react";
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
  {
    id: "okbond-phase-ii",
    author: "Orakzai Bond",
    role: "Official · OKBOND Network",
    time: "2h ago",
    sentiment: "Bullish",
    body: "Orakzai Bond (OKBOND) Staking Vault Phase II is now live with boosted APY rewards. Review the published vault terms, verified deed information, and settlement disclosures before participating.",
    tags: ["#OKBOND", "#RWAVaults", "#OrakzaiBond"],
    official: true,
    metric: { label: "Phase II Vault", value: "10.50% APY", detail: "Verified on-chain settlement" },
    likes: 428,
    comments: 64,
    reposts: 91,
  },
  {
    id: "faisal-rwa",
    author: "Faisal Orakzai",
    role: "Founder · Orakzai Group",
    time: "4h ago",
    sentiment: "Bullish",
    body: "RWA markets need infrastructure before they need noise: transparent property records, disciplined settlement, and useful liquidity. That is the standard we are building across OkzByte and Orakzai Bond.",
    tags: ["#RealWorldAssets", "#PropertyTokenization", "#Pakistan"],
    metric: { label: "OkzByte RWA Desk", value: "$14.85M TVL", detail: "Real estate and land-bond vaults" },
    likes: 242,
    comments: 38,
    reposts: 52,
  },
  {
    id: "bond-holder",
    author: "Bond Holder PK",
    role: "Verified bond holder",
    time: "Yesterday",
    sentiment: "Bullish",
    body: "The strongest RWA conversations start with verified documentation, transparent cash-flow reporting, and clear settlement terms. Looking forward to the next OKBOND disclosure.",
    tags: ["#BondCommunity", "#DueDiligence"],
    likes: 118,
    comments: 21,
    reposts: 14,
  },
  {
    id: "market-desk",
    author: "OkzByte Research",
    role: "Market & risk desk",
    time: "Yesterday",
    sentiment: "Bearish",
    body: "Volatility remains elevated across major assets. Keep position sizing disciplined and separate short-term market views from long-duration property-backed allocations.",
    tags: ["#MarketStructure", "#RiskManagement"],
    metric: { label: "Market Pulse", value: "Risk controlled", detail: "Review liquidity before entry" },
    likes: 86,
    comments: 17,
    reposts: 9,
  },
];

function Avatar({ name, photo, official = false, size = "h-9 w-9" }: { name: string; photo?: string | null; official?: boolean; size?: string }) {
  const initials = name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "OK";
  return (
    <div className={`${size} grid shrink-0 place-items-center overflow-hidden rounded-full border ${official ? "border-yellow-500/60 bg-yellow-400 text-black" : "border-[#2b313a] bg-[#181a20] text-yellow-400"} text-[10px] font-black`}>
      {photo ? <img src={photo} alt="Profile" className="h-full w-full object-cover" /> : official ? <WalletCards size={16} /> : initials}
    </div>
  );
}

function MetricCard({ metric }: { metric: NonNullable<FeedPost["metric"]> }) {
  return (
    <div className="rounded-xl border border-[#2b313a] bg-[#181a20] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#929aa5]">{metric.label}</p>
          <p className="mt-1 text-lg font-black text-white">{metric.value}</p>
          <p className="mt-1 text-[10px] text-emerald-400">{metric.detail}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-yellow-500/20 bg-yellow-400/10 text-yellow-400"><TrendingUp size={18} /></div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#2b313a]"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-yellow-500 to-emerald-400" /></div>
    </div>
  );
}

export default function Community() {
  const { toast } = useToast();
  const { user } = useAuth();
  const profilePhoto = useProfilePhoto();
  const [tab, setTab] = useState<Tab>("Discover");
  const [query, setQuery] = useState("");
  const [composer, setComposer] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [posts, setPosts] = useState(seedPosts);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [followed, setFollowed] = useState<string[]>([]);
  const initials = (user?.firstName?.[0] || user?.email?.[0] || "F").toUpperCase();

  const filtered = useMemo(() => posts.filter((post) => {
    const searchMatch = !query.trim() || `${post.author} ${post.body} ${post.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const tabMatch = tab === "Discover"
      || (tab === "Following" && followed.includes(post.id))
      || (tab === "RWA & Bonds" && post.tags.some((tag) => /rwa|bond|property/i.test(tag)))
      || (tab === "News & Analytics" && post.id === "market-desk");
    return searchMatch && tabMatch;
  }), [followed, posts, query, tab]);

  const toggle = (items: string[], setter: (value: string[]) => void, id: string) => setter(items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  const publish = () => {
    if (!composer.trim()) {
      toast({ title: "Add a market insight", description: "Share a considered RWA, bond, or market idea." });
      return;
    }
    setPosts((current) => [{ id: `user-${Date.now()}`, author: "You", role: "OkzByte community member", time: "Just now", sentiment: "Bullish", body: composer.trim(), tags: ["#OkzByteHub"], likes: 0, comments: 0, reposts: 0 }, ...current]);
    setComposer("");
    setComposerOpen(false);
    toast({ title: "Post published", description: "Your insight is now visible in the Hub feed." });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0e11] pb-[calc(96px+env(safe-area-inset-bottom))] font-sans antialiased text-white">
      <header className="sticky top-0 z-50 h-14 border-b border-[#181a20] bg-[#0b0e11]/95 px-4 py-2.5 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-2xl items-center gap-3">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[#2b313a] bg-[#181a20] px-3 py-1.5 text-xs text-gray-400 focus-within:border-yellow-500/50">
            <Search size={14} className="shrink-0" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search posts, topics, or RWA tokens..." className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-500" />
          </label>
          <Link href="/inbox" aria-label="Open Inbox" className="relative shrink-0 rounded-lg p-2 text-gray-300 transition-colors hover:bg-[#181a20] hover:text-yellow-400"><InboxIcon size={19} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" /></Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl">
        <section className="border-b border-[#2b313a] bg-[#181a20] p-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={initials} photo={profilePhoto} size="h-8 w-8" />
            <button onClick={() => setComposerOpen(true)} className="flex-1 rounded-full border border-[#2b313a] bg-[#0b0e11] px-4 py-2 text-left text-xs text-gray-400 hover:bg-[#13171d]">What's on your mind? Share market ideas...</button>
            <Link href="/inbox" aria-label="Open Inbox" className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400 transition-colors hover:bg-emerald-500/20"><InboxIcon size={18} /></Link>
          </div>
          {composerOpen && <div className="mt-2.5 rounded-xl border border-[#2b313a] bg-[#0b0e11] p-2.5">
            <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">New community post</span><button aria-label="Close composer" onClick={() => setComposerOpen(false)} className="rounded-full p-1 text-gray-500 hover:text-white"><X size={14} /></button></div>
            <div className="flex items-end gap-2"><textarea id="hub-composer" autoFocus value={composer} onChange={(event) => setComposer(event.target.value)} rows={3} placeholder="Share market insights, RWA ideas, or analysis..." className="min-w-0 flex-1 resize-none bg-transparent px-1 py-1 text-xs leading-relaxed text-white outline-none placeholder:text-gray-500" /><button onClick={publish} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-yellow-400 text-black hover:bg-yellow-300" aria-label="Publish post"><Send size={14} /></button></div>
          </div>}
        </section>

        <nav className="scrollbar-none flex gap-6 overflow-x-auto border-b border-[#181a20] bg-[#0b0e11] px-4 py-2.5 text-xs font-semibold text-gray-400">
          {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap border-b-2 pb-1.5 ${tab === item ? "border-yellow-400 font-bold text-yellow-400" : "border-transparent hover:text-white"}`}>{item}</button>)}
        </nav>

        <div className="flex items-center justify-between border-b border-[#181a20] px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500"><span>{tab} feed</span><span>{filtered.length} posts</span></div>

        <section className="divide-y divide-[#181a20]">
          {filtered.map((post) => {
            const isLiked = liked.includes(post.id);
            const isSaved = saved.includes(post.id);
            const isFollowed = followed.includes(post.id);
            return (
              <article key={post.id} className="space-y-3 bg-[#0b0e11] p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={post.author} official={post.official} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5"><span className="text-xs font-bold text-white">@{post.author.replace(/^@/, "")}</span>{post.official && <BadgeCheck size={13} className="text-yellow-400" />}<span className="text-[10px] text-gray-500">{post.time}</span><span className={`rounded px-2 py-0.5 text-[10px] font-bold ${post.sentiment === "Bullish" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{post.sentiment === "Bullish" ? "🟢" : "🔴"} {post.sentiment}</span></div>
                    <p className="mt-0.5 text-[10px] text-gray-500">{post.role}</p>
                  </div>
                  {!post.official && <button onClick={() => toggle(followed, setFollowed, post.id)} className={`rounded border px-2.5 py-1 text-[10px] font-bold ${isFollowed ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-yellow-500/20 bg-yellow-400/10 text-yellow-400"}`}>{isFollowed ? "Following" : "+ Follow"}</button>}
                  <button aria-label="Post options" className="p-1 text-gray-500"><MoreHorizontal size={16} /></button>
                </div>
                {post.official && <div className="inline-flex items-center gap-1 rounded bg-yellow-400/15 px-2 py-1 text-[10px] font-bold text-yellow-400"><Pin size={12} /> Official Announcement</div>}
                <p className="text-xs leading-relaxed text-gray-200">{post.body}</p>
                {post.metric && <MetricCard metric={post.metric} />}
                <div className="flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="text-xs font-semibold text-yellow-400">{tag}</span>)}</div>
                <div className="flex items-center justify-between border-t border-[#181a20] pt-2 text-xs text-gray-500">
                  <button onClick={() => toggle(liked, setLiked, post.id)} className={`flex items-center gap-1.5 hover:text-yellow-400 ${isLiked ? "text-yellow-400" : ""}`}><ThumbsUp size={14} /> {post.likes + (isLiked ? 1 : 0)}</button>
                  <button onClick={() => toast({ title: "Discussion thread", description: "Comments are ready for the community backend." })} className="flex items-center gap-1.5 hover:text-yellow-400"><MessageCircle size={14} /> {post.comments}</button>
                  <button onClick={() => toast({ title: "Post reposted", description: "This insight was added to your Hub feed." })} className="flex items-center gap-1.5 hover:text-emerald-400"><Repeat2 size={14} /> {post.reposts}</button>
                  <button onClick={() => toggle(saved, setSaved, post.id)} className={`flex items-center gap-1.5 hover:text-white ${isSaved ? "text-yellow-400" : ""}`}><Bookmark size={14} /> Save</button>
                  <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/hub`); toast({ title: "Link copied", description: "Share this OkzByte Hub post." }); }} className="flex items-center gap-1.5 hover:text-white"><Share2 size={14} /> Share</button>
                </div>
              </article>
            );
          })}
        </section>
        {!filtered.length && <div className="p-12 text-center text-xs text-gray-500">No posts match this feed yet.</div>}
        <footer className="flex items-center justify-center gap-2 px-4 py-6 text-[10px] text-gray-500"><CheckCircle2 size={13} className="text-emerald-400" /> Official Bond announcements are marked and sourced from the Orakzai Bond Network.</footer>
      </main>
    </div>
  );
}

export { seedPosts };
