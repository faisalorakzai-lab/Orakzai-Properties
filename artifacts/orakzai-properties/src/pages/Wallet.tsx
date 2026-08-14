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

function QuickActionsRow({ onAddFunds, onWithdraw }: { onAddFunds: () => void; onWithdraw: () => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, padding: "12px 16px 16px" }}>
      {QUICK_4.map(({ label, icon: Icon }) => (
        <motion.button
          key={label}
          whileTap={{ scale: 0.92 }}
          onClick={label === "Add Funds" ? onAddFunds : label === "Withdraw" ? onWithdraw : undefined}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
      style={{ padding: "14px 14px 12px", borderBottom: `1px solid rgba(255,255,255,0.045)` }}
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
              <button key={lbl} style={{
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07 }}
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
  const [sidebarCollapsed, setSB]    = useState(false);
  const [isMobile, setIsMobile]      = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab]    = useState<AssetTab>("Overview");
  const [txns, setTxns]              = useState(() => getTxns().slice(0, 10));
  const [, setLocation]              = useWouterLocation();

  /* Sync real-time balances from AppStore into the static ASSETS display */
  const { wallet: storeWallet } = useAppStore();
  const liveWallet = storeWallet ?? wallet;
  const liveAssets = ASSETS.map(a => {
    if (a.name === "USDT")   return { ...a, bal: liveWallet.balances.USDT,   pkr: liveWallet.balances.USDT   * 278 };
    if (a.name === "USDC")   return { ...a, bal: liveWallet.balances.USDC,   pkr: liveWallet.balances.USDC   * 278 };
    if (a.name === "OKBOND") return { ...a, bal: liveWallet.balances.OKBOND, pkr: liveWallet.balances.OKBOND * 88  };
    if (a.name === "PKR")    return { ...a, bal: liveWallet.balances.PKR,    pkr: liveWallet.balances.PKR        };
    return a;
  });

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

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

  const totalNW =
    liveWallet.balances.PKR +
    liveWallet.balances.USDT * 278 +
    liveWallet.balances.USDC * 278 +
    liveWallet.balances.OKBOND * 88 +
    14_125_000;

  const RECENT = txns.map(t => ({
    id:     t.id,
    type:   t.type,
    label:  t.type === "deposit" ? `${t.currency} Deposit` : `Trade — ${(t as any).ticker ?? ""}`,
    sub:    t.type === "deposit" ? t.note || "Wallet top-up" : `${(t as any).side} @ ${(t as any).price ?? ""}`,
    date:   new Date(t.time).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }),
    amount: t.type === "deposit"
      ? `+${fmtNum(t.amount, 2)} ${t.currency}`
      : `${(t as any).side === "BUY" ? "-" : "+"}${fmtNum((t as any).netTotal ?? 0, 4)} ${(t as any).quote ?? ""}`,
    isPos: t.type === "deposit" || (t as any).side === "SELL",
  }));

  const FALLBACK_TXN = [
    { label: "USDT Deposit",       sub: "Welcome bonus",     date: "Today", amount: "+500.00 USDT",   isPos: true  },
    { label: "OKBOND Allocation",  sub: "Onboarding reward", date: "Today", amount: "+250.00 OKB",    isPos: true  },
    { label: "PKR Deposit",        sub: "Initial balance",   date: "Today", amount: "+PKR 100,000",   isPos: true  },
  ];
  const txnList = (RECENT.length > 0 ? RECENT : FALLBACK_TXN).slice(0, 8);

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
            {ASSET_TABS.map(tab => {
              const active = tab === activeTab;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
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

          {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
          {activeTab === "Overview" && (
            <>
              {/* Balance hero */}
              <BalanceHeroSection totalNW={totalNW} onDeposit={() => setIsDepositModalOpen(true)} />

              {/* 4-button quick actions */}
              <QuickActionsRow onAddFunds={() => setIsDepositModalOpen(true)} onWithdraw={() => setSWM(true)} />

              {/* Horizontal allocation bar */}
              <AllocationBarSection />

              {/* Crypto section */}
              <SectionHeader title="Crypto" />
              <ListCard>
                {liveAssets.map((a, i) => <CryptoRow key={a.name} a={a} i={i} />)}
              </ListCard>

              {/* Real Estate section */}
              <SectionHeader
                title="Real Estate"
                badge={
                  <span style={{ fontSize: 9, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, padding: "2px 7px" }}>
                    3 Active
                  </span>
                }
                action={
                  <Link href={`${bp()}/browse`}>
                    <button style={{ fontSize: 10, color: T.gold, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                      Browse All <ChevronRight size={11} />
                    </button>
                  </Link>
                }
              />
              <ListCard>
                {PROPERTIES.map((p, i) => <PropertyRowItem key={p.name} p={p} i={i} />)}
              </ListCard>

              {/* Monthly rental income teaser */}
              <div style={{ margin: "0 16px 16px", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px 16px 14px" }}>
                <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>Monthly Rental Income</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: T.fg, fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>PKR 345,750</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.green, marginBottom: 14 }}>
                  <TrendingUp size={11} /> +8.65% from last month
                </div>
                <div style={{ height: 60 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={INCOME_DATA} barSize={14}>
                      <XAxis dataKey="m" tick={{ fontSize: 8, fill: T.dim }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: any) => [`PKR ${fmtNum(v, 0)}`, "Income"]} contentStyle={{ background: "rgba(8,14,28,0.95)", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11 }} />
                      <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                        {INCOME_DATA.map((_, idx) => <Cell key={idx} fill={idx === INCOME_DATA.length - 1 ? T.gold : `${T.gold}40`} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {/* ═══════════════ REAL ESTATE TAB ═══════════════ */}
          {activeTab === "Real Estate" && (
            <>
              <div style={{ padding: "18px 16px 10px" }}>
                <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>Property Portfolio Value</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.fg, fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>PKR 15,250,000</div>
                <div style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>+12.45% Avg APY · 3 Active Properties</div>
              </div>

              <SectionHeader title="Holdings" />
              <ListCard>
                {PROPERTIES.map((p, i) => <PropertyRowItem key={p.name} p={p} i={i} expanded />)}
              </ListCard>

              <SectionHeader title="Upcoming Payouts" />
              <ListCard>
                {PAYOUTS.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderBottom: i < PAYOUTS.length - 1 ? `1px solid rgba(255,255,255,0.05)` : "none" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, background: T.goldFaint, border: `1px solid ${T.borderHov}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Building2 size={15} color={T.gold} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.fg }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: T.dim }}>{p.date}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: T.green, background: T.greenGlow, border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "4px 10px" }}>{p.amount}</span>
                  </div>
                ))}
                <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: T.dim }}>Total Expected</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: T.gold }}>+PKR 345,750</span>
                </div>
              </ListCard>
            </>
          )}

          {/* ═══════════════ SPOT TAB ═══════════════ */}
          {activeTab === "Spot" && (
            <>
              <div style={{ padding: "18px 16px 10px" }}>
                <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>Crypto & Fiat Holdings</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.fg, fontVariantNumeric: "tabular-nums" }}>
                  PKR {fmtNum(ASSETS.reduce((s, a) => s + a.pkr, 0), 0)}
                </div>
              </div>
              <SectionHeader title="All Assets" />
              <ListCard>
                {liveAssets.map((a, i) => <CryptoRow key={a.name} a={a} i={i} />)}
              </ListCard>
            </>
          )}

          {/* ═══════════════ YIELD / RENTAL TAB ═══════════════ */}
          {activeTab === "Yield / Rental" && (
            <>
              <div style={{ padding: "18px 16px 10px" }}>
                <div style={{ fontSize: 10, color: T.dim, marginBottom: 4 }}>Monthly Rental Income</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.fg, marginBottom: 4 }}>PKR 345,750</div>
                <div style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>+8.65% from last month</div>
              </div>

              <div style={{ margin: "0 16px 16px", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px" }}>
                <div style={{ height: 130 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={INCOME_DATA} barSize={20}>
                      <XAxis dataKey="m" tick={{ fontSize: 9, fill: T.dim }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: any) => [`PKR ${fmtNum(v, 0)}`, "Income"]} contentStyle={{ background: "rgba(8,14,28,0.95)", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11 }} />
                      <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                        {INCOME_DATA.map((_, idx) => <Cell key={idx} fill={idx === INCOME_DATA.length - 1 ? T.gold : `${T.gold}40`} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <SectionHeader title="Yield per Property" />
              {PROPERTIES.map((p, i) => (
                <div key={p.name} style={{ margin: "0 16px 8px", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.fg, marginBottom: 3 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: T.dim }}>{p.loc}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.green }}>{p.yield}</div>
                      <div style={{ fontSize: 10, color: T.dim }}>{p.roi}% APY</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

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
