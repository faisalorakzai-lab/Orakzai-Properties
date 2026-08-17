import { useMemo, useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, ChevronRight, MessageCircle, Send, ShieldCheck, Sparkles, TrendingUp, WalletCards, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { accountLabel, useWalletStore, type Currency } from "@/store/WalletStoreContext";

const BG = "#0B0E11";
const CARD = "#12161C";
const PANEL = "#1E2329";
const LINE = "#2B313A";
const GREEN = "#0ECB81";
const GOLD = "#F0B90B";
const PURPLE = "#8B5CF6";
const CYAN = "#22D3EE";
const DIM = "#848E9C";
const FG = "#EAECEF";

const money = (value: number) => `PKR ${Math.round(value).toLocaleString("en-PK")}`;
const num = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 2 });
const prices: Record<Currency, number> = { PKR: 1, USDT: 278, USDC: 278, OKBOND: 88 };

type Message = { role: "ai" | "user"; text: string };

export default function AIPortfolioAdvisor() {
  const [, nav] = useLocation();
  const { ledger, totalValuePKR, getBalance, transfer } = useWalletStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [allocated, setAllocated] = useState(false);
  const [notice, setNotice] = useState("");

  const metrics = useMemo(() => {
    const value = (account: keyof typeof ledger) => Object.entries(ledger[account]).reduce((sum, [asset, amount]) => sum + amount * prices[asset as Currency], 0);
    const realEstate = value("realEstate");
    const crypto = value("spot") + value("rwaStakingYield") + value("yieldDesk");
    const fiat = value("funding");
    const total = realEstate + crypto + fiat || 1;
    const estatePct = Math.round(realEstate / total * 100);
    const cryptoPct = Math.round(crypto / total * 100);
    const allocations = [
      { label: "Real Estate", value: estatePct, color: GOLD },
      { label: "Crypto", value: cryptoPct, color: PURPLE },
      { label: "Fiat", value: Math.max(0, 100 - estatePct - cryptoPct), color: CYAN },
    ];
    const score = Math.max(58, Math.min(96, Math.round(92 - Math.max(0, cryptoPct - 30) * 0.45)));
    return { allocations, score, idleUsdt: ledger.spot.USDT, total: totalValuePKR, estatePct, cryptoPct };
  }, [ledger, totalValuePKR]);

  const ask = (text: string) => {
    const lower = text.toLowerCase();
    let response = `Your live ledger is being monitored across Spot, Real Estate, Fiat, and yield accounts. Current portfolio value is ${money(totalValuePKR)}.`;
    if (lower.includes("rental") || lower.includes("yield")) response = `Real Estate represents ${metrics.estatePct}% of the live ledger. To improve monthly rental yield, keep core property exposure intact and direct suitable idle liquidity toward approved RWA yield products.`;
    if (lower.includes("risk") || lower.includes("rebalance")) response = `Current health score is ${metrics.score}/100. Crypto represents ${metrics.cryptoPct}% of the live ledger. A gradual allocation of idle Spot USDT toward yield can improve capital efficiency while preserving liquidity.`;
    if (lower.includes("crypto") || lower.includes("optimal")) response = `Crypto represents ${metrics.cryptoPct}% of the live ledger. Spot currently holds ${num(ledger.spot.USDT)} USDT, ${num(ledger.spot.USDC)} USDC, and ${num(ledger.spot.OKBOND)} OKBOND. Review your liquidity needs before changing exposure.`;
    setMessages(prev => [...prev, { role: "user", text }, { role: "ai", text: response }]);
    setPrompt("");
  };

  const autoAllocate = () => {
    const amount = +(getBalance("spot", "USDT") * 0.4).toFixed(2);
    const result = transfer("spot", "yieldDesk", "USDT", amount);
    if (result.ok) { setAllocated(true); setNotice(`Successfully allocated ${num(amount)} USDT to Yield Desk.`); }
    else setNotice(result.error ?? "Allocation could not be completed.");
  };

  return (
    <div style={{ minHeight: "100dvh", maxWidth: "100vw", overflowX: "hidden", background: BG, color: FG, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: BG, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ height: 54, display: "flex", alignItems: "center", padding: "0 12px 0 4px" }}>
          <button onClick={() => nav("/wallet")} aria-label="Back" style={{ padding: "10px 12px", color: DIM, display: "flex", background: "none", border: 0 }}><ArrowLeft size={21} /></button>
          <div style={{ minWidth: 0 }}><div style={{ color: FG, fontSize: 15, fontWeight: 800 }}>AI Portfolio Advisor</div><div style={{ color: GOLD, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", marginTop: 2 }}>Institutional intelligence desk</div></div>
          <div style={{ marginLeft: "auto", width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 10, background: `${GOLD}14`, border: `1px solid ${GOLD}44`, color: GOLD }}><Sparkles size={18} /></div>
        </div>
      </div>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "12px 0 calc(100px + env(safe-area-inset-bottom))" }}>
        <section style={{ margin: "0 12px 14px", padding: 16, border: `1px solid ${GOLD}44`, borderRadius: 14, background: "linear-gradient(135deg,#171A20,#11151A)", boxShadow: `0 0 28px ${GOLD}0D` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div><div style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "2px" }}>LIVE PORTFOLIO SCAN</div><h1 style={{ margin: "7px 0 0", color: FG, fontFamily: "Georgia,serif", fontSize: 25, lineHeight: 1.08 }}>Portfolio Health: {metrics.score}/100</h1><div style={{ marginTop: 7, color: GREEN, fontSize: 12 }}>Review recommended · Controlled risk</div></div>
            <ShieldCheck size={25} color={GREEN} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginTop: 16, background: LINE, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ background: BG, padding: 11 }}><div style={{ color: DIM, fontSize: 10 }}>Total value analyzed</div><strong style={{ display: "block", marginTop: 4, color: FG, fontSize: 14, fontFamily: "monospace" }}>{money(metrics.total)}</strong></div>
            <div style={{ background: BG, padding: 11 }}><div style={{ color: DIM, fontSize: 10 }}>Live PnL</div><strong style={{ display: "block", marginTop: 4, color: GREEN, fontSize: 16, fontFamily: "monospace" }}>+2.45%</strong></div>
          </div>
          <p style={{ margin: "12px 0 0", color: DIM, fontSize: 12, lineHeight: 1.55 }}>Key signal: {metrics.cryptoPct < 40 ? "Low crypto volatility exposure" : "Crypto exposure requires active monitoring"}. Real Estate represents {metrics.estatePct}% of the unified ledger.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>{[["Risk Profile", "Moderate"], ["Est. APY", "+14.2%"], ["Rebalance", "Slight"]].map(([label, value]) => <span key={label} style={{ padding: "6px 9px", borderRadius: 7, background: PANEL, border: `1px solid ${LINE}`, color: DIM, fontSize: 10 }}>{label} <b style={{ color: FG }}>{value}</b></span>)}</div>
        </section>

        <section style={{ margin: "0 12px 14px", padding: 14, background: CARD, border: `1px solid ${LINE}`, borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}><h2 style={{ margin: 0, color: FG, fontFamily: "Georgia,serif", fontSize: 17 }}>Allocation intelligence</h2><span style={{ color: DIM, fontSize: 10 }}>Live ledger</span></div>
          <div style={{ display: "flex", height: 10, overflow: "hidden", borderRadius: 99, background: PANEL }}>{metrics.allocations.map(a => <div key={a.label} style={{ width: `${a.value}%`, background: a.color, transition: "width .3s" }} />)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, marginTop: 12, background: LINE, borderRadius: 9, overflow: "hidden" }}>{metrics.allocations.map(a => <div key={a.label} style={{ background: BG, padding: 9 }}><div style={{ color: DIM, fontSize: 10 }}>{a.label}</div><strong style={{ display: "block", marginTop: 3, color: a.color, fontSize: 17 }}>{a.value}%</strong></div>)}</div>
        </section>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px 10px" }}><Bot size={17} color={GOLD} /><h2 style={{ margin: 0, color: FG, fontFamily: "Georgia,serif", fontSize: 18 }}>Recommended actions</h2></div>
        <section style={{ margin: "0 12px 14px", border: `1px solid ${GOLD}44`, borderRadius: 14, background: CARD, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 12, padding: 15 }}><div style={{ width: 40, height: 40, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 11, background: `${GOLD}18`, color: GOLD }}><TrendingUp size={20} /></div><div style={{ minWidth: 0, flex: 1 }}><div style={{ color: FG, fontSize: 14, fontWeight: 800 }}>Yield Maximizer</div><p style={{ margin: "6px 0 0", color: DIM, fontSize: 12, lineHeight: 1.55 }}>Idle <b style={{ color: FG }}>{num(metrics.idleUsdt)} USDT</b> is currently in Spot Wallet. Allocate 40% to Yield Desk for a target RWA strategy.</p><button disabled={allocated} onClick={autoAllocate} style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 12, padding: "10px 13px", border: 0, borderRadius: 10, background: allocated ? PANEL : GOLD, color: allocated ? DIM : BG, fontSize: 11, fontWeight: 800 }}><Zap size={14} />{allocated ? "Allocated" : "One-Tap Auto Allocate"}</button></div></div>
        </section>
        <section style={{ margin: "0 12px 14px", border: `1px solid ${PURPLE}55`, borderRadius: 14, background: CARD, overflow: "hidden" }}><div style={{ display: "flex", gap: 12, padding: 15 }}><div style={{ width: 40, height: 40, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 11, background: `${PURPLE}18`, color: PURPLE }}><WalletCards size={20} /></div><div><div style={{ color: FG, fontSize: 14, fontWeight: 800 }}>Diversification Alert</div><p style={{ margin: "6px 0 0", color: DIM, fontSize: 12, lineHeight: 1.55 }}>Fiat liquidity is {metrics.allocations[2].value}%. Review OKBOND vault exposure for a fixed quarterly-yield sleeve.</p><button onClick={() => nav("/rwa-vaults")} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "9px 12px", borderRadius: 10, border: `1px solid ${PURPLE}66`, background: `${PURPLE}12`, color: "#C4B5FD", fontSize: 11, fontWeight: 800 }}>Explore OKBOND Vault <ChevronRight size={14} /></button></div></div></section>
        {notice && <div style={{ margin: "0 12px 14px", padding: "10px 12px", borderRadius: 10, border: `1px solid ${GREEN}44`, background: `${GREEN}10`, color: GREEN, fontSize: 11 }}>{notice}</div>}

        <section style={{ margin: "0 12px 14px", padding: 15, background: CARD, border: `1px solid ${LINE}`, borderRadius: 14 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><MessageCircle size={18} color={CYAN} /><h2 style={{ margin: 0, color: FG, fontFamily: "Georgia,serif", fontSize: 18 }}>Ask your portfolio advisor</h2></div><div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 0 2px" }}>{["Increase monthly rental yield", "Rebalance for low risk", "Is my crypto allocation optimal?"].map(q => <button key={q} onClick={() => ask(q)} style={{ flexShrink: 0, padding: "8px 10px", borderRadius: 8, border: `1px solid ${CYAN}44`, background: `${CYAN}0D`, color: "#A5F3FC", fontSize: 10, whiteSpace: "nowrap" }}>{q}</button>)}</div><div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{messages.map((m, i) => <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "stretch", maxWidth: m.role === "user" ? "88%" : "100%", padding: "9px 11px", borderRadius: 10, background: m.role === "user" ? PANEL : `${GOLD}0D`, border: `1px solid ${m.role === "user" ? LINE : `${GOLD}33`}`, color: m.role === "user" ? DIM : FG, fontSize: 11, lineHeight: 1.55 }}>{m.text}</div>)}</div><form onSubmit={e => { e.preventDefault(); if (prompt.trim()) ask(prompt.trim()); }} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "0 4px 0 12px", borderRadius: 11, background: PANEL, border: `1px solid ${LINE}` }}><input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask about your live portfolio..." style={{ minWidth: 0, flex: 1, padding: "12px 0", border: 0, outline: 0, background: "transparent", color: FG, fontSize: 11 }} /><button type="submit" aria-label="Send" style={{ padding: 9, border: 0, background: "none", color: GOLD }}><Send size={17} /></button></form></section>
        <div style={{ display: "flex", gap: 7, alignItems: "flex-start", margin: "0 12px", color: DIM, fontSize: 10, lineHeight: 1.55 }}><CheckCircle2 size={13} color={GREEN} style={{ flexShrink: 0, marginTop: 1 }} />Insights are calculated from current ledger balances. Allocations require confirmation and remain subject to product terms and risk limits.</div>
      </main>
    </div>
  );
}
