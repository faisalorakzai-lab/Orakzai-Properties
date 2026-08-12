import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronDown,
  Clock3,
  Clipboard,
  Copy,
  ExternalLink,
  FileText,
  Info,
  List,
  LockKeyhole,
  Mail,
  Search,
  ShieldCheck,
  X,
  WalletCards,
} from "lucide-react";
import { useLocation } from "wouter";
import { COINS, type Coin } from "./CryptoDepositFlow";
import { useAppStore } from "@/store/AppStoreContext";
import type { WalletState } from "@/lib/walletEngine";
import { useUser } from "@/contexts/AuthContext";
import { getWithdrawalTxns, type WithdrawalTx } from "@/lib/walletEngine";

const D = {
  bg: "#000000",
  panel: "#1E1F24",
  panelSoft: "#14161C",
  border: "rgba(255,255,255,0.08)",
  fg: "#F5F5F7",
  mid: "#A5A7B0",
  dim: "#8B8D98",
  gold: "#C9A84C",
  green: "#10B981",
  blue: "#7EA7FF",
};

function formatBalance(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

function formatAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

function getCoinBalance(wallet: WalletState | null, coin: Coin): number {
  if (!wallet) return 0;
  const balance = wallet.balances[coin.symbol as keyof WalletState["balances"]];
  return typeof balance === "number" ? balance : 0;
}

type NetworkOption = {
  id: string;
  name: string;
  shortName: string;
  eta: string;
  fee: number;
  fastest?: boolean;
};

const WITHDRAWAL_FLOW_KEY = "okzbyte:withdrawal-flow:v1";

type PersistedWithdrawalFlow = {
  coinSymbol?: string;
  address?: string;
  networkId?: string;
  amount?: string;
  remarks?: string;
  code?: string;
  codeRequested?: boolean;
  submitted?: boolean;
  statusStep?: number;
  seconds?: number;
  cancelled?: boolean;
  submittedAt?: string;
};

function readWithdrawalFlow(): PersistedWithdrawalFlow | null {
  try {
    const raw = window.localStorage.getItem(WITHDRAWAL_FLOW_KEY);
    return raw ? JSON.parse(raw) as PersistedWithdrawalFlow : null;
  } catch {
    return null;
  }
}

function saveWithdrawalFlow(patch: PersistedWithdrawalFlow) {
  try {
    const current = readWithdrawalFlow() ?? {};
    window.localStorage.setItem(WITHDRAWAL_FLOW_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    // Storage may be unavailable in private browsing; keep the in-memory flow working.
  }
}

function clearWithdrawalFlow() {
  try {
    window.localStorage.removeItem(WITHDRAWAL_FLOW_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}

const NETWORKS: Record<string, NetworkOption[]> = {
  BTC: [{ id: "bitcoin", name: "Bitcoin", shortName: "BTC", eta: "10–30 min", fee: 0.0001 }],
  ETH: [
    { id: "ethereum", name: "Ethereum", shortName: "ERC20", eta: "3–8 min", fee: 0.0012 },
    { id: "arbitrum", name: "Arbitrum One", shortName: "Arbitrum", eta: "1–3 min", fee: 0.0004, fastest: true },
  ],
  USDT: [
    { id: "tron", name: "TRON", shortName: "TRC20", eta: "1–3 min", fee: 1 },
    { id: "bsc", name: "BNB Smart Chain", shortName: "BEP20", eta: "1–2 min", fee: 0.8, fastest: true },
    { id: "ethereum", name: "Ethereum", shortName: "ERC20", eta: "3–8 min", fee: 3.5 },
    { id: "polygon", name: "Polygon", shortName: "Polygon", eta: "2–5 min", fee: 0.2 },
  ],
  USDC: [
    { id: "bsc", name: "BNB Smart Chain", shortName: "BEP20", eta: "1–2 min", fee: 0.8, fastest: true },
    { id: "ethereum", name: "Ethereum", shortName: "ERC20", eta: "3–8 min", fee: 3.5 },
    { id: "polygon", name: "Polygon", shortName: "Polygon", eta: "2–5 min", fee: 0.2 },
  ],
  PKR: [{ id: "bank", name: "Bank Transfer", shortName: "PKR", eta: "1–2 business days", fee: 0 }],
  OKBOND: [{ id: "okzbyte", name: "OkzByte Network", shortName: "OKBOND", eta: "Under 1 min", fee: 0 }],
};

function getNetworks(symbol: string): NetworkOption[] {
  return NETWORKS[symbol] ?? [{ id: "okzbyte", name: "OkzByte Network", shortName: "OKZ", eta: "Under 1 min", fee: 0 }];
}

function maskEmail(email: string | null | undefined): string {
  if (!email) return "your verified email";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${(name ?? "").slice(0, 2)}•••@${domain}`;
}

function shortAddress(address: string): string {
  return address.length > 30 ? `${address.slice(0, 16)}…${address.slice(-10)}` : address;
}

function previewWithdrawalTxid(coin: Coin, amount: number, network: NetworkOption, address: string): string {
  const input = `${coin.symbol}:${amount}:${network.id}:${address}`;
  let seed = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    seed ^= input.charCodeAt(index);
    seed = Math.imul(seed, 16777619) >>> 0;
  }

  let txid = "";
  for (let index = 0; index < 8; index += 1) {
    seed = (Math.imul(seed ^ (index * 0x9e3779b9), 1664525) + 1013904223) >>> 0;
    txid += seed.toString(16).padStart(8, "0");
  }
  return txid;
}

function explorerUrl(network: NetworkOption, txid: string): string | null {
  const explorers: Record<string, string> = {
    bitcoin: `https://mempool.space/tx/${txid}`,
    ethereum: `https://etherscan.io/tx/${txid}`,
    arbitrum: `https://arbiscan.io/tx/${txid}`,
    bsc: `https://bscscan.com/tx/${txid}`,
    polygon: `https://polygonscan.com/tx/${txid}`,
    tron: `https://tronscan.org/#/transaction/${txid}`,
  };
  return explorers[network.id] ?? null;
}

function CoinIcon({ coin }: { coin: Coin }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (coin.logoUrl && !imageFailed) {
    return (
      <img
        src={coin.logoUrl}
        alt=""
        onError={() => setImageFailed(true)}
        style={{ width: 28, height: 28, objectFit: "contain", borderRadius: "50%" }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: coin.bg,
        color: coin.color,
        fontSize: 16,
        fontWeight: 800,
      }}
    >
      {coin.icon}
    </span>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label style={{ display: "block", marginBottom: 18 }}>
      <span style={{ display: "block", marginBottom: 9, color: D.mid, fontSize: 14 }}>
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 54,
          padding: "0 14px",
          borderRadius: 9,
          background: D.panel,
          border: `1px solid ${D.border}`,
        }}
      >
        <input
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            color: D.fg,
            fontSize: 15,
          }}
        />
        {label === "Address" && (
          <>
            <Clipboard size={19} color={D.dim} style={{ flexShrink: 0 }} />
            <span style={{ width: 1, height: 22, background: D.border }} />
            <span style={{ color: D.dim, display: "flex" }} aria-label="Scan address">
              <span style={{ fontSize: 20, lineHeight: 1 }}>⌗</span>
            </span>
          </>
        )}
      </div>
    </label>
  );
}

