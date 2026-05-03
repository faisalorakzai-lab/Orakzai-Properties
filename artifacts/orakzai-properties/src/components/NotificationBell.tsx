import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, Check, CheckCheck, Trash2, Settings,
  TrendingUp, Home, DollarSign, Megaphone, ChevronRight,
} from "lucide-react";
import { useUser } from "@clerk/react";
import {
  useListNotifications,
  getListNotificationsQueryKey,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useClearAllNotifications,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const TYPE_CFG = {
  market_alert:  { icon: Home,       color: "text-sky-400",     bg: "bg-sky-500/10",     label: "Market Alert"  },
  price_pulse:   { icon: TrendingUp,  color: "text-[#C9A84C]",  bg: "bg-[#C9A84C]/10",  label: "Price Pulse"   },
  wealth_alert:  { icon: DollarSign,  color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Wealth Alert"  },
  system:        { icon: Megaphone,   color: "text-purple-400",  bg: "bg-purple-500/10",  label: "System"        },
} as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data, refetch } = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      enabled: !!user,
      refetchInterval: 30_000,
    },
  });

  const markRead   = useMarkNotificationRead();
  const markAll    = useMarkAllNotificationsRead();
  const clearAll   = useClearAllNotifications();

  const notifications = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  /* WebSocket connection for real-time */
  useEffect(() => {
    if (!user) return;
    const host = window.location.host;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${host}/api/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", userId: user.id }));
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "notification") {
          qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        }
      } catch {}
    };
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
    }, 30_000);
    return () => {
      clearInterval(ping);
      ws.close();
    };
  }, [user, qc]);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  const handleClearAll = () => {
    clearAll.mutate(undefined, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) refetch(); }}
        className="relative h-8 w-8 rounded-lg flex items-center justify-center text-[#6a7f99] hover:text-[#C9A84C] hover:bg-[#C9A84C]/8 transition-all"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-[8px] font-bold text-white border border-[#070e1a]"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-10 w-80 sm:w-96 rounded-2xl border border-[#C9A84C]/20 shadow-2xl shadow-black/60 z-[200] overflow-hidden"
            style={{ background: "linear-gradient(145deg, #0c1828 0%, #060d16 100%)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-[#C9A84C]" />
                <span className="font-serif text-sm font-bold text-white">Sovereign Alerts</span>
                {unread > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {unread} NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button onClick={handleMarkAll}
                    className="h-6 w-6 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-emerald-400 hover:bg-emerald-500/8 transition-all"
                    title="Mark all read">
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={handleClearAll}
                    className="h-6 w-6 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-rose-400 hover:bg-rose-500/8 transition-all"
                    title="Clear all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <Link href={`${basePath}/notification-settings`} onClick={() => setOpen(false)}>
                  <button className="h-6 w-6 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-[#C9A84C] hover:bg-[#C9A84C]/8 transition-all" title="Settings">
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </Link>
                <button onClick={() => setOpen(false)}
                  className="h-6 w-6 rounded-lg flex items-center justify-center text-[#4a6080] hover:text-white transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-[420px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10">
                  <Bell className="h-8 w-8 text-[#1e3a5f] mx-auto mb-3" />
                  <p className="text-[#3a5070] text-xs">No notifications yet</p>
                  <p className="text-[#2a3a50] text-[10px] mt-1">We'll alert you on price moves, wealth events & more</p>
                </div>
              ) : (
                <div>
                  {notifications.map((n, i) => {
                    const cfg = TYPE_CFG[n.type as keyof typeof TYPE_CFG] ?? TYPE_CFG.system;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors group ${!n.isRead ? "bg-[#C9A84C]/[0.02]" : ""}`}
                      >
                        <div className={`h-7 w-7 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-xs font-semibold leading-tight ${n.isRead ? "text-[#94a3b8]" : "text-white"}`}>{n.title}</p>
                            {!n.isRead && (
                              <button
                                onClick={() => handleMarkRead(n.id)}
                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Check className="h-3 w-3 text-emerald-400 mt-0.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-[#4a6080] text-[11px] mt-0.5 leading-relaxed">{n.body}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} border-current/20`}>
                              {cfg.label}
                            </span>
                            <span className="text-[#2a3a50] text-[9px]">{timeAgo(n.createdAt)}</span>
                            {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-[#C9A84C] ml-auto flex-shrink-0" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/8 px-4 py-2.5">
              <Link href={`${basePath}/notifications`} onClick={() => setOpen(false)}>
                <button className="w-full text-[10px] text-[#4a6080] hover:text-[#C9A84C] transition-colors flex items-center justify-center gap-1">
                  View All Notifications <ChevronRight className="h-3 w-3" />
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
