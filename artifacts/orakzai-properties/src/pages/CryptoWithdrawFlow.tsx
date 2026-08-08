import { useMemo, useState } from "react";
import { ArrowLeft, Check, Search, WalletCards } from "lucide-react";
import { useLocation } from "wouter";
import { COINS, type Coin } from "./CryptoDepositFlow";
import { useAppStore } from "@/store/AppStoreContext";
import type { WalletState } from "@/lib/walletEngine";

const D = {
  bg: "#000000",
  panel: "#1E1F24",
  border: "rgba(255,255,255,0.08)",
  fg: "#F5F5F7",
  dim: "#8B8D98",
  gold: "#C9A84C",
  green: "#10B981",
};

function formatBalance(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
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

export default function CryptoWithdrawFlow() {
  const [, setLocation] = useLocation();
  const { wallet } = useAppStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const availableCoins = useMemo(() => {
    const balances = wallet?.balances;
    if (!balances) return [];

    return COINS
      .filter(coin => {
        const balance = balances[coin.symbol as keyof typeof balances];
        return typeof balance === "number" && balance > 0;
      })
      .sort((a, b) => {
        const aBalance = balances[a.symbol as keyof typeof balances] as number;
        const bBalance = balances[b.symbol as keyof typeof balances] as number;
        return bBalance - aBalance;
      });
  }, [wallet]);

  const filteredCoins = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();
    if (!normalizedQuery) return availableCoins;
    return availableCoins.filter(coin =>
      coin.symbol.includes(normalizedQuery) ||
      coin.name.toUpperCase().includes(normalizedQuery),
    );
  }, [availableCoins, query]);

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
          <Check size={15} color={D.green} />
          Available balance only
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
              {availableCoins.length ? "No coins found" : "No assets available to withdraw"}
            </div>
            <div style={{ fontSize: 12 }}>
              {availableCoins.length
                ? "Try another coin name or symbol."
                : "Only coins with a balance greater than zero appear here."}
            </div>
          </div>
        ) : (
          <div>
            {filteredCoins.map(coin => {
              const balance = wallet!.balances[coin.symbol as keyof WalletState["balances"]] as number;
              const isSelected = selected === coin.symbol;

              return (
                <button
                  key={coin.symbol}
                  type="button"
                  onClick={() => setSelected(coin.symbol)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 2px",
                    border: "none",
                    borderBottom: `1px solid ${D.border}`,
                    background: isSelected ? "rgba(201,168,76,0.08)" : "transparent",
                    color: D.fg,
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: isSelected ? 10 : 0,
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
                      Available {coin.symbol}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selected && (
          <div
            role="status"
            style={{
              marginTop: 18,
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(201,168,76,0.1)",
              border: `1px solid rgba(201,168,76,0.3)`,
              color: D.gold,
              fontSize: 13,
            }}
          >
            {selected} selected for withdrawal.
          </div>
        )}
      </section>
    </main>
  );
}