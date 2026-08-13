import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, QrCode, Headphones, Settings, Share2, Copy, Check,
  CheckCircle, ChevronRight, Wallet, Gift, Send, Layers,
  Bot, Coins, Award, MoreHorizontal, ShieldCheck,
  Zap, ArrowRight, TrendingUp,
} from "lucide-react";
import { useUser } from "@/contexts/AuthContext";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { useKYCStatus } from "@/lib/useKYCStatus";
import { getUserCryptoProfile, type UserCryptoProfile } from "@/lib/userCrypto";

/* ── Design tokens ──────────────────────────────────────────────────── */
const GOLD      = "#C9A84C";
const BG        = "#040b14";
const CARD_BG   = "#04080F";
const BORDER    = "rgba(255,255,255,0.07)";
const BORDER_GOLD = "rgba(201,168,76,0.25)";
const DIM       = "#8B93A7";

/* ── Recommend grid items ─────────────────────────────────────────── */
const RECOMMEND_ITEMS = [
  { icon: Wallet,         label: "OkzByte\nWallet",    href: "/wallet" },
  { icon: Gift,           label: "My Gifts",            href: "/my-gift" },
  { icon: Send,           label: "Pay / Send\nvia UID", href: "/wallet" },
  { icon: Layers,         label: "Options",             href: "/trade" },
  { icon: Bot,            label: "Demo\nTrading",       href: "/trade" },
  { icon: Coins,          label: "Staking",             href: "/portfolio" },
  { icon: Award,          label: "Task Center",         href: "#tasks" },
  { icon: MoreHorizontal, label: "More",                href: "/services" },
];

/* ── Task items ───────────────────────────────────────────────────── */
const DAILY_TASKS = [
  { pts: 1, title: "Daily Spot trading ≥ $10 (5-Day Streak Bonus)", progress: "0 / 10 USDT",  href: "/trade" },
  { pts: 1, title: "Daily Futures trading ≥ $200",                  progress: "0 / 200 USDT", href: "/trade" },
  { pts: 2, title: "Refer a friend & they complete KYC",            progress: "0 / 1",         href: "/kyc"   },
  { pts: 1, title: "Complete your KYC Verification",                progress: "0 / 1",         href: "/kyc"   },
];

/* ── Clipboard hook ──────────────────────────────────────────────── */
function useCopyToClipboard() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}

