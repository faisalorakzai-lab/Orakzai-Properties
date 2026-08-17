import { useMemo, useState } from "react";
import { ArrowLeft, ArrowLeftRight, ChevronDown, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useWalletStore, WALLET_ACCOUNTS, accountIdFromLabel, accountLabel, type WalletAccountId } from "@/store/WalletStoreContext";
import type { Currency } from "@/lib/walletEngine";

const BG = "#0b0e11", CARD = "#181a20", PANEL = "#0f1318", LINE = "#2b313a", GOLD = "#f0b90b", GREEN = "#0ecb81", DIM = "#929aa5", FG = "#f5f5f5";
const assets: { symbol: Currency; name: string; tone: string; icon: string }[] = [
  { symbol: "USDT", name: "Tether USD", tone: GREEN, icon: "₮" },
  { symbol: "USDC", name: "USD Coin", tone: "#38bdf8", icon: "$" },
  { symbol: "OKBOND", name: "Orakzai Bond Token", tone: GOLD, icon: "◈" },
  { symbol: "PKR", name: "Pakistani Rupee", tone: "#a7b0c0", icon: "₨" },
];

function AccountSelect({ label, value, onChange, balance }: { label: string; value: string; onChange: (v: string) => void; balance?: string }) {
  return <label style={{ display: "block" }}><span style={{ display: "block", color: DIM, fontSize: 11, fontWeight: 800, marginBottom: 7 }}>{label}</span><select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", appearance: "none", border: `1px solid ${LINE}`, borderRadius: 11, padding: "12px 34px 12px 12px", background: CARD, color: FG, fontSize: 12, fontWeight: 700, outline: "none" }}>{WALLET_ACCOUNTS.map(a => <option key={a.id}>{a.label}</option>)}</select>{balance && <span style={{ display: "block", marginTop: 6, color: GREEN, fontSize: 10, fontFamily: "monospace" }}>{balance}</span>}</label>;
}

