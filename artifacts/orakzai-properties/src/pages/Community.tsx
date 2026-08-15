import { useMemo, useState } from "react";
import { BadgeCheck, Bell, Bookmark, ChevronLeft, Hash, Heart, Image as ImageIcon, MessageCircle, Pin, Repeat2, Search, Send, Share2, Tag, TrendingUp, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const TABS = ["Following", "Discover", "News", "RWA & Bonds"];
type Post = { id: string; kind: "official" | "community"; name: string; handle: string; time: string; body: string; tags: string[]; sentiment?: "Bullish" | "Bearish"; likes: number; comments: number };
const INITIAL_POSTS: Post[] = [
  { id: "official-okbond", kind: "official", name: "OkzByte Official", handle: "@okzbyte", time: "Pinned", body: "Orakzai Bond (OKBOND) Staking Vault Phase II is now live with boosted APY rewards.", tags: ["#OKBOND", "#RWAVaults", "#OkzByte"], likes: 186, comments: 24 },
  { id: "alpha-btc", kind: "community", name: "AlphaTrader", handle: "@AlphaTrader", time: "2h ago", body: "BTC holding strong above key support. RWA property tokens showing huge volume surge this week!", tags: ["#BTC", "#RWA"], sentiment: "Bullish", likes: 242, comments: 38 },
  { id: "rwa-oracle", kind: "community", name: "RWA Oracle", handle: "@RWA_Oracle", time: "5h ago", body: "Watching verified land-backed pools and cash-flow reporting before adding exposure. Institutional settlement quality matters.", tags: ["#RealEstate", "#DueDiligence"], sentiment: "Bullish", likes: 94, comments: 12 },
];

function Avatar({ name, official = false }: { name: string; official?: boolean }) {
  return <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black ${official ? "bg-[#f0b90b] text-black" : "bg-slate-600 text-white"}`}>{name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}</div>;
}
function Action({ icon: Icon, label, onClick, active = false }: { icon: any; label: string; onClick: () => void; active?: boolean }) {
  return <button onClick={onClick} className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold ${active ? "bg-red-500/10 text-[#f6465d]" : "text-[#929aa5]"}`}><Icon size={15} fill={active ? "currentColor" : "none"} />{label}</button>;
}