function Sheet({
  title,
  onClose,
  children,
  maxWidth = 560,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(0,0,0,0.74)",
        padding: "0 0 env(safe-area-inset-bottom)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "calc(100dvh - 18px)",
          overflowY: "auto",
          borderRadius: "26px 26px 0 0",
          background: "#15171D",
          border: `1px solid ${D.border}`,
          boxShadow: "0 -18px 60px rgba(0,0,0,0.46)",
          padding: "12px 18px calc(32px + env(safe-area-inset-bottom))",
        }}
      >
        <div style={{ width: 42, height: 4, borderRadius: 99, background: "#4B4E59", margin: "0 auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0, color: D.fg, fontSize: 18, fontWeight: 800 }}>{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: 0, borderRadius: 99, background: "rgba(255,255,255,0.06)", color: D.mid, cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NetworkMark({ network }: { network: NetworkOption }) {
  const colors: Record<string, string> = {
    bitcoin: "#F7931A",
    ethereum: "#8D9BF4",
    arbitrum: "#4E96FF",
    tron: "#EF3340",
    bsc: "#F0B90B",
    polygon: "#A66CFF",
    bank: D.gold,
    okzbyte: D.gold,
  };
  const fill = colors[network.id] ?? D.gold;
  const circle = {
    width: 34,
    height: 34,
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
    overflow: "hidden" as const,
  };

  if (network.id === "ethereum") {
    return (
      <span style={{ ...circle, background: "#F1F3FA" }} aria-hidden="true">
        <svg viewBox="0 0 32 32" width="27" height="27">
          <path fill="#6877D9" d="M16 3 6.8 16.1 16 20.2l9.2-4.1L16 3Z" />
          <path fill="#4453B7" d="m16 3 9.2 13.1-9.2 4.1V3Z" />
          <path fill="#6877D9" d="m6.8 18.1 9.2 10.9 9.2-10.9-9.2 4.1-9.2-4.1Z" />
          <path fill="#4453B7" d="m16 22.2 9.2-4.1L16 29V22.2Z" />
        </svg>
      </span>
    );
  }
  if (network.id === "bitcoin") {
    return <span style={{ ...circle, background: fill, color: "#fff", fontWeight: 900, fontSize: 22 }} aria-hidden="true">₿</span>;
  }
  if (network.id === "tron") {
    return (
      <span style={{ ...circle, background: fill }} aria-hidden="true">
        <svg viewBox="0 0 32 32" width="25" height="25">
          <path fill="#fff" d="m5 7 21 4-10 16L5 7Zm4.2 3.5 6.5 12.6 5.9-9.7-12.4-2.9Zm0 0 12.4 2.9-5.9 9.7L9.2 10.5Z" />
        </svg>
      </span>
    );
  }
  if (network.id === "bsc") {
    return (
      <span style={{ ...circle, background: fill }} aria-hidden="true">
        <svg viewBox="0 0 32 32" width="25" height="25">
          <path fill="#17120A" d="m16 4 3.4 3.4-3.4 3.4-3.4-3.4L16 4Zm-6 6 3.4 3.4L10 16l-3.4-3.4L10 10Zm12 0 3.4 3.4L22 16l-3.4-3.4L22 10Zm-6 6 3.4 3.4-3.4 3.4-3.4-3.4L16 16Zm-6 6 3.4-3.4 3.4 3.4-3.4 3.4L10 22Zm12 0 3.4-3.4 3.4 3.4-3.4 3.4L22 22Z" />
        </svg>
      </span>
    );
  }
  if (network.id === "polygon") {
    return (
      <span style={{ ...circle, background: fill }} aria-hidden="true">
        <svg viewBox="0 0 32 32" width="25" height="25">
          <path fill="#fff" d="M9 10.2c1.1 0 2 .4 2.9 1l2.5 1.8c.5.4 1 .4 1.5 0l2.5-1.8c.9-.6 1.8-1 2.9-1 1.7 0 3.1 1.3 3.1 3v5.6c0 1.7-1.4 3-3.1 3-1.1 0-2-.4-2.9-1l-2.5-1.8c-.5-.4-1-.4-1.5 0l-2.5 1.8c-.9.6-1.8 1-2.9 1-1.7 0-3.1-1.3-3.1-3v-5.6c0-1.7 1.4-3 3.1-3Z" />
        </svg>
      </span>
    );
  }
  if (network.id === "arbitrum") {
    return (
      <span style={{ ...circle, background: "#EAF2FF" }} aria-hidden="true">
        <svg viewBox="0 0 32 32" width="26" height="26">
          <circle cx="16" cy="16" r="13" fill="#4E96FF" />
          <path fill="#fff" d="m10 21 4.9-10h2.2L12.2 21H10Zm5.1 0 4.4-9h2.1l-4.3 9h-2.2Z" />
        </svg>
      </span>
    );
  }
  return <span style={{ ...circle, background: fill, color: "#17120A", fontWeight: 900, fontSize: 11 }} aria-hidden="true">{network.shortName.slice(0, 2)}</span>;
}

function NetworkSheet({
  coin,
  networks,
  selected,
  onSelect,
  onClose,
}: {
  coin: Coin;
  networks: NetworkOption[];
  selected: NetworkOption | null;
  onSelect: (network: NetworkOption) => void;
  onClose: () => void;
}) {
  return (
    <Sheet title={`Select ${coin.symbol} network`} onClose={onClose}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "18px 0 12px", padding: 12, borderRadius: 10, background: "rgba(44,89,190,0.28)", color: "#C7D7FF", fontSize: 12, lineHeight: 1.45 }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
        <span>Make sure your withdrawal address and selected network match exactly.</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        {networks.map(network => {
          const isSelected = selected?.id === network.id;
          return (
            <button
              key={network.id}
              type="button"
              onClick={() => onSelect(network)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 6px",
                border: 0,
                borderBottom: `1px solid ${D.border}`,
                background: "transparent",
                color: D.fg,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <NetworkMark network={network} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 750 }}>
                  {network.name} <span style={{ color: D.dim, fontWeight: 500 }}>({network.shortName})</span>
                  {network.fastest && <span style={{ color: D.green, fontSize: 10 }}>Fastest</span>}
                </span>
                <span style={{ display: "block", marginTop: 4, color: D.dim, fontSize: 11 }}>
                  Arrival {network.eta} · Network fee {formatAmount(network.fee)} {coin.symbol}
                </span>
              </span>
              <span style={{ width: 20, height: 20, display: "grid", placeItems: "center", borderRadius: "50%", border: `1px solid ${isSelected ? D.gold : D.dim}`, background: isSelected ? D.gold : "transparent", color: "#17120A" }}>
                {isSelected && <Check size={13} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function ReviewSheet({
  coin,
  network,
  address,
  amount,
  fee,
  received,
  onBack,
  onConfirm,
}: {
  coin: Coin;
  network: NetworkOption;
  address: string;
  amount: number;
  fee: number;
  received: number;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet title="Withdrawal details" onClose={onBack}>
      <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
        <div style={{ color: D.mid, fontSize: 13 }}>You will receive</div>
        <div style={{ marginTop: 7, color: D.fg, fontSize: 32, fontWeight: 900 }}>{formatAmount(received)} <span style={{ fontSize: 18 }}>{coin.symbol}</span></div>
        <div style={{ marginTop: 6, color: D.dim, fontSize: 12 }}>Review every detail before confirming</div>
      </div>
      <div style={{ padding: 14, borderRadius: 14, background: D.panel }}>
        {[
          ["Address", shortAddress(address)],
          ["Network", `${network.name} (${network.shortName})`],
          ["Amount", `${formatAmount(amount)} ${coin.symbol}`],
          ["Network fee", `${formatAmount(fee)} ${coin.symbol}`],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "11px 0", borderBottom: label === "Network fee" ? 0 : `1px solid ${D.border}`, color: D.mid, fontSize: 13 }}>
            <span>{label}</span>
            <strong style={{ maxWidth: "65%", color: D.fg, textAlign: "right", fontWeight: 700 }}>{value}</strong>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14, padding: 12, borderRadius: 10, background: "rgba(201,168,76,0.1)", color: "#E7D4A0", fontSize: 12, lineHeight: 1.45 }}>
        <ShieldCheck size={16} style={{ flexShrink: 0 }} />
        <span>Confirm the address and network. Blockchain withdrawals cannot be reversed.</span>
      </div>
      <button type="button" onClick={onConfirm} style={{ width: "100%", height: 54, marginTop: 18, border: 0, borderRadius: 27, background: `linear-gradient(135deg, ${D.gold}, #E3C36A)`, color: "#17120A", fontSize: 15, fontWeight: 850, cursor: "pointer" }}>
        Confirm withdrawal
      </button>
    </Sheet>
  );
}

function VerificationSheet({
  email,
  code,
  codeRequested,
  onCodeChange,
  onGetCode,
  onConfirm,
  onClose,
}: {
  email: string;
  code: string;
  codeRequested: boolean;
  onCodeChange: (value: string) => void;
  onGetCode: () => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isValid = /^\d{6}$/.test(code);
  return (
    <Sheet title="Verify withdrawal" onClose={onClose}>
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 18, padding: 12, borderRadius: 10, background: "rgba(42,79,165,0.34)", color: "#D5E0FF", fontSize: 12, lineHeight: 1.45 }}>
        <LockKeyhole size={16} style={{ flexShrink: 0 }} />
        <span>Test mode is active. Enter any 6-digit verification code to review the next screen.</span>
      </div>
      <div style={{ marginTop: 22, color: D.mid, fontSize: 13 }}>A verification code will be sent to</div>
      <div style={{ marginTop: 5, color: D.fg, fontSize: 14, fontWeight: 750 }}>{maskEmail(email)}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, padding: "0 14px", minHeight: 54, borderRadius: 10, background: D.panel, border: `1px solid ${codeRequested ? "rgba(201,168,76,0.5)" : D.border}` }}>
        <Mail size={18} color={D.dim} />
        <input
          aria-label="Email verification code"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={event => onCodeChange(event.target.value.replace(/\D/g, ""))}
          placeholder="Enter email verification code"
          style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "transparent", color: D.fg, fontSize: 15 }}
        />
        <button type="button" onClick={onGetCode} style={{ border: 0, background: "transparent", color: D.blue, fontSize: 13, fontWeight: 750, cursor: "pointer", whiteSpace: "nowrap" }}>
          {codeRequested ? "Code ready" : "Get code"}
        </button>
      </div>
      <div style={{ marginTop: 10, color: D.dim, fontSize: 11 }}>Test-only verification. Enter exactly 6 digits to continue the preview flow.</div>
      <button type="button" disabled={!isValid} onClick={onConfirm} style={{ width: "100%", height: 54, marginTop: 22, border: 0, borderRadius: 27, background: isValid ? `linear-gradient(135deg, ${D.gold}, #E3C36A)` : "#262830", color: isValid ? "#17120A" : "#737680", fontSize: 15, fontWeight: 850, cursor: isValid ? "pointer" : "not-allowed" }}>
        Verify and submit preview
      </button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, color: D.dim, fontSize: 12 }}><ShieldCheck size={14} /> Protected by OkzByte security checks</div>
    </Sheet>
  );
}

