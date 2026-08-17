import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, ArrowLeftRight, BarChart3, CheckCircle2, ChevronRight, Copy, ExternalLink, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { useLocation, useRoute } from "wouter";

const ASSET_META: Record<string, { name: string; fullName: string; amount: string; value: string; change: string; positive: boolean; color: string; description: string }> = {
  USDT: { name: "USDT", fullName: "Tether USD", amount: "4,250.80 USDT", value: "PKR 1,181,972", change: "+0.02%", positive: true, color: "#10B981", description: "Your primary settlement asset for spot trading, transfers, and RWA allocations." },
  USDC: { name: "USDC", fullName: "USD Coin", amount: "1,980.50 USDC", value: "PKR 550,699", change: "-0.01%", positive: false, color: "#22D3EE", description: "A regulated dollar-backed stablecoin available in your unified Spot Wallet." },
  OKBOND: { name: "OKBOND", fullName: "Orakzai Bond Token", amount: "2,250.00 OKB", value: "PKR 5,625,000", change: "+2.34%", positive: true, color: "#C9A84C", description: "Tokenized bond exposure linked to the OkzByte RWA and yield ecosystem." },
  PKR: { name: "PKR", fullName: "Pakistani Rupee", amount: "4,790,000 PKR", value: "PKR 4,790,000", change: "0.00%", positive: true, color: "#9AA2B8", description: "Available fiat balance for local settlement, P2P, and property investments." },
  SHARES: { name: "Shares", fullName: "Property Shares", amount: "320 SHR", value: "PKR 2,560,000", change: "+3.21%", positive: true, color: "#8B5CF6", description: "Fractional property ownership units held across the RWA portfolio." },
};

export default function AssetTokenDetail() {
  const [, params] = useRoute("/assets/token/:id");
  const [, navigate] = useLocation();
  const symbol = decodeURIComponent(params?.id ?? "USDT").toUpperCase();
  const asset = ASSET_META[symbol] ?? { ...ASSET_META.USDT, name: symbol, fullName: `${symbol} Asset`, amount: `0.00 ${symbol}`, description: "This asset is available in the unified OkzByte ledger." };

  const action = (path: string) => navigate(path);
  return (
    <div style={{ minHeight: "100dvh", background: "#04080F", color: "#EEF2FF", paddingBottom: "calc(84px + env(safe-area-inset-bottom))", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", gap: 10, height: 56, padding: "0 14px", background: "rgba(4,8,15,.96)", borderBottom: "1px solid rgba(255,255,255,.07)", backdropFilter: "blur(16px)" }}>
        <button onClick={() => navigate("/assets?tab=overview")} aria-label="Back to assets" style={{ display: "grid", placeItems: "center", border: 0, background: "transparent", color: "#9AA2B8", padding: 8, cursor: "pointer" }}><ArrowLeft size={19} /></button>
        <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 850 }}>Asset Details</div><div style={{ color: "#6B7591", fontSize: 10, marginTop: 2 }}>Unified ledger position</div></div>
        <button onClick={() => action(`/trade?pair=${encodeURIComponent(asset.name)}_PKR`)} aria-label="Open trading terminal" style={{ display: "grid", placeItems: "center", border: 0, background: "transparent", color: "#C9A84C", padding: 8, cursor: "pointer" }}><BarChart3 size={18} /></button>
      </header>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: "16px 14px" }}>
        <section style={{ padding: 18, borderRadius: 20, background: "linear-gradient(145deg, rgba(201,168,76,.12), rgba(255,255,255,.035))", border: "1px solid rgba(201,168,76,.28)", boxShadow: "0 18px 48px rgba(0,0,0,.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 48, height: 48, borderRadius: 16, display: "grid", placeItems: "center", background: `${asset.color}18`, border: `1px solid ${asset.color}55`, color: asset.color, fontSize: 17, fontWeight: 900 }}>{asset.name.slice(0, 2)}</div><div><div style={{ fontSize: 19, fontWeight: 900 }}>{asset.name}</div><div style={{ color: "#9AA2B8", fontSize: 11, marginTop: 3 }}>{asset.fullName}</div></div><div style={{ marginLeft: "auto", color: "#10B981", fontSize: 11, fontWeight: 800, background: "rgba(16,185,129,.12)", padding: "5px 8px", borderRadius: 8 }}>{asset.change}</div></div>
          <div style={{ marginTop: 22, color: "#6B7591", fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 800 }}>Available balance</div><div style={{ marginTop: 5, fontSize: 27, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{asset.amount}</div><div style={{ marginTop: 5, color: "#9AA2B8", fontSize: 12 }}>{asset.value} estimated value</div>
          <p style={{ color: "#9AA2B8", fontSize: 11, lineHeight: 1.55, margin: "16px 0 0" }}>{asset.description}</p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 14 }}>
          {[{ label: "Trade", icon: BarChart3, path: `/trade?pair=${asset.name}_PKR` }, { label: "Earn", icon: Sparkles, path: `/staking?asset=${asset.name}` }, { label: "Transfer", icon: ArrowLeftRight, path: "/assets/transfer" }, { label: "Deposit", icon: ArrowDownToLine, path: "/deposit-method" }].map(({ label, icon: Icon, path }) => <button key={label} onClick={() => action(path)} style={{ minWidth: 0, padding: "12px 5px", borderRadius: 13, border: `1px solid ${label === "Trade" ? "rgba(201,168,76,.45)" : "rgba(255,255,255,.08)"}`, background: label === "Trade" ? "rgba(201,168,76,.12)" : "rgba(255,255,255,.035)", color: label === "Trade" ? "#C9A84C" : "#9AA2B8", cursor: "pointer", fontSize: 10, fontWeight: 800 }}><Icon size={16} style={{ display: "block", margin: "0 auto 6px" }} />{label}</button>)}
        </section>

        <section style={{ marginTop: 16, padding: 16, borderRadius: 17, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }}><div style={{ display: "flex", alignItems: "center", gap: 8, color: "#EEF2FF", fontSize: 13, fontWeight: 850 }}><WalletCards size={16} color="#C9A84C" /> Ledger activity</div>{["Balance position confirmed", "Unified wallet sync completed", "Risk controls active"].map((label, i) => <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,.06)" : 0 }}><CheckCircle2 size={15} color="#10B981" /><div style={{ flex: 1 }}><div style={{ color: "#EEF2FF", fontSize: 11, fontWeight: 700 }}>{label}</div><div style={{ color: "#6B7591", fontSize: 10, marginTop: 3 }}>OkzByte internal ledger · verified</div></div><ChevronRight size={14} color="#6B7591" /></div>)}</section>

        <section style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}><button onClick={() => action("/withdraw/on-chain")} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 7, padding: 12, borderRadius: 12, border: "1px solid rgba(244,63,94,.25)", background: "rgba(244,63,94,.07)", color: "#F43F5E", fontSize: 11, fontWeight: 800, cursor: "pointer" }}><ArrowUpFromLine size={15} /> Withdraw</button><button onClick={() => navigator.clipboard?.writeText(`okzbyte-${asset.name.toLowerCase()}-ledger`)} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 7, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.035)", color: "#9AA2B8", fontSize: 11, fontWeight: 800, cursor: "pointer" }}><Copy size={15} /> Copy ledger ID</button></section>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 17, color: "#6B7591", fontSize: 10 }}><ShieldCheck size={14} color="#10B981" /> Protected by OkzByte account controls <ExternalLink size={12} style={{ marginLeft: "auto" }} /></div>
      </main>
    </div>
  );
}