/* ── QR Code modal (simple display) ─────────────────────────────── */
function QRModal({ value, label, onClose }: { value: string; label: string; onClose: () => void }) {
  const size = 200;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=${size}x${size}&bgcolor=040b14&color=C9A84C&qzone=2`;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: CARD_BG, border: `1px solid ${BORDER_GOLD}`, borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: 280 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span style={{ color: "#EAECEF", fontWeight: 700, fontSize: 15 }}>{label}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={18} color={DIM} /></button>
        </div>
        <div style={{ padding: 12, background: "#fff", borderRadius: 12 }}>
          <img src={qrUrl} alt="QR" width={size} height={size} style={{ display: "block" }} />
        </div>
        <p style={{ color: DIM, fontSize: 11, textAlign: "center", margin: 0, wordBreak: "break-all", lineHeight: 1.5 }}>{value}</p>
      </motion.div>
    </motion.div>
  );
}

/* ── Deposit Addresses section ───────────────────────────────────── */
function DepositAddresses({ crypto, userId }: { crypto: UserCryptoProfile; userId: string }) {
  const { copied, copy } = useCopyToClipboard();
  const [qrOpen, setQrOpen] = useState<{ value: string; label: string } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const networks = [
    { key: "bep20",   label: "BEP20 (BNB Chain)", address: crypto.bep20Address,   color: "#f0b90b" },
    { key: "trc20",   label: "TRC20 (Tron)",       address: crypto.trc20Address,   color: "#ef4444" },
    { key: "polygon", label: "Polygon (ERC20)",    address: crypto.polygonAddress, color: "#8b5cf6" },
  ];

  return (
    <>
      <AnimatePresence>{qrOpen && <QRModal value={qrOpen.value} label={qrOpen.label} onClose={() => setQrOpen(null)} />}</AnimatePresence>

      <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => setExpanded(v => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Wallet size={16} color={GOLD} />
            <span style={{ color: "#EAECEF", fontWeight: 700, fontSize: 14 }}>Deposit Addresses</span>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight size={16} color={DIM} style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }} />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden", borderTop: `1px solid ${BORDER}` }}
            >
              {networks.map(net => (
                <div key={net.key} style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: net.color }}>{net.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 12px" }}>
                    <span style={{ flex: 1, fontSize: 11, color: DIM, fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.5 }}>{net.address}</span>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQrOpen({ value: net.address, label: net.label })}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                      >
                        <QrCode size={14} color={DIM} />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copy(net.address, net.key)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                      >
                        {copied === net.key
                          ? <Check size={14} color="#10b981" />
                          : <Copy size={14} color={DIM} />
                        }
                      </motion.button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN ProfileCenter PAGE
══════════════════════════════════════════════════════════════════════ */
export default function ProfileCenter() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const profilePhoto = useProfilePhoto();
  const { isVerified } = useKYCStatus();
  const { copied, copy } = useCopyToClipboard();
  const [crypto, setCrypto] = useState<UserCryptoProfile | null>(null);
  const [streak, setStreak] = useState(4); // 1-indexed active streak day

  useEffect(() => {
    if (user?.uid) {
      setCrypto(getUserCryptoProfile(user.uid));
    }
  }, [user?.uid]);

  const displayName = user?.fullName ?? user?.firstName ?? user?.primaryEmailAddress?.emailAddress?.split("@")[0] ?? "User";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: "100dvh", width: "100%", background: BG, color: "#F5F5F5", fontFamily: "'Plus Jakarta Sans',sans-serif", paddingBottom: 40, boxSizing: "border-box" }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}
        style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(4,8,20,0.97)", backdropFilter: "blur(22px)", borderBottom: `1px solid ${BORDER}` }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Close */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setLocation("/")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" }}>
            <X size={22} color="#EAECEF" />
          </motion.button>

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {[
              { Icon: QrCode,      label: "QR",       action: () => {} },
              { Icon: Headphones,  label: "Support",  action: () => setLocation("/inbox") },
              { Icon: Settings,    label: "Settings", action: () => setLocation("/profile") },
            ].map(({ Icon, label, action }) => (
              <motion.button key={label} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={action}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}>
                <Icon size={20} color="#EAECEF" />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.header>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px", position: "relative" }}>

        {/* ── IDENTITY CARD ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ padding: "20px 0 0" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Avatar */}
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: `linear-gradient(135deg,${GOLD},#e8a820)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `2.5px solid ${BORDER_GOLD}`, flexShrink: 0, boxShadow: `0 0 24px rgba(201,168,76,0.25)` }}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "#040b14", fontSize: 24, fontWeight: 900 }}>{initials}</span>
                )}
              </div>

              {/* Name + UID */}
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#EAECEF", marginBottom: 4, lineHeight: 1.2 }}>{displayName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: DIM }}>
                    UID: <span style={{ color: "#EAECEF", fontWeight: 600 }}>{crypto?.okzbyteUid ?? "—"}</span>
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => crypto && copy(crypto.okzbyteUid, "uid")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
                  >
                    {copied === "uid"
                      ? <Check size={13} color="#10b981" />
                      : <Copy size={13} color={DIM} />
                    }
                  </motion.button>
                </div>

                {/* Status badges */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(201,168,76,0.12)", border: `1px solid ${BORDER_GOLD}`, fontSize: 11, color: GOLD, fontWeight: 700 }}>Creator</span>
                  {isVerified && (
                    <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", fontSize: 11, color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />Verified
                    </span>
                  )}
                  <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, fontSize: 11, color: DIM, fontWeight: 600 }}>Regular</span>
                  <ChevronRight size={14} color={DIM} />
                </div>
              </div>
            </div>

            {/* Share button */}
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, flexShrink: 0, marginTop: 4 }}
            >
              <Share2 size={18} color={DIM} />
            </motion.button>
          </div>
        </motion.div>

        {/* ── DEPOSIT ADDRESSES ──────────────────────────────────── */}
        {crypto && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} style={{ marginTop: 18 }}>
            <DepositAddresses crypto={crypto} userId={user?.uid ?? ""} />
          </motion.div>
        )}

        {/* ── PROMO BANNERS ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          {[
            {
              tag: "Earn Together",
              title: "Unlock Your Round Reward Now!",
              icon: <Zap size={28} color={GOLD} />,
              bg: "rgba(201,168,76,0.07)",
              border: BORDER_GOLD,
              href: "/portfolio",
            },
            {
              tag: "For you",
              title: "OkzByte Wealth — Yield Optimizer",
              icon: <TrendingUp size={28} color="#10b981" />,
              bg: "rgba(16,185,129,0.07)",
              border: "rgba(16,185,129,0.25)",
              href: "/portfolio",
            },
          ].map(card => (
            <motion.div
              key={card.tag}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => setLocation(card.href)}
              style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 16, padding: "16px 14px", cursor: "pointer", minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
            >
              <div>{card.icon}</div>
              <div>
                <div style={{ fontSize: 10, color: DIM, marginBottom: 4 }}>{card.tag}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#EAECEF", lineHeight: 1.4 }}>{card.title}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── RECOMMEND GRID ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          style={{ marginTop: 20, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}
        >
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#EAECEF" }}>Recommend</span>
            <ChevronRight size={16} color={DIM} />
          </div>
          <div style={{ padding: "12px 8px 16px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px 4px" }}>
            {RECOMMEND_ITEMS.map(item => (
              <motion.button
                key={item.label}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.93 }}
                onClick={() => {
                  if (item.href === "#tasks") document.getElementById("task-center")?.scrollIntoView({ behavior: "smooth" });
                  else setLocation(item.href);
                }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
              >
                <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(201,168,76,0.08)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.icon size={20} color={GOLD} />
                </div>
                <span style={{ color: "#EAECEF", fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3, maxWidth: 68, whiteSpace: "pre-line" }}>{item.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Pagination dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 5, paddingBottom: 14 }}>
            {[0, 1].map(i => (
              <div key={i} style={{ width: i === 0 ? 16 : 6, height: 6, borderRadius: 3, background: i === 0 ? GOLD : BORDER }} />
            ))}
          </div>
        </motion.div>

        {/* ── TASK CENTER ────────────────────────────────────────── */}
        <motion.div
          id="task-center"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          style={{ marginTop: 20, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}
        >
          {/* Header */}
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#EAECEF" }}>Task Center</span>
              <button onClick={() => setLocation("/portfolio")} style={{ background: "none", border: "none", cursor: "pointer", color: DIM, fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>My Vouchers <ChevronRight size={13} /></button>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#EAECEF", marginBottom: 2 }}>Unlock rewards worth <span style={{ color: GOLD }}>15 PTS</span> today</div>
            <div style={{ fontSize: 12, color: DIM }}>End Time <span style={{ color: "#EAECEF", fontWeight: 600 }}>16H : 50M</span></div>
          </div>

          {/* Streak tracker */}
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
              {Array.from({ length: 7 }, (_, i) => {
                const day = i + 1;
                const isDone = day < streak;
                const isActive = day === streak;
                const isFuture = day > streak;
                return (
                  <div key={day} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "50%",
                      background: isActive ? GOLD : isDone ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.05)",
                      border: isActive ? "none" : `1px solid ${isDone ? BORDER_GOLD : BORDER}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: isActive ? `0 0 14px rgba(201,168,76,0.5)` : "none",
                    }}>
                      {isDone
                        ? <Check size={14} color={GOLD} />
                        : <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? "#040b14" : isFuture ? DIM : "#EAECEF" }}>{day}</span>
                      }
                    </div>
                    <span style={{ fontSize: 10, color: isActive ? GOLD : DIM, fontWeight: isActive ? 700 : 400 }}>
                      {isFuture ? "+" : "+0"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task list */}
          <div>
            {DAILY_TASKS.map((task, i) => (
              <motion.div
                key={i}
                whileHover={{ background: "rgba(255,255,255,0.025)" }}
                style={{ padding: "14px 16px", borderBottom: i < DAILY_TASKS.length - 1 ? `1px solid ${BORDER}` : "none", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                onClick={() => setLocation(task.href)}
              >
                {/* PTS badge */}
                <div style={{ width: 44, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{task.pts}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: GOLD }}>PTS</span>
                </div>

                {/* Task details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#EAECEF", lineHeight: 1.4, marginBottom: 3 }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: DIM }}>{task.progress}</div>
                </div>

                {/* Go button */}
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  style={{ flexShrink: 0, padding: "8px 18px", borderRadius: 8, background: GOLD, border: "none", color: "#040b14", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                >
                  Go
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── QUICK LINKS ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {[
            { label: "Full Profile & Settings",        href: "/profile",    icon: Settings },
            { label: "KYC Verification",               href: "/kyc",        icon: ShieldCheck },
            { label: "Portfolio & Assets",             href: "/portfolio",  icon: TrendingUp },
            { label: "Wallet & Transactions",          href: "/wallet",     icon: Wallet },
          ].map(item => (
            <motion.div
              key={item.label}
              whileHover={{ background: "rgba(255,255,255,0.04)" }}
              onClick={() => setLocation(item.href)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: CARD_BG, borderRadius: 12, cursor: "pointer", border: `1px solid ${BORDER}` }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <item.icon size={16} color={GOLD} />
                <span style={{ fontSize: 14, color: "#EAECEF", fontWeight: 500 }}>{item.label}</span>
              </div>
              <ArrowRight size={15} color={DIM} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
