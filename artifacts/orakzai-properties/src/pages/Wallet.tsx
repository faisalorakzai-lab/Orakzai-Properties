import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Link, useLocation } from "wouter";
import {
  Search, Bell, ChevronRight, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, RefreshCw, TrendingUp, TrendingDown, Plus,
  Shield, Layers, Cpu, BarChart3, Repeat, Home, FolderOpen,
  Wallet2, User, Star, MapPin, CheckCircle2, Sparkles,
  DollarSign, Activity, Clock, BadgeCheck, Settings, LogOut,
  CreditCard, Globe, Eye, EyeOff, ChevronDown, ChevronUp,
  Zap, Lock, Copy, ExternalLink, Building2, PieChart as PieChartIcon,
  TrendingDown as TrendingDownIcon, AlertCircle, X, Check,
  MoreHorizontal, Send, Download, Upload,
} from "lucide-react";
import {
  getWallet, createWallet, deposit, getTxns,
  type WalletState, type Currency,
} from "@/lib/walletEngine";
import { supabase } from "@/lib/supabase";

/* ─── Design System ──────────────────────────────────────────────────────────── */
const T = {
  bg:       "#04080F",
  panel:    "rgba(255,255,255,0.028)",
  panelHov: "rgba(255,255,255,0.05)",
  border:   "rgba(255,255,255,0.065)",
  borderHov:"rgba(201,168,76,0.35)",
  gold:     "#C9A84C",
  goldBright:"#E8C060",
  goldGlow: "rgba(201,168,76,0.18)",
  goldFaint:"rgba(201,168,76,0.06)",
  fg:       "#EEF2FF",
  dim:      "#6B7591",
  dimMid:   "#9AA2B8",
  green:    "#10B981",
  greenGlow:"rgba(16,185,129,0.18)",
  red:      "#F43F5E",
  redGlow:  "rgba(244,63,94,0.18)",
  purple:   "#8B5CF6",
  cyan:     "#22D3EE",
  sidebar:  "rgba(8,12,24,0.96)",
};

/* ─── Fake-live chart data ────────────────────────────────────────────────────── */
const BASE_CHART = [
  {m:"Jan",v:18500000,usd:66700},{m:"Feb",v:19200000,usd:69100},
  {m:"Mar",v:20100000,usd:72400},{m:"Apr",v:19800000,usd:71300},
  {m:"May",v:21500000,usd:77400},{m:"Jun",v:23000000,usd:82800},
  {m:"Jul",v:22200000,usd:79900},{m:"Aug",v:24100000,usd:86800},
  {m:"Sep",v:25300000,usd:91100},{m:"Oct",v:26800000,usd:96500},
  {m:"Nov",v:27200000,usd:97900},{m:"Dec",v:28790450,usd:103600},
];

const INCOME_DATA = [
  {m:"Jan",v:220000},{m:"Feb",v:245000},{m:"Mar",v:268000},
  {m:"Apr",v:290000},{m:"May",v:315000},{m:"Jun",v:345750},
];

const ALLOCATION = [
  {name:"Real Estate",value:53,color:T.gold,    amount:"PKR 15,250,000"},
  {name:"Crypto",     value:30,color:T.purple,  amount:"PKR 8,750,450"},
  {name:"Fiat",       value:17,color:T.cyan,    amount:"PKR 4,790,000"},
];

const ASSETS = [
  {name:"USDT",  sub:"Tether USD",         icon:"₮", color:T.green,  bg:"rgba(16,185,129,0.1)",   bal:4250.80, unit:"USDT", pkr:1181972,  chg:+0.02, spark:[4240,4242,4248,4250,4249,4251]},
  {name:"USDC",  sub:"USD Coin",           icon:"$", color:T.cyan,   bg:"rgba(34,211,238,0.1)",   bal:1980.50, unit:"USDC", pkr:550699,   chg:-0.01, spark:[1982,1980,1979,1981,1980,1980]},
  {name:"OKBOND",sub:"Orakzai Bond Token", icon:"◈", color:T.gold,   bg:"rgba(201,168,76,0.1)",   bal:2250.00, unit:"OKB",  pkr:5625000,  chg:+2.34, spark:[80,83,85,87,86,88]},
  {name:"PKR",   sub:"Pakistani Rupee",    icon:"₨", color:T.dimMid, bg:"rgba(107,117,145,0.1)",  bal:4790000, unit:"PKR",  pkr:4790000,  chg:0,     spark:[4790000,4790000,4790000,4790000,4790000,4790000]},
  {name:"Shares",sub:"Property Shares",    icon:"🏢",color:T.purple, bg:"rgba(139,92,246,0.1)",   bal:320,     unit:"SHR",  pkr:2560000,  chg:+3.21, spark:[300,305,310,315,318,320]},
];

const PROPERTIES = [
  {
    name:"Orakzai Heights",  loc:"DHA Phase 6, Lahore",
    own:35, value:"PKR 8.75M", roi:12.45, badge:"Sovereign",
    img:"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80",
    status:"Active", yield:"PKR 125,000/mo",
  },
  {
    name:"Ocean Tower",      loc:"Dubai Maritime City",
    own:25, value:"PKR 4.25M", roi:9.75,  badge:"Verified",
    img:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80",
    status:"Active", yield:"PKR 145,750/mo",
  },
  {
    name:"Business Hub",     loc:"Bahria Town, Karachi",
    own:20, value:"PKR 2.85M", roi:11.20, badge:"Verified",
    img:"https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80",
    status:"Active", yield:"PKR 75,000/mo",
  },
];

