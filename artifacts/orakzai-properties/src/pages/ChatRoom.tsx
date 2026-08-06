import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Phone, Video, MoreVertical, Send, Mic,
  MapPin, Building2, FileText, Image, X,
  Check, CheckCheck, Smile, MicOff, PhoneOff,
  Camera, Paperclip,
} from "lucide-react";
import { CHATS, type ChatMeta } from "./Inbox";

/* ── Theme ─────────────────────────────────────────────── */
const BG        = "#040b14";
const CARD_BG   = "#070f1c";
const BUBBLE_ME = "linear-gradient(135deg,#C9A84C,#a07830)";
const BUBBLE_THEM = "#0d1a2e";
const GOLD      = "#C9A84C";
const BORDER    = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(201,168,76,0.22)";

/* ── Types ──────────────────────────────────────────────── */
type MsgType = "text" | "property" | "location" | "voice";
interface Msg {
  id: string; from: "me" | "them"; type: MsgType;
  text?: string; time: string; status: "sent" | "delivered" | "read";
  property?: { title: string; price: string; location: string; img: string };
  location?: { label: string; coords: string };
  voice?: { duration: string; waveform: number[] };
}

/* ── Initial mock messages ─────────────────────────────── */
function buildMsgs(chat: ChatMeta): Msg[] {
  return [
    {
      id: "1", from: "them", type: "text",
      text: `Hi! I'm interested in the property you listed.`,
      time: "9:00 AM", status: "read",
    },
    {
      id: "2", from: "me", type: "property",
      time: "9:02 AM", status: "read",
      property: { title: chat.subtitle, price: "Rs 1.40 Cr", location: "Bani Gala, Islamabad", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&q=80" },
    },
    {
      id: "3", from: "me", type: "text",
      text: "Here's the listing! Let me know if you have any questions.",
      time: "9:02 AM", status: "read",
    },
    {
      id: "4", from: "them", type: "text",
      text: chat.lastMsg,
      time: chat.time, status: "read",
    },
    {
      id: "5", from: "them", type: "location",
      time: chat.time, status: "read",
      location: { label: "Proposed meeting point", coords: "33.7294° N, 72.8553° E" },
    },
    {
      id: "6", from: "me", type: "voice",
      time: "9:10 AM", status: "read",
      voice: { duration: "0:24", waveform: [3,5,8,12,7,4,9,14,10,6,3,7,11,8,5,4,9,13,7,4,3,6,10,8] },
    },
    {
      id: "7", from: "them", type: "text",
      text: "Great! I'll be there at 11 AM. Can you confirm?",
      time: "9:15 AM", status: "read",
    },
  ];
}

/* ── Waveform bar ──────────────────────────────────────── */
function Waveform({ bars, fromMe }: { bars: number[]; fromMe: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 28 }}>
      {bars.map((h, i) => (
        <motion.div key={i}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.015, type: "spring", stiffness: 300 }}
          style={{ width: 3, height: Math.max(4, h * 2), borderRadius: 2,
            background: fromMe ? "rgba(255,255,255,0.7)" : GOLD,
          }} />
      ))}
    </div>
  );
}

