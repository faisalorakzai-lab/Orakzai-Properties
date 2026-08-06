/**
 * DepositDetail — shows full transaction details when user clicks a deposit
 * in the wallet history, styled like the Binance deposit details page.
 */
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, CheckCircle2, Copy, Check, ChevronRight,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { getTxns, type WalletTx } from "@/lib/walletEngine";
import { auth } from "@/lib/firebase";
import {
  generateTRC20Address, generateBEP20Address, generatePolygonAddress,
} from "@/lib/userCrypto";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const D = {
  bg:     "#0B0E11",
  panel:  "#181A20",
  border: "rgba(255,255,255,0.06)",
  gold:   "#C9A84C",
  fg:     "#EEF2FF",
  dim:    "#6B7591",
  mid:    "#9AA2B8",
  green:  "#10B981",
  red:    "#F43F5E",
  yellow: "#F0B90B",
  blue:   "#2196F3",
};

/* ─── Network helper ─────────────────────────────────────────────────────── */
interface NetworkInfo { id: string; label: string }
function networkForCurrency(currency: string): NetworkInfo {
  const map: Record<string, NetworkInfo> = {
    USDT:   { id: "TRX",  label: "TRC20 (Tron)" },
    USDC:   { id: "ETH",  label: "ERC20 (Ethereum)" },
    OKBOND: { id: "BSC",  label: "BEP20 (BSC)" },
    BTC:    { id: "BTC",  label: "Bitcoin Network" },
    ETH:    { id: "ETH",  label: "ERC20 (Ethereum)" },
    BNB:    { id: "BSC",  label: "BEP20 (BSC)" },
    SOL:    { id: "SOL",  label: "Solana" },
    PKR:    { id: "FIAT", label: "Bank Transfer" },
  };
  return map[currency] ?? { id: "BSC", label: "BEP20 (BSC)" };
}

/* ─── Deterministic fake txid (for local wallet txns that have no real hash) */
function deterministicTxid(id: string): string {
  let h = 0xdeadbeef;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 2654435761) >>> 0;
    h = ((h << 13) | (h >>> 19)) >>> 0;
  }
  const chunks: string[] = [];
  let seed = h;
  for (let i = 0; i < 16; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    chunks.push(seed.toString(16).padStart(8, "0"));
  }
  return chunks.join("");
}

/* ─── Address for a network ─────────────────────────────────────────────── */
function addressForNetwork(networkId: string, uid: string): string {
  if (networkId === "TRX")  return generateTRC20Address(uid);
  if (networkId === "ETH")  return generateBEP20Address(uid).replace("0x", "0x");
  if (networkId === "POL")  return generatePolygonAddress(uid);
  if (networkId === "FIAT") return "N/A";
  return generateBEP20Address(uid);
}

/* ─── Trading pairs section ─────────────────────────────────────────────── */
const TRADING_PAIRS = [
  { pair: "USDC/USDT", price: "1.00104", chg: "+0.02%", up: true  },
  { pair: "BTC/USDT",  price: "62,837.43", chg: "-0.92%", up: false },
  { pair: "ETH/USDT",  price: "1,858.82",  chg: "-0.88%", up: false },
];

/* ─── Copy-to-clipboard mini hook ───────────────────────────────────────── */
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }, []);
  return { copied, copy };
}

