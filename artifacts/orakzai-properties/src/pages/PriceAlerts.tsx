import { useState, useEffect } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import {
    Bell, BellOff, Plus, Trash2, TrendingUp, MapPin, Building2,
    Home, DollarSign, ShieldCheck, Edit2, Check, X, AlertCircle,
    Zap, Target, Activity, ChevronRight,
  } from "lucide-react";
  import Navbar from "@/components/Navbar";
  import { useUser } from "@/contexts/AuthContext";
  import { Link } from "wouter";

  const basePath = (import.meta.env.BASE_URL as string).replace(/\/$/, "");

  /* ── Brand tokens ──────────────────────────────────────────────── */
  const GOLD = "#C9A84C";
  const BG   = "#040b14";

  /* ── Types ─────────────────────────────────────────────────────── */
  interface PriceAlert {
    id: string;
    title: string;
    type: "price_drop" | "new_listing" | "roi_change" | "market_pulse";
    city: string;
    category: string;
    maxPrice: number | null;
    minROI: number | null;
    active: boolean;
    createdAt: string;
    lastTriggered: string | null;
    triggerCount: number;
  }

  const CATEGORIES = ["All","Buy","Sell","Rent","Investment","Fractional","Luxury","Commercial"];
  const CITIES = ["Any City","Lahore","Islamabad","Karachi","Rawalpindi","Peshawar","Dubai","Abu Dhabi","London","Istanbul","New York","Riyadh"];
  const ALERT_TYPES = [
    { value: "price_drop",   label: "Price Drop",     icon: TrendingUp,  color: "#10b981", desc: "Alert when price falls below target" },
    { value: "new_listing",  label: "New Listing",    icon: Plus,        color: GOLD,      desc: "Alert when matching property listed" },
    { value: "roi_change",   label: "ROI Change",     icon: Activity,    color: "#8b5cf6", desc: "Alert on ROI improvement ≥ threshold" },
    { value: "market_pulse", label: "Market Pulse",   icon: Zap,         color: "#06b6d4", desc: "Weekly city market summary" },
  ] as const;

  function formatPrice(v: number | undefined | null) {
    if (v === undefined || v === null || isNaN(v)) return "₨ 0";
    if (v >= 10000000) return `₨ ${(v/10000000).toFixed(1)} Cr`;
    if (v >= 100000) return `₨ ${(v/100000).toFixed(0)} L`;
    return `₨ ${v.toLocaleString()}`;
  }

  function timeAgo(s: string) {
    const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m/60)}h ago`;
    return `${Math.floor(m/1440)}d ago`;
  }

  const STORAGE_KEY = "orakzai_price_alerts";

  function loadAlerts(): PriceAlert[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch { return []; }
  }
  function saveAlerts(alerts: PriceAlert[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }

  /* ── Seed demo alerts if empty ──────────────────────────────────── */
  function seedDemoAlerts(): PriceAlert[] {
    const demo: PriceAlert[] = [
      { id: "a1", title: "DHA Lahore – Price Drop Watch", type: "price_drop", city: "Lahore", category: "Buy", maxPrice: 25000000, minROI: null, active: true, createdAt: new Date(Date.now()-86400000*3).toISOString(), lastTriggered: new Date(Date.now()-3600000*2).toISOString(), triggerCount: 3 },
      { id: "a2", title: "Dubai Marina – New Listings", type: "new_listing", city: "Dubai", category: "Investment", maxPrice: null, minROI: 10, active: true, createdAt: new Date(Date.now()-86400000*7).toISOString(), lastTriggered: new Date(Date.now()-86400000).toISOString(), triggerCount: 12 },
      { id: "a3", title: "Islamabad F-7 – ROI Alert", type: "roi_change", city: "Islamabad", category: "Fractional", maxPrice: null, minROI: 15, active: false, createdAt: new Date(Date.now()-86400000*14).toISOString(), lastTriggered: null, triggerCount: 0 },
      { id: "a4", title: "Karachi Weekly Market Pulse", type: "market_pulse", city: "Karachi", category: "All", maxPrice: null, minROI: null, active: true, createdAt: new Date(Date.now()-86400000*2).toISOString(), lastTriggered: new Date(Date.now()-86400000*7).toISOString(), triggerCount: 2 },
    ];
    saveAlerts(demo);
    return demo;
  }

  /* ── Empty state ────────────────────────────────────────────────── */
  function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24 }}>
          <Bell size={32} color={GOLD} />
        </div>
        <h3 style={{ color:"#EEF2FF", fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, marginBottom:8 }}>No Active Alerts</h3>
        <p style={{ color:"#4a6080", fontSize:14, maxWidth:320, lineHeight:1.6, marginBottom:28 }}>
          Set up intelligent price alerts to get notified when properties match your investment criteria.
        </p>
        <button onClick={onAdd}
          style={{ padding:"12px 28px", borderRadius:14, background:`linear-gradient(135deg,${GOLD},#b8943e)`, border:"none", color:"#040b14", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          + Create First Alert
        </button>
      </motion.div>
    );
  }

  /* ── Add / Edit modal ───────────────────────────────────────────── */
  function AlertModal({ alert, onSave, onClose }: { alert?: PriceAlert; onSave: (a: PriceAlert) => void; onClose: () => void }) {
    const [title, setTitle]       = useState(alert?.title ?? "");
    const [type, setType]         = useState<PriceAlert["type"]>(alert?.type ?? "price_drop");
    const [city, setCity]         = useState(alert?.city ?? "Any City");
    const [category, setCategory] = useState(alert?.category ?? "Buy");
    const [maxPrice, setMaxPrice] = useState(alert?.maxPrice?.toString() ?? "");
    const [minROI, setMinROI]     = useState(alert?.minROI?.toString() ?? "");
    const [error, setError]       = useState("");

    const typeCfg = ALERT_TYPES.find(t => t.value === type)!;

    function handleSave() {
      if (!title.trim()) { setError("Please enter an alert name"); return; }
      const a: PriceAlert = {
        id: alert?.id ?? crypto.randomUUID(),
        title: title.trim(),
        type, city, category,
        maxPrice: maxPrice ? Number(maxPrice) : null,
        minROI: minROI ? Number(minROI) : null,
        active: alert?.active ?? true,
        createdAt: alert?.createdAt ?? new Date().toISOString(),
        lastTriggered: alert?.lastTriggered ?? null,
        triggerCount: alert?.triggerCount ?? 0,
      };
      onSave(a);
    }

    return (
      <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)" }} onClick={onClose} />
        <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} transition={{ type:"spring", stiffness:300, damping:25 }}
          style={{ position:"relative", zIndex:1, background:"#040b14", border:`1px solid rgba(201,168,76,0.25)`, borderRadius:24, padding:28, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
            <div>
              <h2 style={{ color:"#EEF2FF", fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, margin:0 }}>{alert ? "Edit Alert" : "New Price Alert"}</h2>
              <p style={{ color:"#4a6080", fontSize:12, marginTop:4 }}>Get notified on your terms</p>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"6px 10px", cursor:"pointer", color:"#4a6080" }}><X size={16} /></button>
          </div>

          {/* Alert name */}
          <div style={{ marginBottom:20 }}>
            <label style={{ color:"#9AA2B8", fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:8 }}>Alert Name</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. DHA Lahore Price Watch"
              style={{ width:"100%", padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"#EEF2FF", fontSize:14, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", boxSizing:"border-box" }} />
            {error && <p style={{ color:"#f43f5e", fontSize:12, marginTop:6 }}>{error}</p>}
          </div>

          {/* Alert type */}
          <div style={{ marginBottom:20 }}>
            <label style={{ color:"#9AA2B8", fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:8 }}>Alert Type</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {ALERT_TYPES.map(t => {
                const Icon = t.icon;
                const active = type === t.value;
                return (
                  <button key={t.value} onClick={() => setType(t.value as PriceAlert["type"])}
                    style={{ padding:"12px", borderRadius:12, background: active ? `rgba(${t.color === "#C9A84C" ? "201,168,76" : t.color === "#10b981" ? "16,185,129" : t.color === "#8b5cf6" ? "139,92,246" : "6,182,212"},0.12)` : "rgba(255,255,255,0.03)",
                      border:`1px solid ${active ? t.color+"60" : "rgba(255,255,255,0.06)"}`, cursor:"pointer", textAlign:"left", transition:"all 0.2s" }}>
                    <Icon size={16} color={active ? t.color : "#4a6080"} style={{ marginBottom:6 }} />
                    <div style={{ color: active ? t.color : "#9AA2B8", fontSize:12, fontWeight:600 }}>{t.label}</div>
                    <div style={{ color:"#4a6080", fontSize:10, marginTop:2, lineHeight:1.4 }}>{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* City + Category */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            <div>
              <label style={{ color:"#9AA2B8", fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:8 }}>City</label>
              <select value={city} onChange={e => setCity(e.target.value)}
                style={{ width:"100%", padding:"10px 12px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"#EEF2FF", fontSize:13, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {CITIES.map(c => <option key={c} value={c} style={{ background:"#040b14" }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color:"#9AA2B8", fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:8 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ width:"100%", padding:"10px 12px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"#EEF2FF", fontSize:13, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background:"#040b14" }}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Conditional fields */}
          {(type === "price_drop" || type === "new_listing") && (
            <div style={{ marginBottom:20 }}>
              <label style={{ color:"#9AA2B8", fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:8 }}>Max Price (₨)</label>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="e.g. 25000000"
                style={{ width:"100%", padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"#EEF2FF", fontSize:14, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", boxSizing:"border-box" }} />
              {maxPrice && <p style={{ color:GOLD, fontSize:11, marginTop:4 }}>= {formatPrice(Number(maxPrice))}</p>}
            </div>
          )}
          {(type === "roi_change" || type === "new_listing") && (
            <div style={{ marginBottom:20 }}>
              <label style={{ color:"#9AA2B8", fontSize:12, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:8 }}>Min ROI %</label>
              <input type="number" value={minROI} onChange={e => setMinROI(e.target.value)} placeholder="e.g. 12"
                style={{ width:"100%", padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"#EEF2FF", fontSize:14, outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", boxSizing:"border-box" }} />
            </div>
          )}

          {/* Save */}
          <button onClick={handleSave}
            style={{ width:"100%", padding:"14px", borderRadius:14, background:`linear-gradient(135deg,${GOLD},#b8943e)`, border:"none", color:"#040b14", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            {alert ? "Update Alert" : "Create Alert"}
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── Alert card ─────────────────────────────────────────────────── */
  function AlertCard({ alert, onToggle, onDelete, onEdit }: { alert: PriceAlert; onToggle: () => void; onDelete: () => void; onEdit: () => void }) {
    const typeCfg = ALERT_TYPES.find(t => t.value === alert.type)!;
    const Icon = typeCfg.icon;

    return (
      <motion.div layout initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
        style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${alert.active ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius:18, padding:20, transition:"border-color 0.3s" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
          {/* Type icon */}
          <div style={{ width:44, height:44, borderRadius:12, background:`${typeCfg.color}18`, border:`1px solid ${typeCfg.color}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon size={20} color={typeCfg.color} />
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ color:"#EEF2FF", fontWeight:700, fontSize:15, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{alert.title}</span>
              {!alert.active && <span style={{ fontSize:10, color:"#4a6080", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"2px 7px", fontWeight:600 }}>PAUSED</span>}
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 }}>
              <span style={{ fontSize:11, color:typeCfg.color, background:`${typeCfg.color}15`, border:`1px solid ${typeCfg.color}30`, borderRadius:6, padding:"2px 8px", fontWeight:600 }}>{typeCfg.label}</span>
              <span style={{ fontSize:11, color:"#9AA2B8", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"2px 8px", display:"flex", alignItems:"center", gap:3 }}>
                <MapPin size={9} /> {alert.city}
              </span>
              <span style={{ fontSize:11, color:"#9AA2B8", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"2px 8px" }}>{alert.category}</span>
              {alert.maxPrice && <span style={{ fontSize:11, color:"#10b981", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:6, padding:"2px 8px", fontWeight:600 }}>≤ {formatPrice(alert.maxPrice)}</span>}
              {alert.minROI && <span style={{ fontSize:11, color:"#8b5cf6", background:"rgba(139,92,246,0.08)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:6, padding:"2px 8px", fontWeight:600 }}>ROI ≥ {alert.minROI}%</span>}
            </div>
            <div style={{ display:"flex", gap:16, fontSize:11, color:"#4a6080" }}>
              <span>Created {timeAgo(alert.createdAt)}</span>
              {alert.lastTriggered && <span style={{ color:"#10b981" }}>Last triggered {timeAgo(alert.lastTriggered)}</span>}
              {alert.triggerCount > 0 && <span style={{ color:GOLD }}>{alert.triggerCount} alerts sent</span>}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            <button onClick={onEdit}
              style={{ padding:"7px", borderRadius:10, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", cursor:"pointer", color:"#9AA2B8", transition:"all 0.2s" }}>
              <Edit2 size={14} />
            </button>
            <button onClick={onToggle}
              style={{ padding:"7px 12px", borderRadius:10, background: alert.active ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)", border:`1px solid ${alert.active ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)"}`, cursor:"pointer", color: alert.active ? "#10b981" : "#4a6080", fontSize:12, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:4, transition:"all 0.2s" }}>
              {alert.active ? <><Check size={12} /> ON</> : <><BellOff size={12} /> OFF</>}
            </button>
            <button onClick={onDelete}
              style={{ padding:"7px", borderRadius:10, background:"rgba(244,63,94,0.06)", border:"1px solid rgba(244,63,94,0.15)", cursor:"pointer", color:"#f43f5e", transition:"all 0.2s" }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Stats bar ──────────────────────────────────────────────────── */
  function StatsBar({ alerts }: { alerts: PriceAlert[] }) {
    const active = alerts.filter(a => a.active).length;
    const total  = alerts.reduce((s, a) => s + a.triggerCount, 0);
    const cities = new Set(alerts.map(a => a.city)).size;

    return (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:28 }}>
        {[
          { label:"Active Alerts", value:active, icon:Bell, color:GOLD },
          { label:"Alerts Sent", value:total, icon:Zap, color:"#10b981" },
          { label:"Cities Watched", value:cities, icon:MapPin, color:"#8b5cf6" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"16px", textAlign:"center" }}>
              <Icon size={20} color={s.color} style={{ marginBottom:8 }} />
              <div style={{ color:s.color, fontSize:24, fontWeight:800, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{s.value}</div>
              <div style={{ color:"#4a6080", fontSize:11, marginTop:2 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ── Main page ──────────────────────────────────────────────────── */
  export default function PriceAlerts() {
    const { user } = useUser();
    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editAlert, setEditAlert] = useState<PriceAlert | undefined>();
    const [filter, setFilter] = useState<"all" | PriceAlert["type"]>("all");

    useEffect(() => {
      const stored = loadAlerts();
      setAlerts(stored.length ? stored : seedDemoAlerts());
    }, []);

    const persist = (next: PriceAlert[]) => { setAlerts(next); saveAlerts(next); };

    const handleSave = (a: PriceAlert) => {
      const existing = alerts.find(x => x.id === a.id);
      persist(existing ? alerts.map(x => x.id === a.id ? a : x) : [a, ...alerts]);
      setShowModal(false); setEditAlert(undefined);
    };
    const handleToggle = (id: string) => persist(alerts.map(a => a.id === id ? { ...a, active: !a.active } : a));
    const handleDelete = (id: string) => persist(alerts.filter(a => a.id !== id));

    const filtered = filter === "all" ? alerts : alerts.filter(a => a.type === filter);

    return (
      <div style={{ minHeight:"100dvh", background:BG }}>
        {/* Ambient glow */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:600, height:250, borderRadius:"50%", background:"rgba(201,168,76,0.04)", filter:"blur(100px)" }} />
        </div>
        <Navbar />
        <div style={{ paddingTop:56, maxWidth:720, margin:"0 auto", padding:"72px 16px 120px", position:"relative" }}>

          {/* Header */}
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:28 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:999, padding:"5px 14px", marginBottom:12 }}>
              <Target size={12} color={GOLD} />
              <span style={{ color:GOLD, fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>Intelligence Layer</span>
            </div>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
              <div>
                <h1 style={{ color:"#EEF2FF", fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:700, margin:0, lineHeight:1.2 }}>Price Alert Command</h1>
                <p style={{ color:"#4a6080", fontSize:14, marginTop:6 }}>Real-time intelligence on property prices & market shifts</p>
              </div>
              <button onClick={() => { setEditAlert(undefined); setShowModal(true); }}
                style={{ padding:"11px 20px", borderRadius:14, background:`linear-gradient(135deg,${GOLD},#b8943e)`, border:"none", color:"#040b14", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                <Plus size={14} /> New Alert
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          {alerts.length > 0 && <StatsBar alerts={alerts} />}

          {/* Filter pills */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            {[{ value:"all", label:"All Alerts" }, ...ALERT_TYPES.map(t => ({ value:t.value, label:t.label }))].map(f => (
              <button key={f.value} onClick={() => setFilter(f.value as typeof filter)}
                style={{ padding:"7px 16px", borderRadius:999, fontSize:12, fontWeight:600, border:`1px solid ${filter===f.value ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`,
                  background: filter===f.value ? "rgba(201,168,76,0.1)" : "transparent", color: filter===f.value ? GOLD : "#4a6080", cursor:"pointer", transition:"all 0.2s", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Alerts list */}
          {filtered.length === 0 && alerts.length === 0 ? (
            <EmptyState onAdd={() => setShowModal(true)} />
          ) : (
            <motion.div style={{ display:"flex", flexDirection:"column", gap:12 }} layout>
              <AnimatePresence>
                {filtered.map(a => (
                  <AlertCard key={a.id} alert={a}
                    onToggle={() => handleToggle(a.id)}
                    onDelete={() => handleDelete(a.id)}
                    onEdit={() => { setEditAlert(a); setShowModal(true); }} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Info note */}
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
            style={{ marginTop:32, padding:"16px 20px", borderRadius:16, background:"rgba(201,168,76,0.04)", border:"1px solid rgba(201,168,76,0.12)", display:"flex", gap:12, alignItems:"flex-start" }}>
            <AlertCircle size={16} color={GOLD} style={{ flexShrink:0, marginTop:1 }} />
            <p style={{ color:"#9AA2B8", fontSize:13, lineHeight:1.6, margin:0 }}>
              Alerts are currently stored locally on this device. Sign in and enable notifications in <Link href={basePath+"/notification-settings"} style={{ color:GOLD, textDecoration:"none", fontWeight:600 }}>Notification Settings</Link> to receive push alerts on new listings and price drops in real-time.
            </p>
          </motion.div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && <AlertModal alert={editAlert} onSave={handleSave} onClose={() => { setShowModal(false); setEditAlert(undefined); }} />}
        </AnimatePresence>
      </div>
    );
  }
  