const PAYOUTS = [
  {name:"Orakzai Heights",     date:"30 Jun 2025", amount:"+PKR 125,000", color:T.green},
  {name:"Orakzai Ocean Tower", date:"05 Jul 2025", amount:"+PKR 145,750", color:T.green},
  {name:"Business Hub",        date:"10 Jul 2025", amount:"+PKR 75,000",  color:T.green},
];

const MARKETS = [
  {city:"Karachi",  flag:"🇵🇰", pct:9.25,  roi:11.20, spark:[7,8,8.5,9,8.8,9.25]},
  {city:"Dubai",    flag:"🇦🇪", pct:12.45, roi:13.75, spark:[10,11,12,11.5,12.1,12.45]},
  {city:"Lahore",   flag:"🇵🇰", pct:7.85,  roi:10.45, spark:[6,7,7.2,7.5,7.8,7.85]},
];

const NAV = [
  {icon:Home,       label:"Home",      href:"/"},
  {icon:Building2,  label:"Browse",    href:"/browse"},
  {icon:PieChartIcon,label:"Portfolio",href:"/portfolio"},
  {icon:BarChart3,  label:"Trading",   href:"/trading"},
  {icon:Wallet2,    label:"Wallet",    href:"/wallet"},
  {icon:User,       label:"Profile",   href:"/profile"},
];

const QUICK = [
  {label:"Deposit",   icon:ArrowDownToLine, color:T.green,  glow:T.greenGlow},
  {label:"Withdraw",  icon:ArrowUpFromLine, color:T.red,    glow:T.redGlow},
  {label:"Transfer",  icon:Send,            color:T.cyan,   glow:"rgba(34,211,238,0.18)"},
  {label:"Convert",   icon:Repeat,          color:T.purple, glow:"rgba(139,92,246,0.18)"},
  {label:"Buy",       icon:Layers,          color:T.gold,   glow:T.goldGlow},
  {label:"AI Advisor",icon:Sparkles,        color:"#F97316",glow:"rgba(249,115,22,0.18)"},
];

