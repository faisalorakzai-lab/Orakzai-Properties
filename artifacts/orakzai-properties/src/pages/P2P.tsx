import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronDown, Shield, Zap, SlidersHorizontal,
  Home, ClipboardList, Megaphone, User,
} from "lucide-react";

/* ── Tokens ─────────────────────────────────────────────────────────────── */
const BG    = "#0B0E11";
const CARD  = "#12161C";
const LINE  = "#1E2329";
const GREEN = "#0ECB81";
const RED   = "#F6465D";
const GOLD  = "#F0B90B";
const DIM   = "#848E9C";
const FG    = "#EAECEF";

const PM_COLOR: Record<string, string> = {
  "Bank Transfer": "#6366f1", JazzCash: "#f97316", Easypaisa: "#10b981",
  Nayapay: "#8b5cf6", SadaPay: "#ec4899", "United Bank": "#3b82f6",
};

/* ── Data ───────────────────────────────────────────────────────────────── */
type M = {
  id: number; initials: string; ic: string; ib: string;
  name: string; rt: number; orders: number; rate: number;
  price: number; qty: number; minL: number; maxL: number;
  pay: string[]; featured: boolean; verified: boolean; fast: boolean;
};

const SELL: M[] = [
  { id:1,initials:"L",ic:"#C9A84C",ib:"#C9A84C22",name:"link-exchange",rt:6,orders:584,rate:99,price:288.50,qty:5084.3200,minL:10000,maxL:500000,pay:["United Bank","Bank Transfer"],featured:true,verified:true,fast:false },
  { id:2,initials:"F",ic:"#10b981",ib:"#10b98122",name:"FaizTrader",rt:4,orders:76,rate:99,price:284.20,qty:230.0000,minL:1000,maxL:100000,pay:["Nayapay","SadaPay","Bank Transfer"],featured:false,verified:true,fast:true },
  { id:3,initials:"C",ic:"#6366f1",ib:"#6366f122",name:"CryptoKing_PK",rt:8,orders:1240,rate:97,price:283.75,qty:12500.0000,minL:5000,maxL:1000000,pay:["JazzCash","Easypaisa","Bank Transfer"],featured:false,verified:true,fast:false },
  { id:4,initials:"A",ic:"#f97316",ib:"#f9731622",name:"AlphaExchange",rt:3,orders:328,rate:98,price:282.00,qty:800.0000,minL:2000,maxL:250000,pay:["Bank Transfer","SadaPay"],featured:false,verified:true,fast:true },
  { id:5,initials:"S",ic:"#8b5cf6",ib:"#8b5cf622",name:"SwiftUSDT",rt:12,orders:95,rate:96,price:280.50,qty:3200.0000,minL:500,maxL:150000,pay:["Nayapay","JazzCash"],featured:false,verified:false,fast:false },
  { id:6,initials:"P",ic:"#06b6d4",ib:"#06b6d422",name:"PKRMaster",rt:7,orders:450,rate:99,price:279.80,qty:720.0000,minL:1000,maxL:80000,pay:["Easypaisa","Bank Transfer"],featured:false,verified:true,fast:false },
];
const BUY: M[] = [
  { id:7,initials:"T",ic:"#10b981",ib:"#10b98122",name:"TrustP2P",rt:5,orders:203,rate:98,price:281.00,qty:1500.0000,minL:2000,maxL:200000,pay:["Bank Transfer","JazzCash"],featured:false,verified:true,fast:false },
  { id:8,initials:"Q",ic:"#ec4899",ib:"#ec489922",name:"QuickBuyer",rt:2,orders:87,rate:97,price:280.20,qty:600.0000,minL:1000,maxL:50000,pay:["SadaPay","Nayapay"],featured:false,verified:false,fast:true },
];

const PAY_OPTS = ["All Payment Methods","Bank Transfer","JazzCash","Easypaisa","Nayapay","SadaPay","United Bank"];
const TABS     = ["Express","P2P","FiatClaw","Block"];
const NAV      = [
  { label:"P2P",    Icon:Home,          href:"/p2p"    },
  { label:"Orders", Icon:ClipboardList, href:"/trades" },
  { label:"Ads",    Icon:Megaphone,     href:"/wallet" },
  { label:"Profile",Icon:User,          href:"/profile"},
];

