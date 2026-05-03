import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, TrendingUp, Home, DollarSign, Megaphone,
  CheckCheck, Trash2, Filter, Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Show } from "@clerk/react";
import { Link } from "wouter";
import {
  useListNotifications,
  getListNotificationsQueryKey,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useClearAllNotifications,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const TYPE_CFG = {
  market_alert:  { icon: Home,       color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20",     label: "Market Alert",  emoji: "🏠" },
  price_pulse:   { icon: TrendingUp,  color: "text-[#C9A84C]",  bg: "bg-[#C9A84C]/10",  border: "border-[#C9A84C]/20",  label: "Price Pulse",   emoji: "📈" },
  wealth_alert:  { icon: DollarSign,  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Wealth Alert",  emoji: "💰" },
  system:        { icon: Megaphone,   color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/20",  label: "System",        emoji: "📢" },
} as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

type FilterType = "all" | "market_alert" | "price_pulse" | "wealth_alert" | "system";

function NotificationPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data, isLoading } = useListNotifications({
    query: { queryKey: getListNotificationsQueryKey(), refetchInterval: 30_000 },
  });
  const markRead = useMarkNotificationRead();
  const markAll  = useMarkAllNotificationsRead();
  const clearAll = useClearAllNotifications();

  const all = data?.notifications ?? [];
  const filtered = filter === "all" ? all : all.filter(n => n.type === filter);
  const unread = data?.unreadCount ?? 0;

  const invalidate = () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });

  return (
    <div className="min-h-screen" style={{ background: "#040b14" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[250px] rounded-full bg-[#C9A84C]/[0.04] blur-[100px]" />
      </div>
      <Navbar />
      <div className="pt-14 max-w-3xl mx-auto px-4 sm:px-6 py-8 relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/25 rounded-full px-3 py-1 mb-3">
                <Bell className="w-3 h-3 text-[#C9A84C]" />
                <span className="text-[10px] font-medium text-[#C9A84C] tracking-wider uppercase">Alert Center</span>
              </div>
              <h1 className="font-serif text-3xl font-bold text-white">Sovereign Alerts</h1>
              <p className="text-[#4a6080] text-sm mt-1">
                {unread > 0 ? `${unread} unread notification${unread !== 1 ? "s" : ""}` : "All caught up"}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {unread > 0 && (
                <button onClick={() => markAll.mutate(undefined, { onSuccess: invalidate })}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-[#6a7f99] border border-white/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all">
                  <CheckCheck className="h-3 w-3" /> Mark All Read
                </button>
              )}
              {all.length > 0 && (
                <button onClick={() => clearAll.mutate(undefined, { onSuccess: invalidate })}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-[#6a7f99] border border-white/10 hover:border-rose-500/30 hover:text-rose-400 transition-all">
                  <Trash2 className="h-3 w-3" /> Clear All
                </button>
              )}
              <Link href={`${basePath}/notification-settings`}>
                <button className="h-8 px-3 rounded-xl text-xs font-semibold border border-[#C9A84C]/25 text-[#C9A84C] hover:bg-[#C9A84C]/8 transition-all">
                  Settings
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {([
            { id: "all",          label: "All",          count: all.length        },
            { id: "wealth_alert", label: "💰 Wealth",    count: all.filter(n => n.type === "wealth_alert").length  },
            { id: "price_pulse",  label: "📈 Price",     count: all.filter(n => n.type === "price_pulse").length   },
            { id: "market_alert", label: "🏠 Market",    count: all.filter(n => n.type === "market_alert").length  },
            { id: "system",       label: "📢 System",    count: all.filter(n => n.type === "system").length        },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold transition-all border ${
                filter === f.id
                  ? "bg-[#C9A84C]/15 border-[#C9A84C]/40 text-[#C9A84C]"
                  : "bg-white/[0.03] border-white/8 text-[#4a6080] hover:text-white"
              }`}>
              {f.label}
              {f.count > 0 && (
                <span className={`text-[9px] px-1 rounded-full ${filter === f.id ? "bg-[#C9A84C]/20" : "bg-white/5"}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-white/[0.03] rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Bell className="h-12 w-12 text-[#1e3a5f] mx-auto mb-4" />
            <p className="text-[#3a5070] text-sm font-medium">No {filter !== "all" ? filter.replace("_", " ") : ""} notifications</p>
            <p className="text-[#2a3a50] text-xs mt-1">Check back later for updates</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((n, i) => {
                const cfg = TYPE_CFG[n.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.system;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-2xl border p-4 transition-all group ${
                      !n.isRead
                        ? `${cfg.border} bg-gradient-to-r from-[#0b1826] to-[#060d16]`
                        : "border-white/6 bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                              {cfg.emoji} {cfg.label}
                            </span>
                            {!n.isRead && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#C9A84C]" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!n.isRead && (
                              <button
                                onClick={() => markRead.mutate({ id: n.id }, { onSuccess: invalidate })}
                                className="h-6 w-6 rounded-lg flex items-center justify-center text-[#3a5070] hover:text-emerald-400 hover:bg-emerald-500/8 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <CheckCheck className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm font-semibold mt-1.5 ${n.isRead ? "text-[#94a3b8]" : "text-white"}`}>
                          {n.title}
                        </p>
                        <p className="text-[#4a6080] text-xs mt-0.5 leading-relaxed">{n.body}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-[#2a3a50] text-[10px]">
                          <Clock className="h-2.5 w-2.5" />
                          {timeAgo(n.createdAt)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Notifications() {
  return (
    <>
      <Show when="signed-out">
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#040b14" }}>
          <Navbar />
          <div className="text-center mt-14 px-4">
            <Bell className="h-12 w-12 text-[#1e3a5f] mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-white font-bold mb-2">Sign In Required</h2>
            <p className="text-[#6a7f99] text-sm mb-6">Sign in to view your Sovereign Alerts.</p>
            <Link href={`${basePath}/sign-in`}>
              <button className="px-6 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #C9A84C, #e8c060)", color: "#040b14" }}>
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </Show>
      <Show when="signed-in"><NotificationPage /></Show>
    </>
  );
}
