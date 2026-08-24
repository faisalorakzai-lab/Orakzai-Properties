import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Edit, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/AuthContext";
import { LAWYERS } from "./PropertyLawyers";

const BG = "#040b14";
const CARD_BG = "#070f1c";
const GOLD = "#C9A84C";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(201,168,76,0.22)";
const FILTERS = ["All", "Open", "Closed"] as const;
type Filter = typeof FILTERS[number];

type ThreadRow = {
  id: string;
  participant_a: string;
  participant_b: string;
  participant_a_name?: string | null;
  participant_b_name?: string | null;
  subject?: string | null;
  context?: Record<string, unknown> | null;
  status?: "open" | "closed" | string;
  created_at: string;
};

type MessageRow = { thread_id: string; body: string; created_at: string; sender_id: string };
type LiveChatMeta = ThreadRow & { lawyerName: string; subtitle: string; lastMsg: string; lastAt: string; mine: boolean };

/** Compatibility shape for the legacy route; the real Inbox never populates this with fabricated data. */
export interface ChatMeta {
  id: string; name: string; subtitle: string; avatar: string; avatarColor: string;
  lastMsg: string; time: string; unread: number; online: boolean;
  category: "buyer" | "agent" | "service"; verified: boolean;
}
export const CHATS: ChatMeta[] = [];

function formatTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" });
  return date.toLocaleDateString("en-PK", { month: "short", day: "numeric" });
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "LC";
}

function lawyerForThread(thread: ThreadRow) {
  const lawyerId = thread.context && typeof thread.context.lawyer_id === "string" ? thread.context.lawyer_id : "";
  return LAWYERS.find(item => item.id === lawyerId) ?? null;
}

