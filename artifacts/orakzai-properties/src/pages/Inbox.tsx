import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Check, CheckCheck, Edit, Filter,
  MessageCircle,
} from "lucide-react";

/* ── Theme ─────────────────────────────────────────────── */
const BG        = "#040b14";
const CARD_BG   = "#070f1c";
const GOLD      = "#C9A84C";
const BORDER    = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(201,168,76,0.22)";
const basePath  = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

/* ── Mock Data ──────────────────────────────────────────── */
export interface ChatMeta {
  id: string;
  name: string;
  subtitle: string;           // property / role label
  avatar: string;
  avatarColor: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  category: "buyer" | "agent" | "service";
  verified: boolean;
}

export const CHATS: ChatMeta[] = [
  {
    id: "1", name: "Faisal Orakzai", subtitle: "3.75 Marla House – Islamabad",
    avatar: "FO", avatarColor: "#C9A84C",
    lastMsg: "Is the property still available? I'd like to schedule a visit.",
    time: "9:15 AM", unread: 3, online: true, category: "buyer", verified: true,
  },
  {
    id: "2", name: "Usman Malik", subtitle: "DHA Phase 6 – 1 Kanal Bungalow",
    avatar: "UM", avatarColor: "#10b981",
    lastMsg: "I can arrange a viewing this Saturday. Let me know.",
    time: "Yesterday", unread: 0, online: false, category: "agent", verified: true,
  },
  {
    id: "3", name: "Sara Ahmed", subtitle: "Bahria Town – 5 Marla Plot",
    avatar: "SA", avatarColor: "#a78bfa",
    lastMsg: "The token has been transferred. Please check your wallet.",
    time: "Yesterday", unread: 1, online: true, category: "buyer", verified: false,
  },
  {
    id: "4", name: "Pak Realty Group", subtitle: "Commercial Office – Gulberg",
    avatar: "PR", avatarColor: "#3b82f6",
    lastMsg: "Our team will send you the documents by tomorrow.",
    time: "Mon", unread: 0, online: false, category: "agent", verified: true,
  },
  {
    id: "5", name: "BuildPro Services", subtitle: "Grey Structure – DHA Phase 8",
    avatar: "BP", avatarColor: "#f97316",
    lastMsg: "Construction update: 70% complete. Photos attached.",
    time: "Mon", unread: 2, online: true, category: "service", verified: false,
  },
  {
    id: "6", name: "Ahmed Raza", subtitle: "Dubai Marina – 3 Bed Apt",
    avatar: "AR", avatarColor: "#ec4899",
    lastMsg: "Price is negotiable. Can we discuss on a call?",
    time: "Sun", unread: 0, online: false, category: "buyer", verified: false,
  },
  {
    id: "7", name: "Orakzai Properties", subtitle: "Agent Coordinator",
    avatar: "OP", avatarColor: GOLD,
    lastMsg: "Your property listing has been approved. ✅",
    time: "Sat", unread: 0, online: true, category: "agent", verified: true,
  },
];

const FILTERS = ["All", "Unread", "Buyers", "Agents", "Services"] as const;
type Filter = typeof FILTERS[number];

function matchesFilter(chat: ChatMeta, filter: Filter): boolean {
  if (filter === "All") return true;
  if (filter === "Unread") return chat.unread > 0;
  if (filter === "Buyers")   return chat.category === "buyer";
  if (filter === "Agents")   return chat.category === "agent";
  if (filter === "Services") return chat.category === "service";
  return true;
}

export default function Inbox() {
  const [, setLocation] = useLocation();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<Filter>("All");

  const filtered = CHATS.filter(c =>
    matchesFilter(c, filter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
     c.subtitle.toLowerCase().includes(search.toLowerCase()) ||
     c.lastMsg.toLowerCase().includes(search.toLowerCase()))
  );

  const totalUnread = CHATS.reduce((s, c) => s + c.unread, 0);

  return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(4,11,20,0.96)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${BORDER_GOLD}` }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 20px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <MessageCircle size={22} color={GOLD} />
              <span style={{ fontSize: 20, fontWeight: 900, color: "#F5F5F5" }}>Chats</span>
              {totalUnread > 0 && (
                <span style={{ background: GOLD, color: "#040b14", fontSize: 11, fontWeight: 800, borderRadius: 20, padding: "1px 7px" }}>
                  {totalUnread}
                </span>
              )}
            </div>
            <motion.button whileTap={{ scale: 0.9 }}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(201,168,76,0.1)", border: `1px solid ${BORDER_GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Edit size={15} color={GOLD} />
            </motion.button>
          </div>

          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "0 14px", height: 42, marginBottom: 12 }}>
            <Search size={15} color="#8B93A7" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search chats, names, properties…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#F5F5F5", fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            />
            {search && (
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <X size={13} color="#8B93A7" />
              </motion.button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" as const }}>
            {FILTERS.map(f => {
              const active = filter === f;
              return (
                <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)}
                  style={{ flexShrink: 0, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer",
                    background: active ? GOLD : "rgba(255,255,255,0.05)",
                    border: active ? "none" : `1px solid ${BORDER}`,
                    color: active ? "#040b14" : "#8B93A7",
                    boxShadow: active ? `0 2px 10px rgba(201,168,76,0.3)` : "none",
                  }}>
                  {f}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Chat List ── */}
      <div style={{ flex: 1, overflowY: "auto", maxWidth: 600, margin: "0 auto", width: "100%", paddingBottom: 90 }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 12 }}>
              <MessageCircle size={48} color="rgba(201,168,76,0.25)" />
              <span style={{ color: "#8B93A7", fontSize: 14 }}>No chats found</span>
            </motion.div>
          ) : filtered.map((chat, i) => (
            <motion.div key={chat.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.985, backgroundColor: "rgba(201,168,76,0.04)" }}
              onClick={() => setLocation(`${basePath}/inbox/${chat.id}`)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer",
                background: chat.unread > 0 ? "rgba(201,168,76,0.02)" : "transparent" }}>

              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: `${chat.avatarColor}22`, border: `2px solid ${chat.avatarColor}55`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: chat.avatarColor }}>
                  {chat.avatar}
                </div>
                {chat.online && (
                  <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: "#10b981", border: "2px solid #040b14" }} />
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 14, fontWeight: chat.unread > 0 ? 800 : 600, color: "#F5F5F5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {chat.name}
                    </span>
                    {chat.verified && (
                      <span style={{ fontSize: 9, background: "rgba(201,168,76,0.15)", color: GOLD, borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>✓ Verified</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: chat.unread > 0 ? GOLD : "#8B93A7", fontWeight: chat.unread > 0 ? 700 : 400, flexShrink: 0, marginLeft: 6 }}>
                    {chat.time}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#8B93A7", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  🏠 {chat.subtitle}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
                    {chat.unread === 0 && <CheckCheck size={13} color="#10b981" style={{ flexShrink: 0 }} />}
                    <span style={{ fontSize: 13, color: chat.unread > 0 ? "#EAECEF" : "#8B93A7", fontWeight: chat.unread > 0 ? 600 : 400,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      {chat.lastMsg}
                    </span>
                  </div>
                  {chat.unread > 0 && (
                    <span style={{ flexShrink: 0, marginLeft: 8, minWidth: 20, height: 20, borderRadius: 20, background: GOLD,
                      color: "#040b14", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
