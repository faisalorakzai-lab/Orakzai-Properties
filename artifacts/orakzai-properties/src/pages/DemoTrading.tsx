import { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Gamepad2, RotateCcw, Sparkles, Wallet2, X, Zap } from "lucide-react";
import { useMode } from "@/contexts/ModeContext";
import { useToast } from "@/hooks/use-toast";

const BG = "#0B0E11";
const PANEL = "#151A21";
const CARD = "#1E2630";
const LINE = "#2B3440";
const CYAN = "#22D3EE";
const DIM = "#929AA5";
const FG = "#F5F5F5";

export default function DemoTrading() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isDemoTrading, setIsDemoTrading, demoBalances, resetDemoFunds, refillDemoWallet } = useMode();
  const [open, setOpen] = useState(!isDemoTrading);

  const startDemo = () => {
    setIsDemoTrading(true);
    setOpen(false);
    toast({ title: "Demo Trading activated", description: "$100,000 USDT simulated funds are ready." });
    navigate("/trade");
  };

  const exitDemo = () => {
    setIsDemoTrading(false);
    toast({ title: "Switched back to Live Account", description: "Live wallet balances and market operations restored." });
  };

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: FG, paddingBottom: 88, fontFamily: "Inter, system-ui, sans-serif" }}>
      <header style={{ height: 56, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", borderBottom: `1px solid ${LINE}`, background: BG }}>
        <button onClick={() => navigate("/services")} aria-label="Back to Services" style={{ border: 0, background: "none", color: DIM, padding: 8 }}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 900 }}>Demo Trading</div><div style={{ color: CYAN, fontSize: 10, fontWeight: 800 }}>OKZBYTE TESTNET</div></div>
        <Gamepad2 size={20} color={CYAN} />
      </header>
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "22px 14px" }}>
        <section style={{ padding: 20, borderRadius: 20, border: `1px solid ${CYAN}55`, background: `linear-gradient(135deg, ${CYAN}15, ${PANEL} 55%)`, boxShadow: `0 0 42px ${CYAN}12` }}>
          <div style={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 14, background: `${CYAN}18`, border: `1px solid ${CYAN}44`, color: CYAN }}><Zap size={24} /></div>
          <div style={{ marginTop: 18, fontSize: 27, fontWeight: 900, letterSpacing: "-.04em" }}>Practice without risk.</div>
          <p style={{ margin: "10px 0 0", color: DIM, fontSize: 13, lineHeight: 1.6 }}>Use real-time market prices to practice Spot, Futures and RWA trading with virtual funds. No deposits, no losses, no live orders.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 20 }}>
            {["$100,000 USDT", "50,000 OKBOND", "Real-time markets", "Zero-risk execution"].map(text => <div key={text} style={{ padding: 12, borderRadius: 12, border: `1px solid ${LINE}`, background: `${CARD}aa` }}><div style={{ color: CYAN, fontWeight: 900, fontSize: 12 }}>{text}</div><div style={{ color: DIM, fontSize: 10, marginTop: 4 }}>{text.includes("fund") || text.includes("OK") ? "Virtual starting balance" : "Simulation feature"}</div></div>)}
          </div>
        </section>
        {isDemoTrading && <section style={{ marginTop: 14, padding: 16, borderRadius: 16, background: PANEL, border: `1px solid ${CYAN}44` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: CYAN, boxShadow: `0 0 10px ${CYAN}` }} /><strong style={{ fontSize: 13, color: CYAN }}>Demo Trading is active</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 14 }}><div><div style={{ color: DIM, fontSize: 10 }}>Virtual USDT</div><strong style={{ fontSize: 20 }}>${demoBalances.USDT.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></div><div style={{ textAlign: "right" }}><div style={{ color: DIM, fontSize: 10 }}>Demo OKBOND</div><strong style={{ fontSize: 20 }}>{demoBalances.OKBOND.toLocaleString()} OKB</strong></div></div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}><button onClick={() => { resetDemoFunds(); toast({ title: "Demo funds reset", description: "Balance restored to $100,000 USDT and 50,000 OKBOND." }); }} style={{ flex: 1, border: `1px solid ${LINE}`, background: CARD, color: FG, borderRadius: 10, padding: 11, fontWeight: 800, fontSize: 11 }}><RotateCcw size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />Reset</button><button onClick={() => { refillDemoWallet(); toast({ title: "Demo wallet refilled", description: "Fresh virtual funds are available." }); }} style={{ flex: 1, border: 0, background: CYAN, color: "#061014", borderRadius: 10, padding: 11, fontWeight: 900, fontSize: 11 }}><Wallet2 size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />Refill</button></div>
          <button onClick={exitDemo} style={{ width: "100%", marginTop: 10, border: `1px solid ${CYAN}55`, background: `${CYAN}12`, color: CYAN, borderRadius: 10, padding: 11, fontWeight: 900, fontSize: 11 }}>Exit Demo Trading</button>
        </section>}
      </main>
      <AnimatePresence>{open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,.72)", backdropFilter: "blur(8px)" }} onClick={() => setOpen(false)}><motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "24px 16px calc(32px + env(safe-area-inset-bottom) + 84px)", background: PANEL, borderTop: `1px solid ${CYAN}66`, borderRadius: "24px 24px 0 0" }}><div style={{ width: 42, height: 4, margin: "0 auto 18px", borderRadius: 99, background: LINE }} /><button onClick={() => setOpen(false)} aria-label="Close" style={{ float: "right", background: "none", border: 0, color: DIM }}><X size={20} /></button><div style={{ width: 52, height: 52, display: "grid", placeItems: "center", borderRadius: 16, color: CYAN, background: `${CYAN}18`, border: `1px solid ${CYAN}44` }}><Gamepad2 size={26} /></div><h2 style={{ margin: "18px 0 8px", fontSize: 22, letterSpacing: "-.03em" }}>Switch to OkzByte Demo Trading?</h2><p style={{ margin: 0, color: DIM, fontSize: 13, lineHeight: 1.6 }}>Practice Spot, Futures, and RWA trading with <strong style={{ color: FG }}>$100,000 USDT simulated funds</strong> in a zero-risk real-time market environment.</p><div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 17, padding: 12, borderRadius: 12, background: `${CYAN}0d`, border: `1px solid ${CYAN}2d`, color: CYAN, fontSize: 11, fontWeight: 800 }}><Sparkles size={15} /> No live funds or orders are used.</div><button onClick={startDemo} style={{ width: "100%", marginTop: 20, border: 0, background: CYAN, color: "#061014", fontWeight: 900, padding: "14px 12px", borderRadius: 12, fontSize: 13 }}>Start Demo Trading</button><button onClick={() => setOpen(false)} style={{ width: "100%", marginTop: 9, border: `1px solid ${LINE}`, background: "transparent", color: DIM, fontWeight: 800, padding: "12px", borderRadius: 12, fontSize: 12 }}>Cancel</button></motion.div></motion.div>}</AnimatePresence>
    </div>
  );
}