const basePath = () => (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const bp = basePath;

/* ─── Formatters ─────────────────────────────────────────────────────────────── */
function fmtPKR(n: number | undefined | null) {
  if (n === undefined || n === null || isNaN(n)) return "PKR 0";
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `PKR ${(n / 100_000).toFixed(2)}L`;
  return `PKR ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}
function fmtNum(n: number | undefined | null, d = 2) {
  if (n === undefined || n === null || isNaN(n)) return (0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/* ─── Sparkline ──────────────────────────────────────────────────────────────── */
function Sparkline({ data, color, width = 64, height = 26 }: {
  data: number[]; color: string; width?: number; height?: number;
}) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 2) - 1}`
  ).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${pts} ${width},${height}`}
        fill={`url(#sg-${color.replace("#", "")})`}
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Animated counter ───────────────────────────────────────────────────────── */
function Counter({
  target, prefix = "", suffix = "", decimals = 2, duration = 1600,
}: { target: number; prefix?: string; suffix?: string; decimals?: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    let raf: number;
    const tick = () => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(target * ease);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return <>{prefix}{fmtNum(val, decimals)}{suffix}</>;
}

/* ─── Glass card ─────────────────────────────────────────────────────────────── */
function GlassCard({
  children, style = {}, hover = true, glow,
}: { children: React.ReactNode; style?: React.CSSProperties; hover?: boolean; glow?: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.panel,
        border: `1px solid ${hovered && glow ? glow : T.border}`,
        borderRadius: 18,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: hovered && glow
          ? `0 0 32px ${glow}, inset 0 1px 0 rgba(255,255,255,0.06)`
          : `inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: "border-color .25s, box-shadow .25s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Tooltip components ─────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,14,28,0.95)", border: `1px solid ${T.border}`,
      borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(16px)",
    }}>
      <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: T.fg }}>{fmtPKR(payload[0].value)}</div>
    </div>
  );
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(8,14,28,0.95)", border: `1px solid ${T.border}`,
      borderRadius: 10, padding: "8px 12px",
    }}>
      <div style={{ fontSize: 11, color: T.fg, fontWeight: 700 }}>{payload[0].name}</div>
      <div style={{ fontSize: 12, color: T.gold, fontWeight: 800 }}>{payload[0].value}%</div>
    </div>
  );
}

/* ─── Deposit Modal ──────────────────────────────────────────────────────────── */
function DepositModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [cur, setCur] = useState<Currency>("USDT");
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    deposit(cur, n, `${cur} Deposit`);
    setLoading(false);
    setDone(true);
    setTimeout(() => { setDone(false); onDone(); onClose(); }, 1400);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 9999, padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "rgba(10,14,26,0.98)", border: `1px solid ${T.border}`,
          borderRadius: 22, padding: 28, width: "100%", maxWidth: 420,
          boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 60px ${T.goldGlow}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.fg }}>Deposit Funds</div>
            <div style={{ fontSize: 12, color: T.dim, marginTop: 2 }}>Add to your Orakzai wallet</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Currency selector */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
          {(["USDT","USDC","OKBOND","PKR"] as Currency[]).map(c => (
            <button
              key={c}
              onClick={() => setCur(c)}
              style={{
                padding: "10px 4px", borderRadius: 12, border: `1px solid ${cur === c ? T.gold : T.border}`,
                background: cur === c ? T.goldFaint : "rgba(255,255,255,0.02)",
                color: cur === c ? T.gold : T.dim, fontSize: 11, fontWeight: 700,
                cursor: "pointer", transition: "all .2s",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Amount input */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
          borderRadius: 14, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 20, color: T.dim }}>
            {cur === "PKR" ? "₨" : cur === "USDT" ? "₮" : cur === "USDC" ? "$" : "◈"}
          </span>
          <input
            type="number" placeholder="0.00" value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{
              background: "none", border: "none", outline: "none",
              fontSize: 22, fontWeight: 800, color: T.fg, width: "100%",
              fontVariantNumeric: "tabular-nums",
            }}
          />
          <span style={{ fontSize: 12, color: T.dim, flexShrink: 0 }}>{cur}</span>
        </div>

        {/* Quick amounts */}
        <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
          {[100, 500, 1000, 5000].map(v => (
            <button
              key={v}
              onClick={() => setAmount(String(v))}
              style={{
                flex: 1, padding: "6px 4px", borderRadius: 8, border: `1px solid ${T.border}`,
                background: "rgba(255,255,255,0.03)", color: T.dim, fontSize: 10, fontWeight: 600, cursor: "pointer",
              }}
            >
              {v.toLocaleString()}
            </button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={!amount || loading}
          style={{
            width: "100%", padding: "14px", borderRadius: 14,
            background: done
              ? `linear-gradient(135deg, ${T.green}, #059669)`
              : `linear-gradient(135deg, ${T.gold}, #A07030)`,
            border: "none", color: done ? "#fff" : "#0a0800",
            fontSize: 15, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: !amount || loading ? 0.6 : 1,
            transition: "all .3s",
          }}
        >
          {done ? <><Check size={16} /> Deposited!</> :
            loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw size={16} /></motion.div> :
              <><ArrowDownToLine size={16} /> Confirm Deposit</>}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Create wallet screen ───────────────────────────────────────────────────── */
function CreateWalletScreen({ onCreate }: { onCreate: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleCreate = () => {
    setLoading(true);
    setTimeout(() => { createWallet(); onCreate(); }, 1200);
  };
  return (
    <div style={{
      minHeight: "100dvh", background: T.bg, display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .6 }}
        style={{ textAlign: "center", maxWidth: 380 }}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            width: 96, height: 96, borderRadius: "50%",
            background: `radial-gradient(circle, ${T.gold}50, ${T.gold}20, transparent)`,
            border: `1px solid ${T.gold}40`, display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 28px",
            boxShadow: `0 0 60px ${T.goldGlow}`,
          }}
        >
          <Wallet2 size={40} color={T.gold} />
        </motion.div>
        <div style={{ fontSize: 26, fontWeight: 900, color: T.fg, marginBottom: 10, letterSpacing: "-0.02em" }}>
          Initialize Your Wallet
        </div>
        <div style={{ fontSize: 14, color: T.dim, lineHeight: 1.7, marginBottom: 32 }}>
          Your institutional-grade global property investment wallet. Manage OKBOND, USDT, USDC, PKR, and Real Estate holdings.
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          style={{
            padding: "15px 36px", borderRadius: 14,
            background: `linear-gradient(135deg, ${T.gold}, #A07030)`,
            border: "none", color: "#0a0800", fontSize: 15, fontWeight: 800,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8, margin: "0 auto",
          }}
        >
          {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw size={16} /></motion.div> : <Zap size={16} />}
          {loading ? "Initializing..." : "Create Wallet"}
        </motion.button>
      </motion.div>
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────────────────────── */
function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [loc] = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 220 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        background: T.sidebar, borderRight: `1px solid ${T.border}`,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        zIndex: 100, display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? "20px 0" : "20px 18px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        minHeight: 68,
      }}>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .1 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: T.fg, letterSpacing: "0.04em" }}>ORAKZAI</div>
            <div style={{ fontSize: 9, color: T.gold, letterSpacing: "0.12em", marginTop: 1 }}>PROPERTIES</div>
          </motion.div>
        )}
        <button
          onClick={onToggle}
          style={{
            background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
            borderRadius: 8, padding: 6, cursor: "pointer", color: T.dim,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ icon: Icon, label, href }) => {
          const active = loc === href || (href === "/wallet" && loc.includes("wallet"));
          return (
            <Link key={label} href={`${bp()}${href}`}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 3 }}
                style={{
                  display: "flex", alignItems: "center",
                  gap: collapsed ? 0 : 12,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: collapsed ? "12px 0" : "11px 14px",
                  borderRadius: 12,
                  background: active ? T.goldFaint : "transparent",
                  border: `1px solid ${active ? T.borderHov : "transparent"}`,
                  cursor: "pointer", position: "relative",
                  transition: "all .2s",
                }}
              >
                {/* Active rail glow */}
                {active && (
                  <motion.div
                    layoutId="sidebar-glow"
                    style={{
                      position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                      width: 3, height: "60%", borderRadius: "0 3px 3px 0",
                      background: `linear-gradient(180deg, ${T.goldBright}, ${T.gold})`,
                      boxShadow: `0 0 12px ${T.gold}`,
                    }}
                  />
                )}
                <Icon
                  size={16}
                  color={active ? T.gold : T.dim}
                  style={{ flexShrink: 0 }}
                />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      color: active ? T.fg : T.dim, whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 8px", borderTop: `1px solid ${T.border}` }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 10, padding: collapsed ? "10px 0" : "10px 12px",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.gold}, #8B6020)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "#0a0800", flexShrink: 0,
          }}>F</div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.fg }}>Faisal</div>
              <div style={{ fontSize: 9, color: T.gold }}>Premium Member</div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

