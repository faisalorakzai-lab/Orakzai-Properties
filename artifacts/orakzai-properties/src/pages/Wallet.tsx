import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useLocation as useWouterLocation } from "wouter";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Link, useLocation } from "wouter";
import {
  Search, Bell, ChevronRight, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, RefreshCw, TrendingUp, TrendingDown, Plus,
  Shield, Layers, Cpu, BarChart3, Repeat, Home, FolderOpen,
  Wallet2, User, Users, Star, MapPin, CheckCircle2, Sparkles,
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
import { useAppStore } from "@/store/AppStoreContext";
import { useMode } from "@/contexts/ModeContext";
import { useWalletStore } from "@/store/WalletStoreContext";
import { CryptoDepositFlow } from "./CryptoDepositFlow";

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
  {name:"USDT",  sub:"Tether USD",         icon:"₮", logo:"/tokens/logo-usdt.svg",    color:T.green,  bg:"rgba(16,185,129,0.1)",   bal:4250.80, unit:"USDT", pkr:1181972,  chg:+0.02, spark:[4240,4242,4248,4250,4249,4251]},
  {name:"USDC",  sub:"USD Coin",           icon:"$", logo:"/tokens/logo-usdc.svg",    color:T.cyan,   bg:"rgba(34,211,238,0.1)",   bal:1980.50, unit:"USDC", pkr:550699,   chg:-0.01, spark:[1982,1980,1979,1981,1980,1980]},
  {name:"OKBOND",sub:"Orakzai Bond Token", icon:"◈", logo:"/tokens/token-okbond-official.png", color:T.gold,   bg:"rgba(201,168,76,0.1)",   bal:2250.00, unit:"OKB",  pkr:5625000,  chg:+2.34, spark:[80,83,85,87,86,88]},
  {name:"PKR",   sub:"Pakistani Rupee",    icon:"₨", logo:"/tokens/logo-pkr.svg",     color:T.dimMid, bg:"rgba(107,117,145,0.1)",  bal:4790000, unit:"PKR",  pkr:4790000,  chg:0,     spark:[4790000,4790000,4790000,4790000,4790000,4790000]},
  {name:"Shares",sub:"Property Shares",    icon:"🏢", logo:"/tokens/logo-shares.svg", color:T.purple, bg:"rgba(139,92,246,0.1)",   bal:320,     unit:"SHR",  pkr:2560000,  chg:+3.21, spark:[300,305,310,315,318,320]},
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

/* ─── Asset Screen Sub-tabs ──────────────────────────────────────────────────── */
const ASSET_TABS = ["Overview","Real Estate","Spot","Yield / Rental","History"] as const;
type AssetTab = typeof ASSET_TABS[number];

const HERO_SPARKLINE = [27.2,27.8,28.1,27.6,28.9,29.3,28.7,29.8,30.1,29.5,30.4,30.8];

/* ─── Balance Hero (Binance-style) ──────────────────────────────────────────── */
function BalanceHeroSection({ totalNW, onDeposit }: { totalNW: number; onDeposit: () => void }) {
  const [hidden, setHidden] = useState(false);
  const [currency, setCurrency] = useState<"PKR"|"USD">("PKR");
  const pnlAmt = 345750;
  const pnlPct = 2.45;
  const displayVal = currency === "PKR" ? totalNW : Math.round(totalNW / 277.96);
  const prefix = currency === "PKR" ? "Rs" : "$";
  const mask = "••••••";

  return (
    <div style={{ padding: "16px 16px 6px", paddingTop: "calc(env(safe-area-inset-top,10px) + 12px)" }}>
      {/* Est. Total Value label + eye + receipt icon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: T.dim, fontWeight: 500 }}>Est. Total Value</span>
          <button onClick={() => setHidden(h => !h)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
            {hidden ? <EyeOff size={13} color={T.dim} /> : <Eye size={13} color={T.dim} />}
          </button>
        </div>
        <button style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 9px", cursor: "pointer", color: T.dim, fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}>
          <CreditCard size={11} />
        </button>
      </div>

      {/* Large balance + sparkline side by side */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 5 }}>
            <span style={{
              fontSize: 32, fontWeight: 900, color: T.fg, letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums", lineHeight: 1,
              filter: hidden ? "blur(10px)" : "none", transition: "filter .2s",
            }}>
              {prefix} {hidden ? mask : fmtNum(displayVal, 0)}
            </span>
            <button
              onClick={() => setCurrency(c => c === "PKR" ? "USD" : "PKR")}
              style={{ display: "flex", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: T.dimMid, fontSize: 13, fontWeight: 700, padding: "0 2px" }}
            >
              {currency} <ChevronDown size={12} />
            </button>
          </div>
          {/* Today's PNL */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: T.dim }}>Today's PNL</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: hidden ? T.dim : pnlAmt >= 0 ? T.green : T.red }}>
              {hidden ? "****" : `+Rs ${fmtNum(pnlAmt, 0)} (+${pnlPct}%)`}
            </span>
            <ChevronRight size={12} color={T.dim} />
          </div>
        </div>
        {/* Mini sparkline (gold, Binance-style) */}
        <Sparkline data={HERO_SPARKLINE} color={T.gold} width={88} height={44} />
      </div>

      {/* Expand hint */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
        <ChevronDown size={14} color={T.dim} style={{ opacity: 0.45 }} />
      </div>
    </div>
  );
}

/* ─── Quick Actions Row (4-button Binance style) ─────────────────────────────── */
const QUICK_4 = [
  { label: "Add Funds", icon: ArrowDownToLine },
  { label: "Withdraw",  icon: ArrowUpFromLine },
  { label: "Transfer",  icon: ArrowLeftRight  },
  { label: "AI Advisor",icon: Sparkles        },
] as const;

function QuickActionsRow({ onAddFunds, onWithdraw, onTransfer, onAiAdvisor }: { onAddFunds: () => void; onWithdraw: () => void; onTransfer: () => void; onAiAdvisor: () => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, padding: "12px 16px 16px" }}>
      {QUICK_4.map(({ label, icon: Icon }) => (
        <motion.button
          key={label}
          whileTap={{ scale: 0.92 }}
          onClick={label === "Add Funds" ? onAddFunds : label === "Withdraw" ? onWithdraw : label === "Transfer" ? onTransfer : onAiAdvisor}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 9,
            padding: "14px 6px 12px", borderRadius: 14,
            background: "rgba(255,255,255,0.05)", border: `1px solid ${T.border}`,
            cursor: "pointer", transition: "all .2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.borderHov; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
        >
          <Icon size={22} color={T.fg} />
          <span style={{ fontSize: 10, fontWeight: 600, color: T.dimMid, textAlign: "center", lineHeight: 1.2, whiteSpace: "nowrap" }}>{label}</span>
        </motion.button>
      ))}
    </div>
  );
}