/* ─── Main page component ───────────────────────────────────────────────── */
export default function DepositDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { copied, copy } = useCopy();
  const [tx, setTx] = useState<WalletTx | null>(null);
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    const id = params.id || params[0] || "";
    const txns = getTxns();
    const found = txns.find(t => t.id === id) ?? null;
    setTx(found);

    // Build deposit address from user UID
    const uid = auth.currentUser?.uid ?? "anonymous";
    if (found?.type === "deposit") {
      const net = networkForCurrency((found as any).currency ?? "USDT");
      setAddress(addressForNetwork(net.id, uid));
    }
  }, [params.id, params[0]]);

  if (!tx) {
    return (
      <div style={{ minHeight: "100dvh", background: D.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: D.mid }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            style={{ width: 40, height: 40, borderRadius: "50%", border: `2px solid ${D.border}`, borderTop: `2px solid ${D.gold}`, margin: "0 auto 16px" }}
          />
          <div style={{ fontSize: 12 }}>Loading transaction…</div>
        </div>
      </div>
    );
  }

  const isDeposit = tx.type === "deposit";
  const dep       = tx as any;
  const currency  = dep.currency ?? dep.quote ?? "USDT";
  const amount    = dep.amount ?? dep.netTotal ?? 0;
  const network   = networkForCurrency(currency);
  const txid      = deterministicTxid(tx.id);
  const dateStr   = new Date(tx.time).toLocaleString("en-PK", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  const sign    = isDeposit ? "+" : (dep.side === "SELL" ? "+" : "-");
  const isFiat  = currency === "PKR";

  return (
    <div style={{ minHeight: "100dvh", background: D.bg, color: D.fg, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: D.bg,
        display: "flex", alignItems: "center",
        padding: "14px 16px",
        borderBottom: `1px solid ${D.border}`,
      }}>
        <button
          onClick={() => setLocation("/wallet")}
          style={{ background: "none", border: "none", cursor: "pointer", color: D.fg, padding: 4, marginRight: 8 }}
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, flex: 1, textAlign: "center" }}>
          {isDeposit ? "Deposit Details" : "Trade Details"}
        </span>
        <div style={{ width: 28 }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{ paddingBottom: 100 }}
      >
        {/* ── Amount + Status ── */}
        <div style={{
          textAlign: "center",
          padding: "36px 24px 28px",
          background: D.bg,
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: D.fg, marginBottom: 12, letterSpacing: "-0.5px" }}>
            <span style={{ color: D.green }}>{sign}</span>
            {Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {currency}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12 }}>
            <CheckCircle2 size={18} color={D.green} />
            <span style={{ fontSize: 15, fontWeight: 600, color: D.green }}>Completed</span>
          </div>

          <div style={{ fontSize: 12, color: D.mid, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
            {isDeposit
              ? "Crypto has arrived in your OkzByte account. View your spot account balance for more details."
              : `Trade executed successfully on your Spot account.`}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 8, background: D.panel, borderTop: `1px solid ${D.border}`, borderBottom: `1px solid ${D.border}` }} />

        {/* ── Details rows ── */}
        <div style={{ background: D.bg, padding: "4px 0" }}>

          {isDeposit && !isFiat && (
            <DetailRow label="Network" value={network.id} />
          )}

          {isDeposit && !isFiat && address && (
            <DetailRow
              label="Address"
              value={address}
              monospace
              truncate
              onCopy={() => copy(address, "address")}
              copyKey="address"
              copied={copied === "address"}
            />
          )}

          {isDeposit && !isFiat && (
            <DetailRow
              label="Txid"
              value={txid}
              monospace
              truncate
              link
              onCopy={() => copy(txid, "txid")}
              copyKey="txid"
              copied={copied === "txid"}
            />
          )}

          {!isDeposit && (
            <>
              <DetailRow label="Pair"   value={`${dep.ticker ?? currency}/USDT`} />
              <DetailRow label="Side"   value={dep.side ?? "BUY"} />
              <DetailRow label="Price"  value={`${Number(dep.price ?? 0).toLocaleString()} USDT`} />
              <DetailRow label="Amount" value={`${Number(dep.amount ?? 0).toLocaleString()} ${dep.ticker ?? currency}`} />
              <DetailRow label="Fee"    value={`${Number(dep.fee ?? 0).toFixed(4)} ${dep.quote ?? "USDT"}`} />
            </>
          )}

          <DetailRow label="Wallet" value="Spot Wallet" />
          <DetailRow label="Date"   value={dateStr} />

          {dep.note && dep.note !== "Wallet top-up" && (
            <DetailRow label="Note" value={dep.note} />
          )}
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 8, background: D.panel, borderTop: `1px solid ${D.border}`, borderBottom: `1px solid ${D.border}` }} />

        {/* ── Trading section ── */}
        <div style={{ background: D.bg }}>
          <button
            onClick={() => setLocation("/markets")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "16px 16px 10px",
              background: "none", border: "none", cursor: "pointer", color: D.fg,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700 }}>Trading</span>
            <ChevronRight size={16} color={D.mid} />
          </button>

          <div style={{ padding: "0 16px 16px" }}>
            {TRADING_PAIRS.map(p => (
              <div key={p.pair} style={{
                display: "flex", alignItems: "center",
                padding: "10px 0",
                borderBottom: `1px solid ${D.border}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: D.fg }}>{p.pair}</div>
                  <div style={{ fontSize: 12, color: p.up ? D.green : D.red, marginTop: 2 }}>
                    {p.price}&nbsp;
                    <span style={{ fontSize: 11 }}>{p.chg}</span>
                  </div>
                </div>
                <button
                  onClick={() => setLocation("/markets")}
                  style={{
                    background: D.yellow, color: "#000", border: "none",
                    borderRadius: 6, padding: "7px 16px",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Trade Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── DetailRow subcomponent ─────────────────────────────────────────────── */
interface DetailRowProps {
  label: string;
  value: string;
  monospace?: boolean;
  truncate?: boolean;
  link?: boolean;
  onCopy?: () => void;
  copyKey?: string;
  copied?: boolean;
}
function DetailRow({ label, value, monospace, truncate, link, onCopy, copied }: DetailRowProps) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      padding: "13px 16px",
      borderBottom: `1px solid ${D.border}`,
      gap: 12,
    }}>
      <span style={{ fontSize: 12, color: D.mid, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1, justifyContent: "flex-end" }}>
        <span style={{
          fontSize: 12, fontWeight: 500,
          color: link ? "#2196F3" : D.fg,
          fontFamily: monospace ? "'Courier New', monospace" : "inherit",
          textAlign: "right",
          wordBreak: truncate ? "break-all" : "normal",
        }}>
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            style={{ background: "none", border: "none", cursor: "pointer", color: D.mid, flexShrink: 0, padding: 2 }}
          >
            {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}