/* ─── Mobile Bottom Nav ──────────────────────────────────────────────────────── */
function MobileNav() {
  const [loc] = useLocation();
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: "rgba(4,8,15,0.95)", borderTop: `1px solid ${T.border}`,
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      display: "flex", padding: "8px 0 calc(8px + env(safe-area-inset-bottom))",
    }}>
      {NAV.map(({ icon: Icon, label, href }) => {
        const active = loc === href || (href === "/wallet" && loc.includes("wallet"));
        return (
          <Link key={label} href={`${bp()}${href}`} style={{ flex: 1, textDecoration: "none" }}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "4px 0",
            }}>
              <motion.div
                whileTap={{ scale: 0.88 }}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? T.goldFaint : "transparent",
                  border: `1px solid ${active ? T.borderHov : "transparent"}`,
                }}
              >
                <Icon size={18} color={active ? T.gold : T.dim} />
              </motion.div>
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, color: active ? T.gold : T.dim }}>
                {label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ─── Portfolio Hero Chart ───────────────────────────────────────────────────── */
function PortfolioHero({ wallet, totalNW }: { wallet: WalletState; totalNW: number }) {
  const [timeframe, setTimeframe] = useState("1Y");
  const [hideBalance, setHideBalance] = useState(false);

  const totalUSD = totalNW / 278;

  return (
    <GlassCard style={{ padding: "28px 24px 22px", marginBottom: 16 }} glow={T.goldGlow}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: T.dim, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            Total Portfolio Value
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{
              fontSize: 36, fontWeight: 900, color: T.fg,
              fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em",
              filter: hideBalance ? "blur(10px)" : "none", transition: "filter .2s",
              userSelect: hideBalance ? "none" : "auto",
            }}>
              <Counter target={totalNW} prefix="PKR " suffix="" decimals={0} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 13, color: T.dimMid }}>
              ≈ USD <Counter target={totalUSD} decimals={0} />
            </span>
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 12, fontWeight: 700, color: T.green,
              background: T.greenGlow, border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 20, padding: "3px 10px",
            }}>
              <TrendingUp size={11} /> +18.4% YTD
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setHideBalance(!hideBalance)}
            style={{
              background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
              borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: T.dim,
            }}
          >
            {hideBalance ? <Eye size={14} /> : <EyeOff size={14} />}
          </motion.button>
          <div style={{
            background: T.goldFaint, border: `1px solid ${T.borderHov}`,
            borderRadius: 10, padding: "6px 12px", fontSize: 10, fontWeight: 700, color: T.gold,
          }}>
            LIVE
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ display: "inline-block", marginLeft: 5, width: 6, height: 6, borderRadius: "50%", background: T.gold, verticalAlign: "middle" }}
            />
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <div style={{ height: 170, marginBottom: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={BASE_CHART} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.gold} stopOpacity={0.3} />
                <stop offset="60%" stopColor={T.gold} stopOpacity={0.08} />
                <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 9, fill: T.dim }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotoneX" dataKey="v"
              stroke={T.gold} strokeWidth={2.2}
              fill="url(#portfolioGrad)"
              dot={false}
              activeDot={{ r: 5, fill: T.gold, stroke: T.bg, strokeWidth: 2, filter: `drop-shadow(0 0 6px ${T.gold})` }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Timeframe selector */}
      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
        {["1W","1M","3M","6M","1Y","ALL"].map(t => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            style={{
              padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700,
              border: `1px solid ${timeframe === t ? T.gold : T.border}`,
              background: timeframe === t ? T.goldFaint : "transparent",
              color: timeframe === t ? T.gold : T.dim, cursor: "pointer", transition: "all .2s",
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

/* ─── Asset Token Row ────────────────────────────────────────────────────────── */
function AssetRow({ a, i }: { a: typeof ASSETS[0]; i: number }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.tr
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.06 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderBottom: `1px solid rgba(255,255,255,0.04)`,
        background: hov ? "rgba(255,255,255,0.025)" : "transparent",
        transition: "background .15s",
      }}
    >
      <td style={{ padding: "12px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: a.bg, border: `1px solid ${a.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, color: a.color, fontWeight: 800, flexShrink: 0,
            boxShadow: hov ? `0 0 16px ${a.color}30` : "none", transition: "box-shadow .2s",
          }}>
            {a.icon}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{a.name}</div>
            <div style={{ fontSize: 9, color: T.dim }}>{a.sub}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.fg, fontVariantNumeric: "tabular-nums" }}>
          {fmtNum(a.bal, 2)}
        </div>
        <div style={{ fontSize: 9, color: T.dim }}>{a.unit}</div>
      </td>
      <td style={{ padding: "12px 10px" }}>
        {a.chg !== 0 ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            color: a.chg > 0 ? T.green : T.red,
            fontSize: 11, fontWeight: 700,
            background: a.chg > 0 ? T.greenGlow : T.redGlow,
            border: `1px solid ${a.chg > 0 ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}`,
            borderRadius: 20, padding: "2px 8px",
          }}>
            {a.chg > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {a.chg > 0 ? "+" : ""}{a.chg.toFixed(2)}%
          </span>
        ) : <span style={{ color: T.dim, fontSize: 11 }}>—</span>}
      </td>
      <td style={{ padding: "12px 10px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{fmtPKR(a.pkr)}</div>
      </td>
      <td style={{ padding: "12px 12px" }}>
        <Sparkline data={a.spark} color={a.chg >= 0 ? T.green : T.red} width={66} height={26} />
      </td>
    </motion.tr>
  );
}

