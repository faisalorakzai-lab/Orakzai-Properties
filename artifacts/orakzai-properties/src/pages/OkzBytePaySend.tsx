/**
 * OkzBytePaySend — "Send via OkzByte Pay" screen
 * Send crypto to another OkzByte user by UID or QR scan.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ReceiptText, RefreshCcw,
  Search, ChevronRight, X, Check, AlertCircle,
  Send, Clock, User, ChevronDown,
} from "lucide-react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/AuthContext";
import { getUserCryptoProfile } from "@/lib/userCrypto";
import { ASSET_DEFS } from "@/store/AppStoreContext";

/* ─── Design tokens ──────────────────────────────────────────────────────────── */
const D = {
  bg:     "#0B0E11",
  dark:   "#181A20",
  card:   "#1C1F26",
  panel:  "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  gold:   "#C9A84C",
  fg:     "#EEF2FF",
  dim:    "#6B7591",
  mid:    "#9AA2B8",
  green:  "#10B981",
  red:    "#F43F5E",
};

type CoinType = string;
const DEFAULT_COINS: CoinType[] = ["USDT", "USDC", "OKBOND", "PKR", "BTC", "ETH"];

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

const CDN = (s: string) =>
  `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${s.toLowerCase()}.svg`;

/* All sendable tokens: platform property tokens + common crypto */
const ALL_TOKENS: { symbol: string; name: string; logoUrl?: string; isProperty?: boolean }[] = [
  ...Object.entries(ASSET_DEFS).map(([, def]) => ({
    symbol:     def.ticker,
    name:       def.name,
    logoUrl:    def.logo ? `/${def.logo}` : undefined,
    isProperty: true,
  })),
  { symbol: "USDT",  name: "Tether USD",      logoUrl: CDN("usdt")  },
  { symbol: "USDC",  name: "USD Coin",         logoUrl: CDN("usdc")  },
  { symbol: "BTC",   name: "Bitcoin",          logoUrl: CDN("btc")   },
  { symbol: "ETH",   name: "Ethereum",         logoUrl: CDN("eth")   },
  { symbol: "BNB",   name: "BNB",              logoUrl: CDN("bnb")   },
  { symbol: "SOL",   name: "Solana",           logoUrl: CDN("sol")   },
  { symbol: "XRP",   name: "XRP",              logoUrl: CDN("xrp")   },
  { symbol: "ADA",   name: "Cardano",          logoUrl: CDN("ada")   },
  { symbol: "DOGE",  name: "Dogecoin",         logoUrl: CDN("doge")  },
  { symbol: "TRX",   name: "TRON",             logoUrl: CDN("trx")   },
  { symbol: "MATIC", name: "Polygon",          logoUrl: CDN("matic") },
  { symbol: "DOT",   name: "Polkadot",         logoUrl: CDN("dot")   },
  { symbol: "LINK",  name: "Chainlink",        logoUrl: CDN("link")  },
  { symbol: "AVAX",  name: "Avalanche",        logoUrl: CDN("avax")  },
  { symbol: "LTC",   name: "Litecoin",         logoUrl: CDN("ltc")   },
  { symbol: "UNI",   name: "Uniswap",          logoUrl: CDN("uni")   },
  { symbol: "ATOM",  name: "Cosmos",           logoUrl: CDN("atom")  },
  { symbol: "XLM",   name: "Stellar",          logoUrl: CDN("xlm")   },
  { symbol: "PKR",   name: "Pakistani Rupee",  logoUrl: undefined    },
];