const WITHDRAW_FAQ_ITEMS = [
  {
    question: "How to deposit/withdraw cryptocurrency on the OkzByte app?",
    answer: "Open the OkzByte app, tap Assets from the bottom navigation, then choose Withdraw. Select your token, withdrawal method, address, network, and amount before confirming.",
  },
  {
    question: "How to choose a network? (BEP20 vs TRC20 vs Polygon)",
    answer: "Always select the same network on OkzByte and the receiving wallet. BEP20, TRC20, and Polygon have different addresses, fees, and confirmation times.",
  },
];

function WithdrawFAQScreen({
  onBack,
  onOpenGuide,
}: {
  onBack: () => void;
  onOpenGuide: () => void;
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openTutorial, setOpenTutorial] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Withdrawal FAQ"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        background: D.bg,
        color: D.fg,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          padding: "calc(env(safe-area-inset-top,10px) + 12px) 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          borderBottom: `1px solid ${D.border}`,
          background: D.bg,
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: D.fg, fontSize: 15, fontWeight: 700 }}>
          How to Deposit/Withdraw Cryp...
        </span>
        <button
          type="button"
          aria-label="Close withdrawal FAQ"
          onClick={onBack}
          style={{ display: "grid", placeItems: "center", padding: 4, border: 0, background: "transparent", color: D.dim, cursor: "pointer" }}
        >
          <X size={21} />
        </button>
      </div>

      <div
        style={{
          padding: "14px 16px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${D.border}`,
        }}
      >
        <span style={{ color: D.fg, fontSize: 20, fontWeight: 800 }}>FAQ</span>
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" aria-label="Search withdrawal FAQ" style={{ display: "flex", padding: 2, border: 0, background: "transparent", color: D.dim, cursor: "pointer" }}>
            <Search size={19} />
          </button>
          <button type="button" aria-label="List view" style={{ display: "flex", padding: 2, border: 0, background: "transparent", color: D.dim, cursor: "pointer" }}>
            <List size={19} />
          </button>
        </div>
      </div>

      <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 4, borderBottom: `1px solid ${D.border}`, overflow: "hidden", whiteSpace: "nowrap" }}>
        <span style={{ color: D.dim, fontSize: 11 }}>Withdrawal</span>
        <ChevronRight size={10} color={D.dim} />
        <span style={{ color: D.dim, fontSize: 11 }}>Deposit/Withdraw Guide</span>
        <ChevronRight size={10} color={D.dim} />
        <span style={{ color: D.fg, fontSize: 11 }}>How to Withdraw?</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 34px" }}>
        <h2 style={{ margin: "0 0 6px", color: D.fg, fontSize: 18, lineHeight: 1.35, fontWeight: 850 }}>
          How to Deposit/Withdraw Cryptocurrency on OkzByte?
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 20 }}>
          <span style={{ color: D.dim, fontSize: 11 }}>Published on 2026-08-10 13:15</span>
          <span style={{ color: D.dim, fontSize: 11 }}>Updated on 2026-08-10 13:15</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {WITHDRAW_FAQ_ITEMS.map((item, index) => (
            <div key={item.question} style={{ overflow: "hidden", border: `1px solid ${D.border}`, borderRadius: 12, background: "rgba(255,255,255,0.04)" }}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px", border: 0, background: "transparent", color: D.fg, textAlign: "left", cursor: "pointer" }}
              >
                <span style={{ flex: 1, fontSize: 13, lineHeight: 1.45 }}>{item.question}</span>
                <ChevronDown size={16} color={D.dim} style={{ flexShrink: 0, transform: openFaq === index ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
              </button>
              {openFaq === index && (
                <div style={{ padding: "0 14px 14px", color: D.dim, fontSize: 12, lineHeight: 1.65 }}>
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ margin: "24px 0 12px", color: D.fg, fontSize: 15, fontWeight: 800 }}>
          Step-by-step tutorials
        </div>
        <div style={{ overflow: "hidden", border: `1px solid ${D.border}`, borderRadius: 12, background: "rgba(255,255,255,0.04)" }}>
          <button
            type="button"
            onClick={() => setOpenTutorial(!openTutorial)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px", border: 0, background: "transparent", color: D.fg, textAlign: "left", cursor: "pointer" }}
          >
            <span style={{ flex: 1, fontSize: 13, lineHeight: 1.45 }}>How to withdraw crypto on the OkzByte app?</span>
            <ChevronDown size={16} color={D.dim} style={{ flexShrink: 0, transform: openTutorial ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
          </button>
          {openTutorial && (
            <div style={{ padding: "0 14px 14px" }}>
              <p style={{ margin: "0 0 12px", color: D.dim, fontSize: 12, lineHeight: 1.6 }}>
                Follow the complete on-chain withdrawal, internal transfer, and safety-notes guide with the attached step-by-step visuals.
              </p>
              <button
                type="button"
                onClick={onOpenGuide}
                style={{ width: "100%", minHeight: 44, border: 0, borderRadius: 22, background: D.gold, color: "#17120A", fontSize: 13, fontWeight: 850, cursor: "pointer" }}
              >
                Open detailed withdrawal guide
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WithdrawalStatus({
  coin,
  amount,
  network,
  address,
  onDone,
}: {
  coin: Coin;
  amount: number;
  network: NetworkOption;
  address: string;
  onDone: () => void;
}) {
  const [step, setStep] = useState(() => {
    const saved = readWithdrawalFlow();
    return saved?.coinSymbol === coin.symbol && saved.address === address && saved.networkId === network.id
      ? Math.max(0, Math.min(2, saved.statusStep ?? 0))
      : 0;
  });
  const [cancelled, setCancelled] = useState(() => {
    const saved = readWithdrawalFlow();
    return saved?.coinSymbol === coin.symbol && saved.address === address && saved.networkId === network.id
      ? saved.cancelled === true
      : false;
  });
  const [seconds, setSeconds] = useState(() => {
    const saved = readWithdrawalFlow();
    return saved?.coinSymbol === coin.symbol && saved.address === address && saved.networkId === network.id
      ? Math.max(0, saved.seconds ?? 30)
      : 30;
  });
  const [copiedField, setCopiedField] = useState<"address" | "txid" | null>(null);
  const [submittedAt] = useState(() => {
    const saved = readWithdrawalFlow();
    return saved?.coinSymbol === coin.symbol && saved.address === address && saved.networkId === network.id && saved.submittedAt
      ? new Date(saved.submittedAt)
      : new Date();
  });
  const txid = previewWithdrawalTxid(coin, amount, network, address);
  const blockchainUrl = explorerUrl(network, txid);

  useEffect(() => {
    saveWithdrawalFlow({
      coinSymbol: coin.symbol,
      address,
      networkId: network.id,
      amount: String(amount),
      submitted: true,
      statusStep: step,
      seconds,
      cancelled,
      submittedAt: submittedAt.toISOString(),
    });
  }, [address, amount, cancelled, coin.symbol, network.id, seconds, step, submittedAt]);

  const copyDetail = (value: string, field: "address" | "txid") => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(current => current === field ? null : current), 1800);
  };

  useEffect(() => {
    if (cancelled || step !== 0) return;
    const timer = window.setInterval(() => {
      setSeconds(current => {
        if (current <= 1) {
          setStep(1);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cancelled, step]);

  useEffect(() => {
    if (step !== 1) return;
    const timer = window.setTimeout(() => setStep(2), 4200);
    return () => window.clearTimeout(timer);
  }, [step]);

  if (cancelled) {
    return (
      <main style={{ minHeight: "100dvh", background: D.bg, color: D.fg, fontFamily: "'Inter', sans-serif", padding: "26px 20px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <button type="button" onClick={onDone} style={{ display: "flex", alignItems: "center", gap: 8, border: 0, background: "transparent", color: D.fg, cursor: "pointer" }}><ArrowLeft size={20} /> Wallet</button>
          <div style={{ marginTop: "18vh", textAlign: "center" }}>
            <div style={{ width: 78, height: 78, display: "grid", placeItems: "center", margin: "0 auto 20px", borderRadius: "50%", background: "rgba(239,68,68,0.15)", color: "#F87171" }}><X size={38} /></div>
            <h1 style={{ margin: 0, fontSize: 24 }}>Withdrawal cancelled</h1>
            <p style={{ margin: "12px auto 0", maxWidth: 330, color: D.mid, lineHeight: 1.6 }}>Your preview request was cancelled before system processing started.</p>
            <button type="button" onClick={onDone} style={{ width: "100%", maxWidth: 360, height: 52, marginTop: 30, border: 0, borderRadius: 26, background: D.gold, color: "#17120A", fontWeight: 850, cursor: "pointer" }}>Return to wallet</button>
          </div>
        </div>
      </main>
    );
  }

  const labels = ["Withdrawal request submitted", "System processing", "Withdrawal complete"];
  return (
    <main style={{ minHeight: "100dvh", overflowX: "hidden", background: "radial-gradient(circle at 50% 12%, rgba(201,168,76,0.12), transparent 34%), #000", color: D.fg, fontFamily: "'Inter', sans-serif", padding: "calc(env(safe-area-inset-top, 12px) + 18px) 20px 32px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 13, background: "rgba(201,168,76,0.15)", color: D.gold }}><ShieldCheck size={23} /></div>
          <div><div style={{ color: D.gold, fontSize: 11, fontWeight: 800, letterSpacing: 1.8, textTransform: "uppercase" }}>OkzByte secure transfer</div><h1 style={{ margin: "4px 0 0", fontSize: 22 }}>Withdrawal status</h1></div>
        </header>
        <div style={{ marginTop: 28, padding: 18, borderRadius: 18, background: D.panel, border: `1px solid ${D.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div><div style={{ color: D.dim, fontSize: 12 }}>Amount</div><div style={{ marginTop: 5, fontSize: 24, fontWeight: 850 }}>{formatAmount(amount)} {coin.symbol}</div></div>
            <span style={{ padding: "7px 10px", borderRadius: 99, background: "rgba(201,168,76,0.14)", color: D.gold, fontSize: 11, fontWeight: 750 }}>{step === 2 ? "Complete" : "In progress"}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "13px 12px", marginTop: 18, color: D.mid, fontSize: 12 }}>
            <span>Network</span><strong style={{ color: D.fg, textAlign: "right" }}>{network.name} ({network.shortName})</strong>
            <span>Destination</span><strong style={{ color: D.fg, textAlign: "right" }}>{shortAddress(address)}</strong>
          </div>
        </div>
        <section style={{ position: "relative", marginTop: 28, paddingLeft: 52 }}>
          <div style={{ position: "absolute", left: 17, top: 20, bottom: 20, width: 2, background: "rgba(201,168,76,0.22)" }} />
          {labels.map((label, index) => {
            const complete = index < step;
            const active = index === step;
            return (
              <div key={label} style={{ position: "relative", minHeight: 94 }}>
                <div style={{ position: "absolute", left: -52, top: 0, width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "50%", background: complete || active ? D.gold : "#252730", color: complete || active ? "#17120A" : D.dim, boxShadow: active ? `0 0 0 7px rgba(201,168,76,0.12)` : "none" }}>{complete ? <Check size={18} strokeWidth={3} /> : active ? <Clock3 size={18} /> : <span style={{ fontSize: 13, fontWeight: 800 }}>{index + 1}</span>}</div>
                <div style={{ color: active || complete ? D.fg : D.dim, fontWeight: active ? 800 : 650, fontSize: 15 }}>{label}</div>
                <div style={{ marginTop: 6, color: D.dim, fontSize: 12, lineHeight: 1.5 }}>
                  {index === 0 && (active ? `Your request is secured. Cancellation available for ${seconds}s.` : "Request accepted by OkzByte security.")}
                  {index === 1 && (active ? "The network and destination are being verified." : "Network processing will begin after the cancellation window.")}
                  {index === 2 && (active ? "Funds have been released to the destination address." : "Final confirmation pending.")}
                </div>
                {active && index === 0 && <button type="button" onClick={() => setCancelled(true)} style={{ marginTop: 12, padding: "9px 14px", border: `1px solid rgba(248,113,113,0.55)`, borderRadius: 18, background: "transparent", color: "#FCA5A5", fontSize: 12, fontWeight: 750, cursor: "pointer" }}>Cancel withdrawal</button>}
              </div>
            );
          })}
        </section>
        {step === 2 && (
          <section style={{ marginTop: 2, padding: "5px 0 0", borderTop: `1px solid ${D.border}` }}>
            <div style={{ padding: "16px 0 8px", fontSize: 16, fontWeight: 800 }}>Withdrawal details</div>
            <div style={{ overflow: "hidden", borderTop: `1px solid ${D.border}`, borderBottom: `1px solid ${D.border}` }}>
              {[
                { label: "Network", value: `${network.name} (${network.shortName})` },
                { label: "Address", value: address, copy: "address" as const },
                { label: "Txid", value: txid, copy: "txid" as const },
                { label: "Fee", value: `${formatAmount(network.fee)} ${coin.symbol}` },
                {
                  label: "Time",
                  value: submittedAt.toLocaleString("en-PK", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  }),
                },
              ].map(detail => (
                <div
                  key={detail.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "92px minmax(0, 1fr) auto",
                    alignItems: "center",
                    gap: 12,
                    minHeight: 58,
                    padding: "10px 0",
                    borderBottom: detail.label === "Time" ? 0 : `1px solid ${D.border}`,
                    color: D.mid,
                    fontSize: 13,
                  }}
                >
                  <span>{detail.label}</span>
                  <span
                    style={{
                      minWidth: 0,
                      color: D.fg,
                      textAlign: "right",
                      fontWeight: 650,
                      overflowWrap: "anywhere",
                      fontFamily: detail.copy ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
                      fontSize: detail.copy ? 11 : 13,
                    }}
                  >
                    {detail.value}
                  </span>
                  {detail.copy ? (
                    <button
                      type="button"
                      aria-label={`Copy ${detail.label.toLowerCase()}`}
                      onClick={() => copyDetail(detail.value, detail.copy!)}
                      style={{ display: "grid", placeItems: "center", width: 30, height: 30, padding: 0, border: 0, borderRadius: 8, background: copiedField === detail.copy ? "rgba(16,185,129,0.14)" : "transparent", color: copiedField === detail.copy ? D.green : D.dim, cursor: "pointer" }}
                    >
                      {copiedField === detail.copy ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  ) : <span style={{ width: 30 }} />}
                </div>
              ))}
            </div>
            {blockchainUrl ? (
              <a
                href={blockchainUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 58, color: D.fg, textDecoration: "none", borderBottom: `1px solid ${D.border}`, fontSize: 13 }}
              >
                <span style={{ color: D.mid }}>Query Blockchain</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: D.blue, fontWeight: 750 }}>
                  {network.shortName === "BEP20" ? "BscScan" : `${network.name} Explorer`}
                  <ExternalLink size={16} />
                </span>
              </a>
            ) : null}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.04)", color: D.dim, fontSize: 11, lineHeight: 1.45 }}>
              <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Preview transaction: no funds were moved and this test Txid is not broadcast to the network.</span>
            </div>
          </section>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.04)", color: D.dim, fontSize: 11, lineHeight: 1.4 }}><Info size={15} /> Preview mode: no funds are moved and no production withdrawal is created.</div>
        {step === 2 && <button type="button" onClick={onDone} style={{ width: "100%", height: 52, marginTop: 22, border: 0, borderRadius: 26, background: D.gold, color: "#17120A", fontWeight: 850, cursor: "pointer" }}>Done</button>}
      </div>
    </main>
  );
}

function WithdrawForm({
  coin,
  balance,
  onBack,
  onChangeCoin,
}: {
  coin: Coin;
  balance: number;
  onBack: () => void;
  onChangeCoin: () => void;
}) {
  const networks = getNetworks(coin.symbol);
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const [address, setAddress] = useState(() => {
    const saved = readWithdrawalFlow();
    return saved?.coinSymbol === coin.symbol ? saved.address ?? "" : "";
  });
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkOption | null>(() => {
    const saved = readWithdrawalFlow();
    if (saved?.coinSymbol !== coin.symbol || !saved.networkId) return null;
    return networks.find(network => network.id === saved.networkId) ?? null;
  });
  const [amount, setAmount] = useState(() => {
    const saved = readWithdrawalFlow();
    return saved?.coinSymbol === coin.symbol ? saved.amount ?? "" : "";
  });
  const [remarks, setRemarks] = useState(() => {
    const saved = readWithdrawalFlow();
    return saved?.coinSymbol === coin.symbol ? saved.remarks ?? "" : "";
  });
  const [showNetworkSheet, setShowNetworkSheet] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showReviewSheet, setShowReviewSheet] = useState(false);
  const [showVerificationSheet, setShowVerificationSheet] = useState(false);
  const [code, setCode] = useState(() => {
    const saved = readWithdrawalFlow();
    return saved?.coinSymbol === coin.symbol ? saved.code ?? "" : "";
  });
  const [codeRequested, setCodeRequested] = useState(() => {
    const saved = readWithdrawalFlow();
    return saved?.coinSymbol === coin.symbol && saved.codeRequested === true;
  });
  const [submitted, setSubmitted] = useState(() => {
    const saved = readWithdrawalFlow();
    return saved?.coinSymbol === coin.symbol &&
      saved.submitted === true &&
      Boolean(saved.address && saved.amount && saved.networkId);
  });
  const numericAmount = Number(amount);
  const isValid = Boolean(
    address.trim() &&
    selectedNetwork &&
    numericAmount > 0 &&
    numericAmount <= balance,
  );
  const fee = selectedNetwork?.fee ?? 0;
  const received = Number.isFinite(numericAmount) && numericAmount > 0
    ? Math.max(0, numericAmount - fee)
    : 0;

  useEffect(() => {
    saveWithdrawalFlow({
      coinSymbol: coin.symbol,
      address,
      networkId: selectedNetwork?.id,
      amount,
      remarks,
      code,
      codeRequested,
      submitted,
    });
  }, [address, amount, code, codeRequested, coin.symbol, remarks, selectedNetwork?.id, submitted]);

  if (submitted && selectedNetwork) {
    return (
      <WithdrawalStatus
        coin={coin}
        amount={numericAmount}
        network={selectedNetwork}
        address={address}
        onDone={onBack}
      />
    );
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        overflowX: "hidden",
        background: D.bg,
        color: D.fg,
        fontFamily: "'Inter', sans-serif",
        paddingBottom: "calc(230px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top, 10px) + 15px) 18px 14px",
          borderBottom: `1px solid ${D.border}`,
        }}
      >
        <button
          type="button"
          aria-label="Back to coin list"
          onClick={onBack}
          style={{ display: "grid", placeItems: "center", width: 36, height: 36, border: "none", background: "transparent", color: D.fg, cursor: "pointer" }}
        >
          <ArrowLeft size={23} />
        </button>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Withdraw</h1>
        <div style={{ display: "flex", gap: 12, color: D.dim }}>
          <FileText size={20} />
          <button
            type="button"
            aria-label="How to withdraw on OkzByte"
            onClick={() => setShowFAQ(true)}
            style={{ display: "grid", placeItems: "center", width: 28, height: 28, padding: 0, border: "1px solid currentColor", borderRadius: "50%", background: "transparent", color: D.fg, cursor: "pointer" }}
          >
            <AlertCircle size={20} />
          </button>
        </div>
      </header>

      <section style={{ maxWidth: 560, margin: "0 auto", padding: "16px 18px 0" }}>
        <button
          type="button"
          onClick={onChangeCoin}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 14px",
            border: `1px solid ${D.border}`,
            borderRadius: 9,
            background: D.panelSoft,
            color: D.fg,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <CoinIcon coin={coin} />
          <span style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>{coin.symbol}</span>
          <ChevronRight size={20} color={D.dim} />
        </button>

        <div style={{ marginTop: 28 }}>
          <TextField
            label="Address"
            value={address}
            onChange={setAddress}
            placeholder="Please enter the address"
          />

          <div style={{ marginBottom: 19 }}>
            <span style={{ display: "block", marginBottom: 9, color: D.mid, fontSize: 14 }}>
              Network
            </span>
            <button
              type="button"
              aria-label="Select withdrawal network"
              onClick={() => setShowNetworkSheet(true)}
              style={{
                width: "100%",
                minHeight: 62,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 10,
                border: `1px solid ${selectedNetwork ? "rgba(201,168,76,0.5)" : D.border}`,
                background: D.panel,
                color: selectedNetwork ? D.fg : D.dim,
                outline: "none",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {selectedNetwork && <NetworkMark network={selectedNetwork} />}
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 15, fontWeight: selectedNetwork ? 750 : 500 }}>
                  {selectedNetwork ? `${selectedNetwork.name} (${selectedNetwork.shortName})` : "Please select withdrawal network"}
                </span>
                {selectedNetwork && <span style={{ display: "block", marginTop: 4, color: D.dim, fontSize: 11 }}>Arrival {selectedNetwork.eta} · Fee {formatAmount(selectedNetwork.fee)} {coin.symbol}</span>}
              </span>
              <ChevronRight size={20} color={D.dim} />
            </button>
          </div>

          <label style={{ display: "block", marginBottom: 3 }}>
            <span style={{ display: "block", marginBottom: 9, color: D.mid, fontSize: 14 }}>
              Amount
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 54,
                padding: "0 14px",
                borderRadius: 9,
                border: `1px solid ${D.mid}`,
                background: D.panel,
              }}
            >
              <input
                aria-label="Withdrawal amount"
                type="number"
                min="0"
                max={balance}
                step="any"
                value={amount}
                onChange={event => setAmount(event.target.value)}
                placeholder="Please enter the withdrawal quantity"
                style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: D.fg, fontSize: 15 }}
              />
              <button type="button" onClick={() => setAmount(String(balance))} style={{ border: "none", background: "transparent", color: D.blue, fontSize: 15, cursor: "pointer" }}>
                All
              </button>
              <strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>{coin.symbol}</strong>
            </div>
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22, color: D.dim, fontSize: 13 }}>
            <span>Available</span>
            <span>{formatBalance(balance)} {coin.symbol}</span>
          </div>

          <TextField
            label="Remarks (optional)"
            value={remarks}
            onChange={setRemarks}
            placeholder="Please enter withdrawal instructions"
          />

          <div style={{ marginTop: 26 }}>
            <div style={{ color: D.mid, fontSize: 14, marginBottom: 8 }}>Withdrawal Notification</div>
            <ol style={{ margin: 0, paddingLeft: 18, color: D.dim, fontSize: 12, lineHeight: 1.7 }}>
              <li>Minimum withdrawal amount depends on the selected network.</li>
              <li>Always confirm that the address and network match.</li>
              <li>Withdrawals to OkzByte platform addresses may be credited quickly.</li>
              <li>Do not withdraw to crowdfunding or unsupported contract addresses.</li>
              <li>Do not trade with high-risk assets.</li>
            </ol>
          </div>
        </div>
      </section>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(66px + env(safe-area-inset-bottom, 0px))",
          zIndex: 5,
          padding: "12px 18px calc(16px + env(safe-area-inset-bottom))",
          background: "rgba(0,0,0,0.96)",
          borderTop: `1px solid ${D.border}`,
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "inline-block", marginBottom: 9, padding: "5px 10px", borderRadius: "0 10px 0 0", background: "#113A9A", color: "#BBD0FF", fontSize: 12 }}>
            Lowest Withdrawal Fees Globally
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ color: D.dim, fontSize: 12 }}>Received</div>
              <div style={{ marginTop: 7, fontSize: 20, fontWeight: 800 }}>{formatAmount(received)} {coin.symbol}</div>
              <div style={{ marginTop: 3, color: D.dim, fontSize: 11 }}>Network Fee {formatAmount(fee)} {coin.symbol}</div>
            </div>
            <button
              type="button"
              disabled={!isValid}
              onClick={() => setShowReviewSheet(true)}
              style={{
                minWidth: 140,
                height: 56,
                border: "none",
                borderRadius: 28,
                background: isValid ? `linear-gradient(135deg, ${D.gold}, #E3C36A)` : "#15151A",
                color: isValid ? "#17120A" : "#5F6068",
                fontSize: 15,
                fontWeight: 800,
                cursor: isValid ? "pointer" : "not-allowed",
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
      {showNetworkSheet && (
        <NetworkSheet
          coin={coin}
          networks={networks}
          selected={selectedNetwork}
          onClose={() => setShowNetworkSheet(false)}
          onSelect={option => {
            setSelectedNetwork(option);
            setShowNetworkSheet(false);
          }}
        />
      )}
      {showFAQ && (
        <WithdrawFAQScreen
          onBack={() => setShowFAQ(false)}
          onOpenGuide={() => setLocation("/help/how-to-withdraw")}
        />
      )}
      {showReviewSheet && selectedNetwork && (
        <ReviewSheet
          coin={coin}
          network={selectedNetwork}
          address={address}
          amount={numericAmount}
          fee={fee}
          received={received}
          onBack={() => setShowReviewSheet(false)}
          onConfirm={() => {
            setShowReviewSheet(false);
            setShowVerificationSheet(true);
          }}
        />
      )}
      {showVerificationSheet && (
        <VerificationSheet
          email={user?.primaryEmailAddress?.emailAddress ?? ""}
          code={code}
          codeRequested={codeRequested}
          onCodeChange={setCode}
          onGetCode={() => setCodeRequested(true)}
          onClose={() => setShowVerificationSheet(false)}
          onConfirm={() => {
            setShowVerificationSheet(false);
            setSubmitted(true);
          }}
        />
      )}
    </main>
  );
}

export default function CryptoWithdrawFlow() {
  const [, setLocation] = useLocation();
  const { wallet } = useAppStore();
  const [query, setQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(() => {
    const saved = readWithdrawalFlow();
    return saved?.coinSymbol
      ? COINS.find(coin => coin.symbol === saved.coinSymbol) ?? null
      : null;
  });

  const availableCoins = useMemo(() => {
    const balances = wallet?.balances;
    if (!balances) return [];

    return COINS
      .filter(coin => {
        return getCoinBalance(wallet, coin) > 0;
      })
      .sort((a, b) => {
        return getCoinBalance(wallet, b) - getCoinBalance(wallet, a);
      });
  }, [wallet]);

  const filteredCoins = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();
    const sourceCoins = availableOnly ? availableCoins : COINS;
    if (!normalizedQuery) return sourceCoins;
    return sourceCoins.filter(coin =>
      coin.symbol.includes(normalizedQuery) ||
      coin.name.toUpperCase().includes(normalizedQuery),
    );
  }, [availableCoins, availableOnly, query]);

  if (selectedCoin) {
    const balance = wallet?.balances[selectedCoin.symbol as keyof WalletState["balances"]];
    return (
      <WithdrawForm
        coin={selectedCoin}
        balance={typeof balance === "number" ? balance : 0}
          onBack={() => {
            clearWithdrawalFlow();
            setSelectedCoin(null);
          }}
          onChangeCoin={() => {
            clearWithdrawalFlow();
            setSelectedCoin(null);
          }}
      />
    );
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: D.bg,
        color: D.fg,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top, 10px) + 16px) 20px 14px",
          borderBottom: `1px solid ${D.border}`,
        }}
      >
        <button
          type="button"
          aria-label="Back to wallet"
          onClick={() => setLocation("/wallet")}
          style={{
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            border: "none",
            background: "transparent",
            color: D.fg,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Select Coin</h1>
        <div style={{ width: 36 }} />
      </header>

      <section style={{ maxWidth: 560, margin: "0 auto", padding: "18px 20px 40px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 24,
            background: D.panel,
            border: `1px solid ${D.border}`,
          }}
        >
          <Search size={18} color={D.dim} />
          <input
            aria-label="Search available coins"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search"
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: D.fg,
              fontSize: 15,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "18px 2px 12px",
            color: D.dim,
            fontSize: 12,
          }}
        >
          <button
            type="button"
            aria-label="Show available balance only"
            aria-pressed={availableOnly}
            onClick={() => setAvailableOnly(current => !current)}
            style={{
              width: 19,
              height: 19,
              display: "grid",
              placeItems: "center",
              padding: 0,
              borderRadius: 4,
              border: `1px solid ${availableOnly ? D.green : D.dim}`,
              background: availableOnly ? D.green : "transparent",
              color: availableOnly ? "#001B12" : "transparent",
              cursor: "pointer",
            }}
          >
            <Check size={14} strokeWidth={3} />
          </button>
          <span>Available balance only</span>
        </div>

        {filteredCoins.length === 0 ? (
          <div
            style={{
              marginTop: 28,
              padding: "40px 24px",
              borderRadius: 16,
              border: `1px solid ${D.border}`,
              textAlign: "center",
              color: D.dim,
            }}
          >
            <WalletCards size={28} style={{ marginBottom: 12, opacity: 0.7 }} />
            <div style={{ color: D.fg, fontWeight: 700, marginBottom: 6 }}>
              {availableOnly && availableCoins.length ? "No coins found" : "No assets found"}
            </div>
            <div style={{ fontSize: 12 }}>
              {availableOnly && availableCoins.length
                ? "Try another coin name or symbol."
                : availableOnly
                  ? "Uncheck available balance only to browse all supported assets."
                  : "Try another coin name or symbol."}
            </div>
          </div>
        ) : (
          <div>
            {filteredCoins.map(coin => {
              const balance = getCoinBalance(wallet, coin);
              return (
                <button
                  key={coin.symbol}
                  type="button"
                  onClick={() => setSelectedCoin(coin)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 2px",
                    border: "none",
                    borderBottom: `1px solid ${D.border}`,
                    background: balance > 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    color: D.fg,
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: 0,
                    opacity: balance > 0 ? 1 : 0.72,
                  }}
                >
                  <CoinIcon coin={coin} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>
                      {coin.symbol}
                    </span>
                    <span style={{ display: "block", marginTop: 3, color: D.dim, fontSize: 12 }}>
                      {coin.name}
                    </span>
                  </span>
                  <span style={{ textAlign: "right" }}>
                    <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>
                      {formatBalance(balance)}
                    </span>
                    <span style={{ display: "block", marginTop: 3, color: D.dim, fontSize: 11 }}>
                      {balance > 0 ? `Available ${coin.symbol}` : `Zero balance ${coin.symbol}`}
                    </span>
                  </span>
                  <ChevronRight size={17} color={D.dim} style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export function WithdrawalHistoryPage() {
  const [, setLocation] = useLocation();
  const [withdrawals] = useState<WithdrawalTx[]>(() => getWithdrawalTxns());

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: D.bg,
        color: D.fg,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "calc(env(safe-area-inset-top, 10px) + 15px) 18px 14px",
          borderBottom: `1px solid ${D.border}`,
        }}
      >
        <button
          type="button"
          aria-label="Back to wallet"
          onClick={() => setLocation("/wallet")}
          style={{ display: "grid", placeItems: "center", width: 36, height: 36, border: 0, background: "transparent", color: D.fg, cursor: "pointer" }}
        >
          <ArrowLeft size={23} />
        </button>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Withdrawal History</h1>
      </header>
      <section style={{ maxWidth: 560, margin: "0 auto", padding: "20px 18px 48px" }}>
        {withdrawals.length === 0 ? (
          <div style={{ padding: "44px 24px", border: `1px solid ${D.border}`, borderRadius: 16, textAlign: "center", color: D.dim }}>
            <Clock3 size={28} style={{ marginBottom: 12, opacity: 0.7 }} />
            <div style={{ color: D.fg, fontWeight: 750 }}>No withdrawals yet</div>
            <div style={{ marginTop: 7, fontSize: 12 }}>Completed withdrawal requests will appear here.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} style={{ padding: 15, border: `1px solid ${D.border}`, borderRadius: 14, background: D.panel }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong>{withdrawal.amount} {withdrawal.currency}</strong>
                  <span style={{ color: withdrawal.status === "Completed" ? D.green : D.gold, fontSize: 12, fontWeight: 750 }}>{withdrawal.status}</span>
                </div>
                <div style={{ marginTop: 7, color: D.dim, fontSize: 12 }}>{withdrawal.network} ({withdrawal.standard})</div>
                <div style={{ marginTop: 5, color: D.dim, fontSize: 11 }}>{withdrawal.time}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}