export default function InternalTransfer() {
  const [, nav] = useLocation();
  const { toast } = useToast();
  const { getBalance, transfer } = useWalletStore();
  const [from, setFrom] = useState<WalletAccountId>("spot");
  const [to, setTo] = useState<WalletAccountId>("rwaStakingYield");
  const [asset, setAsset] = useState(assets[0]);
  const [amount, setAmount] = useState("");
  const [success, setSuccess] = useState<{ amount: number; asset: Currency; to: WalletAccountId } | null>(null);
  const fromBalance = getBalance(from, asset.symbol);
  const numericAmount = Number(amount) || 0;
  const remaining = Math.max(fromBalance - numericAmount, 0);
  const canTransfer = numericAmount > 0 && numericAmount <= fromBalance && from !== to;
  const fiat = useMemo(() => numericAmount * (asset.symbol === "OKBOND" ? 88 : asset.symbol === "PKR" ? 1 : 278), [asset.symbol, numericAmount]);
  const swap = () => { setFrom(to); setTo(from); setSuccess(null); };
  const confirm = () => {
    if (!canTransfer) return;
    const result = transfer(from, to, asset.symbol, numericAmount);
    if (!result.ok) { toast({ title: "Transfer unavailable", description: result.error, variant: "destructive" }); return; }
    setSuccess({ amount: numericAmount, asset: asset.symbol, to });
    toast({ title: "Transfer successful", description: `Successfully transferred ${numericAmount.toLocaleString("en-US")} ${asset.symbol} to ${accountLabel(to)}.` });
    setAmount("");
  };
  const reset = () => { setSuccess(null); setAmount(""); };

  return <div style={{ minHeight: "100dvh", paddingBottom: "calc(90px + env(safe-area-inset-bottom))", background: BG, color: FG, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
    <header style={{ position: "sticky", top: 0, zIndex: 40, height: 56, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: `${BG}f2`, borderBottom: `1px solid ${LINE}`, backdropFilter: "blur(16px)" }}><button onClick={() => nav("/wallet")} aria-label="Back to Assets" style={{ display: "grid", placeItems: "center", width: 36, height: 36, border: 0, borderRadius: 10, background: "transparent", color: DIM }}><ArrowLeft size={20} /></button><div><h1 style={{ margin: 0, fontSize: 16, fontWeight: 850 }}>Internal Transfer</h1><p style={{ margin: "3px 0 0", color: DIM, fontSize: 10 }}>Move assets between OkzByte accounts</p></div></header>
    <main style={{ width: "100%", maxWidth: 620, margin: "0 auto", padding: "16px 14px" }}>
      {success ? <section style={{ padding: 22, textAlign: "center", borderRadius: 18, background: `linear-gradient(145deg, ${GREEN}18, ${CARD})`, border: `1px solid ${GREEN}55` }}><div style={{ width: 54, height: 54, display: "grid", placeItems: "center", margin: "0 auto 14px", borderRadius: "50%", background: `${GREEN}18`, color: GREEN }}><CheckCircle2 size={30} /></div><h2 style={{ margin: 0, fontSize: 20 }}>Transfer completed</h2><p style={{ margin: "8px 0 18px", color: DIM, fontSize: 12, lineHeight: 1.55 }}>{success.amount.toLocaleString("en-US")} {success.asset} was transferred to {accountLabel(success.to)}. The unified ledger and portfolio total updated instantly.</p><div style={{ display: "grid", gap: 9 }}><button onClick={reset} style={{ border: 0, borderRadius: 11, padding: 13, background: GOLD, color: "#111", fontWeight: 900 }}>New Transfer</button><button onClick={() => nav("/wallet")} style={{ border: `1px solid ${LINE}`, borderRadius: 11, padding: 13, background: CARD, color: FG, fontWeight: 800 }}>Return to Assets</button></div></section> : <>
        <section style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: `linear-gradient(145deg, ${GOLD}16, ${CARD})`, border: `1px solid ${GOLD}35` }}><div style={{ display: "flex", alignItems: "center", gap: 9, color: GOLD, fontSize: 10, fontWeight: 900, letterSpacing: ".1em" }}><ShieldCheck size={15} /> INTERNAL LEDGER ROUTE</div><p style={{ margin: "9px 0 0", color: DIM, fontSize: 11, lineHeight: 1.5 }}>Move supported assets across your OkzByte wallets and yield modules without a network fee.</p></section>
        <section style={{ position: "relative", display: "grid", gap: 14, padding: 16, borderRadius: 18, background: PANEL, border: `1px solid ${LINE}` }}><AccountSelect label="FROM ACCOUNT" value={accountLabel(from)} onChange={v => { setFrom(accountIdFromLabel(v)); setAmount(""); }} balance={`Available: ${fromBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} ${asset.symbol}`} /><button onClick={swap} aria-label="Swap transfer direction" style={{ position: "absolute", right: 22, top: "50%", transform: "translateY(-50%)", display: "grid", placeItems: "center", width: 40, height: 40, border: `1px solid ${BG}`, borderRadius: "50%", background: LINE, color: GOLD, boxShadow: "0 8px 20px rgba(0,0,0,.3)" }}><ArrowLeftRight size={18} /></button><div style={{ height: 1, background: `${LINE}99` }} /><AccountSelect label="TO ACCOUNT" value={accountLabel(to)} onChange={v => { setTo(accountIdFromLabel(v)); setSuccess(null); }} /></section>
        <section style={{ marginTop: 14, display: "grid", gap: 12, padding: 16, borderRadius: 18, background: CARD, border: `1px solid ${LINE}` }}><label style={{ display: "block" }}><span style={{ display: "block", color: DIM, fontSize: 11, fontWeight: 800, marginBottom: 7 }}>SELECT ASSET</span><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: "50%", background: `${asset.tone}18`, border: `1px solid ${asset.tone}55`, color: asset.tone, fontWeight: 900 }}>{asset.icon}</div><select value={asset.symbol} onChange={e => { setAsset(assets.find(a => a.symbol === e.target.value) || assets[0]); setAmount(""); }} style={{ flex: 1, appearance: "none", border: 0, background: "transparent", color: FG, fontSize: 13, fontWeight: 800, outline: 0 }}>{assets.map(a => <option key={a.symbol} value={a.symbol}>{a.symbol} · {a.name}</option>)}</select><ChevronDown size={16} color={DIM} /></div></label><div style={{ padding: 13, borderRadius: 13, background: PANEL, border: `1px solid ${LINE}` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: DIM, fontSize: 11, fontWeight: 700 }}>AMOUNT</span><button onClick={() => setAmount(String(fromBalance))} style={{ border: 0, background: "transparent", color: GOLD, fontSize: 11, fontWeight: 900 }}>MAX</button></div><input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" style={{ width: "100%", marginTop: 8, border: 0, background: "transparent", color: FG, fontSize: 23, fontFamily: "monospace", fontWeight: 800, outline: 0 }} /><div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 6, color: DIM, fontSize: 10, fontFamily: "monospace" }}><span>≈ Rs {fiat.toLocaleString("en-PK", { minimumFractionDigits: 2 })} PKR</span><span>Remaining: {remaining.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span></div></div></section>
        <section style={{ marginTop: 14, display: "grid", gap: 9, padding: "4px 3px 0", color: DIM, fontSize: 11 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Internal Fee</span><strong style={{ color: GREEN }}>0.00 {asset.symbol} · Free</strong></div><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span>Execution Time</span><strong style={{ color: FG, textAlign: "right" }}>Instant ledger settlement</strong></div></section><button disabled={!canTransfer} onClick={confirm} style={{ width: "100%", marginTop: 18, border: 0, borderRadius: 12, padding: "14px 16px", background: canTransfer ? GOLD : `${GOLD}45`, color: canTransfer ? "#111" : `${FG}99`, fontSize: 13, fontWeight: 900, boxShadow: canTransfer ? `0 12px 28px ${GOLD}1c` : "none" }}><Zap size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} />Confirm Transfer</button>{amount && numericAmount > fromBalance && <p style={{ margin: "9px 0 0", color: "#f6465d", fontSize: 11 }}>Amount exceeds the available {asset.symbol} balance.</p>}{from === to && <p style={{ margin: "9px 0 0", color: "#f6465d", fontSize: 11 }}>Choose two different accounts for an internal transfer.</p>}
      </>}
    </main>
  </div>;
}
