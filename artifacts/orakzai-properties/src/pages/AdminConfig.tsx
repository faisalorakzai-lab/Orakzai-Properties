import { useState, useEffect } from "react";
import { adminSetABP, getABP, initEngine } from "@/lib/priceEngine";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";

const GOLD = "#F3BA2F";
const BG   = "#0B0E11";
const CARD = "#12161C";
const BORD = "#1E2329";
const GREEN = "#0ECB81";
const RED   = "#F6465D";
const FG    = "#EAECEF";
const DIM   = "#848E9C";

const ASSETS = [
  { ticker: "ASC",  name: "Azan Smart City",    defaultPrice: 1.2400 },
  { ticker: "DHA9", name: "DHA Lahore Ph-9",    defaultPrice: 8.7500 },
  { ticker: "BTI",  name: "Bahria Town Isb",    defaultPrice: 5.1000 },
  { ticker: "GBR",  name: "Gulberg Residencia", defaultPrice: 3.6200 },
  { ticker: "CSC",  name: "Capital Smart City", defaultPrice: 2.1800 },
  { ticker: "OBK",  name: "Orakzai Bond",       defaultPrice: 0.8800 },
];

export default function AdminConfig() {
  const [selected, setSelected] = useState(ASSETS[0]);
  const [newPrice, setNewPrice] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [currentABP, setCurrentABP] = useState(0);
  const [history, setHistory] = useState<{ticker: string; price: number; time: string}[]>([]);

  useEffect(() => {
    ASSETS.forEach(a => initEngine(a.ticker, a.defaultPrice));
    setCurrentABP(getABP(selected.ticker) || selected.defaultPrice);
  }, [selected]);

  const handlePush = () => {
    const val = parseFloat(newPrice);
    if (!val || val <= 0) { setStatus("error"); setTimeout(() => setStatus("idle"), 2000); return; }
    const pushed = adminSetABP(selected.ticker, val);
    setCurrentABP(pushed);
    setHistory(h => [{ ticker: selected.ticker, price: val, time: new Date().toLocaleTimeString() }, ...h.slice(0, 9)]);
    setNewPrice("");
    setStatus("success");
    setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: FG, fontFamily: "'Inter', sans-serif", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORD}`, padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(243,186,47,0.15)", border: `1px solid rgba(243,186,47,0.3)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield size={16} color={GOLD} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: FG }}>Admin Price Controller</div>
          <div style={{ fontSize: 11, color: DIM }}>Orakzai Properties · Hidden Route</div>
        </div>
        <div style={{ marginLeft: "auto", background: "rgba(243,186,47,0.1)", border: `1px solid rgba(243,186,47,0.25)`, borderRadius: 6, padding: "3px 10px", fontSize: 10, color: GOLD, fontWeight: 700 }}>
          ADMIN
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: 480, margin: "0 auto" }}>
        {/* Warning banner */}
        <div style={{ background: "rgba(246,70,93,0.08)", border: `1px solid rgba(246,70,93,0.25)`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#FF8090" }}>
          ⚠️ Changes push immediately to the live market. ABP update creates a Gap Candle on all active charts.
        </div>

        {/* Token selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: DIM, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Select Token</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {ASSETS.map(a => (
              <button key={a.ticker} onClick={() => setSelected(a)} style={{
                padding: "10px 12px", borderRadius: 8, border: `1px solid ${selected.ticker === a.ticker ? GOLD : BORD}`,
                background: selected.ticker === a.ticker ? "rgba(243,186,47,0.12)" : CARD,
                cursor: "pointer", textAlign: "left", transition: "all .15s",
              }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: selected.ticker === a.ticker ? GOLD : FG }}>{a.ticker}/USDT</div>
                <div style={{ fontSize: 9, color: DIM, marginTop: 2 }}>{a.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current ABP display */}
        <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: DIM, marginBottom: 4 }}>Current Admin Base Price (ABP)</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: GOLD, fontVariantNumeric: "tabular-nums" }}>{currentABP.toFixed(4)} <span style={{ fontSize: 13, fontWeight: 400, color: DIM }}>USDT</span></div>
          <div style={{ fontSize: 10, color: DIM, marginTop: 4 }}>Formula: Current Price = ABP × (1 + Trade Adjustment)</div>
        </div>

        {/* New price input */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: DIM, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>New Base Price (USDT)</div>
          <input
            type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
            placeholder={`e.g. ${selected.defaultPrice}`} step="0.0001" min="0.0001"
            onKeyDown={e => e.key === "Enter" && handlePush()}
            style={{
              width: "100%", background: "#0f1318", border: `1px solid ${status === "error" ? RED : BORD}`,
              borderRadius: 8, padding: "12px 14px", color: FG, fontSize: 16, outline: "none", boxSizing: "border-box",
              fontVariantNumeric: "tabular-nums", fontFamily: "inherit",
            }}
          />
        </div>

        {/* Push button */}
        <button onClick={handlePush} style={{
          width: "100%", padding: "14px", borderRadius: 8, border: "none", cursor: "pointer",
          fontWeight: 800, fontSize: 14, letterSpacing: "0.03em",
          background: status === "success" ? GREEN : status === "error" ? RED : `linear-gradient(135deg, ${GOLD} 0%, #e8a800 100%)`,
          color: status === "success" || status === "error" ? "#fff" : BG,
          transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {status === "success" ? <><CheckCircle size={16}/> Pushed to Market!</> :
           status === "error" ? <><AlertCircle size={16}/> Invalid Price</> :
           `🚀 Push ${selected.ticker} to Market`}
        </button>

        {/* Formula explanation */}
        <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 10, padding: "12px 14px", marginTop: 16 }}>
          <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, marginBottom: 8 }}>Price Engine Logic</div>
          <div style={{ fontSize: 11, color: DIM, lineHeight: 1.8 }}>
            <div>📌 <span style={{ color: FG }}>ABP</span> = Admin-set base price (persistent)</div>
            <div>📈 <span style={{ color: GREEN }}>Buy &gt; $100</span> → TA increases by 0.01%</div>
            <div>📉 <span style={{ color: RED }}>Sell &gt; $100</span> → TA decreases by 0.01%</div>
            <div>🔢 <span style={{ color: FG }}>Current = ABP × (1 + TA)</span></div>
            <div>⚡ ABP change creates a <span style={{ color: GOLD }}>Gap Candle</span> instantly</div>
            <div>🛡️ Minimum order: <span style={{ color: GOLD }}>$1 USDT</span> enforced</div>
          </div>
        </div>

        {/* Push history */}
        {history.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10, color: DIM, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recent Pushes</div>
            <div style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 8, overflow: "hidden" }}>
              {history.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: i < history.length - 1 ? `1px solid ${BORD}` : "none", fontSize: 11 }}>
                  <span style={{ color: GOLD, fontWeight: 700 }}>{h.ticker}</span>
                  <span style={{ color: FG, fontVariantNumeric: "tabular-nums" }}>{h.price.toFixed(4)} USDT</span>
                  <span style={{ color: DIM }}>{h.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
