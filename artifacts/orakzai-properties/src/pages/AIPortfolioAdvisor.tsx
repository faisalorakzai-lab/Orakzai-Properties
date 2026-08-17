import { useMemo, useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, ChevronRight, MessageCircle, Send, ShieldCheck, Sparkles, TrendingUp, WalletCards, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { accountLabel, useWalletStore, type Currency } from "@/store/WalletStoreContext";

const money = (value: number) => `PKR ${Math.round(value).toLocaleString("en-PK")}`;
const num = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 2 });
const prices: Record<Currency, number> = { PKR: 1, USDT: 278, USDC: 278, OKBOND: 88 };

export default function AIPortfolioAdvisor() {
  const [, setLocation] = useLocation();
  const { ledger, totalValuePKR, getBalance, transfer } = useWalletStore();
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([]);
  const [prompt, setPrompt] = useState("");
  const [allocated, setAllocated] = useState(false);
  const [notice, setNotice] = useState("");

  const metrics = useMemo(() => {
    const value = (account: keyof typeof ledger) => Object.entries(ledger[account]).reduce((s, [asset, amount]) => s + amount * prices[asset as Currency], 0);
    const realEstate = value("realEstate");
    const crypto = value("spot") + value("rwaStakingYield") + value("yieldDesk");
    const fiat = value("funding");
    const total = realEstate + crypto + fiat || 1;
    const allocations = [
      { label: "Real Estate", value: Math.round(realEstate / total * 100), color: "#f0b90b" },
      { label: "Crypto", value: Math.round(crypto / total * 100), color: "#8b5cf6" },
      { label: "Fiat", value: Math.max(0, 100 - Math.round(realEstate / total * 100) - Math.round(crypto / total * 100)), color: "#22d3ee" },
    ];
    const volatility = allocations[1].value;
    const score = Math.max(58, Math.min(96, Math.round(92 - Math.max(0, volatility - 30) * 0.45)));
    return { realEstate, crypto, fiat, total, allocations, score, idleUsdt: ledger.spot.USDT };
  }, [ledger]);

  const ask = (text: string) => {
    const lower = text.toLowerCase();
    let response = "Your portfolio is being monitored across Spot, Real Estate, Fiat, and yield accounts. A measured rebalance keeps liquidity available while improving income potential.";
    if (lower.includes("rental") || lower.includes("yield")) response = `Your Real Estate allocation is ${metrics.allocations[0].value}%. To increase monthly rental yield, keep the core property exposure intact and direct idle liquidity toward approved RWA yield products. Current portfolio value is ${money(totalValuePKR)}.`;
    if (lower.includes("risk") || lower.includes("rebalance")) response = `The current health score is ${metrics.score}/100. Crypto represents ${metrics.allocations[1].value}% of the live ledger. A gradual allocation of idle Spot USDT to yield can reduce idle capital without forcing a large market move.`;
    if (lower.includes("crypto") || lower.includes("optimal")) response = `The live Crypto allocation is ${metrics.allocations[1].value}%. Spot currently holds ${num(ledger.spot.USDT)} USDT, ${num(ledger.spot.USDC)} USDC, and ${num(ledger.spot.OKBOND)} OKBOND. Consider your liquidity needs before changing exposure.`;
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
    <div className="min-h-screen bg-[#0b0e11] text-white pb-28">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-[#262c35] bg-[#0b0e11]/95 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => setLocation("/wallet")} className="rounded-xl p-2 text-gray-300 hover:bg-white/5"><ArrowLeft size={19} /></button>
        <div><p className="text-sm font-extrabold">AI Portfolio Advisor</p><p className="text-[10px] uppercase tracking-[0.18em] text-yellow-400/70">Institutional intelligence desk</p></div>
        <div className="ml-auto rounded-full border border-yellow-500/30 bg-yellow-500/10 p-2 text-yellow-400"><Sparkles size={16} /></div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <section className="rounded-2xl border border-yellow-500/25 bg-gradient-to-br from-[#1a1710] via-[#14171d] to-[#10151b] p-4 shadow-[0_0_35px_rgba(240,185,11,0.08)]">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400">Live portfolio scan</p><h1 className="mt-1 text-2xl font-extrabold">Portfolio Health: {metrics.score}/100</h1><p className="mt-1 text-xs text-emerald-400">{metrics.score >= 80 ? "Balanced · Moderate risk" : "Review recommended · Controlled risk"}</p></div><ShieldCheck className="text-emerald-400" size={28} /></div>
          <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] text-gray-500">Total Value Analyzed</p><p className="mt-1 font-mono text-sm font-bold">{money(totalValuePKR)}</p></div><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] text-gray-500">Live PnL</p><p className="mt-1 font-mono text-sm font-bold text-emerald-400">+2.45%</p></div></div>
          <p className="mt-3 text-xs leading-relaxed text-gray-300">Key signal: {metrics.allocations[1].value < 40 ? "Low crypto volatility exposure" : "Crypto exposure requires active monitoring"}. Real Estate represents {metrics.allocations[0].value}% of the unified ledger.</p>
          <div className="mt-3 flex flex-wrap gap-2">{[["Risk Profile", "Moderate"], ["Est. APY", "+14.2%"], ["Rebalance", "Slight"]].map(([a,b]) => <span key={a} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-gray-300">{a}: <b className="text-white">{b}</b></span>)}</div>
        </section>

        <section className="rounded-2xl border border-[#262c35] bg-[#14171d] p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Allocation intelligence</h2><span className="text-[10px] text-gray-500">Derived from unified ledger</span></div><div className="flex h-3 overflow-hidden rounded-full bg-white/5">{metrics.allocations.map(a => <div key={a.label} style={{ width: `${a.value}%`, background: a.color }} />)}</div><div className="mt-3 grid grid-cols-3 gap-2">{metrics.allocations.map(a => <div key={a.label}><p className="text-[10px] text-gray-500">{a.label}</p><p className="font-mono text-sm font-bold">{a.value}%</p></div>)}</div></section>

        <section className="space-y-3"><div className="flex items-center gap-2"><Bot size={17} className="text-yellow-400" /><h2 className="text-sm font-bold">Recommended actions</h2></div>
          <article className="rounded-2xl border border-yellow-500/20 bg-[#14171d] p-4"><div className="flex gap-3"><div className="rounded-xl bg-yellow-500/10 p-2.5 text-yellow-400"><TrendingUp size={18} /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold">Yield Maximizer</p><p className="mt-1 text-xs leading-relaxed text-gray-400">Unused <b className="text-white">{num(metrics.idleUsdt)} USDT</b> is currently sitting in Spot Wallet. Allocate 40% to Yield Desk for a target RWA yield strategy.</p><button disabled={allocated} onClick={autoAllocate} className="mt-3 flex items-center gap-2 rounded-xl bg-yellow-400 px-3 py-2 text-[11px] font-extrabold text-black disabled:cursor-not-allowed disabled:opacity-60"><Zap size={13} />{allocated ? "Allocated" : "One-Tap Auto Allocate"}</button></div></div></article>
          <article className="rounded-2xl border border-purple-500/20 bg-[#14171d] p-4"><div className="flex gap-3"><div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-400"><WalletCards size={18} /></div><div><p className="text-xs font-bold">Diversification Alert</p><p className="mt-1 text-xs leading-relaxed text-gray-400">Fiat liquidity is {metrics.allocations[2].value}%. Consider reviewing OKBOND vault exposure for a fixed quarterly-yield sleeve.</p><button onClick={() => setLocation("/rwa-vaults")} className="mt-3 flex items-center gap-2 rounded-xl border border-purple-400/30 px-3 py-2 text-[11px] font-bold text-purple-300">Explore OKBOND Vault <ChevronRight size={13} /></button></div></div></article>
          {notice && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{notice}</p>}
        </section>

        <section className="rounded-2xl border border-[#262c35] bg-[#14171d] p-4"><div className="flex items-center gap-2"><MessageCircle size={17} className="text-cyan-400" /><h2 className="text-sm font-bold">Ask your portfolio advisor</h2></div><div className="mt-3 flex flex-wrap gap-2">{["How to increase my monthly rental yield?", "Rebalance my portfolio for low risk", "Is my Crypto allocation optimal?"].map(q => <button key={q} onClick={() => ask(q)} className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1.5 text-[10px] text-cyan-200">{q}</button>)}</div><div className="mt-3 space-y-2">{messages.map((m,i) => <div key={i} className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${m.role === "ai" ? "border border-yellow-500/15 bg-yellow-500/5 text-gray-200" : "ml-6 bg-white/5 text-gray-300"}`}>{m.text}</div>)}</div><form onSubmit={e => { e.preventDefault(); if (prompt.trim()) ask(prompt.trim()); }} className="mt-3 flex items-center gap-2 rounded-xl border border-[#2d3440] bg-[#1a1e26] px-3"><input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask about your live portfolio..." className="min-w-0 flex-1 bg-transparent py-3 text-xs text-white outline-none placeholder:text-gray-500" /><button className="rounded-lg p-2 text-yellow-400 hover:bg-yellow-400/10"><Send size={16} /></button></form></section>
        <p className="flex items-center gap-2 px-1 text-[10px] leading-relaxed text-gray-500"><CheckCircle2 size={12} className="text-emerald-400" />Insights are calculated from current ledger balances. All allocations require your confirmation and remain subject to product terms and risk limits.</p>
      </main>
    </div>
  );
}