export default function Inbox() {
  const [, setLocation] = useLocation();
  const { supabaseUser, isSupabaseReady } = useUser();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [threads, setThreads] = useState<LiveChatMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const loadThreads = async () => {
    if (!isSupabaseReady || !supabaseUser?.id) { setThreads([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("chat_threads").select("*").order("updated_at", { ascending: false }).order("created_at", { ascending: false });
    if (error) { toast.error(`Inbox could not load: ${error.message}`); setThreads([]); setLoading(false); return; }
    const rows = (data ?? []) as ThreadRow[];
    if (!rows.length) { setThreads([]); setLoading(false); return; }
    const ids = rows.map(row => row.id);
    const { data: messages, error: messageError } = await supabase.from("chat_messages").select("thread_id, body, created_at, sender_id").in("thread_id", ids).order("created_at", { ascending: false });
    if (messageError) { toast.error(`Inbox messages could not load: ${messageError.message}`); setThreads([]); setLoading(false); return; }
    const latest = new Map<string, MessageRow>();
    for (const message of (messages ?? []) as MessageRow[]) if (!latest.has(message.thread_id)) latest.set(message.thread_id, message);
    setThreads(rows.map(thread => {
      const lawyer = lawyerForThread(thread);
      const last = latest.get(thread.id);
      return { ...thread, lawyerName: lawyer?.name ?? thread.participant_b_name ?? "Legal Counsel", subtitle: lawyer?.offices ?? thread.subject ?? "Property legal consultation", lastMsg: last?.body ?? "Consultation opened securely.", lastAt: last?.created_at ?? thread.created_at, mine: last?.sender_id === supabaseUser.id };
    }));
    setLoading(false);
  };

  useEffect(() => { void loadThreads(); }, [isSupabaseReady, supabaseUser?.id]);

  useEffect(() => {
    if (!supabaseUser?.id) return;
    const channel = supabase.channel(`inbox-threads-${supabaseUser.id}`).on("postgres_changes", { event: "*", schema: "public", table: "chat_threads" }, () => { void loadThreads(); }).on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => { void loadThreads(); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabaseUser?.id, isSupabaseReady]);

  const filtered = useMemo(() => threads.filter(thread => {
    const matchesFilter = filter === "All" || thread.status === filter.toLowerCase();
    const haystack = `${thread.lawyerName} ${thread.subtitle} ${thread.lastMsg}`.toLowerCase();
    return matchesFilter && haystack.includes(search.trim().toLowerCase());
  }), [threads, filter, search]);

  const totalOpen = threads.filter(thread => thread.status !== "closed").length;

  return <div style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
    <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(4,11,20,0.96)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${BORDER_GOLD}` }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "16px 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><MessageCircle size={22} color={GOLD} /><span style={{ fontSize: 20, fontWeight: 900, color: "#F5F5F5" }}>Inbox</span>{totalOpen > 0 && <span style={{ background: GOLD, color: BG, fontSize: 11, fontWeight: 800, borderRadius: 20, padding: "1px 7px" }}>{totalOpen}</span>}</div><div style={{ display: "flex", gap: 6 }}><motion.button whileTap={{ scale: 0.9 }} aria-label="Refresh inbox" onClick={() => void loadThreads()} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, display: "grid", placeItems: "center", color: GOLD }}><RefreshCw size={15} /></motion.button><motion.button whileTap={{ scale: 0.9 }} aria-label="New message" onClick={() => setLocation("/services/lawyers")} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(201,168,76,0.1)", border: `1px solid ${BORDER_GOLD}`, display: "grid", placeItems: "center", color: GOLD }}><Edit size={15} /></motion.button></div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "0 14px", height: 42, marginBottom: 12 }}><Search size={15} color="#8B93A7" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search consultations…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#F5F5F5", fontSize: 13, fontFamily: "inherit" }} />{search && <button onClick={() => setSearch("")} aria-label="Clear search" style={{ background: "none", border: "none", padding: 0 }}><X size={13} color="#8B93A7" /></button>}</div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" as const }}>{FILTERS.map(item => { const active = filter === item; return <motion.button key={item} whileTap={{ scale: 0.95 }} onClick={() => setFilter(item)} style={{ flexShrink: 0, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer", background: active ? GOLD : "rgba(255,255,255,0.05)", border: active ? "none" : `1px solid ${BORDER}`, color: active ? BG : "#8B93A7" }}>{item}</motion.button>; })}</div>
      </div>
    </div>
    <div style={{ flex: 1, overflowY: "auto", maxWidth: 620, margin: "0 auto", width: "100%", paddingBottom: 90 }}>
      {loading ? <div style={{ padding: 80, textAlign: "center", color: "#8B93A7", fontSize: 13 }}>Loading secure conversations…</div> : <AnimatePresence>{filtered.length === 0 ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 12 }}><MessageCircle size={48} color="rgba(201,168,76,0.25)" /><span style={{ color: "#8B93A7", fontSize: 14 }}>{threads.length ? "No consultations match your search" : "No live consultations yet"}</span><span style={{ color: "#596273", fontSize: 11, textAlign: "center", maxWidth: 280 }}>{threads.length ? "Try another search or filter." : "Choose a source-linked lawyer to open a secure consultation."}</span></motion.div> : filtered.map((chat, index) => <motion.div key={chat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: index * 0.04 }} whileTap={{ scale: 0.985 }} onClick={() => setLocation(`/inbox?thread_id=${encodeURIComponent(chat.id)}`)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", background: "rgba(201,168,76,0.02)" }}><div style={{ position: "relative", flexShrink: 0 }}><div style={{ width: 50, height: 50, borderRadius: "50%", background: `${GOLD}22`, border: `2px solid ${GOLD}55`, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 800, color: GOLD }}>{initials(chat.lawyerName)}</div><div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: "#10b981", border: `2px solid ${BG}` }} /></div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}><div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}><span style={{ fontSize: 14, fontWeight: 750, color: "#F5F5F5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.lawyerName}</span><ShieldCheck size={13} color={GOLD} /></div><span style={{ fontSize: 11, color: GOLD, flexShrink: 0 }}>{formatTime(chat.lastAt)}</span></div><div style={{ fontSize: 11, color: "#8B93A7", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>⚖ {chat.subtitle}</div><div style={{ fontSize: 13, color: "#EAECEF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.mine ? "You: " : ""}{chat.lastMsg}</div></div></motion.div>)}</AnimatePresence>}
    </div>
  </div>;
}