function fmtLim(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(2) + "K";
  return n.toLocaleString();
}

/* ── Trade Modal ─────────────────────────────────────────────────────────── */
function TradeModal({ m, side, onClose }: { m: M; side: "buy" | "sell"; onClose: () => void }) {
  const [fiat, setFiat] = useState("");
  const isBuy = side === "buy";
  const usdt = fiat ? (+fiat / m.price).toFixed(4) : "";
  return (
    <motion.div
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)" }} onClick={onClose} />
      <motion.div
        style={{
          position: "relative", width: "100%", borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: "8px 20px calc(40px + env(safe-area-inset-bottom))",
          background: "#1C1F26", borderTop: `1px solid ${LINE}`,
        }}
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)", margin: "0 auto 20px" }} />
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
              background: m.ib, color: m.ic,
            }}>{m.initials}</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: FG, margin: 0 }}>{m.name}</p>
              <p style={{ fontSize: 12, color: DIM, margin: 0 }}>{m.orders} Orders · {m.rate}%</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: isBuy ? GREEN : RED, margin: 0 }}>Rs {m.price.toFixed(2)}</p>
            <p style={{ fontSize: 12, color: DIM, margin: 0 }}>per USDT</p>
          </div>
        </div>
        {/* Stats */}
        <div style={{ background: BG, borderRadius: 16, padding: "16px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: DIM }}>Available</span>
            <span style={{ color: FG }}>{m.qty.toFixed(4)} USDT</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: DIM }}>Limit</span>
            <span style={{ color: FG }}>Rs {fmtLim(m.minL)} – {fmtLim(m.maxL)}</span>
          </div>
        </div>
        {/* Input */}
        <div style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 16, padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: DIM, marginBottom: 8 }}>
            <span>Amount (PKR)</span>
            {usdt && <span style={{ color: GOLD }}>≈ {usdt} USDT</span>}
          </div>
          <input
            type="number" inputMode="decimal" placeholder="0.00" value={fiat}
            onChange={e => setFiat(e.target.value)}
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              fontSize: 24, fontWeight: 700, color: FG, fontFamily: "inherit",
            }}
          />
        </div>
        <button style={{
          width: "100%", padding: "16px", borderRadius: 16, border: "none", cursor: "pointer",
          background: isBuy ? GREEN : RED, color: "#fff", fontWeight: 700, fontSize: 16,
        }}>
          {isBuy ? "Buy USDT" : "Sell USDT"}
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ── Merchant Card ───────────────────────────────────────────────────────── */
function MCard({ m, side, onTrade }: { m: M; side: "buy" | "sell"; onTrade: () => void }) {
  const isBuy = side === "buy";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        margin: "0 12px 10px",
        background: CARD,
        border: "1px solid #2B313A",
        borderRadius: 14,
        padding: "14px 14px 12px",
        position: "relative",
      }}
    >
      {/* Featured badge */}
      {m.featured && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          fontSize: 10, fontWeight: 700,
          padding: "2px 8px", borderRadius: 100,
          background: `${GOLD}18`, color: GOLD,
          border: `1px solid ${GOLD}44`,
          whiteSpace: "nowrap",
        }}>
          Featured ✦
        </div>
      )}

      {/* ── Row A: avatar + name/meta | orders count ── */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingRight: m.featured ? 90 : 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14,
            background: m.ib, color: m.ic,
            border: `1.5px solid ${m.ic}55`,
          }}>{m.initials}</div>
          {/* Name + badges */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: FG, lineHeight: 1.2 }}>{m.name}</span>
              {m.verified && <Shield size={13} color="#06b6d4" style={{ flexShrink: 0 }} />}
              {m.fast     && <Zap    size={13} color={GOLD}     style={{ flexShrink: 0 }} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 11, color: DIM }}>⏱ {m.rt}m</span>
              {m.fast && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                  background: "#0ECB8115", color: GREEN,
                }}>Fast release</span>
              )}
            </div>
          </div>
        </div>
        {/* Orders + completion — top-right */}
        <span style={{
          fontSize: 12, color: DIM, flexShrink: 0,
          whiteSpace: "nowrap", marginLeft: 6, lineHeight: 1.4,
        }}>
          {m.orders} Orders ({m.rate}%)
        </span>
      </div>

      {/* ── Row B: price + limits/qty on left | Buy button on right ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        {/* Left stack */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: DIM, lineHeight: 1 }}>Rs</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: isBuy ? GREEN : RED, lineHeight: 1 }}>
              {m.price.toFixed(2)}
            </span>
          </div>
          {/* Limits */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontSize: 12, marginBottom: 4, lineHeight: 1.5 }}>
            <span style={{ color: DIM, minWidth: 52, flexShrink: 0 }}>Limits</span>
            <span style={{ color: FG }}>{fmtLim(m.minL)} – {fmtLim(m.maxL)} PKR</span>
          </div>
          {/* Quantity */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontSize: 12, lineHeight: 1.5 }}>
            <span style={{ color: DIM, minWidth: 52, flexShrink: 0 }}>Quantity</span>
            <span style={{ color: FG }}>{m.qty.toFixed(4)} USDT</span>
          </div>
        </div>

        {/* Buy / Sell button — fixed right */}
        <button
          onClick={onTrade}
          style={{
            padding: "10px 22px", borderRadius: 22,
            background: isBuy ? GREEN : RED,
            color: "#fff", fontWeight: 700, fontSize: 15,
            border: "none", cursor: "pointer", flexShrink: 0,
            alignSelf: "flex-end", marginBottom: 2,
            minWidth: 80,
          }}
        >
          {isBuy ? "Buy" : "Sell"}
        </button>
      </div>

      {/* ── Row C: payment method pills ── */}
      <div style={{
        display: "flex", flexWrap: "wrap",
        gap: "6px 14px", marginTop: 12,
        paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        {m.pay.map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: DIM }}>
            <div style={{
              width: 3, height: 14, borderRadius: 2, flexShrink: 0,
              background: PM_COLOR[p] ?? "#555",
            }} />
            {p}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function P2P() {
  const [, nav] = useLocation();
  const [tab, setTab]   = useState("P2P");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [pay, setPay]   = useState("All Payment Methods");
  const [sel, setSel]   = useState<M | null>(null);

  const list = (side === "buy" ? SELL : BUY).filter(
    m => pay === "All Payment Methods" || m.pay.includes(pay)
  );

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: "100dvh", background: BG, color: FG,
      maxWidth: "100vw", overflowX: "hidden",
      fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
    }}>

      {/* ── STICKY HEADER ──────────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: BG, borderBottom: `1px solid ${LINE}` }}>

        {/* Tab row */}
        <div style={{
          display: "flex", alignItems: "center",
          height: 52, paddingLeft: 4, paddingRight: 12, gap: 0,
          overflowX: "auto", scrollbarWidth: "none",
        }}>
          <button
            onClick={() => nav("/")}
            style={{ padding: "10px 12px", color: DIM, display: "flex", alignItems: "center", flexShrink: 0, background: "none", border: "none", cursor: "pointer" }}
          >
            <ChevronLeft size={22} />
          </button>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "0 12px", height: "100%",
                fontSize: 14, fontWeight: t === tab ? 700 : 500,
                color: t === tab ? FG : DIM,
                borderBottom: `2.5px solid ${t === tab ? GREEN : "transparent"}`,
                flexShrink: 0, background: "none", border: "none",
                borderTop: "none", borderLeft: "none", borderRight: "none",
                cursor: "pointer", transition: "color .15s",
                touchAction: "manipulation",
              }}
            >
              {t}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 12px", borderRadius: 8,
            background: "#1E2329", color: FG, fontSize: 13, fontWeight: 600,
            border: `1px solid ${LINE}`, cursor: "pointer", flexShrink: 0,
            touchAction: "manipulation",
          }}>
            PKR <ChevronDown size={13} color={DIM} />
          </button>
        </div>

        {/* Security banner */}
        <div style={{ background: "#0F1115", padding: "7px 16px", overflow: "hidden" }}>
          <p style={{
            fontSize: 11, color: "#F6A609", whiteSpace: "nowrap",
            animation: "marquee 32s linear infinite", display: "inline-block", margin: 0,
          }}>
            📢&nbsp;Stay vigilant against impersonators and scammers. Do not share OTP, passwords, or personal banking info. Report suspicious activity immediately.
          </p>
        </div>

        {/* Buy / Sell toggle */}
        <div style={{ display: "flex", alignItems: "center", padding: "10px 16px 8px" }}>
          <div style={{ display: "flex", background: "#1E2329", borderRadius: 100, padding: 3, gap: 2 }}>
            {(["buy", "sell"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSide(s)}
                style={{
                  padding: "9px 28px", borderRadius: 100,
                  fontSize: 15, fontWeight: 700,
                  background: side === s ? (s === "buy" ? GREEN : RED) : "transparent",
                  color: side === s ? "#fff" : DIM,
                  border: "none", cursor: "pointer", transition: "all .18s",
                  textTransform: "capitalize",
                  touchAction: "manipulation",
                }}
              >
                {s === "buy" ? "Buy" : "Sell"}
              </button>
            ))}
          </div>
        </div>

        {/* Filter chips */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "0 16px 12px",
          overflowX: "auto",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}>
          <button style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
            background: "#1E2329", borderRadius: 8, border: `1px solid ${LINE}`,
            color: FG, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
            cursor: "pointer", flexShrink: 0, touchAction: "manipulation",
          }}>
            💎 USDT <ChevronDown size={12} color={DIM} />
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
            background: "#1E2329", borderRadius: 8, border: `1px solid ${LINE}`,
            color: FG, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
            cursor: "pointer", flexShrink: 0, touchAction: "manipulation",
          }}>
            Amount <ChevronDown size={12} color={DIM} />
          </button>
          {/* Payment method select */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <select
              value={pay}
              onChange={e => setPay(e.target.value)}
              style={{
                appearance: "none", padding: "7px 28px 7px 12px",
                background: "#1E2329", borderRadius: 8, border: `1px solid ${LINE}`,
                color: pay === "All Payment Methods" ? DIM : FG,
                fontSize: 13, cursor: "pointer", outline: "none",
                fontFamily: "inherit", whiteSpace: "nowrap",
              }}
            >
              {PAY_OPTS.map(o => <option key={o} value={o} style={{ background: "#1C1F26" }}>{o}</option>)}
            </select>
            <ChevronDown size={12} color={DIM} style={{
              position: "absolute", right: 8, top: "50%",
              transform: "translateY(-50%)", pointerEvents: "none",
            }} />
          </div>
          {/* Funnel */}
          <button style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: 8, background: "#1E2329",
            border: `1px solid ${LINE}`, cursor: "pointer", flexShrink: 0,
            position: "relative", touchAction: "manipulation",
          }}>
            <SlidersHorizontal size={16} color={DIM} />
            <span style={{
              position: "absolute", top: 6, right: 6,
              width: 6, height: 6, borderRadius: "50%", background: GREEN,
            }} />
          </button>
        </div>
      </div>

      {/* ── MERCHANT LIST ──────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: "#0B0E11",
        paddingTop: 10,
        paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))",
      }}>
        <AnimatePresence mode="wait">
          {list.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: "center", padding: "80px 16px", color: DIM }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <p style={{ fontWeight: 600, marginBottom: 4, margin: "0 0 4px" }}>No merchants found</p>
              <p style={{ fontSize: 13, margin: 0 }}>Try changing your payment filter</p>
            </motion.div>
          ) : (
            <motion.div key={side + pay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>
              {list.map(m => (
                <MCard key={m.id} m={m} side={side} onTrade={() => setSel(m)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FIXED BOTTOM NAV ───────────────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", background: BG, borderTop: `1px solid ${LINE}`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        {NAV.map(({ label, Icon, href }) => {
          const active = label === "P2P";
          return (
            <button
              key={label}
              onClick={() => nav(href)}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: "10px 0", gap: 3,
                background: "none", border: "none", cursor: "pointer",
                color: active ? GOLD : DIM,
                touchAction: "manipulation",
              }}
            >
              <Icon size={22} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
              {active && <span style={{ width: 16, height: 2, borderRadius: 2, background: GOLD }} />}
            </button>
          );
        })}
      </div>

      {/* ── Trade Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sel && <TradeModal m={sel} side={side} onClose={() => setSel(null)} />}
      </AnimatePresence>

      <style>{`
        @keyframes marquee { from { transform: translateX(100vw) } to { transform: translateX(-100%) } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        ::-webkit-scrollbar { display: none; }
        select option { background: #1C1F26; }
      `}</style>
    </div>
  );
}