/* ─── Token Picker Modal ─────────────────────────────────────────────────────── */
function TokenPickerModal({
  open, selected, onClose, onSelect,
}: {
  open: boolean; selected: string;
  onClose: () => void; onSelect: (sym: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = ALL_TOKENS.filter(t =>
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="token-picker-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            key="token-picker-sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#12161C", borderTopLeftRadius: 24, borderTopRightRadius: 24,
              border: "1px solid rgba(255,255,255,0.07)", borderBottom: "none",
              boxShadow: "0 -8px 60px rgba(0,0,0,0.7)",
              maxHeight: "82vh", display: "flex", flexDirection: "column",
            }}
          >
            {/* Grab handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)" }} />
            </div>

            {/* Header */}
            <div style={{ padding: "10px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#EEF2FF" }}>Select Token</span>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 7px", cursor: "pointer", color: "#6B7591", display: "flex" }}>
                <X size={15} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: "0 16px 12px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 12, padding: "8px 12px" }}>
                <Search size={14} color="#6B7591" />
                <input
                  autoFocus
                  placeholder="Search token or name…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "#EEF2FF", fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}
                />
                {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7591", display: "flex", padding: 0 }}><X size={13} /></button>}
              </div>
            </div>

            {/* Token list */}
            <div style={{ overflowY: "auto", padding: "0 12px", paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}>
              {filtered.map(t => (
                <motion.button
                  key={t.symbol}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { onSelect(t.symbol); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    width: "100%", padding: "12px 8px", borderRadius: 12,
                    background: t.symbol === selected ? "rgba(201,168,76,0.08)" : "transparent",
                    border: t.symbol === selected ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent",
                    cursor: "pointer", textAlign: "left", marginBottom: 4,
                    transition: "background .15s, border-color .15s",
                  }}
                  onMouseEnter={e => { if (t.symbol !== selected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={e => { if (t.symbol !== selected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* Logo */}
                  <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, overflow: "hidden", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {t.logoUrl ? (
                      <img src={t.logoUrl} alt={t.symbol} style={{ width: 28, height: 28, objectFit: "contain" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#9AA2B8" }}>{t.symbol.slice(0, 3)}</span>
                    )}
                  </div>
                  {/* Labels */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#EEF2FF", display: "flex", alignItems: "center", gap: 6 }}>
                      {t.symbol}
                      {t.isProperty && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#C9A84C", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 20, padding: "1px 6px" }}>
                          PROPERTY
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7591", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                  </div>
                  {t.symbol === selected && <Check size={15} color="#C9A84C" style={{ flexShrink: 0 }} />}
                </motion.button>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", color: "#6B7591", fontSize: 13, padding: "32px 0" }}>No tokens found</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Recent contacts (demo) ─────────────────────────────────────────────────── */
const RECENT = [
  { uid: "482031294", label: "Bilal K." },
  { uid: "391827465", label: "Sana R." },
  { uid: "617294830", label: "Ahsan M." },
];

/* ─── Confirm bottom sheet ───────────────────────────────────────────────────── */
function ConfirmSheet({
  open, amount, coin, recipientUid,
  onClose, onConfirm,
}: {
  open: boolean; amount: string; coin: CoinType; recipientUid: string;
  onClose: () => void; onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            key="confirm-sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: D.dark, borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "0 0 calc(32px + env(safe-area-inset-bottom))",
              border: `1px solid ${D.border}`, borderBottom: "none",
              boxShadow: "0 -8px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 6 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)" }} />
            </div>
            <div style={{ padding: "12px 22px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: D.fg }}>Confirm Send</span>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${D.border}`, borderRadius: 8, padding: "5px 7px", cursor: "pointer", color: D.dim, display: "flex" }}>
                <X size={15} />
              </button>
            </div>

            {/* Summary */}
            <div style={{ margin: "0 16px 18px", background: D.card, borderRadius: 16, border: `1px solid ${D.border}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "To (UID)", value: recipientUid },
                { label: "Amount",  value: `${amount} ${coin}` },
                { label: "Network", value: "OkzByte Internal" },
                { label: "Fee",     value: "0.00 (Free)" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: D.dim }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: label === "Fee" ? D.green : D.fg }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: "0 16px" }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                style={{
                  width: "100%", padding: "15px", borderRadius: 14, border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg, ${D.gold}, #A07030)`,
                  fontSize: 15, fontWeight: 800, color: "#0B0E11", letterSpacing: "0.01em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Send size={16} />
                Confirm Send
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Success overlay ────────────────────────────────────────────────────────── */
function SuccessOverlay({ show, amount, coin, uid, onDone }: {
  show: boolean; amount: string; coin: CoinType; uid: string; onDone: () => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="success"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "rgba(11,14,17,0.96)", backdropFilter: "blur(12px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 20, padding: "0 32px",
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.1 }}
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `linear-gradient(135deg, ${D.green}, #059669)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 0 16px rgba(16,185,129,0.12), 0 0 0 32px rgba(16,185,129,0.06)`,
            }}
          >
            <Check size={34} color="#fff" strokeWidth={3} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{ textAlign: "center" }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: D.fg, marginBottom: 8 }}>Sent Successfully!</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: D.gold, marginBottom: 4 }}>{amount} {coin}</div>
            <div style={{ fontSize: 13, color: D.dim }}>To UID: {uid}</div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.96 }}
            onClick={onDone}
            style={{
              marginTop: 12, padding: "14px 48px", borderRadius: 14, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${D.gold}, #A07030)`,
              fontSize: 15, fontWeight: 800, color: "#0B0E11",
            }}
          >
            Done
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function OkzBytePaySend() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const uid = user?.uid ?? "demo-uid";
  const profile = getUserCryptoProfile(uid);

  /* State */
  const [recipientUid,   setRecipientUid]   = useState("");
  const [amount,         setAmount]         = useState("");
  const [coin,           setCoin]           = useState<CoinType>("USDT");
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [showSuccess,    setShowSuccess]    = useState(false);
  const [uidError,       setUidError]       = useState("");
  const [showTokenPicker, setShowTokenPicker] = useState(false);

  /* Validation */
  const isValidUid = recipientUid.trim().length >= 6;
  const isValidAmt = parseFloat(amount) > 0;
  const canSend    = isValidUid && isValidAmt;

  const handleSend = useCallback(() => {
    if (!isValidUid) { setUidError("Enter a valid OkzByte UID (min 6 digits)"); return; }
    if (!isValidAmt) return;
    setUidError("");
    setShowConfirm(true);
  }, [isValidUid, isValidAmt]);

  const handleConfirm = useCallback(() => {
    setShowConfirm(false);
    setShowSuccess(true);
  }, []);

  const handleDone = useCallback(() => {
    setShowSuccess(false);
    setLocation("/wallet");
  }, [setLocation]);

  /* ── Render ── */
  return (
    <div style={{
      minHeight: "100dvh",
      background: D.bg,
      fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
      display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto",
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "calc(env(safe-area-inset-top,12px) + 14px) 18px 14px",
        borderBottom: `1px solid ${D.border}`,
        background: D.bg,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setLocation("/wallet/okzbyte-pay")}
          style={{ background: "none", border: "none", cursor: "pointer", color: D.fg, padding: 4, display: "flex" }}
        >
          <ArrowLeft size={22} />
        </motion.button>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: D.fg, letterSpacing: "-0.01em" }}>
            Send (OkzByte Pay)
          </div>
        </div>

        {/* Right icons: history + switch back to Receive */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setLocation("/wallet")}
            title="Transaction History"
            style={{
              background: "rgba(255,255,255,0.06)", border: `1px solid ${D.border}`,
              borderRadius: 9, padding: "7px 8px", cursor: "pointer", color: D.mid,
              display: "flex", alignItems: "center",
            }}
          >
            <ReceiptText size={16} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setLocation("/wallet/okzbyte-pay")}
            title="Switch to Receive"
            style={{
              background: "rgba(255,255,255,0.06)", border: `1px solid ${D.border}`,
              borderRadius: 9, padding: "7px 8px", cursor: "pointer", color: D.mid,
              display: "flex", alignItems: "center",
            }}
          >
            <RefreshCcw size={16} />
          </motion.button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "20px 16px calc(110px + env(safe-area-inset-bottom))",
        display: "flex", flexDirection: "column", gap: 14,
      }}>

        {/* Sender info strip */}
        <div style={{
          background: D.card, border: `1px solid ${D.border}`,
          borderRadius: 14, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {/* Dynamic profile avatar: real photo → initials → icon fallback */}
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="avatar"
              style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${D.gold}` }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : user?.displayName ? (
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${D.gold}, #A07030)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, fontWeight: 800, color: "#0B0E11",
            }}>
              {user.displayName.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${D.gold}, #A07030)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <User size={16} color="#0B0E11" />
            </div>
          )}
          <div>
            <div style={{ fontSize: 11, color: D.dim, marginBottom: 1 }}>Sending from</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: D.fg }}>UID: {profile.okzbyteUid}</div>
          </div>
        </div>

        {/* ── Recipient UID ── */}
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: "16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: D.mid, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Recipient
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: D.panel, border: `1px solid ${uidError ? D.red : D.border}`,
            borderRadius: 12, padding: "4px 12px 4px 4px",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "rgba(255,255,255,0.06)", border: `1px solid ${D.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Search size={15} color={D.dim} />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter OkzByte UID"
              value={recipientUid}
              onChange={e => { setRecipientUid(e.target.value.replace(/\D/g, "")); setUidError(""); }}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                fontSize: 16, fontWeight: 700, color: D.fg,
                fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              }}
            />
            {recipientUid.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => { setRecipientUid(""); setUidError(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: D.dim, display: "flex" }}
              >
                <X size={14} />
              </motion.button>
            )}
          </div>
          {uidError && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <AlertCircle size={13} color={D.red} />
              <span style={{ fontSize: 12, color: D.red }}>{uidError}</span>
            </div>
          )}

          {/* Recent contacts */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: D.dim, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <Clock size={11} color={D.dim} /> Recent
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {RECENT.map(c => (
                <motion.button
                  key={c.uid}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setRecipientUid(c.uid); setUidError(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(255,255,255,0.03)", border: `1px solid ${D.border}`,
                    borderRadius: 10, padding: "9px 12px", cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: "rgba(201,168,76,0.15)", border: `1px solid rgba(201,168,76,0.2)`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <User size={13} color={D.gold} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: D.fg }}>{c.label}</div>
                    <div style={{ fontSize: 11, color: D.dim }}>UID: {c.uid}</div>
                  </div>
                  <ChevronRight size={13} color={D.dim} />
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Amount & Coin ── */}
        <div style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 16, padding: "16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: D.mid, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Amount
          </div>

          {/* Coin selector chips */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
            {DEFAULT_COINS.map(c => (
              <motion.button
                key={c}
                whileTap={{ scale: 0.93 }}
                onClick={() => setCoin(c)}
                style={{
                  padding: "5px 12px", borderRadius: 8,
                  border: `1px solid ${coin === c ? D.gold : D.border}`,
                  background: coin === c ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.04)",
                  color: coin === c ? D.gold : D.dim, fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                {c}
              </motion.button>
            ))}
            {/* "Other ▾" pill — opens full token picker */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setShowTokenPicker(true)}
              style={{
                padding: "5px 10px", borderRadius: 8,
                border: `1px solid ${!DEFAULT_COINS.includes(coin) ? D.gold : D.border}`,
                background: !DEFAULT_COINS.includes(coin) ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.04)",
                color: !DEFAULT_COINS.includes(coin) ? D.gold : D.dim,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              {!DEFAULT_COINS.includes(coin) ? coin : "Other"}
              <ChevronDown size={11} />
            </motion.button>
          </div>

          {/* Amount input */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: D.panel, border: `1px solid ${D.border}`, borderRadius: 12, padding: "4px 14px",
          }}>
            <span style={{ fontSize: 18, color: D.dim, flexShrink: 0 }}>$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                fontSize: 22, fontWeight: 800, color: D.fg,
                fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              }}
            />
            {/* Clickable coin tag — also opens token picker */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowTokenPicker(true)}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 3,
                background: "rgba(201,168,76,0.10)", border: `1px solid rgba(201,168,76,0.25)`,
                borderRadius: 7, padding: "3px 8px", cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: D.gold }}>{coin}</span>
              <ChevronDown size={10} color={D.gold} />
            </motion.button>
          </div>

          {/* Quick amounts */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
            {QUICK_AMOUNTS.map(v => (
              <motion.button
                key={v}
                whileTap={{ scale: 0.93 }}
                onClick={() => setAmount(String(v))}
                style={{
                  padding: "5px 12px", borderRadius: 8,
                  border: `1px solid ${D.border}`, background: "rgba(255,255,255,0.04)",
                  color: D.mid, fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                +{v}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Send button ── */}
        <motion.button
          whileTap={{ scale: canSend ? 0.97 : 1 }}
          onClick={handleSend}
          style={{
            width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: canSend ? "pointer" : "not-allowed",
            background: canSend
              ? `linear-gradient(135deg, ${D.gold}, #A07030)`
              : "rgba(255,255,255,0.06)",
            fontSize: 15, fontWeight: 800,
            color: canSend ? "#0B0E11" : D.dim,
            letterSpacing: "0.01em",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.2s, color 0.2s",
          }}
        >
          <Send size={16} />
          Send {amount && coin ? `${amount} ${coin}` : ""}
        </motion.button>

      </div>

      {/* Token picker modal */}
      <TokenPickerModal
        open={showTokenPicker}
        selected={coin}
        onClose={() => setShowTokenPicker(false)}
        onSelect={sym => setCoin(sym)}
      />

      {/* Confirm sheet */}
      <ConfirmSheet
        open={showConfirm}
        amount={amount}
        coin={coin}
        recipientUid={recipientUid}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
      />

      {/* Success overlay */}
      <SuccessOverlay
        show={showSuccess}
        amount={amount}
        coin={coin}
        uid={recipientUid}
        onDone={handleDone}
      />
    </div>
  );
}
