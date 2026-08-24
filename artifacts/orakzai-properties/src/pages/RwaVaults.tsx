import { useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, LockKeyhole, Network, ShieldCheck, TrendingUp, Wallet, X, Zap } from "lucide-react";
import { useLocation } from "wouter";

const BG = "#050b14";
const PANEL = "#0b1420";
const CARD = "#101d2b";
const LINE = "rgba(255,255,255,.09)";
const TEXT = "#f3f5f7";
const DIM = "#8d9aaa";
const GOLD = "#f0b90b";
const GREEN = "#22c55e";
const BLUE = "#38bdf8";

type Category = "All Vaults" | "Fixed APY Staking" | "Rental Income Pools" | "Commercial RWA Vaults" | "High Liquidity";
type UnitResult = { label: string };
type Vault = {
  id: string;
  title: string;
  asset: string;
  category: Category;
  apy: number;
  lockup: string;
  payout: string;
  staked: number;
  capacity: number;
  network: string;
  contract: string;
  image: string;
  description: string;
  features: string[];
  units: UnitResult[];
};

const categories: Category[] = ["All Vaults", "Fixed APY Staking", "Rental Income Pools", "Commercial RWA Vaults", "High Liquidity"];
const vaults: Vault[] = [
  {
    id: "okbond-v7",
    title: "OKBOND Commercial Real Estate Staking Pool V7",
    asset: "Gulberg Prime Commercial Tower · Lahore",
    category: "Commercial RWA Vaults",
    apy: 16.2,
    lockup: "180 Days",
    payout: "Daily in USDT / OKB",
    staked: 850000,
    capacity: 1000000,
    network: "Polygon",
    contract: "0x7A31...9C42",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85",
    description: "Tokenized participation in a verified commercial property with rental distributions routed through the protocol settlement layer.",
    features: ["SolidityScan audited", "Title and lease review complete", "Daily rental distribution", "Secondary liquidity window"],
    units: [{ label: "USDT vault share" }],
  },
  {
    id: "rentflow-12",
    title: "RentFlow Residential Income Vault 12",
    asset: "Furnished apartments · DHA Phase 6, Karachi",
    category: "Rental Income Pools",
    apy: 13.8,
    lockup: "90 Days",
    payout: "Daily in USDT",
    staked: 620000,
    capacity: 750000,
    network: "Polygon",
    contract: "0x31C8...47F0",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=85",
    description: "Diversified residential rental receipts pooled across a professionally managed apartment portfolio.",
    features: ["Rental ledger verified", "Quarterly occupancy review", "90-day exit window", "USDT distribution"],
    units: [{ label: "USDT vault share" }],
  },
  {
    id: "brickyield-3",
    title: "BrickYield Fixed APY Vault III",
    asset: "Construction-backed inventory · Pakistan",
    category: "Fixed APY Staking",
    apy: 11.5,
    lockup: "Flexible",
    payout: "Weekly in USDT",
    staked: 430000,
    capacity: 600000,
    network: "Polygon",
    contract: "0xA4D2...1B9E",
    image: "https://images.unsplash.com/photo-1503387762-592cac58ef4e?auto=format&fit=crop&w=1400&q=85",
    description: "A fixed-rate vault backed by verified construction receivables and short-duration inventory finance.",
    features: ["Fixed-rate policy", "Receivables verified", "Flexible redemption", "Weekly settlement"],
    units: [{ label: "USDT vault share" }],
  },
  {
    id: "metro-liquid",
    title: "Metro Square Liquid RWA Vault",
    asset: "Mixed-use retail units · Islamabad",
    category: "High Liquidity",
    apy: 9.8,
    lockup: "Flexible",
    payout: "Daily in USDT / OKB",
    staked: 970000,
    capacity: 1000000,
    network: "Polygon",
    contract: "0x82E1...D607",
    image: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1400&q=85",
    description: "A liquid tokenized retail asset designed for shorter holding periods and transparent exit pricing.",
    features: ["High liquidity", "Live reserve ratio", "On-chain transferability", "Daily settlement"],
    units: [{ label: "USDT vault share" }],
  },
];

