/**
 * OkzBytePayReceive — "Receive via OkzByte Pay" screen
 * Triggered from the Add Funds → Select Deposit Method modal.
 * Mirrors the Bybit Pay "Receive" UI (dark theme, QR card, utility cards).
 */
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Copy, Check, RefreshCw,
  ReceiptText, Globe,
  X, Download, Share2, ChevronRight,
  Link2, Send as TelegramIcon, MessageCircle, MoreHorizontal,
} from "lucide-react";
import { useLocation } from "wouter";
import { useUser } from "@/contexts/AuthContext";
import { getUserCryptoProfile } from "@/lib/userCrypto";

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

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function maskEmail(email: string | null | undefined): string {
  if (!email) return "user***@okzbyte.com";
  const [local, domain] = email.split("@");
  if (!domain) return "user***@okzbyte.com";
  const visible = local.slice(0, 3);
  const masked   = local.length > 3 ? "***" : "*";
  return `${visible}${masked}@${domain}`;
}

/* ─── QR Code component ──────────────────────────────────────────────────────── */
function QRCode({ data, logoSrc, size = 200 }: {
  data: string; logoSrc?: string; size?: number;
}) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=${size}x${size}&margin=4&bgcolor=ffffff&color=000000&format=png`;
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{
      position: "relative",
      width: size + 28, height: size + 28,
      background: "#fff",
      borderRadius: 20,
      padding: 14,
      boxShadow: "0 10px 48px rgba(0,0,0,0.55)",
      margin: "0 auto",
    }}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(240,240,240,0.9)", borderRadius: 8,
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              border: "3px solid #ddd", borderTopColor: "#888",
            }}
          />
        </div>
      )}
      <img
        src={qrUrl}
        alt="OkzByte Pay QR Code"
        width={size}
        height={size}
        style={{ display: "block", borderRadius: 6, opacity: loaded ? 1 : 0, transition: "opacity .3s" }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      {/* Center logo/avatar */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 44, height: 44, borderRadius: "50%",
        background: "#0B0E11",
        border: "4px solid #fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {logoSrc ? (
          <img src={logoSrc} alt="OkzByte" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 17, fontWeight: 900, color: D.gold, letterSpacing: "-0.03em" }}>O</span>
        )}
      </div>
    </div>
  );
}

/* ─── Copy button ────────────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }, [text]);

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={handle}
      title="Copy to clipboard"
      style={{
        background: "none", border: "none", cursor: "pointer",
        padding: 4, display: "flex", alignItems: "center",
        color: copied ? D.green : D.mid,
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </motion.button>
  );
}

/* ─── Set Amount Modal ───────────────────────────────────────────────────────── */
const COINS = ["USDT","USDC","OKBOND","PKR","BTC","ETH"] as const;
type CoinType = typeof COINS[number];

function SetAmountModal({ open, onClose, onConfirm }: {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: string, coin: CoinType) => void;
}) {
  const [amount, setAmount] = useState("");
  const [coin, setCoin]     = useState<CoinType>("USDT");

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    onConfirm(amount, coin);
    onClose();
    setAmount("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: D.dark, borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: "20px 22px calc(32px + env(safe-area-inset-bottom))",
              border: `1px solid ${D.border}`, borderBottom: "none",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.16)" }} />
            </div>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: D.fg }}>Set Request Amount</span>
              <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${D.border}`, borderRadius: 8, padding: "5px 7px", cursor: "pointer", color: D.dim, display: "flex" }}>
                <X size={15} />
              </button>
            </div>

            {/* Coin selector */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 18 }}>
              {COINS.map(c => (
                <button
                  key={c}
                  onClick={() => setCoin(c)}
                  style={{
                    padding: "9px 4px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                    cursor: "pointer", transition: "all .18s",
                    border: `1px solid ${coin === c ? D.gold : D.border}`,
                    background: coin === c ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)",
                    color: coin === c ? D.gold : D.dim,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div style={{
              background: "rgba(255,255,255,0.04)", border: `1px solid ${D.border}`,
              borderRadius: 14, padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 12, marginBottom: 22,
            }}>
              <span style={{ fontSize: 18, color: D.dim, flexShrink: 0 }}>
                {coin === "PKR" ? "₨" : coin === "USDT" ? "₮" : coin === "USDC" ? "$" : coin === "BTC" ? "₿" : coin === "ETH" ? "Ξ" : "◈"}
              </span>
              <input
                type="number" placeholder="0.00" value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
                style={{
                  background: "none", border: "none", outline: "none",
                  fontSize: 22, fontWeight: 800, color: D.fg, flex: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              />
              <span style={{ fontSize: 12, color: D.dim, flexShrink: 0 }}>{coin}</span>
            </div>

            {/* Quick amounts */}
            <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
              {[10, 50, 100, 500].map(v => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  style={{
                    flex: 1, padding: "7px 4px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                    border: `1px solid ${D.border}`, background: "rgba(255,255,255,0.04)",
                    color: D.mid, cursor: "pointer",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              disabled={!amount || parseFloat(amount) <= 0}
              style={{
                width: "100%", padding: 14, borderRadius: 13,
                background: `linear-gradient(135deg, ${D.gold}, #A07030)`,
                border: "none", color: "#0a0800",
                fontSize: 15, fontWeight: 800, cursor: "pointer",
                opacity: (!amount || parseFloat(amount) <= 0) ? 0.5 : 1,
                transition: "opacity .2s",
              }}
            >
              Confirm Amount
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Share text builder ─────────────────────────────────────────────────────── */
function buildShareText(
  maskedEmail: string,
  uid: string,
  requestLabel: string | null,
  baseLink: string,
): string {
  const parts   = requestLabel ? requestLabel.replace("Request ", "").split(" ") : [];
  const amount  = parts[0] && parseFloat(parts[0]) > 0 ? parts[0] : "Any";
  const coin    = parts[1] ?? "";
  const link    = amount !== "Any"
    ? `https://okzbyte.com/pay/${uid}?amount=${amount}`
    : baseLink;

  return (
    `👇 *OkzByte Pay - Payment Request*\n\n` +
    `Hey! I am requesting a transfer via OkzByte Pay.\n\n` +
    `👤 *Recipient:* ${maskedEmail}\n` +
    `🆔 *OkzByte UID:* ${uid}\n` +
    `💰 *Requested Amount:* ${amount}${coin ? ` ${coin}` : ""}\n\n` +
    `🔗 *Pay directly via link:*\n${link}\n\n` +
    `⚡ _Zero fees • Instant internal settlement on OkzByte Exchange_`
  );
}

/* ─── Share-to Poster Modal ──────────────────────────────────────────────────── */
function ShareToModal({
  open, onClose, qrData, logoSrc, maskedEmail, okzbyteUid, requestLabel, shareLink,
}: {
  open: boolean;
  onClose: () => void;
  qrData: string;
  logoSrc: string;
  maskedEmail: string;
  okzbyteUid: string;
  requestLabel: string | null;
  shareLink: string;
}) {
  const [copied, setCopied] = useState(false);

  const shareText = buildShareText(maskedEmail, okzbyteUid, requestLabel, shareLink);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleMore = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "OkzByte Pay Request", text: shareText, url: shareLink });
      } catch {}
    } else {
      handleCopy();
    }
  };

  /* Poster QR URL (smaller, for the poster preview) */
  const posterQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=200x200&margin=3&bgcolor=ffffff&color=000000&format=png`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="share-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed", inset: 0, zIndex: 10002,
            background: "rgba(0,0,0,0.82)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          onClick={onClose}
        >
          <motion.div
            key="share-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#13151B",
              borderTopLeftRadius: 26, borderTopRightRadius: 26,
              paddingBottom: "calc(32px + env(safe-area-inset-bottom))",
              boxShadow: "0 -12px 80px rgba(0,0,0,0.7)",
              border: `1px solid rgba(255,255,255,0.07)`,
              borderBottom: "none",
              maxHeight: "92vh",
              overflowY: "auto",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)" }} />
            </div>

            {/* Title row */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px 16px",
            }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: "#EEF2FF", letterSpacing: "-0.01em" }}>
                Share to
              </span>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, padding: "5px 7px", cursor: "pointer",
                  color: "#6B7591", display: "flex",
                }}
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* ── Poster Card ── */}
            <div style={{ padding: "0 16px 20px" }}>
              <div style={{
                borderRadius: 20,
                overflow: "hidden",
                /* Premium black background with gold grid/line decoration */
                background: "#090B0E",
                border: "1px solid rgba(201,168,76,0.25)",
                boxShadow: "0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.1)",
                position: "relative",
              }}>

                {/* Corner gold accent lines (decorative) */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  backgroundImage:
                    `repeating-linear-gradient(45deg, rgba(201,168,76,0.04) 0px, rgba(201,168,76,0.04) 1px, transparent 1px, transparent 28px),
                     repeating-linear-gradient(-45deg, rgba(201,168,76,0.04) 0px, rgba(201,168,76,0.04) 1px, transparent 1px, transparent 28px)`,
                }} />

                {/* Glow spot */}
                <div style={{
                  position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)",
                  width: 260, height: 260,
                  background: "radial-gradient(circle, rgba(201,168,76,0.14) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />

                {/* Brand header */}
                <div style={{
                  padding: "20px 20px 14px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  position: "relative",
                }}>
                  {/* Diamond logo mark */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 6,
                    transform: "rotate(45deg)",
                    background: `linear-gradient(135deg, #C9A84C, #A07030)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 0 14px rgba(201,168,76,0.45)",
                  }}>
                    <span style={{
                      transform: "rotate(-45deg)",
                      fontSize: 13, fontWeight: 900, color: "#0B0E11",
                      lineHeight: 1,
                    }}>O</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <span style={{
                      fontSize: 20, fontWeight: 900, letterSpacing: "0.12em",
                      color: "#C9A84C",
                      textShadow: "0 0 20px rgba(201,168,76,0.5)",
                    }}>OKZ</span>
                    <span style={{
                      fontSize: 20, fontWeight: 900, letterSpacing: "0.12em",
                      color: "#EEF2FF",
                    }}>BYTE</span>
                    <span style={{
                      marginLeft: 8,
                      fontSize: 20, fontWeight: 900, letterSpacing: "0.12em",
                      color: "#C9A84C",
                    }}>PAY</span>
                  </div>
                </div>

                {/* Inner QR card */}
                <div style={{
                  margin: "0 16px 0",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: "18px 18px 16px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
                  position: "relative",
                }}>
                  <p style={{
                    fontSize: 12, fontWeight: 600, color: "#9AA2B8",
                    margin: "0 0 14px", textAlign: "center", letterSpacing: "0.01em",
                  }}>
                    Scan with the OkzByte App to pay
                  </p>

                  {/* QR code */}
                  <div style={{
                    background: "#fff", borderRadius: 14,
                    padding: 10, position: "relative",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                  }}>
                    <img
                      src={posterQrUrl}
                      alt="OkzByte Pay QR"
                      width={160}
                      height={160}
                      style={{ display: "block", borderRadius: 6 }}
                    />
                    {/* Center logo */}
                    <div style={{
                      position: "absolute", top: "50%", left: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 34, height: 34, borderRadius: "50%",
                      background: "#0B0E11", border: "3px solid #fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
                    }}>
                      {logoSrc ? (
                        <img src={logoSrc} alt="OkzByte" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 900, color: "#C9A84C" }}>O</span>
                      )}
                    </div>
                  </div>

                  {/* Masked email */}
                  <p style={{
                    fontSize: 12, fontWeight: 600, color: "#9AA2B8",
                    margin: "12px 0 0", textAlign: "center",
                  }}>
                    {maskedEmail}
                  </p>
                </div>

                {/* Tagline banner */}
                <div style={{
                  margin: "14px 0 0",
                  background: "linear-gradient(90deg, #C9A84C, #A07030 60%, #C9A84C)",
                  padding: "13px 20px 14px",
                }}>
                  <div style={{
                    fontSize: 13, fontWeight: 800, color: "#0B0E11",
                    letterSpacing: "0.01em", marginBottom: 3,
                  }}>
                    Instant RWA &amp; Crypto Payments with OkzByte
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(11,14,17,0.65)", letterSpacing: "0.01em" }}>
                    Unlock the future of Web3 finance today!
                  </div>
                </div>
              </div>
            </div>

            {/* ── Share action row ── */}
            <div style={{
              display: "flex", justifyContent: "space-around", alignItems: "flex-start",
              padding: "4px 20px 8px",
            }}>
              {/* Copy Link */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleCopy}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}
              >
                <div style={{
                  width: 54, height: 54, borderRadius: "50%",
                  background: copied ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.09)",
                  border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.12)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background .2s, border-color .2s",
                }}>
                  {copied ? <Check size={22} color="#10B981" /> : <Link2 size={22} color="#9AA2B8" />}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: copied ? "#10B981" : "#9AA2B8" }}>
                  {copied ? "Copied!" : "Copy Link"}
                </span>
              </motion.button>

              {/* Telegram */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleTelegram}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}
              >
                <div style={{
                  width: 54, height: 54, borderRadius: "50%",
                  background: "#2AABEE",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(42,171,238,0.35)",
                }}>
                  <TelegramIcon size={22} color="#fff" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#9AA2B8" }}>Telegram</span>
              </motion.button>

              {/* WhatsApp */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleWhatsApp}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}
              >
                <div style={{
                  width: 54, height: 54, borderRadius: "50%",
                  background: "#25D366",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(37,211,102,0.35)",
                }}>
                  <MessageCircle size={22} color="#fff" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#9AA2B8" }}>WhatsApp</span>
              </motion.button>

              {/* More */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={handleMore}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}
              >
                <div style={{
                  width: 54, height: 54, borderRadius: "50%",
                  background: "rgba(255,255,255,0.09)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <MoreHorizontal size={22} color="#9AA2B8" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#9AA2B8" }}>More</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function OkzBytePayReceive() {
  const [, setLocation] = useLocation();
  const { user } = useUser();

  const uid = user?.uid ?? "demo-uid";
  const profile = getUserCryptoProfile(uid);
  const maskedEmail = maskEmail(user?.primaryEmailAddress?.emailAddress);

  /* QR data: encode the receipt link */
  const qrData    = `okzbyte://pay?uid=${profile.okzbyteUid}&ref=receive`;
  const shareLink = `https://pay.okzbyte.com/r/${profile.okzbyteUid}`;

  /* State */
  const [showSetAmount,   setShowSetAmount]   = useState(false);
  const [showShareModal,  setShowShareModal]  = useState(false);
  const [requestLabel,    setRequestLabel]    = useState<string | null>(null);

  const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const logoSrc = `${BASE}/okzbyte-icon.png`;
  const qrRef = useRef<HTMLDivElement>(null);

  /* ── Handlers ── */
  const handleSaveQR = () => {
    const a = document.createElement("a");
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=400x400&margin=6&bgcolor=ffffff&color=000000&format=png`;
    a.href = qrUrl;
    a.download = `okzbyte-pay-${profile.okzbyteUid}.png`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleHistoryIcon = () => {
    setLocation("/wallet");
  };

  const handleSwitchMode = () => {
    setLocation("/wallet/okzbyte-pay-send");
  };

  const handleAmountConfirm = (amount: string, coin: CoinType) => {
    setRequestLabel(`Request ${amount} ${coin}`);
  };

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
        {/* Back */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setLocation("/wallet")}
          style={{ background: "none", border: "none", cursor: "pointer", color: D.fg, padding: 4, display: "flex" }}
        >
          <ArrowLeft size={22} />
        </motion.button>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: D.fg, letterSpacing: "-0.01em" }}>
            Receive (OkzByte Pay)
          </div>
        </div>

        {/* Right icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleHistoryIcon}
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
            onClick={handleSwitchMode}
            title="Switch Pay Mode"
            style={{
              background: "rgba(255,255,255,0.06)", border: `1px solid ${D.border}`,
              borderRadius: 9, padding: "7px 8px", cursor: "pointer", color: D.mid,
              display: "flex", alignItems: "center",
            }}
          >
            <RefreshCw size={16} />
          </motion.button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "20px 16px calc(40px + env(safe-area-inset-bottom))",
        display: "flex", flexDirection: "column", gap: 14,
      }}>

        {/* ── Main QR Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{
            background: D.card,
            border: `1px solid ${D.border}`,
            borderRadius: 22,
            padding: "24px 20px 22px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
          }}
        >
          {/* User identity header */}
          <div style={{ textAlign: "center", marginBottom: 18, width: "100%" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: D.mid, marginBottom: 6 }}>
              {maskedEmail}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`,
              borderRadius: 20, padding: "5px 12px",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: D.fg }}>
                {profile.okzbyteUid}
              </span>
              <span style={{ fontSize: 10, color: D.dim }}>(OkzByte UID)</span>
              <CopyButton text={profile.okzbyteUid} />
            </div>
          </div>

          {/* Request amount badge (shown after Set Amount) */}
          <AnimatePresence>
            {requestLabel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  marginBottom: 14,
                  background: "rgba(201,168,76,0.12)", border: `1px solid rgba(201,168,76,0.35)`,
                  borderRadius: 10, padding: "6px 16px",
                  fontSize: 12, fontWeight: 700, color: D.gold,
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {requestLabel}
                <button
                  onClick={() => setRequestLabel(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: D.dim, padding: 0, display: "flex" }}
                >
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR Code */}
          <div ref={qrRef} style={{ marginBottom: 18 }}>
            <QRCode data={qrData} logoSrc={logoSrc} size={210} />
          </div>

          {/* Caption */}
          <p style={{
            fontSize: 14, fontWeight: 600, color: D.mid,
            margin: "0 0 22px", textAlign: "center",
          }}>
            Pay me via this QR code
          </p>

          {/* Set Amount button (centered) */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowSetAmount(true)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "11px 32px", borderRadius: 22,
              background: "rgba(255,255,255,0.06)", border: `1px solid ${D.border}`,
              color: D.fg, fontSize: 13, fontWeight: 700, cursor: "pointer",
              marginBottom: 14, width: "100%", maxWidth: 220,
              transition: "border-color .18s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = D.border; }}
          >
            <Download size={15} />
            Set Amount
          </motion.button>

          {/* Save QR + Share Link */}
          <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 360 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveQR}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "11px 12px", borderRadius: 22,
                background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`,
                color: D.fg, fontSize: 12, fontWeight: 700, cursor: "pointer",
                transition: "border-color .18s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = D.border; }}
            >
              <Download size={14} />
              Save QR Code
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleShare}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "11px 12px", borderRadius: 22,
                background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`,
                color: D.fg, fontSize: 12, fontWeight: 700, cursor: "pointer",
                transition: "border-color .18s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = D.border; }}
            >
              <Share2 size={14} />
              Share Link
            </motion.button>
          </div>
        </motion.div>

        {/* ── Utility action cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >

        </motion.div>

        {/* ── Visit OkzByte Pay Portal link ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              color: D.dim, fontSize: 13, fontWeight: 600,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = D.mid; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = D.dim; }}
          >
            <Globe size={15} />
            Visit OkzByte Pay Portal
          </motion.button>
        </motion.div>
      </div>

      {/* ── Set Amount Modal ── */}
      <SetAmountModal
        open={showSetAmount}
        onClose={() => setShowSetAmount(false)}
        onConfirm={handleAmountConfirm}
      />

      {/* ── Share-to Poster Modal ── */}
      <ShareToModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        qrData={qrData}
        logoSrc={logoSrc}
        maskedEmail={maskedEmail}
        okzbyteUid={profile.okzbyteUid}
        requestLabel={requestLabel}
        shareLink={shareLink}
      />
    </div>
  );
}
