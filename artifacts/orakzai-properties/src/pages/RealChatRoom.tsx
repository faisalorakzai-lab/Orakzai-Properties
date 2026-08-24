import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Camera, Check, CheckCheck, FileText, Image as ImageIcon,
  MapPin, MessageCircle, Mic, MoreVertical, Paperclip, Phone, Send,
  Smile, Video, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/AuthContext";
import { LAWYERS, type Lawyer } from "./PropertyLawyers";
import Inbox from "./Inbox";

const BG = "#040b14";
const CARD = "#0b1422";
const GOLD = "#c9a84c";
const MUTED = "#8b93a7";
const BORDER = "rgba(255,255,255,.09)";
const GREEN = "#10b981";
const BLUE = "#3b82f6";

type ChatRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  message_type?: string;
  created_at: string;
};

type ThreadRow = {
  id: string;
  participant_a: string;
  participant_b: string;
  participant_a_name?: string | null;
  participant_b_name?: string | null;
  subject?: string | null;
  context?: Record<string, unknown> | null;
  status?: string;
};

type ViewMessage = ChatRow & { mine: boolean };

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" });
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "LC";
}

function lawyerForThread(thread: ThreadRow | null, currentId: string | undefined) {
  const lawyerId = thread?.context && typeof thread.context.lawyer_id === "string" ? thread.context.lawyer_id : "";
  return LAWYERS.find(item => item.id === lawyerId) ?? LAWYERS.find(item => item.name === (thread?.participant_b_name || "")) ?? null;
}

function errorText(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: string }).message || "Database request failed");
  return "Database request failed";
}