export default function Community() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState("Discover");
  const [query, setQuery] = useState("");
  const [composer, setComposer] = useState("");
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [liked, setLiked] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const filtered = useMemo(() => posts.filter((post) => !query.trim() || `${post.name} ${post.handle} ${post.body} ${post.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [posts, query]);
  const toggle = (items: string[], setter: (value: string[]) => void, id: string) => setter(items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const publish = () => {
    if (!composer.trim()) { toast({ title: "Write an idea first", description: "Share a market insight, RWA idea, or analysis with the Hub." }); return; }
    setPosts((current) => [{ id: `post-${Date.now()}`, kind: "community", name: "You", handle: "@okzbyte-user", time: "Just now", body: composer.trim(), tags: ["#OkzByte"], sentiment: "Bullish", likes: 0, comments: 0 }, ...current]);
    setComposer("");
    toast({ title: "Post published", description: "Your trading idea is now visible in the OkzByte Hub." });
  };
  return <div className="min-h-[100dvh] overflow-x-hidden bg-[#0b0e11] px-3.5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-3 text-[#f5f5f5]">
    <header className="sticky top-0 z-20 mx-auto flex h-12 max-w-3xl items-center gap-2 bg-[#0b0e11]">
      <button onClick={() => navigate("/")} aria-label="Back" className="p-1.5 text-[#929aa5]"><ChevronLeft size={21} /></button><strong className="text-lg">Hub</strong>
      <div className="ml-auto flex items-center gap-1"><div className="flex items-center gap-1.5 rounded-lg border border-[#2b313a] bg-[#181a20] px-2 py-1.5"><Search size={14} className="text-[#929aa5]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search feed" className="w-20 bg-transparent text-[10px] text-white outline-none" /></div><button onClick={() => navigate("/notifications")} aria-label="Notifications" className="p-2 text-[#929aa5]"><Bell size={18} /></button></div>
    </header>
    <main className="mx-auto max-w-3xl">
      <div className="flex gap-1 overflow-x-auto border-b border-[#2b313a] pb-3 pt-1">{TABS.map((item) => <button key={item} onClick={() => setTab(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-extrabold ${tab === item ? "bg-[#f0b90b]/15 text-[#f0b90b]" : "text-[#929aa5]"}`}>{item}</button>)}</div>
      <section className="mt-3 rounded-2xl border border-[#2b313a] bg-[#181a20] p-3.5"><div className="flex gap-2.5"><Avatar name="You" /><textarea value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="Share market insights, RWA ideas, or analysis..." rows={2} className="min-w-0 flex-1 resize-none bg-transparent text-xs leading-6 text-white outline-none" /></div><div className="mt-2.5 flex items-center gap-1 border-t border-[#2b313a] pt-2.5"><button onClick={() => toast({ title: "Media attachment", description: "Image upload is ready for the next post." })} className="p-1.5 text-[#929aa5]"><ImageIcon size={16} /></button><button onClick={() => toast({ title: "Sentiment tag", description: "Choose bullish or bearish when publishing your idea." })} className="p-1.5 text-[#0ecb81]"><TrendingUp size={16} /></button><button onClick={() => toast({ title: "Asset tag", description: "Attach a coin or vault tag to your post." })} className="p-1.5 text-cyan-400"><Tag size={16} /></button><span className="flex-1" /><button onClick={publish} className="inline-flex items-center gap-1.5 rounded-lg bg-[#f0b90b] px-3.5 py-2 text-[11px] font-black text-black"><Send size={13} />Post</button></div></section>
      <div className="my-4 flex items-center gap-1.5 px-0.5 text-[10px] font-extrabold text-[#929aa5]"><Users size={14} className="text-[#f0b90b]" />{tab} feed <span className="ml-auto">{filtered.length} posts</span></div>
      <div className="grid gap-2.5">{filtered.map((post) => <article key={post.id} className={`rounded-2xl border p-3.5 ${post.kind === "official" ? "border-[#f0b90b]/30 bg-gradient-to-br from-[#241f12] to-[#181a20]" : "border-[#2b313a] bg-[#181a20]"}`}>
        {post.kind === "official" && <div className="mb-2.5 inline-flex items-center gap-1 rounded-md bg-[#f0b90b]/15 px-2 py-1 text-[10px] font-black text-[#f0b90b]"><Pin size={12} />Official Announcement</div>}
        <div className="flex items-center gap-2.5"><Avatar name={post.name} official={post.kind === "official"} /><div className="min-w-0 flex-1"><div className="flex items-center gap-1"><strong className="text-xs">{post.name}</strong>{post.kind === "community" && <BadgeCheck size={14} className="text-cyan-400" />}</div><span className="mt-0.5 block text-[10px] text-[#929aa5]">{post.handle} · {post.time}</span></div>{post.kind === "community" && <button onClick={() => toggle(following, setFollowing, post.id)} className={`rounded-md border px-2 py-1.5 text-[9px] font-black ${following.includes(post.id) ? "border-[#0ecb81] text-[#0ecb81]" : "border-[#2b313a] text-[#929aa5]"}`}>{following.includes(post.id) ? "Following" : "+ Follow"}</button>}</div>
        {post.sentiment && <span className={`mt-3 inline-block rounded px-1.5 py-1 text-[10px] font-black ${post.sentiment === "Bullish" ? "bg-[#0ecb81]/10 text-[#0ecb81]" : "bg-[#f6465d]/10 text-[#f6465d]"}`}>{post.sentiment === "Bullish" ? "🟢" : "🔴"} {post.sentiment}</span>}
        <p className="my-3 text-[13px] leading-6 text-[#e7e9ed]">{post.body}</p>
        {post.kind === "community" && <div className="mb-2.5 h-[104px] overflow-hidden rounded-xl border border-[#2b313a] bg-[#1e2329]"><svg viewBox="0 0 500 100" preserveAspectRatio="none" className="h-full w-full"><polyline points="0,78 35,70 70,75 105,58 145,64 182,42 220,50 260,34 300,43 340,22 380,30 420,15 455,24 500,8" fill="none" stroke="#0ecb81" strokeWidth="3" /></svg></div>}
        <div className="flex items-center gap-0.5 border-t border-[#2b313a] pt-1.5"><Action icon={Heart} label={`Like (${post.likes + (liked.includes(post.id) ? 1 : 0)})`} active={liked.includes(post.id)} onClick={() => toggle(liked, setLiked, post.id)} /><Action icon={MessageCircle} label={`Comment (${post.comments})`} onClick={() => toast({ title: "Comments", description: "Community discussion is available on this post." })} /><Action icon={Repeat2} label="Repost" onClick={() => toast({ title: "Reposted", description: "The idea was added to your Hub feed." })} /><Action icon={Share2} label="Share" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/hub`); toast({ title: "Post link copied", description: "Share this Hub post safely." }); }} /><button onClick={() => toggle(saved, setSaved, post.id)} className={`ml-auto p-1.5 ${saved.includes(post.id) ? "text-[#f0b90b]" : "text-[#929aa5]"}`}><Bookmark size={15} fill={saved.includes(post.id) ? "currentColor" : "none"} /></button></div>
      </article>)}</div>
      {!filtered.length && <div className="p-9 text-center text-xs text-[#929aa5]">No posts match this search.</div>}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-[#929aa5]"><Hash size={13} className="text-[#f0b90b]" />Share responsibly. Verify information before trading.</div>
    </main>
  </div>;
}
export { INITIAL_POSTS };