/* ─── Property Card ──────────────────────────────────────────────────────────── */
function PropertyCard({ p, i }: { p: typeof PROPERTIES[0]; i: number }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: .3 + i * .1, type: "spring", stiffness: 200, damping: 22 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        minWidth: 210, flexShrink: 0,
        background: T.panel, border: `1px solid ${hov ? T.borderHov : T.border}`,
        borderRadius: 18, overflow: "hidden", cursor: "pointer",
        boxShadow: hov ? `0 16px 48px rgba(0,0,0,0.5), 0 0 24px ${T.goldGlow}` : "0 4px 20px rgba(0,0,0,0.3)",
        transition: "all .3s",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 126, overflow: "hidden" }}>
        <img
          src={p.img} alt={p.name}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hov ? "scale(1.06)" : "scale(1)", transition: "transform .4s",
          }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        {/* Dark overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(4,8,15,0.1) 0%, rgba(4,8,15,0.65) 100%)",
        }} />
        {/* Badge */}
        <div style={{
          position: "absolute", top: 10, left: 10,
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.4)",
          borderRadius: 20, padding: "3px 9px", fontSize: 9, color: T.gold, fontWeight: 700,
        }}>
          <BadgeCheck size={9} /> {p.badge}
        </div>
        {/* ROI badge */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: T.greenGlow, border: "1px solid rgba(16,185,129,0.35)",
          borderRadius: 20, padding: "3px 9px", fontSize: 9, color: T.green, fontWeight: 700,
        }}>
          {p.roi}% APY
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 14px 12px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.fg, marginBottom: 4 }}>{p.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.dim, marginBottom: 12 }}>
          <MapPin size={9} />{p.loc}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            ["Ownership", `${p.own}%`],
            ["Market Val", p.value],
            ["Yield", p.yield],
            ["Status", p.status],
          ].map(([l, v]) => (
            <div key={l} style={{
              background: "rgba(255,255,255,0.025)", borderRadius: 8,
              padding: "7px 8px", border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontSize: 8, color: T.dim, marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: l === "Status" ? T.green : T.fg }}>{v}</div>
            </div>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          style={{
            width: "100%", padding: "8px 12px", borderRadius: 10,
            border: `1px solid ${hov ? T.borderHov : T.border}`,
            background: hov ? T.goldFaint : "rgba(255,255,255,0.03)",
            color: hov ? T.gold : T.dim, fontSize: 10, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "space-between", transition: "all .2s",
          }}
        >
          View Details <ChevronRight size={11} />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────────── */
function Dashboard({ wallet, onReload }: { wallet: WalletState; onReload: () => void }) {
  const [showDeposit, setSD] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [txns, setTxns] = useState(() => getTxns().slice(0, 8));

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Live txn subscription via Supabase realtime
  useEffect(() => {
    const channel = supabase
      .channel("wallet-txns")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        setTxns(getTxns().slice(0, 8));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const sideW = isMobile ? 0 : sidebarCollapsed ? 68 : 220;

  const totalNW =
    wallet.balances.PKR +
    wallet.balances.USDT * 278 +
    wallet.balances.USDC * 278 +
    wallet.balances.OKBOND * 88 +
    14_125_000; // property portfolio PKR equivalent

  const RECENT = txns.map(t => ({
    label: t.type === "deposit" ? `${t.currency} Deposit` : `Trade — ${(t as any).ticker ?? ""}`,
    sub: t.type === "deposit" ? t.note || "Wallet top-up" : `${(t as any).side} @ ${(t as any).price ?? ""}`,
    date: new Date(t.time).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }),
    amount: t.type === "deposit"
      ? `+${fmtNum(t.amount, 2)} ${t.currency}`
      : `${(t as any).side === "BUY" ? "-" : "+"}${fmtNum((t as any).netTotal ?? 0, 4)} ${(t as any).quote ?? ""}`,
    isPos: t.type === "deposit" || (t as any).side === "SELL",
  }));

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, display: "flex" }}>

      {/* ── Sidebar (desktop) ── */}
      {!isMobile && (
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      )}

      {/* ── Main content ── */}
      <main style={{
        flex: 1, marginLeft: isMobile ? 0 : sideW,
        paddingBottom: isMobile ? 90 : 40,
        transition: "margin-left .3s",
        minWidth: 0,
      }}>
        {/* Top bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(4,8,15,0.88)", backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${T.border}`,
          padding: isMobile ? "12px 16px" : "14px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <div style={{ fontSize: 14, fontWeight: 900, color: T.fg, letterSpacing: "0.04em" }}>ORAKZAI</div>
            )}
            {!isMobile && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.fg }}>Wealth Wallet</div>
                <div style={{ fontSize: 10, color: T.dim }}>Global Property Investment System</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`,
              borderRadius: 10, padding: "8px 12px",
            }}>
              <Search size={13} color={T.dim} />
              {!isMobile && (
                <span style={{ fontSize: 11, color: T.dim }}>Search assets...</span>
              )}
            </div>
            {/* Notifications */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              style={{
                position: "relative", background: "rgba(255,255,255,0.04)",
                border: `1px solid ${T.border}`, borderRadius: 10,
                padding: "8px 10px", cursor: "pointer", color: T.dim,
                display: "flex", alignItems: "center",
              }}
            >
              <Bell size={14} />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: "absolute", top: 6, right: 6, width: 6, height: 6,
                  borderRadius: "50%", background: T.red, border: `1px solid ${T.bg}`,
                }}
              />
            </motion.button>
            {/* Deposit CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSD(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 10,
                background: `linear-gradient(135deg, ${T.gold}, #A07030)`,
                border: "none", color: "#0a0800", fontSize: 11,
                fontWeight: 800, cursor: "pointer",
              }}
            >
              <Plus size={13} />{!isMobile && "Deposit"}
            </motion.button>
          </div>
        </div>

        {/* ── Content Area ── */}
        <div style={{ padding: isMobile ? "16px 14px" : "24px 28px", maxWidth: 1280, margin: "0 auto" }}>

          {/* ── Portfolio Hero ── */}
          <PortfolioHero wallet={wallet} totalNW={totalNW} />

          {/* ── Stats Row ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)",
            gap: 12, marginBottom: 16,
          }}>
            {[
              { label: "Monthly Yield",  value: "PKR 345,750",  sub: "+8.65% vs last mo", color: T.green,  icon: TrendingUp },
              { label: "Properties Owned", value: "3 Assets",   sub: "35%, 25%, 20% stakes", color: T.gold, icon: Building2 },
              { label: "OKBOND Balance",  value: "2,250 OKB",   sub: "≈ PKR 198,000",     color: T.purple, icon: Shield },
              { label: "Next Payout",     value: "Jun 30",       sub: "+PKR 125,000",      color: T.cyan,   icon: Clock },
            ].map(({ label, value, sub, color, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <GlassCard style={{ padding: "16px 18px" }} glow={`${color}30`}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      background: `${color}18`, border: `1px solid ${color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={14} color={color} />
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.fg, marginBottom: 4 }}>{value}</div>
                  <div style={{ fontSize: 9, color: T.dim }}>{label}</div>
                  <div style={{ fontSize: 10, color, marginTop: 4, fontWeight: 600 }}>{sub}</div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* ── Quick Actions ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .2 }} style={{ marginBottom: 16 }}
          >
            <GlassCard style={{ padding: 16 }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${isMobile ? 3 : 6}, 1fr)`,
                gap: 8,
              }}>
                {QUICK.map(({ label, icon: Icon, color, glow }) => (
                  <motion.button
                    key={label}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={label === "Deposit" ? () => setSD(true) : undefined}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 7, padding: "12px 6px", borderRadius: 14,
                      border: `1px solid rgba(255,255,255,0.06)`,
                      background: "rgba(255,255,255,0.025)", cursor: "pointer",
                      transition: "all .2s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${glow}`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: `${color}18`, border: `1px solid ${color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={16} color={color} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: T.dim, textAlign: "center" }}>{label}</span>
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Assets Table + Allocation ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 280px",
            gap: 14, marginBottom: 16,
          }}>
            {/* Assets Table */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 }}>
              <GlassCard style={{ overflow: "hidden" }}>
                <div style={{
                  padding: "16px 18px 14px", borderBottom: `1px solid ${T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Wallet2 size={14} color={T.gold} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>My Assets</span>
                  </div>
                  <button style={{ fontSize: 10, color: T.gold, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                    View All <ChevronRight size={11} />
                  </button>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                        {["Asset", "Balance", "24h", "Value (PKR)", "7D"].map(h => (
                          <th key={h} style={{
                            padding: "8px 12px", textAlign: "left",
                            color: T.dim, fontWeight: 600, fontSize: 9,
                            letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ASSETS.map((a, i) => <AssetRow key={a.name} a={a} i={i} />)}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: `1px solid ${T.border}` }}>
                        <td colSpan={3} style={{ padding: "12px 12px", fontSize: 11, fontWeight: 700, color: T.dim }}>Total</td>
                        <td colSpan={2} style={{ padding: "12px 12px", fontSize: 14, fontWeight: 900, color: T.gold }}>
                          {fmtPKR(ASSETS.reduce((s, a) => s + a.pkr, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </GlassCard>
            </motion.div>

            {/* Donut Allocation */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}>
              <GlassCard style={{ padding: "18px", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.fg, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <PieChartIcon size={14} color={T.gold} /> Portfolio Allocation
                </div>
                <div style={{ position: "relative", height: 170 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ALLOCATION} cx="50%" cy="50%"
                        innerRadius={52} outerRadius={72}
                        paddingAngle={4} dataKey="value"
                        startAngle={90} endAngle={-270}
                        strokeWidth={0}
                      >
                        {ALLOCATION.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.fg }}>
                      {fmtNum(totalNW / 1_000_000, 2)}M
                    </div>
                    <div style={{ fontSize: 8, color: T.dim }}>PKR</div>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  {ALLOCATION.map(e => (
                    <div key={e.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color }} />
                          <span style={{ fontSize: 11, color: T.dimMid }}>{e.name}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.fg }}>{e.value}%</span>
                      </div>
                      <div style={{
                        height: 3, background: "rgba(255,255,255,0.06)",
                        borderRadius: 2, overflow: "hidden",
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${e.value}%` }}
                          transition={{ duration: 1.2, delay: 0.4 }}
                          style={{ height: "100%", background: e.color, borderRadius: 2 }}
                        />
                      </div>
                      <div style={{ fontSize: 9, color: T.dim, marginTop: 3 }}>{e.amount}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* ── Property Holdings ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .35 }} style={{ marginBottom: 16 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Building2 size={15} color={T.gold} />
                <span style={{ fontSize: 14, fontWeight: 800, color: T.fg }}>Property Holdings</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: T.green,
                  background: T.greenGlow, border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 20, padding: "2px 8px",
                }}>3 Active</span>
              </div>
              <Link href={`${bp()}/browse`}>
                <button style={{ fontSize: 10, color: T.gold, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                  Browse All <ChevronRight size={11} />
                </button>
              </Link>
            </div>

            <div style={{
              display: "flex", gap: 14, overflowX: "auto",
              paddingBottom: 12, scrollbarWidth: "none",
            }}>
              {PROPERTIES.map((p, i) => <PropertyCard key={p.name} p={p} i={i} />)}

              {/* Invest more */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .6 }}
                style={{
                  minWidth: 170, flexShrink: 0,
                  background: T.goldFaint, border: `1px dashed rgba(201,168,76,0.35)`,
                  borderRadius: 18, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  padding: 20, gap: 10, cursor: "pointer",
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  style={{
                    width: 46, height: 46, borderRadius: "50%",
                    background: T.goldGlow, border: `1px solid ${T.borderHov}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Plus size={20} color={T.gold} />
                </motion.div>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.fg, textAlign: "center" }}>New Investment</div>
                <div style={{ fontSize: 9, color: T.dim, textAlign: "center", lineHeight: 1.5 }}>Explore verified properties</div>
                <Link href={`${bp()}/browse`}>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    style={{
                      padding: "8px 18px", borderRadius: 20, border: `1px solid ${T.borderHov}`,
                      background: T.goldFaint, color: T.gold,
                      fontSize: 10, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Invest Now
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* ── Income + AI + Payouts ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
            gap: 14, marginBottom: 16,
          }}>
            {/* Monthly Income */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .4 }}>
              <GlassCard style={{ padding: 18, height: "100%" }}>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 10, color: T.dim }}>Monthly Rental Income</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: T.fg, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                    PKR 345,750
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.green, marginTop: 4 }}>
                    <TrendingUp size={11} /> +8.65% from last month
                  </div>
                </div>
                <div style={{ height: 100, marginTop: 14 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={INCOME_DATA} barSize={18}>
                      <XAxis dataKey="m" tick={{ fontSize: 8, fill: T.dim }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(v: any) => [`PKR ${fmtNum(v, 0)}`, "Income"]}
                        contentStyle={{ background: "rgba(8,14,28,0.95)", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11 }}
                      />
                      <Bar dataKey="v" radius={[5, 5, 0, 0]}>
                        {INCOME_DATA.map((_, i) => (
                          <Cell key={i} fill={i === INCOME_DATA.length - 1 ? T.gold : `${T.gold}40`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>

            {/* AI Copilot */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .45 }}>
              <GlassCard style={{ padding: 18, height: "100%" }} glow={T.goldGlow}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Sparkles size={14} color={T.gold} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>AI Wealth Copilot</span>
                  </div>
                  <div style={{
                    fontSize: 9, color: T.green, background: T.greenGlow,
                    border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, padding: "2px 7px",
                  }}>Live</div>
                </div>
                <div style={{ fontSize: 9, color: T.dim, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                  Market Signal
                </div>
                <div style={{ fontSize: 12, color: T.fg, lineHeight: 1.7, marginBottom: 16 }}>
                  AI suggests <strong style={{ color: T.gold }}>increasing Dubai property exposure by 12%</strong> for better yield opportunities this quarter.
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: `radial-gradient(circle, ${T.gold}60, ${T.gold}20, transparent)`,
                      border: `1px solid ${T.gold}50`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 0 32px ${T.goldGlow}`,
                    }}
                  >
                    <Sparkles size={22} color={T.gold} />
                  </motion.div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{
                    width: "100%", padding: "9px", borderRadius: 10,
                    border: `1px solid rgba(201,168,76,0.35)`,
                    background: T.goldFaint, color: T.gold,
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  View AI Insights
                </motion.button>
              </GlassCard>
            </motion.div>

            {/* Upcoming Payouts */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5 }}>
              <GlassCard style={{ padding: 18, height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Clock size={14} color={T.gold} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>Upcoming Payouts</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {PAYOUTS.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: .5 + i * 0.08 }}
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: 11,
                        background: T.goldFaint, border: `1px solid ${T.borderHov}`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Building2 size={15} color={T.gold} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 9, color: T.dim }}>{p.date}</div>
                      </div>
                      <div style={{
                        fontSize: 11, fontWeight: 800, color: T.green,
                        background: T.greenGlow, border: "1px solid rgba(16,185,129,0.25)",
                        borderRadius: 8, padding: "4px 8px", flexShrink: 0,
                      }}>{p.amount}</div>
                    </motion.div>
                  ))}
                </div>
                <div style={{
                  marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 10, color: T.dim }}>Total Expected</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: T.gold }}>+PKR 345,750</span>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* ── Transactions + Market Pulse ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 14, marginBottom: 16,
          }}>
            {/* Transactions */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .55 }}>
              <GlassCard style={{ overflow: "hidden" }}>
                <div style={{
                  padding: "16px 18px", borderBottom: `1px solid ${T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Activity size={14} color={T.gold} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>Recent Transactions</span>
                  </div>
                  <span style={{
                    fontSize: 9, color: T.green,
                    background: T.greenGlow, border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: 20, padding: "2px 7px", display: "flex", alignItems: "center", gap: 3,
                  }}>
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ width: 4, height: 4, borderRadius: "50%", background: T.green, display: "inline-block" }}
                    /> Live
                  </span>
                </div>
                <div style={{ padding: "0 18px" }}>
                  {(RECENT.length > 0 ? RECENT : [
                    { label: "USDT Deposit", sub: "Welcome bonus", date: "Today", amount: "+500.00 USDT", isPos: true },
                    { label: "OKBOND Allocation", sub: "Onboarding reward", date: "Today", amount: "+250.00 OKB", isPos: true },
                    { label: "PKR Deposit", sub: "Initial balance", date: "Today", amount: "+PKR 100,000", isPos: true },
                  ]).slice(0, 6).map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: .55 + i * 0.06 }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 0",
                        borderBottom: i < 5 ? `1px solid rgba(255,255,255,0.04)` : "none",
                      }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: 11,
                        background: t.isPos ? T.greenGlow : T.redGlow,
                        border: `1px solid ${t.isPos ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {t.isPos
                          ? <ArrowDownToLine size={14} color={T.green} />
                          : <ArrowUpFromLine size={14} color={T.red} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</div>
                        <div style={{ fontSize: 9, color: T.dim }}>{t.sub}</div>
                        <div style={{ fontSize: 8, color: "rgba(107,117,145,0.7)" }}>{t.date}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: t.isPos ? T.green : T.red }}>{t.amount}</div>
                        <div style={{
                          fontSize: 8, color: T.green,
                          background: T.greenGlow, border: "1px solid rgba(16,185,129,0.2)",
                          borderRadius: 10, padding: "1px 6px", marginTop: 3, display: "inline-block",
                        }}>Confirmed</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Market Pulse */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .6 }}>
              <GlassCard style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Globe size={14} color={T.gold} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>Market Pulse</span>
                  </div>
                  <button style={{ fontSize: 10, color: T.gold, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                    Analytics <ChevronRight size={11} />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {MARKETS.map((m, i) => (
                    <motion.div
                      key={m.city}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: .6 + i * 0.08 }}
                      style={{
                        background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}`,
                        borderRadius: 14, padding: "14px 16px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                          <span style={{ fontSize: 15 }}>{m.flag}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: T.fg }}>{m.city}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                          <TrendingUp size={10} color={T.green} />
                          <span style={{ fontSize: 11, fontWeight: 800, color: T.green }}>▲ {m.pct.toFixed(2)}%</span>
                        </div>
                        <div style={{ fontSize: 8, color: T.dim }}>Avg ROI (APY)</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: T.fg }}>{m.roi.toFixed(2)}%</div>
                      </div>
                      <Sparkline data={m.spark} color={T.green} width={80} height={36} />
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* ── Wallet Address + Security ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .65 }}>
            <GlassCard style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Lock size={14} color={T.gold} />
                <span style={{ fontSize: 13, fontWeight: 800, color: T.fg }}>Wallet Security</span>
                <span style={{
                  fontSize: 9, color: T.green,
                  background: T.greenGlow, border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 20, padding: "2px 7px",
                }}>Secured</span>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.025)", border: `1px solid ${T.border}`,
                borderRadius: 12, padding: "12px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                flexWrap: "wrap",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: T.dim, marginBottom: 4 }}>Wallet Address</div>
                  <div style={{ fontSize: 11, color: T.fg, fontFamily: "monospace", wordBreak: "break-all" }}>
                    {wallet.address}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => navigator.clipboard?.writeText(wallet.address)}
                    style={{
                      padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`,
                      background: "rgba(255,255,255,0.04)", color: T.dim,
                      fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <Copy size={11} /> Copy
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      {isMobile && <MobileNav />}

      {/* ── Deposit Modal ── */}
      <AnimatePresence>
        {showDeposit && (
          <DepositModal open={showDeposit} onClose={() => setSD(false)} onDone={onReload} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────────── */
export default function Wallet() {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setWallet(getWallet());
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  if (loading) return (
    <div style={{
      minHeight: "100dvh", background: T.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          style={{
            width: 48, height: 48, borderRadius: "50%",
            border: `2px solid ${T.border}`,
            borderTop: `2px solid ${T.gold}`,
            margin: "0 auto 20px",
          }}
        />
        <div style={{ fontSize: 11, color: T.dim, letterSpacing: "0.1em" }}>LOADING WALLET</div>
      </div>
    </div>
  );

  if (!wallet) return <CreateWalletScreen onCreate={reload} />;
  return <Dashboard wallet={wallet} onReload={reload} />;
}