export default function RealChatRoom() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { user, supabaseUser, isSupabaseReady } = useUser();
  const search = typeof window !== "undefined"
    ? window.location.search.replace(/^\?/, "")
    : (location.includes("?") ? location.slice(location.indexOf("?") + 1) : "");
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const requestedThreadId = query.get("thread_id") || params.id || "";
  const requestedLawyerId = query.get("lawyer_id") || "";
  const requestedLawyer = LAWYERS.find(item => item.id === requestedLawyerId) ?? null;

  const [thread, setThread] = useState<ThreadRow | null>(null);
  const [messages, setMessages] = useState<ViewMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachmentMenu, setAttachmentMenu] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserId = supabaseUser?.id || "";

  const contact = lawyerForThread(thread, currentUserId) ?? requestedLawyer;
  const contactName = contact?.name ?? thread?.participant_b_name ?? "Legal Counsel";
  const contactOffice = contact?.offices ?? thread?.subject ?? "Property legal consultation";
  const avatar = contact?.image;

  const appendMessage = (row: ChatRow) => {
    setMessages(previous => previous.some(item => item.id === row.id)
      ? previous
      : [...previous, { ...row, mine: row.sender_id === currentUserId }]);
  };

  const findOrCreateThread = async (): Promise<ThreadRow> => {
    if (!currentUserId) throw new Error("Sign in is required before starting a conversation.");
    if (requestedThreadId) {
      const { data, error: threadError } = await supabase.from("chat_threads").select("*").eq("id", requestedThreadId).maybeSingle();
      if (threadError) throw threadError;
      if (!data) throw new Error("This consultation thread could not be found.");
      return data as ThreadRow;
    }
    if (!requestedLawyer) throw new Error("No lawyer consultation was selected.");

    const first = await supabase.from("chat_threads").select("*").eq("participant_a", currentUserId).eq("participant_b", requestedLawyer.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (first.error) throw first.error;
    if (first.data) return first.data as ThreadRow;

    const reverse = await supabase.from("chat_threads").select("*").eq("participant_a", requestedLawyer.id).eq("participant_b", currentUserId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (reverse.error) throw reverse.error;
    if (reverse.data) return reverse.data as ThreadRow;

    const { data, error: createError } = await supabase.from("chat_threads").insert({
      participant_a: currentUserId,
      participant_b: requestedLawyer.id,
      participant_a_name: user?.fullName || user?.primaryEmailAddress?.emailAddress || "OkzByte user",
      participant_b_name: requestedLawyer.name,
      subject: `Property legal consultation · ${requestedLawyer.name}`,
      context: { lawyer_id: requestedLawyer.id, source: requestedLawyer.source, kind: "property_lawyer_consultation" },
      status: "open",
    }).select("*").single();
    if (createError) throw createError;
    const created = data as ThreadRow;
    const { error: welcomeError } = await supabase.from("chat_messages").insert({
      thread_id: created.id,
      sender_id: currentUserId,
      body: `Hello Advocate ${requestedLawyer.name}, I am reaching out regarding a legal consultation for property verification/drafting.`,
      message_type: "system_welcome",
    });
    if (welcomeError) throw welcomeError;
    return created;
  };

  useEffect(() => {
    if (!isSupabaseReady || !currentUserId) return;
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const currentThread = await findOrCreateThread();
        if (!active) return;
        setThread(currentThread);
        if (!requestedThreadId) setLocation(`/inbox?thread_id=${encodeURIComponent(currentThread.id)}`, { replace: true });
        const { data, error: messageError } = await supabase.from("chat_messages").select("*").eq("thread_id", currentThread.id).order("created_at", { ascending: true });
        if (messageError) throw messageError;
        if (active) setMessages(((data ?? []) as ChatRow[]).map(row => ({ ...row, mine: row.sender_id === currentUserId })));
        const channelName = `real-chat-${currentThread.id}-${crypto.randomUUID()}`;
        channel = supabase.channel(channelName).on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${currentThread.id}` }, payload => {
          if (payload.new && typeof payload.new === "object") appendMessage(payload.new as ChatRow);
        });
        channel.subscribe((status, statusError) => {
          if (status === "CHANNEL_ERROR" && active) setError(statusError?.message || "Realtime consultation updates could not be started.");
        });
      } catch (loadError) {
        if (active) setError(errorText(loadError));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [currentUserId, isSupabaseReady, requestedLawyerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendText = async () => {
    const body = text.trim();
    if (!body || !thread || !currentUserId || sending) return;
    setSending(true);
    try {
      const { data, error: sendError } = await supabase.from("chat_messages").insert({ thread_id: thread.id, sender_id: currentUserId, body, message_type: "user" }).select("*").single();
      if (sendError) throw sendError;
      appendMessage(data as ChatRow);
      setText("");
    } catch (sendError) {
      toast.error(errorText(sendError));
    } finally {
      setSending(false);
    }
  };

  const uploadAttachment = async (file: File) => {
    if (!thread || !currentUserId) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Attachments must be 10MB or smaller."); return; }
    setSending(true);
    try {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const path = `${thread.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("chat-attachments").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data, error: messageError } = await supabase.from("chat_messages").insert({ thread_id: thread.id, sender_id: currentUserId, body: `Attachment: ${file.name}\nstorage://chat-attachments/${path}`, message_type: "attachment" }).select("*").single();
      if (messageError) throw messageError;
      appendMessage(data as ChatRow);
      setAttachmentMenu(false);
    } catch (uploadError) {
      toast.error(errorText(uploadError));
    } finally {
      setSending(false);
    }
  };

  if (!isSupabaseReady || loading) return <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: BG, color: MUTED, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Opening secure consultation…</main>;
  if (error) return <main style={{ minHeight: "100dvh", background: BG, color: "#f5f5f5", padding: 20, fontFamily: "'Plus Jakarta Sans',sans-serif" }}><button onClick={() => setLocation("/services/lawyers")} style={{ background: "transparent", border: 0, color: GOLD, padding: 0, fontSize: 14 }}>← Back to lawyers</button><div style={{ maxWidth: 560, margin: "26vh auto 0", textAlign: "center", padding: 22, border: `1px solid ${BORDER}`, borderRadius: 18, background: CARD }}><MessageCircle size={40} color={GOLD} /><h1 style={{ fontSize: 22, margin: "14px 0 8px" }}>Live chat is not connected yet</h1><p style={{ color: MUTED, lineHeight: 1.65, fontSize: 13, margin: 0 }}>{error}</p><p style={{ color: MUTED, lineHeight: 1.65, fontSize: 12, margin: "12px 0 0" }}>The app did not create a fake conversation. The secure database session is active, but realtime updates are currently unavailable. You can retry the consultation after Realtime is enabled for the chat tables.</p></div></main>;

  return <main style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column", background: BG, color: "#f5f5f5", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
    <header style={{ flexShrink: 0, background: "rgba(4,11,20,.98)", borderBottom: `1px solid ${GOLD}38`, padding: "10px 14px", paddingTop: "calc(10px + env(safe-area-inset-top))", display: "flex", alignItems: "center", gap: 10, zIndex: 10 }}>
      <button onClick={() => setLocation("/inbox")} aria-label="Back to Inbox" style={{ width: 36, height: 36, border: 0, background: "transparent", color: "#fff", display: "grid", placeItems: "center" }}><ArrowLeft size={22} /></button>
      <div style={{ position: "relative", flexShrink: 0 }}>{avatar ? <img src={avatar} alt={contactName} style={{ width: 42, height: 42, objectFit: "cover", objectPosition: "top", borderRadius: "50%", border: `2px solid ${GOLD}66` }} /> : <div style={{ width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", background: `${GOLD}1c`, border: `2px solid ${GOLD}66`, color: GOLD, fontWeight: 900 }}>{initials(contactName)}</div>}<span style={{ position: "absolute", right: -1, bottom: 1, width: 11, height: 11, borderRadius: "50%", background: GREEN, border: `2px solid ${BG}` }} /></div>
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 15, fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contactName}</div><div style={{ color: GREEN, fontSize: 11, marginTop: 2 }}>● Online · {contactOffice}</div></div>
      <button aria-label="Voice call" onClick={() => toast.info("Voice calling will be enabled after counsel account onboarding.")} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${GREEN}55`, background: `${GREEN}16`, color: GREEN, display: "grid", placeItems: "center" }}><Phone size={16} /></button>
      <button aria-label="Video call" onClick={() => toast.info("Video calling will be enabled after counsel account onboarding.")} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${BLUE}55`, background: `${BLUE}16`, color: BLUE, display: "grid", placeItems: "center" }}><Video size={16} /></button>
      <button aria-label="More options" onClick={() => toast.info("Conversation options are coming with counsel onboarding.")} style={{ width: 30, height: 36, border: 0, background: "transparent", color: MUTED, display: "grid", placeItems: "center" }}><MoreVertical size={18} /></button>
    </header>

    <section style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "14px 12px 18px", background: "radial-gradient(circle at 15% 20%,rgba(201,168,76,.04),transparent 48%),radial-gradient(circle at 85% 80%,rgba(59,130,246,.04),transparent 48%)" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ alignSelf: "center", color: MUTED, fontSize: 10, padding: "4px 10px", border: `1px solid ${BORDER}`, borderRadius: 20, background: CARD }}>Today · secure consultation</div>
        {messages.map(message => <motion.div key={message.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ alignSelf: message.mine ? "flex-end" : "flex-start", maxWidth: "82%" }}>
          <div style={{ padding: "10px 13px", borderRadius: message.mine ? "17px 17px 4px 17px" : "17px 17px 17px 4px", background: message.mine ? "linear-gradient(135deg,#c9a84c,#a07830)" : "#0d1a2e", border: message.mine ? 0 : `1px solid ${BORDER}`, boxShadow: message.mine ? "0 2px 12px rgba(201,168,76,.18)" : "none" }}>
            {message.message_type === "attachment" ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FileText size={18} color={message.mine ? BG : BLUE} /><span style={{ whiteSpace: "pre-wrap", fontSize: 13, color: message.mine ? BG : "#eaecef" }}>{message.body}</span></div> : <span style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.5, color: message.mine ? BG : "#eaecef", fontWeight: message.mine ? 600 : 400 }}>{message.body}</span>}
          </div>
          <div style={{ display: "flex", justifyContent: message.mine ? "flex-end" : "flex-start", alignItems: "center", gap: 3, marginTop: 3, padding: "0 4px", color: MUTED, fontSize: 10 }}>{timeLabel(message.created_at)}{message.mine && (message.message_type === "system_welcome" ? <Check size={11} /> : <CheckCheck size={11} color={GREEN} />)}</div>
        </motion.div>)}
        <div ref={bottomRef} />
      </div>
    </section>

    <footer style={{ flexShrink: 0, padding: "9px 12px calc(9px + env(safe-area-inset-bottom))", background: "rgba(4,11,20,.98)", borderTop: `1px solid ${GOLD}35`, zIndex: 20 }}>
      <div style={{ maxWidth: 620, margin: "0 auto", position: "relative" }}>
        <AnimatePresence>{attachmentMenu && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} style={{ position: "absolute", bottom: 62, left: 0, right: 0, padding: 12, borderRadius: 16, border: `1px solid ${BORDER}`, background: "#0d1a2e", boxShadow: "0 -10px 30px rgba(0,0,0,.45)", display: "flex", gap: 8 }}><button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${BLUE}44`, background: `${BLUE}14`, color: BLUE, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, fontWeight: 800 }}><Paperclip size={16} /> File</button><button onClick={() => fileInputRef.current?.click()} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${GREEN}44`, background: `${GREEN}14`, color: GREEN, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, fontWeight: 800 }}><ImageIcon size={16} /> Image</button><button onClick={() => setAttachmentMenu(false)} aria-label="Close attachments" style={{ width: 38, border: 0, background: "transparent", color: MUTED }}><X size={18} /></button></motion.div>}</AnimatePresence>
        <input ref={fileInputRef} type="file" hidden accept="image/*,.pdf,.doc,.docx" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadAttachment(file); event.currentTarget.value = ""; }} />
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 8px 7px 16px", borderRadius: 28, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.06)" }}><input value={text} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendText(); } }} placeholder="Message" style={{ minWidth: 0, flex: 1, background: "transparent", border: 0, outline: 0, color: "#fff", fontSize: 14, fontFamily: "inherit" }} /><button aria-label="Emoji" onClick={() => setText(value => `${value} `)} style={{ width: 30, height: 30, border: 0, background: "transparent", color: MUTED, display: "grid", placeItems: "center" }}><Smile size={20} /></button><button aria-label="Attachments" onClick={() => setAttachmentMenu(value => !value)} style={{ width: 30, height: 30, border: 0, background: "transparent", color: attachmentMenu ? GOLD : MUTED, display: "grid", placeItems: "center" }}><Paperclip size={19} /></button>{text.trim() ? <button aria-label="Send message" disabled={sending} onClick={() => void sendText()} style={{ width: 36, height: 36, borderRadius: "50%", border: 0, background: GOLD, color: BG, display: "grid", placeItems: "center" }}><Send size={16} /></button> : <button aria-label="Voice message" onClick={() => toast.info("Voice messages require browser microphone permission and counsel onboarding.")} style={{ width: 36, height: 36, borderRadius: "50%", border: 0, background: GOLD, color: BG, display: "grid", placeItems: "center" }}><Mic size={17} /></button>}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 7, paddingTop: 7, color: MUTED, fontSize: 10 }}><CheckCheck size={13} color={GREEN} /> Messages are stored securely in the consultation thread.</div>
      </div>
    </footer>
  </main>;
}

export function InboxRoute() {
  const [location] = useLocation();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const hasConsultation = search.includes("thread_id=") || search.includes("lawyer_id=") || location.includes("thread_id=") || location.includes("lawyer_id=");
  return hasConsultation ? <RealChatRoom /> : <Inbox />;
}

export { Camera, MapPin };