/* ─── Select Deposit Method Bottom Sheet ─────────────────────────────────────── */
const DEPOSIT_METHODS = [
  {
    icon: ArrowDownToLine,
    title: "Deposit Asset",
    subtitle: "Deposit Crypto or Tokenized Assets from other exchanges/wallets to OkzByte",
    action: "deposit-asset",
  },
  {
    icon: Send,
    title: "Receive via OkzByte Pay",
    subtitle: "Receive crypto instantly from other OkzByte users using your OkzByte UID / QR Code",
    action: "okzbyte-pay",
  },
  {
    icon: ArrowLeftRight,
    title: "P2P Trading",
    subtitle: "Buy crypto via Bank Transfer, EasyPaisa, JazzCash, and Mobile Payments",
    action: "p2p",
  },
] as const;

function SelectDepositMethodModal({
  open,
  onClose,
  onSelectDepositAsset,
  onSelectOkzBytePay,
  onSelectP2P,
}: {
  open: boolean;
  onClose: () => void;
  onSelectDepositAsset: () => void;
  onSelectOkzBytePay: () => void;
  onSelectP2P: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="select-deposit-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          onClick={onClose}
        >
          <motion.div
            key="select-deposit-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#181A20",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              boxShadow: "0 -8px 60px rgba(0,0,0,0.6)",
              border: `1px solid rgba(255,255,255,0.07)`,
              borderBottom: "none",
              maxHeight: "85vh",
              overflowY: "auto",
              paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 6 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)" }} />
            </div>

            {/* Title */}
            <div style={{ padding: "12px 22px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#EEF2FF", letterSpacing: "-0.01em" }}>
                Select Deposit Method
              </span>
              <button
                onClick={onClose}
                style={{ background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8, padding: "5px 7px", cursor: "pointer", color: "#6B7591", display: "flex", alignItems: "center" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Options */}
            <div style={{ padding: "0 16px", paddingBottom: "calc(112px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 10 }}>
              {DEPOSIT_METHODS.map(({ icon: Icon, title, subtitle, action }) => (
                <motion.button
                  key={action}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (action === "deposit-asset") {
                      onClose();
                      onSelectDepositAsset();
                    } else if (action === "okzbyte-pay") {
                      onClose();
                      onSelectOkzBytePay();
                    } else if (action === "p2p") {
                      onClose();
                      onSelectP2P();
                    } else {
                      onClose();
                    }
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "16px 16px", borderRadius: 16,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "border-color .2s, background .2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.35)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.05)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  }}
                >
                  {/* Icon circle */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={20} color="#9AA2B8" />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#EEF2FF", marginBottom: 4, lineHeight: 1.3 }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7591", lineHeight: 1.5, wordBreak: "break-word" }}>
                      {subtitle}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight size={15} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Select Withdraw Method Bottom Sheet ────────────────────────────────────── */
const WITHDRAW_METHODS = [
  {
    icon: Send,
    title: "Send to OkzByte users",
    subtitle: "OkzByte internal transfer, send via Email/Phone/UID",
    action: "internal",
  },
  {
    icon: Upload,
    title: "Withdraw Asset",
    subtitle: "Withdraw Crypto/Tokens from OkzByte to other exchanges/wallets",
    action: "on-chain",
  },
  {
    icon: Users,
    title: "P2P Trading",
    subtitle: "Sell directly to users. Competitive pricing. Local payments (Bank, EasyPaisa, JazzCash)",
    action: "p2p",
  },
] as const;

function SelectWithdrawMethodModal({
  open,
  onClose,
  onSelectInternal,
  onSelectOnChain,
  onSelectP2P,
}: {
  open: boolean;
  onClose: () => void;
  onSelectInternal: () => void;
  onSelectOnChain: () => void;
  onSelectP2P: () => void;
}) {
  const handleAction = (action: string) => {
    onClose();
    if (action === "internal")  onSelectInternal();
    else if (action === "on-chain") onSelectOnChain();
    else if (action === "p2p")  onSelectP2P();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="select-withdraw-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          onClick={onClose}
        >
          <motion.div
            key="select-withdraw-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#12161C",
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              boxShadow: "0 -8px 60px rgba(0,0,0,0.7)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderBottom: "none",
              maxHeight: "90vh",
              marginBottom: 60,
              paddingBottom: "90px",
              overflowY: "auto",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 6 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)" }} />
            </div>

            {/* Header */}
            <div style={{ padding: "12px 22px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#EEF2FF", letterSpacing: "-0.01em" }}>
                Select Withdraw Method
              </span>
              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "5px 7px", cursor: "pointer",
                  color: "#6B7591", display: "flex", alignItems: "center",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Options */}
            <div style={{
              padding: "0 16px",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              {WITHDRAW_METHODS.map(({ icon: Icon, title, subtitle, action }) => (
                <motion.button
                  key={action}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAction(action)}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "16px 16px", borderRadius: 16,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer", textAlign: "left", width: "100%",
                    transition: "border-color .2s, background .2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)";
                    (e.currentTarget as HTMLElement).style.background   = "rgba(201,168,76,0.05)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLElement).style.background   = "rgba(255,255,255,0.04)";
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={20} color="#9AA2B8" />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#EEF2FF", marginBottom: 4, lineHeight: 1.3 }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7591", lineHeight: 1.5, wordBreak: "break-word" }}>
                      {subtitle}
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight size={15} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Horizontal Allocation Bar ──────────────────────────────────────────────── */
function AllocationBarSection() {
  return (
    <div style={{ padding: "0 16px 14px" }}>
      <div style={{
        background: "rgba(255,255,255,0.035)", border: `1px solid ${T.border}`,
        borderRadius: 14, padding: "12px 14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.dim, letterSpacing: "0.01em" }}>Allocation</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: T.dim, cursor: "pointer" }}>⇅</span>
            <ChevronDown size={13} color={T.dim} style={{ cursor: "pointer" }} />
          </div>
        </div>
        {/* Multi-color bar */}
        <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", gap: 2, marginBottom: 10 }}>
          {ALLOCATION.map(a => (
            <motion.div
              key={a.name}
              initial={{ flex: 0 }}
              animate={{ flex: a.value }}
              transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
              style={{ background: a.color, borderRadius: 3, minWidth: 4 }}
            />
          ))}
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {ALLOCATION.map(a => (
            <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: a.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: T.dim }}>{a.name}</span>
              <span style={{ fontSize: 10, color: T.dimMid, fontWeight: 700 }}>{a.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Crypto Asset Row (Binance-style with Earn | Trade) ─────────────────────── */
function CryptoRow({ a, i }: { a: typeof ASSETS[0]; i: number }) {
  const [logoFailed, setLogoFailed] = useState(false);
  const [, navigate] = useWouterLocation();
  const openToken = () => navigate(`/assets/token/${encodeURIComponent(a.name)}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.985 }}
      transition={{ delay: i * 0.05 }}
      role="button" tabIndex={0} onClick={openToken}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") openToken(); }}
      style={{ padding: "14px 14px 12px", borderBottom: `1px solid rgba(255,255,255,0.045)`, cursor: "pointer", transition: "background .16s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.035)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: a.bg, border: `1px solid ${a.color}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, color: a.color, fontWeight: 800, flexShrink: 0,
         }}>
           {!logoFailed ? (
             <img
               src={a.logo}
               alt={`${a.name} logo`}
               style={{ width: 29, height: 29, objectFit: "contain", display: "block" }}
               onError={() => setLogoFailed(true)}
             />
           ) : (
             <span aria-hidden="true">{a.icon}</span>
           )}
         </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row: name + balance */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.fg }}>{a.name}</span>
              <div style={{ fontSize: 10, color: T.dim, marginTop: 1 }}>{a.sub}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.fg, fontVariantNumeric: "tabular-nums" }}>
                {fmtNum(a.bal, 2)}
              </div>
              <div style={{ fontSize: 10, color: T.dim, fontVariantNumeric: "tabular-nums" }}>
                {fmtPKR(a.pkr)}
              </div>
            </div>
          </div>

          {/* Floating PNL */}
          <div style={{ fontSize: 10, color: T.dim, marginBottom: 10 }}>
            Floating PNL{" "}
            <span style={{ color: a.chg >= 0 ? T.green : T.red, fontWeight: 600 }}>
              {a.chg >= 0 ? "+" : ""}{fmtPKR(Math.abs(a.pkr * (a.chg / 100)))} ({a.chg >= 0 ? "+" : ""}{a.chg.toFixed(2)}%)
            </span>
          </div>

          {/* Earn | Trade buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {["Earn","Trade"].map(lbl => (
              <button key={lbl} onClick={e => { e.stopPropagation(); navigate(lbl === "Earn" ? `/staking?asset=${encodeURIComponent(a.name)}` : `/trade?pair=${encodeURIComponent(a.name)}_PKR`); }} style={{
                padding: "5px 18px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                border: `1px solid rgba(255,255,255,0.1)`,
                background: "rgba(255,255,255,0.06)", color: T.dimMid, cursor: "pointer",
                transition: "all .2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.borderHov; (e.currentTarget as HTMLElement).style.color = T.fg; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = T.dimMid; }}
              >{lbl}</button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Property Row (compact list) ───────────────────────────────────────────── */
function PropertyRowItem({ p, i, expanded = false }: { p: typeof PROPERTIES[0]; i: number; expanded?: boolean }) {
  const [, navigate] = useWouterLocation();
  const propertyPath = `/property/${encodeURIComponent(p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
      whileTap={{ scale: 0.985 }}
      onClick={() => navigate(propertyPath)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "13px 14px",
        borderBottom: `1px solid rgba(255,255,255,0.045)`,
        cursor: "pointer",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {/* Thumbnail */}
      <div style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "rgba(201,168,76,0.1)", border: `1px solid ${T.borderHov}` }}>
        <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
          <span style={{ fontSize: 8, color: T.gold, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 10, padding: "1px 5px", flexShrink: 0 }}>{p.badge}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: T.dim, marginBottom: 5 }}>
          <MapPin size={9} /> {p.loc}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ fontSize: 10, color: T.dim }}>Own: <span style={{ color: T.fg, fontWeight: 600 }}>{p.own}%</span></span>
          {expanded && <span style={{ fontSize: 10, color: T.dim }}>Yield: <span style={{ color: T.green, fontWeight: 600 }}>{p.yield}</span></span>}
        </div>
      </div>

      {/* Right side */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.fg, marginBottom: 3 }}>{p.value}</div>
        <div style={{ fontSize: 9, color: T.green, fontWeight: 600, marginBottom: 4 }}>{p.roi}% APY</div>
        <div style={{ fontSize: 8, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,0.2)", borderRadius: 4, padding: "2px 6px", display: "inline-block" }}>
          {p.status}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Dashboard (Binance-style Assets) ──────────────────────────────────── */
function Dashboard({ wallet, onReload }: { wallet: WalletState; onReload: () => void }) {
  const [showDeposit, setSD]         = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [showWithdrawModal, setSWM]  = useState(false);
  const [showDepositFlow, setSDF]    = useState(false);
  const [autoReinvestYield, setAutoReinvestYield] = useState(false);
  const [yieldNotice, setYieldNotice] = useState("");
  const [sidebarCollapsed, setSB]    = useState(false);
  const [isMobile, setIsMobile]      = useState(window.innerWidth < 768);
  const queryTab = (() => {
    const raw = new URLSearchParams(window.location.search).get("tab")?.toLowerCase();
    if (raw === "spot") return "Spot" as AssetTab;
    if (raw === "real-estate" || raw === "realestate") return "Real Estate" as AssetTab;
    if (raw === "yield" || raw === "yield-rental" || raw === "rental") return "Yield / Rental" as AssetTab;
    if (raw === "history") return "History" as AssetTab;
    return "Overview" as AssetTab;
  })();
  const [activeTab, setActiveTab]    = useState<AssetTab>(queryTab);
  const [spotSearch, setSpotSearch]   = useState("");
  const [hideZeroSpot, setHideZeroSpot] = useState(false);
  const [txns, setTxns]              = useState(() => getTxns().slice(0, 10));
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [, setLocation]              = useWouterLocation();

  /* Sync real-time balances from AppStore into the static ASSETS display */
  const { wallet: storeWallet } = useAppStore();
  const { isDemoTrading, demoBalances, resetDemoFunds } = useMode();
  const { ledger: moduleLedger, history: internalTransfers, totalValuePKR: unifiedTotalPKR } = useWalletStore();
  const liveWallet = storeWallet ?? wallet;
  const spotBalances = moduleLedger.spot;
  const liveAssets = ASSETS.map(a => {
    if (a.name === "USDT")   return { ...a, bal: spotBalances.USDT,   pkr: spotBalances.USDT   * 278 };
    if (a.name === "USDC")   return { ...a, bal: spotBalances.USDC,   pkr: spotBalances.USDC   * 278 };
    if (a.name === "OKBOND") return { ...a, bal: spotBalances.OKBOND, pkr: spotBalances.OKBOND * 88  };
    if (a.name === "PKR")    return { ...a, bal: spotBalances.PKR,    pkr: spotBalances.PKR        };
    return a;
  });
  const demoAssets = [
    { ...ASSETS[0], name: "USDT", sub: "Demo TestNet Wallet", bal: demoBalances.USDT, pkr: demoBalances.USDT * 278, color: T.cyan, bg: "rgba(34,211,238,0.1)" },
    { ...ASSETS[2], name: "OKBOND", sub: "Demo Token · Virtual", bal: demoBalances.OKBOND, pkr: demoBalances.OKBOND * 88 },
  ];
  const displayAssets = isDemoTrading ? demoAssets : liveAssets;
  const visibleAssetTabs = isDemoTrading ? ASSET_TABS.filter(tab => tab !== "Real Estate" && tab !== "Yield / Rental") : ASSET_TABS;

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("tab")?.toLowerCase();
    const next = raw === "spot" ? "Spot" : raw === "real-estate" || raw === "realestate" ? "Real Estate" : raw === "yield" || raw === "yield-rental" || raw === "rental" ? "Yield / Rental" : raw === "history" ? "History" : "Overview";
    if (next !== activeTab) setActiveTab(next as AssetTab);
  }, [activeTab]);

  useEffect(() => {
    const ch = supabase
      .channel("wallet-txns")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        setTxns(getTxns().slice(0, 10));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const sideW = isMobile ? 0 : sidebarCollapsed ? 68 : 220;

  const totalNW = isDemoTrading ? demoBalances.USDT * 278 + demoBalances.OKBOND * 88 : unifiedTotalPKR;

  const RECENT = txns.map(t => {
    const safeDate = t.time ? new Date(t.time).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "Today";
    if (t.type === "deposit") return { id: t.id, type: t.type, label: `${t.currency} Deposit`, sub: t.note || "Wallet top-up", date: safeDate, amount: `+${fmtNum(t.amount, 2)} ${t.currency}`, isPos: true, fee: "0.00" };
    if (t.type === "withdrawal") return { id: t.id, type: t.type, label: `${t.currency || "Asset"} Withdrawal`, sub: `${t.network || "Network"} · ${t.status || "Pending"}`, date: safeDate, amount: `-${fmtNum(t.amount, 2)} ${t.currency || ""}`, isPos: false, fee: `${fmtNum(t.fee ?? 0, 4)} ${t.currency || ""}` };
    return { id: t.id, type: t.type, label: `${t.side === "BUY" ? "Buy" : "Sell"} ${t.ticker || "Asset"}`, sub: `${t.ticker || "Asset"}/${t.quote || "USDT"} · ${t.price ?? "Market"}`, date: safeDate, amount: `${t.side === "BUY" ? "-" : "+"}${fmtNum(t.netTotal ?? 0, 4)} ${t.quote || ""}`, isPos: t.side === "SELL", fee: `${fmtNum(t.fee ?? 0, 4)} ${t.quote || ""}` };
  });

  const FALLBACK_TXN = [
    { label: "USDT Deposit",       sub: "Welcome bonus",     date: "Today", amount: "+500.00 USDT",   isPos: true  },
    { label: "OKBOND Allocation",  sub: "Onboarding reward", date: "Today", amount: "+250.00 OKB",    isPos: true  },
    { label: "PKR Deposit",        sub: "Initial balance",   date: "Today", amount: "+PKR 100,000",   isPos: true  },
  ];
  const TRANSFER_RECENT = internalTransfers.map(t => ({
    id: t.id,
    type: "transfer",
    label: `${t.asset} Internal Transfer`,
    sub: `${t.from} → ${t.to}`,
    date: new Date(t.time).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }),
    amount: `-${fmtNum(t.amount, 2)} ${t.asset}`,
    isPos: false,
  }));
  const txnList = [...TRANSFER_RECENT, ...(RECENT.length > 0 ? RECENT : FALLBACK_TXN)].slice(0, 8);

  /* Section helpers */
  const SectionHeader = ({ title, badge, action }: { title: string; badge?: React.ReactNode; action?: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>{title}</span>
        {badge}
      </div>
      {action}
    </div>
  );

  const ListCard = ({ children, mb = 16 }: { children: React.ReactNode; mb?: number }) => (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
      borderRadius: 16, margin: `0 16px ${mb}px`, overflow: "hidden",
    }}>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, display: "flex" }}>
      {/* Sidebar (desktop) */}
      {!isMobile && <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSB(!sidebarCollapsed)} />}

      <main style={{
        flex: 1, marginLeft: isMobile ? 0 : sideW,
        paddingBottom: isMobile ? 84 : 40,
        transition: "margin-left .3s", minWidth: 0,
      }}>

        {/* ── Sub-nav tabs (sticky) ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(4,8,15,0.97)", backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${T.border}`,
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}>
          <div style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none", padding: "0 4px" }}>
            {visibleAssetTabs.map(tab => {
              const active = tab === activeTab;
              return (
                <button key={tab} onClick={() => { setActiveTab(tab); const slug = tab === "Real Estate" ? "real-estate" : tab === "Yield / Rental" ? "yield" : tab.toLowerCase(); window.history.replaceState({}, "", `${window.location.pathname}?tab=${slug}`); }} style={{
                  padding: "14px 14px", fontSize: 13, fontWeight: active ? 700 : 500,
                  border: "none", cursor: "pointer", background: "transparent",
                  whiteSpace: "nowrap", color: active ? T.fg : T.dim,
                  borderBottom: active ? `2px solid ${T.gold}` : "2px solid transparent",
                  flexShrink: 0, transition: "color .15s",
                }}>
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ maxWidth: isMobile ? "100%" : 680, margin: "0 auto" }}>

          {/* ═══════════════ INSTITUTIONAL OVERVIEW TAB ═══════════════ */}
          {activeTab === "Overview" && (
            <div style={{ paddingBottom: 18 }}>
              {isDemoTrading && <div style={{ margin: "14px 16px 12px", padding: 16, borderRadius: 16, border: `1px solid ${T.cyan}55`, background: `linear-gradient(135deg, ${T.cyan}18, rgba(255,255,255,0.03))` }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><div><div style={{ color: T.cyan, fontSize: 10, fontWeight: 900, letterSpacing: ".1em" }}>DEMO TESTNET WALLET</div><div style={{ color: T.fg, fontSize: 22, fontWeight: 900, marginTop: 5 }}>$100,000.00 <span style={{ color: T.dim, fontSize: 11 }}>USDT Virtual</span></div><div style={{ color: T.dim, fontSize: 11, marginTop: 3 }}>50,000 OKBOND Demo Token</div></div><button onClick={() => resetDemoFunds()} style={{ border: `1px solid ${T.cyan}55`, background: `${T.cyan}12`, color: T.cyan, borderRadius: 9, padding: "8px 10px", fontSize: 10, fontWeight: 900, whiteSpace: "nowrap" }}>Reset TestNet Funds</button></div></div>}

              <BalanceHeroSection totalNW={totalNW} onDeposit={() => setIsDepositModalOpen(true)} />
              <QuickActionsRow onAddFunds={() => setIsDepositModalOpen(true)} onWithdraw={() => setSWM(true)} onTransfer={() => window.location.assign("/assets/transfer")} onAiAdvisor={() => window.location.assign("/assets/ai-advisor")} />

              <section style={{ margin: "0 16px 18px", padding: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}><div><div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: ".14em", fontWeight: 800 }}>Portfolio allocation</div><div style={{ fontSize: 11, color: T.dimMid, marginTop: 3 }}>Tap a sleeve to inspect the underlying assets</div></div><span style={{ fontSize: 10, color: T.gold, fontWeight: 800 }}>LIVE LEDGER</span></div>
                <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", background: T.panel, border: `1px solid ${T.border}` }}>
                  <button aria-label="Real Estate allocation" onClick={() => { setActiveTab("Real Estate"); window.history.replaceState({}, "", `${window.location.pathname}?tab=real-estate`); }} style={{ width: "53%", border: 0, background: `linear-gradient(90deg, ${T.gold}, #e7bd54)`, cursor: "pointer" }} />
                  <button aria-label="Crypto allocation" onClick={() => { setActiveTab("Spot"); window.history.replaceState({}, "", `${window.location.pathname}?tab=spot`); }} style={{ width: "30%", border: 0, background: "#8b5cf6", cursor: "pointer" }} />
                  <button aria-label="Fiat allocation" onClick={() => { setActiveTab("Spot"); window.history.replaceState({}, "", `${window.location.pathname}?tab=spot`); }} style={{ width: "17%", border: 0, background: "#22d3ee", cursor: "pointer" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 }}>
                  {[{ label: "Real Estate", value: "53%", color: T.gold, tab: "Real Estate" as AssetTab }, { label: "Crypto", value: "30%", color: "#a78bfa", tab: "Spot" as AssetTab }, { label: "Fiat", value: "17%", color: T.cyan, tab: "Spot" as AssetTab }].map(item => <button key={item.label} onClick={() => { setActiveTab(item.tab); const slug = item.tab === "Real Estate" ? "real-estate" : "spot"; window.history.replaceState({}, "", `${window.location.pathname}?tab=${slug}`); }} style={{ textAlign: "left", padding: "9px 8px", borderRadius: 10, border: `1px solid ${item.color}30`, background: `${item.color}0b`, cursor: "pointer" }}><div style={{ display: "flex", alignItems: "center", gap: 6, color: item.color, fontSize: 10, fontWeight: 800 }}><span style={{ width: 6, height: 6, borderRadius: 99, background: item.color }} />{item.label}</div><div style={{ marginTop: 3, color: T.fg, fontSize: 16, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{item.value}</div></button>)}
                </div>
              </section>

              <SectionHeader title="Crypto" badge={<span style={{ fontSize: 9, color: T.dimMid, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 20, padding: "2px 7px" }}>Spot holdings</span>} />
              <ListCard>{displayAssets.filter(a => ["USDT", "USDC", "OKBOND"].includes(a.name)).map((a, i) => <CryptoRow key={a.name} a={a} i={i} />)}</ListCard>

              {!isDemoTrading && <>
                <SectionHeader title="Real Estate RWAs" badge={<span style={{ fontSize: 9, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, padding: "2px 7px" }}>3 Active</span>} action={<button onClick={() => { setActiveTab("Real Estate"); window.history.replaceState({}, "", `${window.location.pathname}?tab=real-estate`); }} style={{ fontSize: 10, color: T.gold, background: "none", border: 0, cursor: "pointer" }}>View dashboard <ChevronRight size={11} /></button>} />
                <ListCard>{PROPERTIES.slice(0, 2).map((p, i) => <PropertyRowItem key={p.name} p={p} i={i} />)}</ListCard>

                <SectionHeader title="Yield & Staking Vaults" badge={<span style={{ fontSize: 9, color: T.gold, background: T.goldFaint, border: `1px solid ${T.borderHov}`, borderRadius: 20, padding: "2px 7px" }}>Accruing</span>} />
                <ListCard>
                  <div style={{ padding: 15, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><div><div style={{ color: T.fg, fontSize: 13, fontWeight: 800 }}>RWA Staking Yield</div><div style={{ color: T.dim, fontSize: 10, marginTop: 4 }}>Orakzai Bond vault · quarterly distribution</div></div><div style={{ textAlign: "right" }}><div style={{ color: T.green, fontSize: 13, fontWeight: 900 }}>+12.45% APY</div><button onClick={() => setLocation("/staking")} style={{ marginTop: 5, color: T.gold, background: "none", border: 0, fontSize: 10, fontWeight: 800, cursor: "pointer" }}>Open vault <ChevronRight size={10} /></button></div></div>
                </ListCard>

                <SectionHeader title="Fiat / Cash" badge={<span style={{ fontSize: 9, color: T.cyan, background: `${T.cyan}12`, border: `1px solid ${T.cyan}30`, borderRadius: 20, padding: "2px 7px" }}>Available</span>} />
                <ListCard>{displayAssets.filter(a => a.name === "PKR" || a.name === "Shares").map((a, i) => <CryptoRow key={a.name} a={a} i={i} />)}</ListCard>
              </>}

              <section style={{ margin: "0 16px 18px", padding: 16, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}><div><div style={{ color: T.fg, fontSize: 13, fontWeight: 800 }}>Recent Activity</div><div style={{ color: T.dim, fontSize: 10, marginTop: 3 }}>Latest ledger and wallet operations</div></div><button onClick={() => { setActiveTab("History"); window.history.replaceState({}, "", `${window.location.pathname}?tab=history`); }} style={{ color: T.gold, background: "none", border: 0, fontSize: 10, fontWeight: 800, cursor: "pointer" }}>View All History <ChevronRight size={11} /></button></div>
                {txnList.slice(0, 3).map((tx, i) => <button key={(tx as any).id ?? `${tx.label}-${i}`} onClick={() => setSelectedActivity(tx)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 0", border: 0, borderTop: i ? `1px solid ${T.border}` : "none", background: "transparent", textAlign: "left", cursor: "pointer", transition: "transform .15s, background .15s" }} onPointerDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(.985)"; }} onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}><div><div style={{ color: T.fg, fontSize: 11, fontWeight: 700 }}>{tx.label || "Asset Activity"}</div><div style={{ color: T.dim, fontSize: 10, marginTop: 3 }}>{tx.sub || "Ledger operation"} · {tx.date || "Today"} · <span style={{ color: T.green }}>Success</span></div></div><div style={{ color: tx.isPos ? T.green : T.fg, fontSize: 11, fontWeight: 800, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{tx.amount || "—"}</div></button>)}
                {selectedActivity && <div style={{ marginTop: 10, padding: 13, borderRadius: 12, border: `1px solid ${T.borderHov}`, background: "rgba(201,168,76,.06)" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><div style={{ color: T.gold, fontSize: 9, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>Transaction Receipt</div><div style={{ color: T.fg, fontSize: 12, fontWeight: 800, marginTop: 5 }}>{selectedActivity.label || "Asset Activity"}</div></div><button onClick={() => setSelectedActivity(null)} style={{ border: 0, background: "transparent", color: T.dimMid, cursor: "pointer", fontSize: 16 }}>×</button></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 11, fontSize: 10 }}><div><div style={{ color: T.dim }}>Timestamp</div><div style={{ color: T.fg, marginTop: 3 }}>{selectedActivity.date || "Today"}</div></div><div><div style={{ color: T.dim }}>Status</div><div style={{ color: T.green, marginTop: 3, fontWeight: 800 }}>Success</div></div><div><div style={{ color: T.dim }}>Amount</div><div style={{ color: T.fg, marginTop: 3, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{selectedActivity.amount || "—"}</div></div><div><div style={{ color: T.dim }}>Tx Hash</div><div style={{ color: T.fg, marginTop: 3, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{selectedActivity.id ? `0x${String(selectedActivity.id).slice(0, 10)}` : "Internal ledger"}</div></div><div><div style={{ color: T.dim }}>Fee</div><div style={{ color: T.fg, marginTop: 3, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{selectedActivity.fee || "0.00"}</div></div></div><button onClick={() => window.open("https://etherscan.io", "_blank", "noopener,noreferrer")} style={{ marginTop: 11, border: 0, background: "transparent", color: T.gold, padding: 0, fontSize: 10, fontWeight: 800, cursor: "pointer" }}>View explorer record <ChevronRight size={11} /></button></div>}
              </section>
            </div>
          )}

          {/* ═══════════════ INSTITUTIONAL RWA TAB ═══════════════ */}
          {activeTab === "Real Estate" && (
            <div style={{ paddingBottom: 18 }}>
              <section style={{ margin: "14px 14px 16px", padding: 18, background: "linear-gradient(145deg, rgba(201,168,76,0.11), rgba(255,255,255,0.025) 48%, rgba(16,185,129,0.05))", border: `1px solid ${T.borderHov}`, borderRadius: 20, boxShadow: `inset 0 1px 0 rgba(255,255,255,.06), 0 18px 45px rgba(0,0,0,.18)` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ color: T.gold, fontSize: 10, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase" }}>Institutional RWA Portfolio</div>
                    <div style={{ marginTop: 8, color: T.fg, fontSize: 27, lineHeight: 1, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontVariantNumeric: "tabular-nums" }}>PKR {fmtNum(moduleLedger.realEstate.PKR + moduleLedger.realEstate.USDT * 278 + moduleLedger.realEstate.OKBOND * 88, 0)}</div>
                    <div style={{ marginTop: 8, color: T.dimMid, fontSize: 11 }}>Current tokenized-property value across the unified ledger</div>
                  </div>
                  <div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 13, color: T.gold, background: T.goldFaint, border: `1px solid ${T.borderHov}` }}><Building2 size={20} /></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 9px", borderRadius: 8, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,.22)", fontSize: 11, fontWeight: 800 }}><TrendingUp size={13} /> +12.45% Avg APY</span>
                  <span style={{ color: T.dimMid, fontSize: 11, fontWeight: 700 }}>3 Active Tokenized Properties</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
                  <button onClick={() => setLocation("/rwa-vaults")} style={{ minHeight: 42, border: 0, borderRadius: 11, background: `linear-gradient(135deg, ${T.gold}, ${T.goldBright})`, color: T.bg, fontSize: 11, fontWeight: 900, cursor: "pointer" }}>Buy RWA Tokens</button>
                  <button onClick={() => setLocation("/staking")} style={{ minHeight: 42, border: `1px solid ${T.green}55`, borderRadius: 11, background: T.greenGlow, color: T.green, fontSize: 11, fontWeight: 900, cursor: "pointer" }}>Claim Rental Yield</button>
                </div>
              </section>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px 10px" }}>
                <div style={{ color: T.fg, fontSize: 18, fontWeight: 900, letterSpacing: "-.02em" }}>Property Holdings</div>
                <span style={{ color: T.dim, fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>Verified assets</span>
              </div>
              <section style={{ margin: "0 14px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
                {PROPERTIES.map((p, i) => (
                  <motion.div key={p.name} whileTap={{ scale: .99 }} style={{ padding: 14, background: "linear-gradient(145deg, rgba(255,255,255,.035), rgba(255,255,255,.018))", border: `1px solid ${T.border}`, borderRadius: 17, cursor: "pointer", boxShadow: "inset 0 1px 0 rgba(255,255,255,.035)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                      <img src={p.img} alt={p.name} style={{ width: 50, height: 50, flexShrink: 0, objectFit: "cover", borderRadius: 13, border: `1px solid ${T.border}` }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}><span style={{ color: T.fg, fontSize: 13, fontWeight: 900 }}>{p.name}</span><span style={{ padding: "3px 6px", borderRadius: 6, color: T.gold, background: T.goldFaint, border: `1px solid ${T.borderHov}`, fontSize: 8, fontWeight: 900 }}>{i === 0 ? "Sovereign Verified" : "Audited Escrow"}</span></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5, color: T.dim, fontSize: 10 }}><MapPin size={11} />{p.loc}</div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right" }}><div style={{ color: T.fg, fontSize: 12, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{p.value}</div><div style={{ marginTop: 4, color: T.green, fontSize: 10, fontWeight: 800 }}>{p.roi}% APY</div></div>
                    </div>
                    <div style={{ height: 6, marginTop: 14, overflow: "hidden", borderRadius: 99, background: T.bg }}><div style={{ width: `${Math.min(p.own, 100)}%`, height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${T.gold}, ${T.goldBright})` }} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 9, marginTop: 9, color: T.dim, fontSize: 10 }}><span>Own: <b style={{ color: T.fg }}>{p.own}%</b></span><span>Monthly Yield: <b style={{ color: T.green }}>{p.yield}</b></span><span style={{ padding: "4px 7px", borderRadius: 6, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,.2)", fontWeight: 800 }}>Active</span></div>
                  </motion.div>
                ))}
              </section>

              <div style={{ padding: "0 14px 10px", color: T.fg, fontSize: 18, fontWeight: 900 }}>Upcoming Rental Payouts</div>
              <section style={{ margin: "0 14px", padding: 10, background: "rgba(255,255,255,.025)", border: `1px solid ${T.border}`, borderRadius: 17 }}>
                {PAYOUTS.map((p, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderBottom: i < PAYOUTS.length - 1 ? `1px solid ${T.border}` : "none" }}><div style={{ width: 36, height: 36, display: "grid", placeItems: "center", flexShrink: 0, borderRadius: 11, color: T.gold, background: T.goldFaint, border: `1px solid ${T.borderHov}` }}><Building2 size={15} /></div><div style={{ minWidth: 0, flex: 1 }}><div style={{ color: T.fg, fontSize: 12, fontWeight: 800 }}>{p.name}</div><div style={{ marginTop: 3, color: T.dim, fontSize: 10 }}>{p.date} · Rental distribution</div></div><span style={{ padding: "6px 9px", borderRadius: 8, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,.22)", fontSize: 11, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{p.amount}</span></div>)}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "14px 4px 4px" }}><span style={{ color: T.dimMid, fontSize: 11, fontWeight: 700 }}>Total Expected Payout</span><span style={{ color: T.goldBright, fontSize: 15, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>+PKR 345,750</span></div>
              </section>
            </div>
          )}

          {/* ═══════════════ INSTITUTIONAL SPOT TAB ═══════════════ */}
          {activeTab === "Spot" && (
            <div style={{ paddingBottom: 18 }}>
              <section style={{ margin: "14px 14px 12px", padding: 18, background: "linear-gradient(145deg, rgba(255,255,255,.045), rgba(255,255,255,.018))", border: `1px solid ${T.border}`, borderRadius: 19, boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)" }}>
                <div style={{ color: T.gold, fontSize: 10, fontWeight: 900, letterSpacing: ".13em", textTransform: "uppercase" }}>Crypto & Fiat Spot Portfolio</div>
                <div style={{ marginTop: 8, color: T.fg, fontSize: 27, lineHeight: 1, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontVariantNumeric: "tabular-nums" }}>{isDemoTrading ? `$${fmtNum(demoBalances.USDT, 2)} USDT` : `PKR ${fmtNum(liveAssets.reduce((s, a) => s + a.pkr, 0), 0)}`}</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "6px 9px", borderRadius: 8, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,.22)", fontSize: 11, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}><TrendingUp size={13} /> +PKR 5.56 Cr (+0.02%) 24h</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
                  <div style={{ position: "relative", flex: 1 }}><Search size={14} color={T.dim} style={{ position: "absolute", left: 11, top: 12 }} /><input value={spotSearch} onChange={e => setSpotSearch(e.target.value)} placeholder="Search asset..." style={{ width: "100%", boxSizing: "border-box", height: 38, padding: "0 10px 0 32px", color: T.fg, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 11, outline: "none", fontSize: 11 }} /></div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, color: T.dimMid, fontSize: 10, cursor: "pointer" }}><input type="checkbox" checked={hideZeroSpot} onChange={e => setHideZeroSpot(e.target.checked)} style={{ accentColor: T.gold }} /> Hide zero</label>
                </div>
              </section>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 14px 10px" }}><div style={{ color: T.fg, fontSize: 18, fontWeight: 900 }}>Spot Assets</div><span style={{ color: T.dim, fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}>{displayAssets.length} instruments</span></div>
              <section style={{ margin: "0 14px", display: "flex", flexDirection: "column", gap: 9 }}>
                {displayAssets.filter(a => (!hideZeroSpot || a.bal > 0) && (!spotSearch.trim() || `${a.name} ${a.sub} ${a.unit}`.toLowerCase().includes(spotSearch.trim().toLowerCase()))).map((a, i) => {
                  const pnlPositive = a.chg >= 0;
                  const tradePair = a.name === "PKR" ? "USDT_PKR" : `${a.name}_USDT`;
                  return <motion.div key={a.name} whileTap={{ scale: .99 }} style={{ padding: 14, background: "linear-gradient(145deg, rgba(255,255,255,.035), rgba(255,255,255,.018))", border: `1px solid ${T.border}`, borderRadius: 17, boxShadow: "inset 0 1px 0 rgba(255,255,255,.035)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div style={{ width: 42, height: 42, flexShrink: 0, display: "grid", placeItems: "center", overflow: "hidden", borderRadius: "50%", background: a.bg, border: `1px solid ${a.color}55` }}>{a.logo ? <img src={a.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: a.color, fontSize: 18, fontWeight: 900 }}>{a.icon}</span>}</div>
                      <div style={{ minWidth: 0, flex: 1 }}><div style={{ color: T.fg, fontSize: 15, fontWeight: 900 }}>{a.name}</div><div style={{ marginTop: 3, color: T.dim, fontSize: 11 }}>{a.sub}</div></div>
                      <div style={{ flexShrink: 0, textAlign: "right" }}><div style={{ color: T.fg, fontSize: 14, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{fmtNum(a.bal, a.bal < 1000 ? 2 : 0)}</div><div style={{ marginTop: 3, color: T.dim, fontSize: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{fmtPKR(a.pkr)}</div></div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12, paddingTop: 11, borderTop: `1px solid ${T.border}` }}><span style={{ color: pnlPositive ? T.green : T.red, fontSize: 11, fontWeight: 800, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{pnlPositive ? "+" : ""}PKR {a.name === "USDT" ? "5.56 Cr" : a.name === "OKBOND" ? "515" : a.name === "USDC" ? "14" : "0"} ({pnlPositive ? "+" : ""}{a.chg.toFixed(2)}%)</span><span style={{ color: T.dim, fontSize: 10 }}>Floating PnL</span></div>
                    <div style={{ display: "flex", gap: 7, marginTop: 10 }}><button onClick={() => setLocation(`/staking?asset=${a.name}`)} style={{ flex: 1, minHeight: 35, border: `1px solid ${T.border}`, borderRadius: 10, background: "rgba(255,255,255,.045)", color: T.dimMid, fontSize: 10, fontWeight: 900, cursor: "pointer" }}>Earn / Vault</button><button onClick={() => setLocation(`/trade?pair=${tradePair}`)} style={{ flex: 1, minHeight: 35, border: 0, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, ${T.goldBright})`, color: T.bg, fontSize: 10, fontWeight: 900, cursor: "pointer" }}>Trade</button><button aria-label={`Transfer ${a.name}`} onClick={() => setLocation(`/assets/transfer?asset=${a.name}`)} style={{ width: 39, minHeight: 35, display: "grid", placeItems: "center", border: `1px solid ${T.border}`, borderRadius: 10, background: "rgba(255,255,255,.045)", color: T.dimMid, cursor: "pointer" }}><ArrowLeftRight size={15} /></button></div>
                  </motion.div>;
                })}
                {displayAssets.filter(a => (!hideZeroSpot || a.bal > 0) && (!spotSearch.trim() || `${a.name} ${a.sub} ${a.unit}`.toLowerCase().includes(spotSearch.trim().toLowerCase()))).length === 0 && <div style={{ padding: 28, textAlign: "center", color: T.dim, border: `1px solid ${T.border}`, borderRadius: 16 }}>No spot assets match your filter.</div>}
              </section>
            </div>
          )}

          {/* ═══════════════ INSTITUTIONAL YIELD / RENTAL TAB ═══════════════ */}
          {activeTab === "Yield / Rental" && (() => {
            const monthlyRentalTotal = PROPERTIES.reduce((sum, p) => sum + (Number(p.yield.replace(/[^0-9]/g, "")) || 0), 0);
            const propertyPath = (name: string) => `/property/${encodeURIComponent(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))}`;
            const claimAll = () => { setYieldNotice(`PKR ${fmtNum(monthlyRentalTotal, 0)} yield claim submitted to your Funding Wallet.`); setTimeout(() => setYieldNotice(""), 2800); };
            return (
              <div style={{ paddingBottom: 20 }}>
                <section style={{ margin: "14px 14px 12px", padding: 18, background: "linear-gradient(145deg, rgba(201,168,76,.12), rgba(255,255,255,.035) 55%, rgba(16,185,129,.05))", border: `1px solid ${T.borderHov}`, borderRadius: 20, boxShadow: "inset 0 1px 0 rgba(255,255,255,.06), 0 16px 38px rgba(0,0,0,.18)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}><div><div style={{ color: T.dim, fontSize: 10, fontWeight: 900, letterSpacing: ".14em", textTransform: "uppercase" }}>Monthly Rental Income</div><div style={{ marginTop: 8, color: T.fg, fontSize: 29, lineHeight: 1, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontVariantNumeric: "tabular-nums" }}>PKR {fmtNum(monthlyRentalTotal, 0)}</div><div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "6px 9px", borderRadius: 8, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,.22)", fontSize: 11, fontWeight: 800 }}><TrendingUp size={13} /> +8.65% from last month</div></div><div style={{ color: T.green, fontSize: 9, fontWeight: 900, letterSpacing: ".1em", padding: "5px 7px", borderRadius: 7, background: T.greenGlow, border: "1px solid rgba(16,185,129,.25)" }}>LIVE YIELD</div></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 17 }}><button onClick={claimAll} style={{ padding: "10px 8px", border: 0, borderRadius: 11, background: T.gold, color: T.bg, fontSize: 10, fontWeight: 900, cursor: "pointer" }}>Claim All Yield</button><button onClick={() => setAutoReinvestYield(v => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 8px", border: `1px solid ${autoReinvestYield ? T.green : T.border}`, borderRadius: 11, background: autoReinvestYield ? T.greenGlow : T.panel, color: autoReinvestYield ? T.green : T.dimMid, fontSize: 10, fontWeight: 900, cursor: "pointer" }}><span style={{ width: 25, height: 14, padding: 2, display: "flex", justifyContent: autoReinvestYield ? "flex-end" : "flex-start", borderRadius: 99, background: autoReinvestYield ? T.green : T.dim, transition: "all .18s" }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff" }} /></span>Auto-Reinvest</button></div>
                  {yieldNotice && <div style={{ marginTop: 10, color: T.green, fontSize: 10, fontWeight: 700 }}>{yieldNotice}</div>}
                </section>

                <section style={{ margin: "0 14px 16px", padding: 16, background: "rgba(255,255,255,.03)", border: `1px solid ${T.border}`, borderRadius: 18 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><div><div style={{ color: T.fg, fontSize: 13, fontWeight: 850 }}>Historical Yield</div><div style={{ color: T.dim, fontSize: 10, marginTop: 3 }}>Monthly rental distributions · PKR</div></div><span style={{ color: T.gold, fontSize: 10, fontWeight: 800 }}>6 MONTHS</span></div><div style={{ height: 155 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={INCOME_DATA} barSize={22} margin={{ top: 8, right: 2, left: -18, bottom: 0 }}><defs><linearGradient id="yieldGoldGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F0B90B" /><stop offset="100%" stopColor="#B77905" /></linearGradient></defs><CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" /><XAxis dataKey="m" tick={{ fontSize: 9, fill: T.dim }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 8, fill: T.dim }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "rgba(201,168,76,.06)" }} formatter={(v: any) => [`PKR ${fmtNum(v, 0)}`, "Rental yield"]} contentStyle={{ background: "rgba(8,14,28,.97)", border: `1px solid ${T.borderHov}`, borderRadius: 10, fontSize: 11 }} /><Bar dataKey="v" radius={[6, 6, 0, 0]}>{INCOME_DATA.map((_, idx) => <Cell key={idx} fill={idx === INCOME_DATA.length - 1 ? "url(#yieldGoldGradient)" : `${T.gold}55`} />)}</Bar></BarChart></ResponsiveContainer></div></section>

                <SectionHeader title="Yield Breakdown per Property" badge={<span style={{ color: T.green, fontSize: 9, fontWeight: 800 }}>3 ACTIVE ASSETS</span>} />
                {PROPERTIES.map((p, i) => <motion.div key={p.name} whileTap={{ scale: .985 }} onClick={() => setLocation(propertyPath(p.name))} style={{ margin: "0 14px 10px", padding: 16, background: "rgba(255,255,255,.03)", border: `1px solid ${T.border}`, borderRadius: 17, cursor: "pointer", transition: "background .18s, border-color .18s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.06)"; (e.currentTarget as HTMLElement).style.borderColor = T.borderHov; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.03)"; (e.currentTarget as HTMLElement).style.borderColor = T.border; }}><div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}><div style={{ minWidth: 0 }}><div style={{ color: T.fg, fontSize: 13, fontWeight: 850 }}>{p.name}</div><div style={{ color: T.dim, fontSize: 10, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><MapPin size={10} style={{ verticalAlign: "-2px", marginRight: 3 }} />{p.loc}</div></div><div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ color: T.green, fontSize: 14, fontWeight: 900, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{p.yield}/mo</div><div style={{ color: T.green, fontSize: 10, fontWeight: 800, marginTop: 4 }}>{p.roi}% APY</div></div></div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14, paddingTop: 11, borderTop: `1px solid ${T.border}` }}><button onClick={e => { e.stopPropagation(); setYieldNotice(`${p.name} payout history opened.`); setTimeout(() => setYieldNotice(""), 2200); }} style={{ flex: 1, padding: "8px 5px", border: `1px solid ${T.border}`, borderRadius: 9, background: T.panel, color: T.dimMid, fontSize: 10, fontWeight: 800, cursor: "pointer" }}>Payout History</button><button onClick={e => { e.stopPropagation(); setAutoReinvestYield(true); setYieldNotice(`${p.name} yield is now marked for auto-reinvestment.`); setTimeout(() => setYieldNotice(""), 2600); }} style={{ flex: 1, padding: "8px 5px", border: `1px solid ${T.gold}55`, borderRadius: 9, background: T.goldFaint, color: T.gold, fontSize: 10, fontWeight: 900, cursor: "pointer" }}>Reinvest Yield</button><ChevronRight size={15} color={T.dim} /></div></motion.div>)}
              </div>
            );
          })()}

          {/* ═══════════════ HISTORY TAB ═══════════════ */}
          {activeTab === "History" && (
            <>
              <div style={{ padding: "16px 16px 8px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.fg }}>Transaction History</div>
              </div>
              <ListCard>
                {txnList.map((t, i) => (
                  <Link key={i} href={t.id ? `/wallet/transaction/${t.id}` : "#"} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "13px 14px",
                    borderBottom: i < txnList.length - 1 ? `1px solid rgba(255,255,255,0.05)` : "none",
                    cursor: t.id ? "pointer" : "default",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (t.id) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: t.isPos ? T.greenGlow : T.redGlow,
                      border: `1px solid ${t.isPos ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {t.isPos ? <ArrowDownToLine size={15} color={T.green} /> : <ArrowUpFromLine size={15} color={T.red} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</div>
                      <div style={{ fontSize: 9, color: T.dim }}>{t.sub}</div>
                      <div style={{ fontSize: 8, color: T.dim }}>{t.date}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: t.isPos ? T.green : T.red }}>{t.amount}</div>
                      <div style={{ fontSize: 8, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "1px 6px", marginTop: 3, display: "inline-block" }}>Confirmed</div>
                    </div>
                  </div>
                  </Link>
                ))}
              </ListCard>
            </>
          )}

        </div>
      </main>

      {isMobile && <MobileNav />}

      {/* Select Deposit Method bottom sheet */}
      <SelectDepositMethodModal
        open={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSelectDepositAsset={() => { setIsDepositModalOpen(false); setSDF(true); }}
        onSelectOkzBytePay={() => { setIsDepositModalOpen(false); setLocation("/wallet/okzbyte-pay"); }}
        onSelectP2P={() => { setIsDepositModalOpen(false); setLocation("/p2p"); }}
      />

      {/* Select Withdraw Method bottom sheet */}
      <SelectWithdrawMethodModal
        open={showWithdrawModal}
        onClose={() => setSWM(false)}
        onSelectInternal={() => setLocation("/wallet/okzbyte-pay-send")}
        onSelectOnChain={() => setLocation("/withdraw/on-chain")}
        onSelectP2P={() => setLocation("/p2p?type=sell")}
      />

      {/* 3-step Crypto Deposit Flow (Select Asset → Network → QR Address) */}
      <CryptoDepositFlow
        open={showDepositFlow}
        onClose={() => setSDF(false)}
      />

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