/* ── Call Screen Overlay ────────────────────────────────── */
function CallOverlay({ type, contact, onEnd }: { type: "voice"|"video"; contact: ChatMeta; onEnd: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setConnected(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9999,
        background: type === "video" ? "#000" : "linear-gradient(180deg,#0d1a2e 0%,#040b14 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between",
        padding: "60px 0 60px", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

      <div style={{ textAlign: "center" }}>
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}
          style={{ width: 90, height: 90, borderRadius: "50%", background: `${contact.avatarColor}22`,
            border: `3px solid ${contact.avatarColor}66`, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 26, fontWeight: 900, color: contact.avatarColor, margin: "0 auto 16px" }}>
          {contact.avatar}
        </motion.div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#F5F5F5", marginBottom: 6 }}>{contact.name}</div>
        <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
          style={{ fontSize: 14, color: "#8B93A7" }}>
          {connected
            ? (type === "voice" ? `🔊 ${fmt(elapsed)}` : `📹 ${fmt(elapsed)}`)
            : (type === "voice" ? "Calling…" : "Starting video…")}
        </motion.div>
      </div>

      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        {type === "video" && (
          <motion.button whileTap={{ scale: 0.9 }}
            style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.12)",
              border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <MicOff size={22} color="#fff" />
          </motion.button>
        )}
        <motion.button whileTap={{ scale: 0.9 }} onClick={onEnd}
          style={{ width: 68, height: 68, borderRadius: "50%", background: "#ef4444", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(239,68,68,0.5)" }}>
          <PhoneOff size={28} color="#fff" />
        </motion.button>
        {type === "voice" && (
          <motion.button whileTap={{ scale: 0.9 }}
            style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.12)",
              border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Smile size={22} color="#fff" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Attachment Menu options ────────────────────────────── */
const ATTACH_OPTS = [
  { icon: MapPin,    label: "Live Location",    color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  { icon: Building2, label: "Property Listing", color: GOLD,      bg: "rgba(201,168,76,0.15)" },
  { icon: FileText,  label: "Document / File",  color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  { icon: Image,     label: "Gallery Image",    color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
];

/* ── Approximate dock height used for scroll padding ─────── */
const DOCK_HEIGHT = 118;

/* ════════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════════ */
export default function ChatRoom() {
  const params  = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const chat = CHATS.find(c => c.id === params.id) ?? CHATS[0];

  const [msgs, setMsgs]           = useState<Msg[]>(() => buildMsgs(chat));
  const [text, setText]           = useState("");
  const [showAttach, setShowAttach] = useState(false);
  const [recording, setRecording] = useState(false);
  const [call, setCall]           = useState<"voice"|"video"|null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const recTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recSecs, setRecSecs]     = useState(0);

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  /* Keep latest message visible when the software keyboard opens */
  useEffect(() => {
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;
    const onResize = () => bottomRef.current?.scrollIntoView({ behavior: "instant" } as any);
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  /* ── Send ─────────────────────────────────────────────── */
  const send = (type: MsgType = "text", extra?: Partial<Msg>) => {
    if (type === "text" && !text.trim()) return;
    const newMsg: Msg = {
      id: Date.now().toString(), from: "me", type,
      time: new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }),
      status: "sent", text: type === "text" ? text : undefined, ...extra,
    };
    setMsgs(m => [...m, newMsg]);
    setText("");
    setShowAttach(false);
    setTimeout(() => setMsgs(m => m.map(x => x.id === newMsg.id ? { ...x, status: "delivered" } : x)), 800);
    setTimeout(() => {
      setMsgs(m => m.map(x => x.id === newMsg.id ? { ...x, status: "read" } : x));
      setMsgs(m => [...m, {
        id: (Date.now()+1).toString(), from: "them", type: "text",
        text: "Thanks for reaching out! I'll get back to you shortly.",
        time: new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }),
        status: "read",
      }]);
    }, 2000);
  };

  /* ── Voice record ─────────────────────────────────────── */
  const startRecord = () => {
    setRecording(true); setRecSecs(0);
    recTimer.current = setInterval(() => setRecSecs(s => s + 1), 1000);
  };
  const stopRecord = () => {
    if (recTimer.current) clearInterval(recTimer.current);
    setRecording(false);
    const wf = Array.from({ length: 24 }, () => Math.floor(Math.random() * 12) + 3);
    send("voice", { voice: { duration: `0:${String(recSecs).padStart(2,"0")}`, waveform: wf } });
    setRecSecs(0);
  };

  /* ── Attachment shortcuts ─────────────────────────────── */
  const sendAttach = (label: string) => {
    if (label === "Live Location") {
      send("location", { location: { label: "My current location", coords: "33.7294° N, 72.8553° E" } });
    } else if (label === "Property Listing") {
      send("property", { property: { title: chat.subtitle, price: "Rs 1.40 Cr", location: "Bani Gala, Islamabad", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=300&q=80" } });
    } else {
      send("text", { text: `📎 ${label} shared` });
    }
  };

  const isSendable = text.trim().length > 0;

  return (
    /*
     * Full-screen flex column — takes exactly the viewport height.
     * The bottom nav is suppressed by App.tsx when on /inbox/:id.
     */
    <div style={{
      height: "100dvh",
      background: BG,
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      overflow: "hidden",
      position: "relative",
    }}>

      {/* ── Call overlay ────────────────────────────────────── */}
      <AnimatePresence>
        {call && <CallOverlay type={call} contact={chat} onEnd={() => setCall(null)} />}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════
          HEADER
          ════════════════════════════════════════════════════ */}
      <div style={{
        flexShrink: 0,
        zIndex: 50,
        background: "rgba(4,11,20,0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${BORDER_GOLD}`,
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>

          {/* Back arrow — navigates to /inbox and restores bottom nav */}
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => setLocation("/inbox")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <ArrowLeft size={20} color="#F5F5F5" />
          </motion.button>

          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${chat.avatarColor}22`,
              border: `2px solid ${chat.avatarColor}55`, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 13, fontWeight: 800, color: chat.avatarColor }}>
              {chat.avatar}
            </div>
            {chat.online && (
              <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10,
                borderRadius: "50%", background: "#10b981", border: "2px solid #040b14" }} />
            )}
          </div>

          {/* Name / status */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#F5F5F5", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{chat.name}</div>
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              style={{ fontSize: 11, color: chat.online ? "#10b981" : "#8B93A7" }}>
              {chat.online ? "● Online" : "Last seen recently"}
            </motion.div>
          </div>

          {/* Call buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCall("voice")}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer" }}>
              <Phone size={15} color="#10b981" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setCall("video")}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer" }}>
              <Video size={15} color="#3b82f6" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)",
                border: `1px solid ${BORDER}`, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer" }}>
              <MoreVertical size={15} color="#8B93A7" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          MESSAGE LIST — flex-1, scrolls independently
          ════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "12px 0",
        /* Extra bottom padding so the last bubble clears the dock */
        paddingBottom: showAttach ? DOCK_HEIGHT + 168 : DOCK_HEIGHT + 16,
        backgroundImage: [
          "radial-gradient(circle at 20% 20%, rgba(201,168,76,0.03) 0%, transparent 60%)",
          "radial-gradient(circle at 80% 80%, rgba(59,130,246,0.03) 0%, transparent 60%)",
        ].join(","),
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 14px", display: "flex", flexDirection: "column", gap: 8 }}>

          {/* Date divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 8px" }}>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
            <span style={{ fontSize: 11, color: "#8B93A7", padding: "3px 10px",
              background: CARD_BG, borderRadius: 20, border: `1px solid ${BORDER}` }}>Today</span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>

          {msgs.map(msg => {
            const isMe = msg.from === "me";
            return (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>

                {msg.type === "text" && (
                  <div style={{ maxWidth: "75%", padding: "10px 14px",
                    borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: isMe ? BUBBLE_ME : BUBBLE_THEM,
                    border: isMe ? "none" : `1px solid ${BORDER}`,
                    boxShadow: isMe ? "0 2px 12px rgba(201,168,76,0.2)" : "none" }}>
                    <p style={{ margin: 0, color: isMe ? "#040b14" : "#EAECEF",
                      fontSize: 14, lineHeight: 1.5, fontWeight: isMe ? 600 : 400 }}>{msg.text}</p>
                  </div>
                )}

                {msg.type === "property" && msg.property && (
                  <div style={{ maxWidth: "78%", borderRadius: 16, overflow: "hidden",
                    border: `1px solid ${BORDER_GOLD}`, boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
                    <img src={msg.property.img} alt="" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                    <div style={{ background: CARD_BG, padding: "10px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#F5F5F5", marginBottom: 3 }}>{msg.property.title}</div>
                      <div style={{ fontSize: 11, color: "#8B93A7", marginBottom: 4 }}>📍 {msg.property.location}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: GOLD }}>{msg.property.price}</div>
                    </div>
                  </div>
                )}

                {msg.type === "location" && msg.location && (
                  <div style={{ maxWidth: "72%", borderRadius: 16, overflow: "hidden",
                    border: `1px solid rgba(16,185,129,0.3)`, background: "rgba(16,185,129,0.05)" }}>
                    <div style={{ height: 80, background: "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(59,130,246,0.1))",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <MapPin size={24} color="#10b981" />
                      <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>Location Shared</span>
                    </div>
                    <div style={{ padding: "8px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#EAECEF", marginBottom: 2 }}>{msg.location.label}</div>
                      <div style={{ fontSize: 10, color: "#8B93A7" }}>{msg.location.coords}</div>
                    </div>
                  </div>
                )}

                {msg.type === "voice" && msg.voice && (
                  <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: 18,
                    background: isMe ? BUBBLE_ME : BUBBLE_THEM,
                    border: isMe ? "none" : `1px solid ${BORDER}`,
                    display: "flex", alignItems: "center", gap: 10 }}>
                    <motion.button whileTap={{ scale: 0.9 }}
                      style={{ width: 34, height: 34, borderRadius: "50%",
                        background: isMe ? "rgba(0,0,0,0.2)" : "rgba(201,168,76,0.2)",
                        border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", flexShrink: 0 }}>
                      <Mic size={14} color={isMe ? "#040b14" : GOLD} />
                    </motion.button>
                    <Waveform bars={msg.voice.waveform} fromMe={isMe} />
                    <span style={{ fontSize: 11, color: isMe ? "rgba(4,11,20,0.7)" : "#8B93A7", flexShrink: 0 }}>
                      {msg.voice.duration}
                    </span>
                  </div>
                )}

                {/* Timestamp + tick */}
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3,
                  paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}>
                  <span style={{ fontSize: 10, color: "#8B93A7" }}>{msg.time}</span>
                  {isMe && msg.status === "sent"      && <Check size={11} color="#8B93A7" />}
                  {isMe && msg.status === "delivered" && <CheckCheck size={11} color="#8B93A7" />}
                  {isMe && msg.status === "read"      && <CheckCheck size={11} color="#10b981" />}
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Attachment picker — slides up above the dock ─────── */}
      <AnimatePresence>
        {showAttach && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: "absolute",
              bottom: DOCK_HEIGHT + 8,
              left: 0, right: 0,
              zIndex: 200,
              maxWidth: 600,
              margin: "0 auto",
              padding: "0 16px",
            }}
          >
            <div style={{
              background: "#0d1a2e",
              border: `1px solid ${BORDER_GOLD}`,
              borderRadius: 20,
              padding: "16px 20px",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}>
              {ATTACH_OPTS.map(opt => (
                <motion.button key={opt.label} whileTap={{ scale: 0.95 }} onClick={() => sendAttach(opt.label)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                    borderRadius: 14, background: opt.bg, border: `1px solid ${opt.color}33`, cursor: "pointer" }}>
                  <opt.icon size={18} color={opt.color} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: opt.color }}>{opt.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════
          WHATSAPP-STYLE INPUT DOCK  (pinned to bottom)
          ┌──────────────────────────────────────────────────┐
          │  ( ○  Message                                  ) │
          │  [My reply]      😊   📎   📷      ⬤ mic/send │
          └──────────────────────────────────────────────────┘
          ════════════════════════════════════════════════════ */}
      <div style={{
        flexShrink: 0,
        background: "rgba(4,11,20,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: `1px solid ${BORDER_GOLD}`,
        /* Respect iPhone home-bar area */
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "10px 14px 8px", display: "flex", flexDirection: "column", gap: 8 }}>

          {/* ── Row 1: pill text input / recording indicator ───── */}
          {recording ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ height: 48, borderRadius: 28, background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center",
                gap: 10, padding: "0 16px" }}>
              <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>
                Recording… {recSecs}s
              </span>
            </motion.div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center",
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${BORDER}`,
              borderRadius: 28,
              padding: "0 16px",
              height: 48,
            }}>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message"
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  color: "#F5F5F5", fontSize: 14,
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                }}
              />
            </div>
          )}

          {/* ── Row 2: quick-chip | spacer | icons | circular btn ─ */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>

            {/* Quick-reply chip */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setText("My reply")}
              style={{
                flexShrink: 0,
                padding: "5px 14px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${BORDER}`,
                color: "#8B93A7",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                whiteSpace: "nowrap" as const,
              }}
            >
              My reply
            </motion.button>

            {/* Push icons to the right */}
            <div style={{ flex: 1 }} />

            {/* 😊 Emoji */}
            <motion.button whileTap={{ scale: 0.9 }}
              style={{ width: 38, height: 38, borderRadius: "50%", background: "none", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Smile size={22} color="#8B93A7" />
            </motion.button>

            {/* 📎 Attachment */}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAttach(v => !v)}
              style={{ width: 38, height: 38, borderRadius: "50%",
                background: showAttach ? `${GOLD}22` : "none", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                transition: "background 0.2s" }}>
              <AnimatePresence mode="wait">
                {showAttach
                  ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                      <X size={20} color={GOLD} />
                    </motion.div>
                  : <motion.div key="clip" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                      <Paperclip size={20} color="#8B93A7" />
                    </motion.div>
                }
              </AnimatePresence>
            </motion.button>

            {/* 📷 Camera */}
            <motion.button whileTap={{ scale: 0.9 }}
              style={{ width: 38, height: 38, borderRadius: "50%", background: "none", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Camera size={20} color="#8B93A7" />
            </motion.button>

            {/* ⬤ Mic → Send (circular, gold) */}
            <AnimatePresence mode="wait">
              {isSendable ? (
                <motion.button
                  key="send"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => send()}
                  style={{
                    width: 50, height: 50, borderRadius: "50%",
                    background: `linear-gradient(135deg,${GOLD},#a07830)`,
                    border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0,
                    boxShadow: `0 4px 18px rgba(201,168,76,0.5)`,
                  }}
                >
                  <Send size={20} color="#040b14" />
                </motion.button>
              ) : (
                <motion.button
                  key="mic"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  onMouseDown={startRecord}
                  onMouseUp={stopRecord}
                  onTouchStart={startRecord}
                  onTouchEnd={stopRecord}
                  whileTap={{ scale: 0.88 }}
                  style={{
                    width: 50, height: 50, borderRadius: "50%",
                    background: recording
                      ? "#ef4444"
                      : `linear-gradient(135deg,${GOLD},#a07830)`,
                    border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0,
                    boxShadow: recording
                      ? "0 4px 18px rgba(239,68,68,0.5)"
                      : `0 4px 18px rgba(201,168,76,0.4)`,
                    transition: "background 0.2s, box-shadow 0.2s",
                  }}
                >
                  <Mic size={20} color="#040b14" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
