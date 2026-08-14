import { Gamepad2, X } from "lucide-react";
import { useMode } from "@/contexts/ModeContext";
import { useToast } from "@/hooks/use-toast";

export default function DemoModeBanner() {
  const { isDemoTrading, setIsDemoTrading, demoBalances } = useMode();
  const { toast } = useToast();
  if (!isDemoTrading) return null;

  const exit = () => {
    setIsDemoTrading(false);
    toast({ title: "Switched back to Live Account", description: "Live wallet balances and market operations restored." });
  };

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minHeight: 38, padding: "8px 12px", background: "linear-gradient(90deg, rgba(8,73,88,.94), #181a20 50%, rgba(8,73,88,.94))", borderBottom: "1px solid rgba(34,211,238,.5)", backdropFilter: "blur(16px)", color: "#F5F5F5" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}><span style={{ width: 7, height: 7, flexShrink: 0, borderRadius: "50%", background: "#22D3EE", boxShadow: "0 0 11px #22D3EE" }} /><Gamepad2 size={14} color="#22D3EE" /><span style={{ color: "#22D3EE", fontSize: 10, fontWeight: 900, letterSpacing: ".08em", whiteSpace: "nowrap" }}>DEMO TRADING MODE</span></div>
      <div style={{ flex: 1, textAlign: "center", color: "#fff", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" }}>${demoBalances.USDT.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDT</div>
      <button onClick={exit} style={{ flexShrink: 0, border: "1px solid rgba(34,211,238,.4)", borderRadius: 8, padding: "5px 9px", background: "rgba(34,211,238,.12)", color: "#22D3EE", fontSize: 10, fontWeight: 900 }}>Exit Demo</button>
    </div>
  );
}