const money = (value: number) => `$${Math.round(value).toLocaleString("en-US")}`;
const compact = (value: number) => (value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${Math.round(value / 1000)}K`);

type EthereumProvider = { request: (args: { method: string }) => Promise<unknown> };

function RwaModal({ vault, close, onStake }: { vault: Vault; close: () => void; onStake: (amount: number) => void }) {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"stake" | "contract">("stake");
  const [amount, setAmount] = useState(5000);
  const [wallet, setWallet] = useState("");
  const [walletMessage, setWalletMessage] = useState("");
  const [staked, setStaked] = useState(false);
  const daily = amount * vault.apy / 100 / 365;
  const monthly = amount * vault.apy / 100 / 12;
  const annual = amount * vault.apy / 100;

  const connectWallet = async () => {
    const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    if (ethereum) {
      try {
        const accounts = await ethereum.request({ method: "eth_requestAccounts" }) as string[];
        setWallet(accounts?.[0] || "");
        setWalletMessage(accounts?.[0] ? "Wallet connected" : "No wallet account returned");
      } catch {
        setWalletMessage("Wallet connection was cancelled");
      }
      return;
    }
    setWallet("0xDemo...7A31");
    setWalletMessage("Preview wallet connected · Polygon readiness check passed");
  };

  const confirmDeposit = () => {
    if (!wallet) {
      setWalletMessage("Connect a Polygon wallet before confirming the deposit");
      return;
    }
    setStaked(true);
    onStake(amount);
  };

  if (staked) {
    return (
      <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,.82)" }}>
        <div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 600, padding: 18, borderRadius: "22px 22px 0 0", background: PANEL, border: `1px solid ${LINE}`, color: TEXT }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}><button onClick={close} style={{ border: 0, background: "transparent", color: DIM }}><X size={20} /></button></div>
          <div style={{ marginTop: 8, padding: 18, borderRadius: 15, background: `${GREEN}0d`, border: `1px solid ${GREEN}42`, textAlign: "center" }}>
            <Check size={34} color={GREEN} />
            <h3 style={{ margin: "8px 0 4px", fontSize: 18 }}>Deposit confirmed</h3>
            <p style={{ color: DIM, fontSize: 11, lineHeight: 1.5 }}>Your vault position is active and the yield stream is now visible in your portfolio.</p>
            <div style={{ padding: 12, borderRadius: 10, background: CARD, textAlign: "left", fontSize: 10, lineHeight: 1.8 }}>
              <strong>Stake ID: OKZ-RWA-{vault.id.toUpperCase()}-{Date.now().toString().slice(-6)}</strong><br />
              <span style={{ color: DIM }}>{money(amount)} deposited · {vault.apy}% APY · {vault.lockup}<br />Estimated monthly rewards: {money(monthly)} · {vault.payout}</span>
            </div>
            <button onClick={() => navigate("/portfolio?tab=rwa-vaults")} style={{ marginTop: 14, padding: "10px 22px", border: 0, borderRadius: 10, background: GOLD, color: "#061009", fontWeight: 900 }}>Open Portfolio</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,.82)" }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 600, maxHeight: "95dvh", overflowY: "auto", padding: 18, borderRadius: "22px 22px 0 0", background: PANEL, border: `1px solid ${LINE}`, color: TEXT }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ color: GREEN, fontSize: 10, fontWeight: 900, letterSpacing: ".14em" }}>RWA VAULT DESK</div>
            <h2 style={{ margin: "7px 0 3px", fontSize: 19 }}>{vault.title}</h2>
            <div style={{ color: DIM, fontSize: 11 }}>{vault.asset} · {vault.network}</div>
          </div>
          <button onClick={close} style={{ border: 0, background: "transparent", color: DIM }}><X size={20} /></button>
        </div>
        <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
          <button onClick={() => setTab("stake")} style={{ flex: 1, padding: 10, borderRadius: 9, border: `1px solid ${tab === "stake" ? GREEN : LINE}`, background: tab === "stake" ? `${GREEN}16` : CARD, color: tab === "stake" ? GREEN : DIM, fontSize: 10, fontWeight: 900 }}>Deposit & Stake</button>
          <button onClick={() => setTab("contract")} style={{ flex: 1, padding: 10, borderRadius: 9, border: `1px solid ${tab === "contract" ? BLUE : LINE}`, background: tab === "contract" ? `${BLUE}16` : CARD, color: tab === "contract" ? BLUE : DIM, fontSize: 10, fontWeight: 900 }}>Smart Contract</button>
        </div>
        {tab === "stake" ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ padding: 12, borderRadius: 11, background: CARD, border: `1px solid ${LINE}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: DIM, fontSize: 10 }}>STAKE AMOUNT</span><strong style={{ color: GREEN, fontSize: 18 }}>{money(amount)}</strong></div>
              <input type="range" min="100" max="100000" step="100" value={amount} onChange={(event) => setAmount(Number(event.target.value))} style={{ width: "100%", marginTop: 12, accentColor: GREEN }} />
              <div style={{ display: "flex", justifyContent: "space-between", color: DIM, fontSize: 9, marginTop: 4 }}><span>$100 minimum</span><span>$100K per wallet</span></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginTop: 10 }}>
              {[["Daily yield", daily], ["Monthly yield", monthly], ["Annual yield", annual]].map(([label, value]) => (
                <div key={String(label)} style={{ padding: 10, borderRadius: 9, background: `${GREEN}0d`, border: `1px solid ${GREEN}30`, textAlign: "center" }}><div style={{ color: DIM, fontSize: 9 }}>{label}</div><strong style={{ display: "block", marginTop: 4, color: GREEN, fontSize: 13 }}>{money(Number(value))}</strong></div>
              ))}
            </div>
            <div style={{ marginTop: 11, padding: 11, borderRadius: 10, background: `${BLUE}0d`, border: `1px solid ${BLUE}32`, fontSize: 10, lineHeight: 1.5, color: DIM }}><Zap size={13} color={BLUE} style={{ verticalAlign: "-3px", marginRight: 5 }} />Rewards stream to your connected wallet at the {vault.payout.toLowerCase()} cadence. Estimates are indicative and subject to vault performance.</div>
            <button onClick={connectWallet} style={{ width: "100%", marginTop: 12, padding: 11, borderRadius: 10, border: `1px solid ${wallet ? GREEN : LINE}`, background: wallet ? `${GREEN}16` : CARD, color: wallet ? GREEN : TEXT, fontWeight: 900, fontSize: 10 }}><Wallet size={14} style={{ verticalAlign: "-3px", marginRight: 5 }} />{wallet ? `${wallet} · Polygon ready` : "Connect MetaMask / WalletConnect"}</button>
            {walletMessage && <div style={{ marginTop: 7, color: walletMessage.includes("connected") || walletMessage.includes("passed") ? GREEN : "#f59e0b", fontSize: 10 }}>{walletMessage}</div>}
            <button onClick={confirmDeposit} style={{ width: "100%", marginTop: 12, padding: 13, border: 0, borderRadius: 11, background: wallet ? GREEN : "#304052", color: wallet ? "#03100a" : DIM, fontWeight: 900, cursor: wallet ? "pointer" : "not-allowed" }}>Confirm Deposit & Stake</button>
            <div style={{ color: DIM, fontSize: 9, textAlign: "center", marginTop: 8 }}>Polygon network · {vault.lockup} lockup · Contract {vault.contract}</div>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <div style={{ padding: 13, borderRadius: 11, background: CARD, border: `1px solid ${LINE}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ color: DIM, fontSize: 10 }}>CONTRACT ADDRESS</span><button onClick={() => navigator.clipboard?.writeText(vault.contract)} style={{ border: 0, background: "transparent", color: BLUE }}><Copy size={14} /></button></div>
              <strong style={{ display: "block", marginTop: 7, fontFamily: "monospace", fontSize: 15 }}>{vault.contract}</strong>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, color: DIM, fontSize: 10 }}><span>Network</span><strong style={{ color: TEXT }}>{vault.network}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, color: DIM, fontSize: 10 }}><span>Audit status</span><strong style={{ color: GREEN }}>Verified · SolidityScan</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, color: DIM, fontSize: 10 }}><span>Token standard</span><strong style={{ color: TEXT }}>ERC-4626 RWA vault</strong></div>
            </div>
            <a href={`https://polygonscan.com/address/${vault.contract}`} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 12, padding: 12, borderRadius: 10, border: `1px solid ${BLUE}45`, background: `${BLUE}12`, color: BLUE, textAlign: "center", fontSize: 10, fontWeight: 900, textDecoration: "none" }}><ExternalLink size={13} style={{ verticalAlign: "-3px", marginRight: 5 }} />View contract on PolygonScan</a>
            <button onClick={() => setTab("stake")} style={{ width: "100%", marginTop: 10, padding: 11, border: 0, borderRadius: 10, background: GOLD, color: "#07100a", fontWeight: 900 }}>Deposit & Stake</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RwaVaults() {
  const [, navigate] = useLocation();
  const [category, setCategory] = useState<Category>("All Vaults");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Vault | null>(null);
  const [stakedTotal, setStakedTotal] = useState(0);
  const visible = useMemo(() => vaults.filter((vault) => (category === "All Vaults" || vault.category === category) && `${vault.title} ${vault.asset}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const totalStaked = 12500000 + stakedTotal;

  return (
    <main style={{ minHeight: "100dvh", padding: "10px 14px calc(96px + env(safe-area-inset-bottom))", background: BG, color: TEXT, fontFamily: "Inter, Plus Jakarta Sans, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", gap: 11, height: 55, borderBottom: `1px solid ${LINE}` }}>
          <button onClick={() => navigate("/market/services")} style={{ border: 0, background: "transparent", color: DIM, padding: 6 }}><ArrowLeft size={21} /></button>
          <div><span style={{ display: "block", color: GREEN, fontSize: 10, fontWeight: 900, letterSpacing: ".14em" }}>WEB3 RWA DESK</span><h1 style={{ margin: "4px 0 0", fontSize: 21 }}>High-Yield RWA Vaults</h1></div>
        </header>
        <section style={{ marginTop: 15, padding: 14, borderRadius: 16, background: `linear-gradient(135deg,${PANEL},#0c1c24)`, border: `1px solid ${GREEN}34` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}><div><div style={{ color: DIM, fontSize: 10, fontWeight: 800, letterSpacing: ".12em" }}>PROTOCOL OVERVIEW</div><div style={{ fontSize: 12, color: DIM, marginTop: 5 }}>Asset-backed yield, transparent settlement, on-chain verification.</div></div><div style={{ padding: "6px 8px", borderRadius: 8, background: `${GREEN}16`, color: GREEN, fontSize: 9, fontWeight: 900 }}><ShieldCheck size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />Audited protocol</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>{[["TVL", `${compact(totalStaked)} USDT`, GREEN], ["Avg APY", "14.8% APY", GOLD], ["Active stakers", "3,420+", BLUE]].map(([label, value, color]) => <div key={String(label)} style={{ padding: 10, borderRadius: 10, background: "rgba(0,0,0,.18)", border: `1px solid ${LINE}` }}><div style={{ color: DIM, fontSize: 9 }}>{label}</div><strong style={{ display: "block", marginTop: 4, color: String(color), fontSize: 14 }}>{value}</strong></div>)}</div>
        </section>
        <section style={{ marginTop: 12, padding: 12, borderRadius: 14, background: PANEL, border: `1px solid ${LINE}` }}>
          <div style={{ position: "relative" }}><Network size={15} color={DIM} style={{ position: "absolute", left: 11, top: 12 }} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vault or underlying asset..." style={{ width: "100%", boxSizing: "border-box", padding: "11px 11px 11px 34px", borderRadius: 10, border: `1px solid ${LINE}`, background: CARD, color: TEXT }} /></div>
          <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingTop: 11 }}>{categories.map((item) => <button key={item} onClick={() => setCategory(item)} style={{ flexShrink: 0, padding: "9px 11px", borderRadius: 10, border: `1px solid ${category === item ? `${GREEN}99` : LINE}`, background: category === item ? `${GREEN}16` : CARD, color: category === item ? GREEN : DIM, fontSize: 10, fontWeight: 800 }}>{item}</button>)}</div>
        </section>
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "end", margin: "17px 0 10px" }}><div><div style={{ color: GREEN, fontSize: 10, fontWeight: 900, letterSpacing: ".13em" }}>TOKENIZED YIELD MARKETS</div><h2 style={{ margin: "5px 0 0", fontSize: 18 }}>Choose a verified vault</h2></div><span style={{ color: DIM, fontSize: 10 }}>{visible.length} vaults</span></section>
        <div style={{ display: "grid", gap: 13 }}>
          {visible.map((vault) => { const fill = Math.round(vault.staked / vault.capacity * 100); return <article key={vault.id} style={{ overflow: "hidden", borderRadius: 16, background: CARD, border: `1px solid ${LINE}` }}>
            <div style={{ position: "relative" }}><img src={vault.image} alt={vault.title} style={{ width: "100%", height: 145, objectFit: "cover", display: "block" }} /><div style={{ position: "absolute", left: 11, bottom: 10, display: "flex", gap: 6, flexWrap: "wrap" }}><span style={{ padding: "6px 8px", borderRadius: 8, background: "rgba(0,0,0,.76)", color: GREEN, fontSize: 9, fontWeight: 900 }}><ShieldCheck size={11} style={{ verticalAlign: "-2px", marginRight: 3 }} />Audited by SolidityScan</span><span style={{ padding: "6px 8px", borderRadius: 8, background: "rgba(0,0,0,.76)", color: BLUE, fontSize: 9, fontWeight: 900 }}>Verified</span></div></div>
            <div style={{ padding: 14 }}><h3 style={{ margin: 0, fontSize: 15, lineHeight: 1.25 }}>{vault.title}</h3><div style={{ color: DIM, fontSize: 10, marginTop: 5 }}>{vault.asset}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginTop: 12 }}><div style={{ padding: 9, borderRadius: 9, background: `${GREEN}0d` }}><div style={{ color: DIM, fontSize: 9 }}>Est. APY</div><strong style={{ display: "block", marginTop: 4, color: GREEN, fontSize: 14 }}>{vault.apy}%</strong></div><div style={{ padding: 9, borderRadius: 9, background: PANEL }}><div style={{ color: DIM, fontSize: 9 }}>Lockup</div><strong style={{ display: "block", marginTop: 4, fontSize: 11 }}>{vault.lockup}</strong></div><div style={{ padding: 9, borderRadius: 9, background: PANEL }}><div style={{ color: DIM, fontSize: 9 }}>Payout</div><strong style={{ display: "block", marginTop: 4, fontSize: 10, lineHeight: 1.2 }}>{vault.payout}</strong></div></div><div style={{ marginTop: 12 }}><div style={{ display: "flex", justifyContent: "space-between", color: DIM, fontSize: 10 }}><span>Vault capacity</span><strong style={{ color: TEXT }}>{compact(vault.staked)} / {compact(vault.capacity)}</strong></div><div style={{ height: 7, borderRadius: 99, background: "#263545", marginTop: 6, overflow: "hidden" }}><div style={{ height: "100%", width: `${fill}%`, background: `linear-gradient(90deg,${GREEN},${BLUE})`, borderRadius: 99 }} /></div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, color: DIM, fontSize: 9 }}><span>{fill}% allocated</span><span>{vault.network} network</span></div></div><div style={{ display: "flex", gap: 8, marginTop: 13 }}><button onClick={() => setSelected(vault)} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${BLUE}55`, background: `${BLUE}0d`, color: BLUE, fontSize: 10, fontWeight: 900 }}><ExternalLink size={13} style={{ verticalAlign: "-3px", marginRight: 4 }} />View Smart Contract</button><button onClick={() => setSelected(vault)} style={{ flex: 1, padding: 10, border: 0, borderRadius: 10, background: GREEN, color: "#03100a", fontSize: 10, fontWeight: 900 }}><LockKeyhole size={13} style={{ verticalAlign: "-3px", marginRight: 4 }} />Deposit & Stake</button></div></div>
          </article>; })}
        </div>
        {visible.length === 0 && <div style={{ padding: 28, marginTop: 12, borderRadius: 14, background: CARD, border: `1px solid ${LINE}`, textAlign: "center", color: DIM, fontSize: 12 }}>No vaults match this category or search.</div>}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16, padding: 12, borderRadius: 12, background: PANEL, border: `1px solid ${LINE}`, color: DIM, fontSize: 10, lineHeight: 1.5 }}><LockKeyhole size={16} color={GREEN} />All vaults display audit status, contract address, network, lockup, and payout cadence before a deposit decision.</div>
      </div>
      {selected && <RwaModal vault={selected} close={() => setSelected(null)} onStake={(amount) => setStakedTotal((value) => value + amount)} />}
    </main>
  );
}
