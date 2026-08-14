import { useState } from "react";
import { ArrowLeft, MoreVertical, Paperclip, Send, ChevronRight, X, CheckCheck, Camera } from "lucide-react";
import { useLocation } from "wouter";

const BG = "#0b0e11", CARD = "#181a20", BUBBLE = "#1e2329", LINE = "#2b313a", GOLD = "#f0b90b", GREEN = "#0ecb81", RED = "#f6465d", FG = "#f5f5f5", DIM = "#929aa5";
const QUICK = [
  "Deposit / Withdrawal Delay (PKR & Crypto)",
  "Identity Verification (KYC Level 1 & 2)",
  "Real World Asset (RWA) Staking & Yields",
];

export default function CustomerService() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Array<{ text: string; mine?: boolean; time?: string }>>([]);
  const [input, setInput] = useState("");
  const [ended, setEnded] = useState(false);
  const [notice, setNotice] = useState("");

  const send = (text = input) => {
    if (!text.trim() || ended) return;
    setMessages(m => [...m, { text: text.trim(), mine: true, time: "12:02 PM" }]);
    setInput("");
    setNotice("Message sent to the support queue");
    window.setTimeout(() => setNotice(""), 2400);
  };

  return <div style={{ minHeight: "100dvh", height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column", background: BG, color: FG, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
    <header style={{ flexShrink: 0, height: 66, padding: "9px 16px 7px", borderBottom: `1px solid ${LINE}80`, display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <button onClick={() => setLocation("/services")} style={{ border: 0, background: "none", color: FG, padding: 4, display: "grid", placeItems: "center" }}><ArrowLeft size={20} /></button>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${GREEN}20`, border: `1px solid ${GREEN}`, display: "grid", placeItems: "center", color: GREEN, fontSize: 10, fontWeight: 900, flexShrink: 0 }}>OKZ</div>
        <div style={{ minWidth: 0 }}><strong style={{ display: "block", fontSize: 14, whiteSpace: "nowrap" }}>OkzByte Live Support</strong><span style={{ display: "block", fontSize: 10, color: GREEN, marginTop: 2, whiteSpace: "nowrap" }}>● Online · Average wait time: &lt; 1 min</span></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}><button aria-label="Chat options" style={{ border: 0, background: "none", color: DIM, padding: 4 }}><MoreVertical size={19} /></button><button onClick={() => setEnded(true)} style={{ border: `1px solid ${RED}33`, background: `${RED}12`, color: "#ff7382", borderRadius: 8, padding: "6px 9px", fontSize: 10, fontWeight: 800 }}>End Chat</button></div>
    </header>

    <main style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 16px 92px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, marginBottom: 14, borderRadius: 12, border: `1px solid ${LINE}`, background: CARD }}><div><span style={{ display: "inline-block", color: GOLD, fontSize: 10, fontWeight: 800, padding: "3px 7px", marginBottom: 5, borderRadius: 4, background: `${GOLD}14`, border: `1px solid ${GOLD}4d` }}>VIP QUEUE</span><span style={{ display: "block", color: DIM, fontSize: 10 }}>Priority Level: Standard Account</span></div><span style={{ color: DIM, fontFamily: "monospace", fontSize: 10 }}>Agent ID: #8092-OkzByte</span></div>
      <div style={{ textAlign: "center", color: "#66707c", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", margin: "12px 0" }}>Today, 12:00 PM</div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 18 }}><div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: GOLD, color: "#000", fontSize: 9, fontWeight: 950 }}>OKZ</div><div style={{ maxWidth: "85%" }}><div style={{ padding: 14, borderRadius: "0 16px 16px 16px", border: `1px solid ${LINE}`, background: BUBBLE, color: "#e8eaed", fontSize: 12, lineHeight: 1.65, boxShadow: "0 4px 14px rgba(0,0,0,.14)" }}>Hello! Welcome to OkzByte Customer Service. I am your AI Virtual Concierge. Please select a topic below or type your issue directly to connect with a human specialist.</div><div style={{ display: "grid", gap: 8, marginTop: 10 }}>{QUICK.map(q => <button key={q} onClick={() => send(q)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 11px", textAlign: "left", borderRadius: 12, border: `1px solid ${LINE}`, background: CARD, color: FG, fontSize: 11, fontWeight: 600 }}>{q}<ChevronRight size={15} color={DIM} /></button>)}<button onClick={() => send("I would like to speak with a human support representative.")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 11px", textAlign: "left", borderRadius: 12, border: `1px solid ${GOLD}66`, background: `${GOLD}12`, color: GOLD, fontSize: 11, fontWeight: 800 }}>Talk to Human Support Representative<ChevronRight size={15} /></button></div></div></div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><div style={{ maxWidth: "80%" }}>{messages.map((m, i) => <div key={i} style={{ marginBottom: 8, padding: "11px 13px", borderRadius: "16px 0 16px 16px", background: GOLD, color: "#000", fontSize: 12, fontWeight: 600, boxShadow: "0 4px 14px rgba(0,0,0,.22)" }}>{m.text}<span style={{ display: "block", textAlign: "right", marginTop: 5, color: "#263000", opacity: .75, fontSize: 9 }}>{m.time} · Read <CheckCheck size={11} style={{ verticalAlign: "-2px" }} /></span></div>)}</div></div>
      {ended && <div style={{ margin: "22px 0", padding: 16, borderRadius: 14, border: `1px solid ${LINE}`, background: CARD, textAlign: "center", color: DIM, fontSize: 12 }}><X size={22} color={DIM} style={{ marginBottom: 6 }} /><strong style={{ display: "block", color: FG }}>Chat ended</strong><span>Thank you for contacting OkzByte Customer Service.</span><button onClick={() => setEnded(false)} style={{ display: "block", margin: "12px auto 0", padding: "8px 14px", borderRadius: 9, border: `1px solid ${GOLD}55`, background: `${GOLD}12`, color: GOLD, fontSize: 11, fontWeight: 800 }}>Start new chat</button></div>}
      {notice && <div style={{ position: "fixed", top: 76, left: "50%", transform: "translateX(-50%)", zIndex: 50, padding: "8px 12px", borderRadius: 9, background: `${GREEN}e8`, color: "#00150d", fontSize: 11, fontWeight: 800 }}>{notice}</div>}
    </main>

    <div style={{ position: "fixed", zIndex: 100, left: 0, right: 0, bottom: 0, padding: "10px 12px calc(10px + env(safe-area-inset-bottom))", display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${LINE}`, background: `${CARD}f7`, backdropFilter: "blur(14px)" }}><button aria-label="Attach file" style={{ padding: 10, borderRadius: 11, border: `1px solid ${LINE}`, background: BG, color: DIM, display: "grid", placeItems: "center" }}><Paperclip size={17} /></button><button aria-label="Attach image" style={{ padding: 10, borderRadius: 11, border: `1px solid ${LINE}`, background: BG, color: DIM, display: "grid", placeItems: "center" }}><Camera size={17} /></button><input value={input} disabled={ended} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Type your message or attach screenshot..." style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 11, border: `1px solid ${LINE}`, background: BG, color: FG, outline: "none", fontSize: 11, fontFamily: "inherit" }} /><button aria-label="Send message" disabled={ended || !input.trim()} onClick={() => send()} style={{ padding: 10, borderRadius: 11, border: 0, background: ended || !input.trim() ? `${GOLD}44` : GOLD, color: "#000", display: "grid", placeItems: "center" }}><Send size={17} /></button></div>
  </div>;
}
