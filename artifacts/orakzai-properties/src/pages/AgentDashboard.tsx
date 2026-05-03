import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Building2, Users, Eye, TrendingUp, Plus,
  Edit3, Trash2, CheckSquare, Clock, Shield, ChevronRight,
  Phone, MessageCircle, MapPin, Settings, Layers, Star,
  Briefcase, Award, X, Save, BadgeCheck, Flame, Snowflake,
  Thermometer, ChevronDown, Send, PhoneCall, MessageSquare,
  WholeWord, LayoutGrid, List, Bell, BellOff, ArrowRight,
  CheckCircle2, Calendar, Handshake, TrendingDown, Filter,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Show, useUser } from "@clerk/react";
import {
  useGetAgentDashboard,
  getGetAgentDashboardQueryKey,
  useUpdateAgentProfile,
  getGetAgentProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteProperty, useUpdateProperty } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function fmtPKR(n: number): string {
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000)    return `PKR ${(n / 100_000).toFixed(1)}L`;
  return `PKR ${n.toLocaleString()}`;
}

const STATUS_CFG = {
  live:    { label: "Live",    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  pending: { label: "Pending", color: "text-amber-400 bg-amber-500/10 border-amber-500/30"       },
  sold:    { label: "Sold",    color: "text-[#4a6080] bg-white/5 border-white/10"                },
};

/* ── Pipeline stage config ── */
const PIPELINE_STAGES = [
  { id: "new",              label: "New Inquiry",          short: "New",        color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"    },
  { id: "contacted",        label: "Contacted",            short: "Contacted",  color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"  },
  { id: "visit_scheduled",  label: "Visit Scheduled",      short: "Visit",      color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/20" },
  { id: "negotiation",      label: "Negotiation",          short: "Negotiation",color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
  { id: "closed",           label: "Closed / Sold",        short: "Closed",     color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20"},
] as const;

/* ── Lead score config ── */
const SCORE_CFG = {
  hot:  { label: "Hot",  icon: Flame,       color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20"    },
  warm: { label: "Warm", icon: Thermometer, color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
  cold: { label: "Cold", icon: Snowflake,   color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"     },
};

const SIDEBAR_ITEMS = [
  { id: "inventory", label: "Inventory",   icon: Layers   },
  { id: "leads",     label: "Leads",       icon: Users    },
  { id: "analytics", label: "Analytics",   icon: BarChart3 },
  { id: "profile",   label: "My Profile",  icon: Settings },
] as const;
type SidebarTab = typeof SIDEBAR_ITEMS[number]["id"];

/* ─── ListingRow ─── */
function ListingRow({ listing, onDelete, onToggleSold }: { listing: any; onDelete: () => void; onToggleSold: () => void }) {
  const statusCfg = STATUS_CFG[listing.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 py-3.5 border-b border-white/[0.05] last:border-0 group hover:bg-white/[0.015] rounded-xl px-2 -mx-2 transition-colors">
      <div className="h-9 w-9 rounded-xl bg-[#C9A84C]/8 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
        <Building2 className="h-4 w-4 text-[#C9A84C]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{listing.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <MapPin className="h-2.5 w-2.5 text-[#C9A84C]/50" />
          <span className="text-[10px] text-[#4a6080]">{listing.city}</span>
          <span className="text-[10px] text-[#3a5070]">·</span>
          <span className="text-[10px] text-[#C9A84C]">{fmtPKR(listing.price)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-3 mr-2 text-xs text-[#3a5070]">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{listing.views}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{listing.leads}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`${basePath}/post-property?edit=${listing.id}`}>
            <button className="h-7 w-7 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-[#C9A84C] hover:bg-[#C9A84C]/8 transition-all" title="Edit">
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </Link>
          <button onClick={onToggleSold} className="h-7 w-7 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-amber-400 hover:bg-amber-500/8 transition-all" title={listing.status === "sold" ? "Mark Live" : "Mark as Sold"}>
            <CheckSquare className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="h-7 w-7 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-rose-400 hover:bg-rose-500/8 transition-all" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Lead Score Badge ─── */
function ScoreBadge({ score }: { score: string }) {
  const cfg = SCORE_CFG[score as keyof typeof SCORE_CFG] ?? SCORE_CFG.cold;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon className="h-2.5 w-2.5" />{cfg.label}
    </span>
  );
}

/* ─── Pipeline Stage Badge ─── */
function StageBadge({ status }: { status: string }) {
  const stage = PIPELINE_STAGES.find(s => s.id === status) ?? PIPELINE_STAGES[0]!;
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${stage.color} ${stage.bg} ${stage.border}`}>
      {stage.short}
    </span>
  );
}

/* ─── WhatsApp Button ─── */
function WhatsAppBtn({ phone, name, propertyTitle }: { phone: string | null; name: string | null; propertyTitle: string }) {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, "");
  const intl = clean.startsWith("92") ? clean : `92${clean.replace(/^0/, "")}`;
  const msg = encodeURIComponent(
    `Assalamu Alaikum${name ? ` ${name}` : ""}! I'm your Orakzai Properties agent. Following up regarding your inquiry for *${propertyTitle}*. I'd love to arrange a viewing — please let me know your availability. 🏡`
  );
  return (
    <a href={`https://wa.me/${intl}?text=${msg}`} target="_blank" rel="noopener noreferrer"
      className="h-7 w-7 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all" title="WhatsApp">
      <MessageCircle className="h-3 w-3" />
    </a>
  );
}

/* ─── Lead Card (list view) ─── */
function LeadCard({ lead, index, onChat, onCallLog, onStageChange, onScoreChange }: {
  lead: any; index: number;
  onChat: () => void; onCallLog: () => void;
  onStageChange: (status: string) => void;
  onScoreChange: (score: string) => void;
}) {
  const [stageOpen, setStageOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const d = new Date(lead.createdAt);
  const dateStr = d.toLocaleDateString("en-PK", { month: "short", day: "numeric" });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className="rounded-xl border border-white/[0.07] p-3.5 hover:border-[#C9A84C]/20 transition-all group"
      style={{ background: "linear-gradient(145deg, #0c1929 0%, #08111f 100%)" }}>

      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-[#1e3a5f]/40 border border-white/8 flex items-center justify-center flex-shrink-0">
            <Users className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white leading-tight">{lead.leadName ?? "Anonymous"}</p>
            {lead.leadPhone && (
              <p className="text-[10px] text-[#4a6080] mt-0.5">{lead.leadPhone}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ScoreBadge score={lead.score} />
          <StageBadge status={lead.status} />
        </div>
      </div>

      {/* Property */}
      <div className="flex items-center gap-1.5 mb-3">
        <Building2 className="h-3 w-3 text-[#C9A84C]/60 flex-shrink-0" />
        <p className="text-[10px] text-[#5a7090] truncate">{lead.propertyTitle}</p>
        <span className="text-[#2a3a50] text-[9px] ml-auto flex-shrink-0">{dateStr}</span>
      </div>

      {/* Call log count */}
      {lead.callLogs?.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 px-2 py-1.5 rounded-lg bg-[#0a1520] border border-[#1a2e44]/60">
          <PhoneCall className="h-3 w-3 text-[#C9A84C]/60 flex-shrink-0" />
          <p className="text-[10px] text-[#4a6080] truncate">{lead.callLogs[0].note}</p>
          {lead.callLogs.length > 1 && (
            <span className="text-[9px] text-[#3a5070] ml-auto flex-shrink-0">+{lead.callLogs.length - 1} more</span>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-1.5 justify-between">
        <div className="flex items-center gap-1">
          {/* Pipeline stage dropdown */}
          <div className="relative">
            <button onClick={() => { setStageOpen(o => !o); setScoreOpen(false); }}
              className="h-7 px-2 rounded-lg flex items-center gap-1 text-[9px] font-semibold bg-white/[0.04] border border-white/[0.07] text-[#6a8090] hover:text-white hover:bg-white/[0.07] transition-all">
              <ArrowRight className="h-2.5 w-2.5" /> Move
            </button>
            {stageOpen && (
              <div className="absolute left-0 top-9 z-50 rounded-xl border border-[#1e3a5f]/60 overflow-hidden shadow-2xl min-w-[160px]"
                style={{ background: "#07111e" }}>
                {PIPELINE_STAGES.map(s => (
                  <button key={s.id} onClick={() => { onStageChange(s.id); setStageOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-[11px] font-semibold transition-colors ${s.color} hover:bg-white/[0.04] ${lead.status === s.id ? "bg-white/[0.04]" : ""}`}>
                    {lead.status === s.id && "✓ "}{s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Score dropdown */}
          <div className="relative">
            <button onClick={() => { setScoreOpen(o => !o); setStageOpen(false); }}
              className="h-7 px-2 rounded-lg flex items-center gap-1 text-[9px] font-semibold bg-white/[0.04] border border-white/[0.07] text-[#6a8090] hover:text-white hover:bg-white/[0.07] transition-all">
              <Flame className="h-2.5 w-2.5" /> Score
            </button>
            {scoreOpen && (
              <div className="absolute left-0 top-9 z-50 rounded-xl border border-[#1e3a5f]/60 overflow-hidden shadow-2xl min-w-[120px]"
                style={{ background: "#07111e" }}>
                {(["hot", "warm", "cold"] as const).map(s => {
                  const cfg = SCORE_CFG[s];
                  const Icon = cfg.icon;
                  return (
                    <button key={s} onClick={() => { onScoreChange(s); setScoreOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-[11px] font-semibold flex items-center gap-2 transition-colors ${cfg.color} hover:bg-white/[0.04] ${lead.score === s ? "bg-white/[0.04]" : ""}`}>
                      <Icon className="h-3 w-3" />{cfg.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <WhatsAppBtn phone={lead.leadPhone} name={lead.leadName} propertyTitle={lead.propertyTitle} />
          <button onClick={onCallLog}
            className="h-7 w-7 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all" title="Log Call">
            <PhoneCall className="h-3 w-3" />
          </button>
          <button onClick={onChat}
            className="h-7 w-7 rounded-lg flex items-center justify-center bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all" title="Chat">
            <MessageSquare className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Pipeline Kanban View ─── */
function PipelineView({ leads, onStageChange, onScoreChange, onChat, onCallLog }: {
  leads: any[]; onStageChange: (id: number, status: string) => void;
  onScoreChange: (id: number, score: string) => void;
  onChat: (lead: any) => void; onCallLog: (lead: any) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map(stage => {
        const stageLeads = leads.filter(l => l.status === stage.id);
        return (
          <div key={stage.id} className="flex-shrink-0 w-52 rounded-2xl border border-white/[0.07] overflow-hidden"
            style={{ background: "linear-gradient(180deg, #0a1520 0%, #07111e 100%)" }}>
            <div className={`flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06] ${stage.bg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${stage.color}`}>{stage.label}</span>
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold ${stage.bg} ${stage.border} border ${stage.color}`}>
                {stageLeads.length}
              </span>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {stageLeads.length === 0 ? (
                <div className="flex items-center justify-center h-16">
                  <p className="text-[10px] text-[#2a3a50]">No leads</p>
                </div>
              ) : (
                stageLeads.map(lead => (
                  <div key={lead.id} className="rounded-lg border border-white/[0.06] p-2.5 hover:border-[#C9A84C]/15 transition-all"
                    style={{ background: "#0d1e30" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-bold text-white truncate flex-1">{lead.leadName ?? "Anonymous"}</p>
                      <ScoreBadge score={lead.score} />
                    </div>
                    <p className="text-[9px] text-[#4a6080] truncate mb-2">{lead.propertyTitle}</p>
                    <div className="flex items-center gap-1">
                      <WhatsAppBtn phone={lead.leadPhone} name={lead.leadName} propertyTitle={lead.propertyTitle} />
                      <button onClick={() => onCallLog(lead)}
                        className="h-6 w-6 rounded-md flex items-center justify-center bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">
                        <PhoneCall className="h-2.5 w-2.5" />
                      </button>
                      <button onClick={() => onChat(lead)}
                        className="h-6 w-6 rounded-md flex items-center justify-center bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all">
                        <MessageSquare className="h-2.5 w-2.5" />
                      </button>
                      {/* Move forward */}
                      {stage.id !== "closed" && (
                        <button
                          onClick={() => {
                            const next = PIPELINE_STAGES[PIPELINE_STAGES.findIndex(s => s.id === stage.id) + 1];
                            if (next) onStageChange(lead.id, next.id);
                          }}
                          className="h-6 px-1.5 rounded-md flex items-center gap-1 text-[8px] font-bold bg-white/[0.04] text-[#4a6080] hover:text-white hover:bg-white/[0.07] transition-all ml-auto">
                          <ChevronRight className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Chat Panel ─── */
function ChatPanel({ lead, onClose, agentId }: { lead: any; onClose: () => void; agentId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${basePath}/api/leads/${lead.id}/messages`, { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setMessages(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [lead.id]);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${window.location.host}/api/ws`);
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId: agentId }));
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === "lead_message" && data.leadId === lead.id) {
          setMessages(prev => {
            if (prev.find(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      } catch { /* ignore */ }
    };
    return () => { ws.close(); };
  }, [lead.id, agentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const body = input.trim();
    setInput("");
    try {
      const res = await fetch(`${basePath}/api/leads/${lead.id}/messages`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const { message } = await res.json();
        setMessages(prev => prev.find(m => m.id === message.id) ? prev : [...prev, message]);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className="fixed right-0 top-0 h-full w-80 z-50 flex flex-col border-l border-[#1e3a5f]/60 shadow-2xl"
      style={{ background: "linear-gradient(180deg, #070f1c 0%, #040b14 100%)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1e3a5f]/40">
        <div className="h-8 w-8 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
          <Users className="h-3.5 w-3.5 text-[#C9A84C]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white">{lead.leadName ?? "Anonymous"}</p>
          <p className="text-[10px] text-[#4a6080] truncate">{lead.propertyTitle}</p>
        </div>
        <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-white hover:bg-white/[0.07] transition-all">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MessageSquare className="h-8 w-8 text-[#1e3a5f] mb-2" />
            <p className="text-[#3a5070] text-xs">No messages yet</p>
            <p className="text-[#2a3a50] text-[10px] mt-1">Start the conversation below</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "agent" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
                msg.role === "agent"
                  ? "bg-[#C9A84C]/15 border border-[#C9A84C]/25 text-white rounded-br-sm"
                  : "bg-[#0e1f30] border border-[#1e3a5f]/40 text-[#c0d0e0] rounded-bl-sm"
              }`}>
                {msg.body}
                <div className={`text-[8px] mt-1 ${msg.role === "agent" ? "text-[#C9A84C]/50 text-right" : "text-[#3a5070]"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#1e3a5f]/40">
        <div className="flex items-end gap-2">
          <textarea
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message…"
            rows={2}
            className="flex-1 px-3 py-2 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/60 text-white text-xs placeholder-[#3a5070] focus:border-[#C9A84C]/40 focus:outline-none transition-colors resize-none leading-relaxed"
          />
          <button onClick={send} disabled={!input.trim() || sending}
            className="h-9 w-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)" }}>
            <Send className="h-3.5 w-3.5 text-[#040b14]" />
          </button>
        </div>
        <p className="text-[9px] text-[#2a3a50] mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </motion.div>
  );
}

/* ─── Call Log Modal ─── */
function CallLogModal({ lead, onClose, onSaved }: { lead: any; onClose: () => void; onSaved: (log: any) => void }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${basePath}/api/leads/${lead.id}/call-log`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      if (res.ok) {
        const { log } = await res.json();
        toast({ title: "Call logged", description: "Your note has been saved." });
        onSaved(log);
        setNote("");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md rounded-2xl border border-[#C9A84C]/20 p-5 shadow-2xl z-10"
        style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <PhoneCall className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-white">Log Call</h3>
            <p className="text-[10px] text-[#4a6080]">{lead.leadName ?? "Anonymous"} · {lead.propertyTitle}</p>
          </div>
          <button onClick={onClose} className="ml-auto h-7 w-7 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-white hover:bg-white/[0.07] transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Existing call logs */}
        {lead.callLogs?.length > 0 && (
          <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
            <p className="text-[9px] text-[#3a5070] uppercase tracking-wider font-semibold mb-1.5">Previous Call Notes</p>
            {lead.callLogs.map((log: any) => (
              <div key={log.id} className="rounded-xl bg-[#060f1c] border border-[#1a2e44]/60 px-3 py-2">
                <p className="text-xs text-[#c0d0e0] leading-relaxed">{log.note}</p>
                <p className="text-[9px] text-[#3a5070] mt-1">
                  {new Date(log.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4">
          <label className="text-[10px] text-[#4a6080] uppercase tracking-wider font-semibold block mb-1.5">New Note</label>
          <textarea
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="e.g. Client wants a visit on Sunday at 3pm. Very interested in the kitchen size."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/60 text-white text-xs placeholder-[#3a5070] focus:border-[#C9A84C]/40 focus:outline-none transition-colors resize-none leading-relaxed"
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={save} disabled={!note.trim() || saving}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold disabled:opacity-40 transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save Note"}
          </button>
          <button onClick={onClose} className="h-9 px-4 rounded-xl text-xs font-semibold text-[#4a6080] hover:text-white hover:bg-white/[0.05] transition-all">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Leads Analytics Bar Chart ─── */
function LeadsBarChart({ leads }: { leads: any[] }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-PK", { month: "short" }),
    };
  });

  const data = months.map(m => ({
    label: m.label,
    inquiries: leads.filter(l => l.createdAt.startsWith(m.key)).length,
    closed: leads.filter(l => l.createdAt.startsWith(m.key) && l.status === "closed").length,
  }));

  const maxVal = Math.max(...data.map(d => d.inquiries), 1);

  return (
    <div className="rounded-2xl border border-white/8 p-5"
      style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-serif text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#C9A84C]" /> Inquiries vs Deals
        </h3>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#C9A84C]/60" />Inquiries</span>
          <span className="flex items-center gap-1.5 text-emerald-400"><span className="h-2 w-2 rounded-sm bg-emerald-500/60" />Closed</span>
        </div>
      </div>
      <div className="flex items-end gap-3 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end gap-0.5 h-24">
              <div className="flex-1 rounded-t-md transition-all duration-500"
                style={{ height: `${(d.inquiries / maxVal) * 100}%`, background: "linear-gradient(180deg, #C9A84C60, #C9A84C20)", minHeight: d.inquiries > 0 ? "4px" : "0" }} />
              <div className="flex-1 rounded-t-md transition-all duration-500"
                style={{ height: `${(d.closed / maxVal) * 100}%`, background: "linear-gradient(180deg, #10b98160, #10b98120)", minHeight: d.closed > 0 ? "4px" : "0" }} />
            </div>
            <span className="text-[9px] text-[#3a5070] font-semibold">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-4">
        <div className="text-center">
          <div className="font-serif text-lg font-bold text-[#C9A84C]">{leads.length}</div>
          <div className="text-[9px] text-[#3a5070] uppercase tracking-wider">Total Inquiries</div>
        </div>
        <div className="text-center">
          <div className="font-serif text-lg font-bold text-emerald-400">{leads.filter(l => l.status === "closed").length}</div>
          <div className="text-[9px] text-[#3a5070] uppercase tracking-wider">Deals Closed</div>
        </div>
        <div className="text-center">
          <div className="font-serif text-lg font-bold text-purple-400">
            {leads.length > 0 ? `${Math.round((leads.filter(l => l.status === "closed").length / leads.length) * 100)}%` : "—"}
          </div>
          <div className="text-[9px] text-[#3a5070] uppercase tracking-wider">Close Rate</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Away Message Settings ─── */
function AwayMessageSettings() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`${basePath}/api/agent/settings`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setEnabled(d.awayEnabled); setMessage(d.awayMessage); } setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${basePath}/api/agent/settings`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awayEnabled: enabled, awayMessage: message }),
      });
      if (res.ok) toast({ title: "Away message saved", description: "Buyers will see this during off-hours." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-32 rounded-2xl bg-white/[0.03] animate-pulse" />;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 p-5 mt-4"
      style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
      <div className="flex items-center gap-3 mb-4">
        {enabled ? <Bell className="h-4 w-4 text-[#C9A84C]" /> : <BellOff className="h-4 w-4 text-[#3a5070]" />}
        <h3 className="font-serif text-sm font-bold text-white">Auto-Responder</h3>
        <button
          onClick={() => setEnabled(e => !e)}
          className={`ml-auto h-6 w-11 rounded-full transition-all relative ${enabled ? "bg-[#C9A84C]" : "bg-white/[0.08]"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${enabled ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>
      <p className="text-[10px] text-[#3a5070] mb-3">
        When enabled, buyers who inquire during off-hours will automatically receive this message.
      </p>
      <textarea
        value={message} onChange={e => setMessage(e.target.value)}
        disabled={!enabled}
        rows={3}
        className="w-full px-3 py-2.5 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/60 text-white text-xs placeholder-[#3a5070] focus:border-[#C9A84C]/40 focus:outline-none transition-colors resize-none leading-relaxed disabled:opacity-40"
      />
      <button onClick={save} disabled={saving}
        className="mt-3 flex items-center gap-2 h-8 px-4 rounded-xl text-xs font-bold disabled:opacity-40 transition-all hover:scale-[1.02]"
        style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
        <Save className="h-3 w-3" />
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </motion.div>
  );
}

/* ─── Profile edit form ─── */
function ProfileForm({ profile, onSave }: { profile: any; onSave: () => void }) {
  const [form, setForm] = useState({
    agencyName:      profile?.agencyName      ?? "",
    experienceYears: profile?.experienceYears ?? 0,
    specialization:  profile?.specialization  ?? "",
    bio:             profile?.bio             ?? "",
    logoUrl:         profile?.logoUrl         ?? "",
  });
  const updateProfile = useUpdateAgentProfile();
  const qc = useQueryClient();

  const save = () => {
    updateProfile.mutate(
      { data: { ...form, experienceYears: Number(form.experienceYears) } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetAgentProfileQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAgentDashboardQueryKey() });
          onSave();
        },
      },
    );
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/8 p-6"
        style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Briefcase className="h-4 w-4 text-[#C9A84C]" />
          <h3 className="font-serif text-base font-bold text-white">Agent Profile</h3>
          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            profile?.verificationStatus === "verified"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}>
            {profile?.verificationStatus === "verified" ? "✓ Verified" : "Pending Review"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {[
            { field: "agencyName", label: "Agency Name", placeholder: "e.g. Orakzai Real Estate" },
            { field: "specialization", label: "Specialization", placeholder: "e.g. DHA Specialist, Luxury Homes" },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="text-[10px] text-[#4a6080] uppercase tracking-wider font-semibold mb-1.5 block">{label}</label>
              <input
                value={form[field as keyof typeof form] as string}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder}
                className="w-full h-9 px-3 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/60 text-white text-xs placeholder-[#3a5070] focus:border-[#C9A84C]/40 focus:outline-none transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] text-[#4a6080] uppercase tracking-wider font-semibold mb-1.5 block">Years Experience</label>
            <input type="number" min={0} max={50} value={form.experienceYears}
              onChange={e => setForm(f => ({ ...f, experienceYears: parseInt(e.target.value) || 0 }))}
              className="w-full h-9 px-3 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/60 text-white text-xs focus:border-[#C9A84C]/40 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#4a6080] uppercase tracking-wider font-semibold mb-1.5 block">Logo URL</label>
            <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
              placeholder="https://..." className="w-full h-9 px-3 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/60 text-white text-xs placeholder-[#3a5070] focus:border-[#C9A84C]/40 focus:outline-none transition-colors" />
          </div>
        </div>
        <div className="mb-5">
          <label className="text-[10px] text-[#4a6080] uppercase tracking-wider font-semibold mb-1.5 block">Bio</label>
          <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Brief description about your expertise and experience..." rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-[#060f1c] border border-[#1e3a5f]/60 text-white text-xs placeholder-[#3a5070] focus:border-[#C9A84C]/40 focus:outline-none transition-colors resize-none leading-relaxed"
          />
        </div>
        <button onClick={save} disabled={updateProfile.isPending}
          className="flex items-center gap-2 h-9 px-5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
          <Save className="h-3.5 w-3.5" />
          {updateProfile.isPending ? "Saving…" : "Save Profile"}
        </button>
      </motion.div>
      <AwayMessageSettings />
    </>
  );
}

/* ─── Main Dashboard ─── */
function AgentDashboardContent() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [tab, setTab] = useState<SidebarTab>("inventory");

  const { data: dash, isLoading } = useGetAgentDashboard({
    query: { queryKey: getGetAgentDashboardQueryKey(), refetchInterval: 60_000 },
  });

  const deleteProperty = useDeleteProperty();
  const updateProperty = useUpdateProperty();

  /* ── Leads state ── */
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");
  const [filterScore, setFilterScore] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [callLogOpen, setCallLogOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch(`${basePath}/api/leads`, { credentials: "include" });
      if (res.ok) setLeads(await res.json());
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "leads") fetchLeads();
  }, [tab, fetchLeads]);

  const handleStageChange = async (leadId: number, status: string) => {
    const res = await fetch(`${basePath}/api/leads/${leadId}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
      if (selectedLead?.id === leadId) setSelectedLead((l: any) => ({ ...l, status }));
    }
  };

  const handleScoreChange = async (leadId: number, score: string) => {
    const res = await fetch(`${basePath}/api/leads/${leadId}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    if (res.ok) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, score } : l));
      if (selectedLead?.id === leadId) setSelectedLead((l: any) => ({ ...l, score }));
    }
  };

  const handleCallLogSaved = (leadId: number, log: any) => {
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, callLogs: [log, ...(l.callLogs ?? [])] } : l
    ));
    if (selectedLead?.id === leadId) {
      setSelectedLead((l: any) => ({ ...l, callLogs: [log, ...(l.callLogs ?? [])] }));
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this listing?")) return;
    deleteProperty.mutate({ id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetAgentDashboardQueryKey() }) });
  };

  const handleToggleSold = (listing: any) => {
    updateProperty.mutate(
      { id: listing.id, data: { isAvailable: listing.status === "sold" } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getGetAgentDashboardQueryKey() }) },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "#040b14" }}>
        <Navbar />
        <div className="pt-14 max-w-7xl mx-auto px-4 py-8 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/[0.03] rounded-2xl animate-pulse" />)}
          </div>
          <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const profile   = dash?.profile;
  const stats     = dash?.stats   ?? { totalListings: 0, activeListings: 0, totalLeads: 0, totalViews: 0 };
  const listings  = dash?.listings ?? [];

  const filteredLeads = filterScore === "all" ? leads : leads.filter(l => l.score === filterScore);
  const hotCount = leads.filter(l => l.score === "hot").length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #040b14 0%, #060e18 100%)" }}>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[300px] rounded-full bg-[#C9A84C]/[0.03] blur-[120px]" />
      </div>
      <Navbar />
      <div className="pt-14 relative z-10">

        {/* Agent Header */}
        <div className="border-b border-[#C9A84C]/8" style={{ background: "linear-gradient(180deg, #06111e 0%, #040b14 100%)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #C9A84C20, transparent)" }}>
                  {profile?.logoUrl
                    ? <img src={profile.logoUrl} alt="logo" className="h-10 w-10 rounded-xl object-cover" />
                    : <Briefcase className="h-6 w-6 text-[#C9A84C]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-serif text-xl font-bold text-white">
                      {profile?.agencyName ?? (user?.firstName ? `${user.firstName}'s Agency` : "Agent Dashboard")}
                    </h1>
                    {profile?.verificationStatus === "verified" && (
                      <BadgeCheck className="h-4.5 w-4.5 text-[#C9A84C]" />
                    )}
                  </div>
                  <p className="text-[#4a6080] text-xs mt-0.5">
                    {profile?.specialization ?? "Real Estate Agent"}{profile?.experienceYears ? ` · ${profile.experienceYears}yr experience` : ""}
                  </p>
                </div>
              </div>
              <Link href={`${basePath}/post-property`}>
                <button className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold hover:scale-[1.03] transition-transform"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
                  <Plus className="h-3.5 w-3.5" /> Quick Post
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">

          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col w-44 flex-shrink-0 gap-1">
            {SIDEBAR_ITEMS.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  tab === item.id
                    ? "bg-[#C9A84C]/12 border border-[#C9A84C]/25 text-[#C9A84C]"
                    : "text-[#6a7f99] hover:text-white hover:bg-white/[0.03]"
                }`}>
                <item.icon className="h-3.5 w-3.5" /> {item.label}
                {item.id === "leads" && leads.length > 0 && (
                  <span className="ml-auto h-4 min-w-[16px] rounded-full bg-rose-500/20 text-rose-400 text-[8px] font-bold flex items-center justify-center px-1">
                    {leads.length}
                  </span>
                )}
                {item.id === "leads" && hotCount > 0 && (
                  <span className="ml-1 h-4 min-w-[16px] rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-bold flex items-center justify-center px-1">
                    🔥{hotCount}
                  </span>
                )}
              </button>
            ))}
          </aside>

          {/* Mobile tab bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-[#C9A84C]/15 px-2 py-2"
            style={{ background: "#070e1a" }}>
            {SIDEBAR_ITEMS.map(item => (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl text-[9px] font-semibold transition-all ${
                  tab === item.id ? "text-[#C9A84C]" : "text-[#4a6080]"
                }`}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 pb-20 lg:pb-0 space-y-5">

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Eye,       label: "Total Views",     value: stats.totalViews,    color: "text-sky-400"     },
                { icon: Users,     label: "Total Leads",     value: stats.totalLeads,    color: "text-[#C9A84C]"  },
                { icon: Building2, label: "Active Listings", value: stats.activeListings, color: "text-emerald-400" },
                { icon: BarChart3, label: "All Listings",    value: stats.totalListings,  color: "text-purple-400"  },
              ].map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border border-white/8 p-4"
                  style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                  <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
                  <div className={`font-serif text-2xl font-bold ${s.color} leading-none mb-1`}>{s.value}</div>
                  <div className="text-[#3a5070] text-[9px] uppercase tracking-wider font-semibold">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* ══ INVENTORY ══ */}
              {tab === "inventory" && (
                <motion.div key="inventory" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="rounded-2xl border border-white/8 overflow-hidden"
                    style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-[#C9A84C]" />
                        <h2 className="font-serif text-sm font-bold text-white">My Listings</h2>
                        <span className="text-[10px] font-semibold text-[#3a5070] bg-white/5 px-2 py-0.5 rounded-full border border-white/8">{listings.length}</span>
                      </div>
                      <Link href={`${basePath}/post-property`}>
                        <button className="flex items-center gap-1.5 h-7 px-3 rounded-xl text-[10px] font-bold border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/8 transition-colors">
                          <Plus className="h-3 w-3" /> Add
                        </button>
                      </Link>
                    </div>
                    <div className="px-5 py-2">
                      {listings.length === 0 ? (
                        <div className="text-center py-12">
                          <Building2 className="h-10 w-10 text-[#1e3a5f] mx-auto mb-3" />
                          <p className="text-[#3a5070] text-sm">No listings yet</p>
                          <Link href={`${basePath}/post-property`}>
                            <button className="mt-3 text-[10px] text-[#C9A84C] hover:underline">Post your first property →</button>
                          </Link>
                        </div>
                      ) : (
                        listings.map(listing => (
                          <ListingRow key={listing.id} listing={listing}
                            onDelete={() => handleDelete(listing.id)}
                            onToggleSold={() => handleToggleSold(listing)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ══ LEADS ══ */}
              {tab === "leads" && (
                <motion.div key="leads" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4">

                  {/* Header bar */}
                  <div className="rounded-2xl border border-white/8 overflow-hidden"
                    style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#C9A84C]" />
                        <h2 className="font-serif text-sm font-bold text-white">Lead Inbox</h2>
                        {leads.length > 0 && (
                          <span className="text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">{leads.length}</span>
                        )}
                        {hotCount > 0 && (
                          <span className="text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Flame className="h-2.5 w-2.5" />{hotCount} Hot
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Score filter */}
                        <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1">
                          {(["all", "hot", "warm", "cold"] as const).map(f => (
                            <button key={f} onClick={() => setFilterScore(f)}
                              className={`h-6 px-2.5 rounded-lg text-[9px] font-bold capitalize transition-all ${
                                filterScore === f
                                  ? "bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30"
                                  : "text-[#4a6080] hover:text-white"
                              }`}>
                              {f === "hot" ? "🔥" : f === "warm" ? "🌡" : f === "cold" ? "❄️" : ""} {f}
                            </button>
                          ))}
                        </div>
                        {/* View toggle */}
                        <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1">
                          <button onClick={() => setViewMode("list")}
                            className={`h-6 w-7 rounded-lg flex items-center justify-center transition-all ${viewMode === "list" ? "bg-[#C9A84C]/20 text-[#C9A84C]" : "text-[#4a6080] hover:text-white"}`}>
                            <List className="h-3 w-3" />
                          </button>
                          <button onClick={() => setViewMode("pipeline")}
                            className={`h-6 w-7 rounded-lg flex items-center justify-center transition-all ${viewMode === "pipeline" ? "bg-[#C9A84C]/20 text-[#C9A84C]" : "text-[#4a6080] hover:text-white"}`}>
                            <LayoutGrid className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      {leadsLoading ? (
                        <div className="space-y-3">
                          {[1,2,3].map(i => <div key={i} className="h-28 rounded-xl bg-white/[0.03] animate-pulse" />)}
                        </div>
                      ) : leads.length === 0 ? (
                        <div className="text-center py-14">
                          <Users className="h-10 w-10 text-[#1e3a5f] mx-auto mb-3" />
                          <p className="text-[#3a5070] text-sm">No leads yet</p>
                          <p className="text-[#2a3a50] text-xs mt-1">Leads appear when buyers contact you via WhatsApp or listings</p>
                        </div>
                      ) : viewMode === "list" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {filteredLeads.map((lead, i) => (
                            <LeadCard key={lead.id} lead={lead} index={i}
                              onChat={() => { setSelectedLead(lead); setChatOpen(true); setCallLogOpen(false); }}
                              onCallLog={() => { setSelectedLead(lead); setCallLogOpen(true); setChatOpen(false); }}
                              onStageChange={(status) => handleStageChange(lead.id, status)}
                              onScoreChange={(score) => handleScoreChange(lead.id, score)}
                            />
                          ))}
                        </div>
                      ) : (
                        <PipelineView
                          leads={filteredLeads}
                          onStageChange={handleStageChange}
                          onScoreChange={handleScoreChange}
                          onChat={(lead) => { setSelectedLead(lead); setChatOpen(true); setCallLogOpen(false); }}
                          onCallLog={(lead) => { setSelectedLead(lead); setCallLogOpen(true); setChatOpen(false); }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Mini chart when there are leads */}
                  {leads.length > 0 && <LeadsBarChart leads={leads} />}
                </motion.div>
              )}

              {/* ══ ANALYTICS ══ */}
              {tab === "analytics" && (
                <motion.div key="analytics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4">
                  <div className="rounded-2xl border border-white/8 p-5"
                    style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                    <h2 className="font-serif text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[#C9A84C]" /> Performance Overview
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Conversion Rate",     value: stats.totalLeads > 0 ? `${((stats.totalLeads / Math.max(stats.totalViews, 1)) * 100).toFixed(1)}%` : "—", desc: "Leads per view" },
                        { label: "Avg. Lead / Listing", value: stats.totalListings > 0 ? (stats.totalLeads / stats.totalListings).toFixed(1) : "—",                  desc: "Leads per property" },
                        { label: "Views per Listing",   value: stats.totalListings > 0 ? Math.floor(stats.totalViews / stats.totalListings) : "—",                   desc: "Average views" },
                        { label: "Active Rate",         value: stats.totalListings > 0 ? `${Math.round((stats.activeListings / stats.totalListings) * 100)}%` : "—", desc: "Listings currently live" },
                      ].map(metric => (
                        <div key={metric.label} className="rounded-xl bg-[#060f1c] border border-[#1e3a5f]/40 p-3">
                          <div className="font-serif text-xl font-bold text-[#C9A84C] mb-0.5">{metric.value}</div>
                          <div className="text-white text-[11px] font-semibold">{metric.label}</div>
                          <div className="text-[#3a5070] text-[9px]">{metric.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {listings.length > 0 && (
                    <div className="rounded-2xl border border-white/8 p-5"
                      style={{ background: "linear-gradient(145deg, #0b1826 0%, #060d16 100%)" }}>
                      <h3 className="font-serif text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Star className="h-4 w-4 text-[#C9A84C]" /> Top Performers
                      </h3>
                      {[...listings].sort((a, b) => b.views - a.views).slice(0, 3).map((l, i) => (
                        <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                          <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                            i === 0 ? "bg-[#C9A84C]/20 text-[#C9A84C]" : i === 1 ? "bg-[#8a7a4c]/20 text-[#8a7a4c]" : "bg-white/5 text-[#4a6080]"
                          }`}>{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium truncate">{l.title}</p>
                            <p className="text-[#3a5070] text-[10px]">{l.city}</p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="flex items-center gap-1 text-[#4a6080]"><Eye className="h-2.5 w-2.5" />{l.views}</span>
                            <span className="flex items-center gap-1 text-[#4a6080]"><Users className="h-2.5 w-2.5" />{l.leads}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══ PROFILE ══ */}
              {tab === "profile" && (
                <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <ProfileForm profile={profile} onSave={() => {}} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Chat Slide Panel ── */}
      <AnimatePresence>
        {chatOpen && selectedLead && user && (
          <ChatPanel
            lead={selectedLead}
            agentId={user.id}
            onClose={() => { setChatOpen(false); setSelectedLead(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Call Log Modal ── */}
      <AnimatePresence>
        {callLogOpen && selectedLead && (
          <CallLogModal
            lead={selectedLead}
            onClose={() => { setCallLogOpen(false); setSelectedLead(null); }}
            onSaved={(log) => { handleCallLogSaved(selectedLead.id, log); setCallLogOpen(false); setSelectedLead(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Route wrapper ─── */
export default function AgentDashboard() {
  return (
    <>
      <Show when="signed-out">
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#040b14" }}>
          <Navbar />
          <div className="text-center mt-14 px-4">
            <Shield className="h-12 w-12 text-[#1e3a5f] mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-white font-bold mb-2">Agent Area</h2>
            <p className="text-[#6a7f99] text-sm mb-6">Sign in to access your Business Dashboard.</p>
            <Link href={`${basePath}/sign-in`}>
              <button className="px-6 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </Show>
      <Show when="signed-in"><AgentDashboardContent /></Show>
    </>
  );
}
