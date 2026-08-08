import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clipboard,
  FileText,
  Search,
  WalletCards,
} from "lucide-react";
import { useLocation } from "wouter";
import { COINS, type Coin } from "./CryptoDepositFlow";
import { useAppStore } from "@/store/AppStoreContext";
import type { WalletState } from "@/lib/walletEngine";

const D = {
  bg: "#000000",
  panel: "#1E1F24",
  panelSoft: "#14161C",
  border: "rgba(255,255,255,0.08)",
  fg: "#F5F5F7",
  mid: "#A5A7B0",
  dim: "#8B8D98",
  gold: "#C9A84C",
  green: "#10B981",
  blue: "#7EA7FF",
};

function formatBalance(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

function formatAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

function getCoinBalance(wallet: WalletState | null, coin: Coin): number {
  if (!wallet) return 0;
  const balance = wallet.balances[coin.symbol as keyof WalletState["balances"]];
  return typeof balance === "number" ? balance : 0;
}

const NETWORKS: Record<string, string[]> = {
  BTC: ["Bitcoin"],
  ETH: ["Ethereum (ERC20)", "Arbitrum One"],
  USDT: ["TRON (TRC20)", "BNB Smart Chain (BEP20)", "Ethereum (ERC20)", "Polygon"],
  USDC: ["BNB Smart Chain (BEP20)", "Ethereum (ERC20)", "Polygon"],
  PKR: ["Bank Transfer"],
  OKBOND: ["OkzByte Network"],
};

function getNetworks(symbol: string): string[] {
  return NETWORKS[symbol] ?? ["OkzByte Network"];
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

function TextField({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label style={{ display: "block", marginBottom: 18 }}>
      <span style={{ display: "block", marginBottom: 9, color: D.mid, fontSize: 14 }}>
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 54,
          padding: "0 14px",
          borderRadius: 9,
          background: D.panel,
          border: `1px solid ${D.border}`,
        }}
      >
        <input
          type={type}
          inputMode={type === "number" ? "decimal" : undefined}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            minWidth: 0,
            border: "none",
            outline: "none",
            background: "transparent",
            color: D.fg,
            fontSize: 15,
          }}
        />
        {label === "Address" && (
          <>
            <Clipboard size={19} color={D.dim} style={{ flexShrink: 0 }} />
            <span style={{ width: 1, height: 22, background: D.border }} />
            <span style={{ color: D.dim, display: "flex" }} aria-label="Scan address">
              <span style={{ fontSize: 20, lineHeight: 1 }}>⌗</span>
            </span>
          </>
        )}
      </div>
    </label>
  );
}

function WithdrawForm({
  coin,
  balance,
  onBack,
  onChangeCoin,
}: {
  coin: Coin;
  balance: number;
  onBack: () => void;
  onChangeCoin: () => void;
}) {
  const networks = getNetworks(coin.symbol);
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const numericAmount = Number(amount);
  const isValid = Boolean(
    address.trim() &&
    network &&
    numericAmount > 0 &&
    numericAmount <= balance,
  );
  const fee = 0;
  const received = Number.isFinite(numericAmount) && numericAmount > 0
    ? Math.max(0, numericAmount - fee)
    : 0;

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: D.bg,
        color: D.fg,
        fontFamily: "'Inter', sans-serif",
        paddingBottom: 118,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top, 10px) + 15px) 18px 14px",
          borderBottom: `1px solid ${D.border}`,
        }}
      >
        <button
          type="button"
          aria-label="Back to coin list"
          onClick={onBack}
          style={{ display: "grid", placeItems: "center", width: 36, height: 36, border: "none", background: "transparent", color: D.fg, cursor: "pointer" }}
        >
          <ArrowLeft size={23} />
        </button>
        <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Withdraw</h1>
        <div style={{ display: "flex", gap: 12, color: D.dim }}>
          <FileText size={20} />
          <AlertCircle size={20} />
        </div>
      </header>

      <section style={{ maxWidth: 560, margin: "0 auto", padding: "16px 18px 0" }}>
        <button
          type="button"
          onClick={onChangeCoin}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 14px",
            border: `1px solid ${D.border}`,
            borderRadius: 9,
            background: D.panelSoft,
            color: D.fg,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <CoinIcon coin={coin} />
          <span style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>{coin.symbol}</span>
          <ChevronRight size={20} color={D.dim} />
        </button>

        <div style={{ marginTop: 28 }}>
          <TextField
            label="Address"
            value={address}
            onChange={setAddress}
            placeholder="Please enter the address"
          />

          <div style={{ marginBottom: 19 }}>
            <span style={{ display: "block", marginBottom: 9, color: D.mid, fontSize: 14 }}>
              Network
            </span>
            <div style={{ position: "relative" }}>
              <select
                aria-label="Withdrawal network"
                value={network}
                onChange={event => setNetwork(event.target.value)}
                style={{
                  appearance: "none",
                  width: "100%",
                  height: 54,
                  padding: "0 42px 0 14px",
                  borderRadius: 9,
                  border: `1px solid ${D.border}`,
                  background: D.panel,
                  color: network ? D.fg : D.dim,
                  outline: "none",
                  fontSize: 15,
                }}
              >
                <option value="" disabled>Please select withdrawal network</option>
                {networks.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
              <ChevronRight
                size={20}
                color={D.dim}
                style={{ position: "absolute", right: 14, top: 17, pointerEvents: "none" }}
              />
            </div>
          </div>

          <label style={{ display: "block", marginBottom: 3 }}>
            <span style={{ display: "block", marginBottom: 9, color: D.mid, fontSize: 14 }}>
              Amount
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 54,
                padding: "0 14px",
                borderRadius: 9,
                border: `1px solid ${D.mid}`,
                background: D.panel,
              }}
            >
              <input
                aria-label="Withdrawal amount"
                type="number"
                min="0"
                max={balance}
                step="any"
                value={amount}
                onChange={event => setAmount(event.target.value)}
                placeholder="Please enter the withdrawal quantity"
                style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: D.fg, fontSize: 15 }}
              />
              <button type="button" onClick={() => setAmount(String(balance))} style={{ border: "none", background: "transparent", color: D.blue, fontSize: 15, cursor: "pointer" }}>
                All
              </button>
              <strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>{coin.symbol}</strong>
            </div>
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22, color: D.dim, fontSize: 13 }}>
            <span>Available</span>
            <span>{formatBalance(balance)} {coin.symbol}</span>
          </div>

          <TextField
            label="Remarks (optional)"
            value={remarks}
            onChange={setRemarks}
            placeholder="Please enter withdrawal instructions"
          />

          <div style={{ marginTop: 26 }}>
            <div style={{ color: D.mid, fontSize: 14, marginBottom: 8 }}>Withdrawal Notification</div>
            <ol style={{ margin: 0, paddingLeft: 18, color: D.dim, fontSize: 12, lineHeight: 1.7 }}>
              <li>Minimum withdrawal amount depends on the selected network.</li>
              <li>Always confirm that the address and network match.</li>
              <li>Withdrawals to OkzByte platform addresses may be credited quickly.</li>
              <li>Do not withdraw to crowdfunding or unsupported contract addresses.</li>
              <li>Do not trade with high-risk assets.</li>
            </ol>
          </div>
        </div>
      </section>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 5,
          padding: "12px 18px calc(16px + env(safe-area-inset-bottom))",
          background: "rgba(0,0,0,0.96)",
          borderTop: `1px solid ${D.border}`,
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "inline-block", marginBottom: 9, padding: "5px 10px", borderRadius: "0 10px 0 0", background: "#113A9A", color: "#BBD0FF", fontSize: 12 }}>
            Lowest Withdrawal Fees Globally
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ color: D.dim, fontSize: 12 }}>Received</div>
              <div style={{ marginTop: 7, fontSize: 20, fontWeight: 800 }}>{formatAmount(received)} {coin.symbol}</div>
              <div style={{ marginTop: 3, color: D.dim, fontSize: 11 }}>Network Fee {formatAmount(fee)} {coin.symbol}</div>
            </div>
            <button
              type="button"
              disabled={!isValid}
              onClick={() => window.alert("Withdrawal request is ready for review.")}
              style={{
                minWidth: 140,
                height: 56,
                border: "none",
                borderRadius: 28,
                background: isValid ? D.gold : "#15151A",
                color: isValid ? "#15100A" : "#5F6068",
                fontSize: 15,
                fontWeight: 800,
                cursor: isValid ? "pointer" : "not-allowed",
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CryptoWithdrawFlow() {
  const [, setLocation] = useLocation();
  const { wallet } = useAppStore();
  const [query, setQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);

  const availableCoins = useMemo(() => {
    const balances = wallet?.balances;
    if (!balances) return [];

    return COINS
      .filter(coin => {
        return getCoinBalance(wallet, coin) > 0;
      })
      .sort((a, b) => {
        return getCoinBalance(wallet, b) - getCoinBalance(wallet, a);
      });
  }, [wallet]);

  const filteredCoins = useMemo(() => {
    const normalizedQuery = query.trim().toUpperCase();
    const sourceCoins = availableOnly ? availableCoins : COINS;
    if (!normalizedQuery) return sourceCoins;
    return sourceCoins.filter(coin =>
      coin.symbol.includes(normalizedQuery) ||
      coin.name.toUpperCase().includes(normalizedQuery),
    );
  }, [availableCoins, availableOnly, query]);

  if (selectedCoin) {
    const balance = wallet?.balances[selectedCoin.symbol as keyof WalletState["balances"]];
    return (
      <WithdrawForm
        coin={selectedCoin}
        balance={typeof balance === "number" ? balance : 0}
        onBack={() => setSelectedCoin(null)}
        onChangeCoin={() => setSelectedCoin(null)}
      />
    );
  }

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
          <button
            type="button"
            aria-label="Show available balance only"
            aria-pressed={availableOnly}
            onClick={() => setAvailableOnly(current => !current)}
            style={{
              width: 19,
              height: 19,
              display: "grid",
              placeItems: "center",
              padding: 0,
              borderRadius: 4,
              border: `1px solid ${availableOnly ? D.green : D.dim}`,
              background: availableOnly ? D.green : "transparent",
              color: availableOnly ? "#001B12" : "transparent",
              cursor: "pointer",
            }}
          >
            <Check size={14} strokeWidth={3} />
          </button>
          <span>Available balance only</span>
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
              {availableOnly && availableCoins.length ? "No coins found" : "No assets found"}
            </div>
            <div style={{ fontSize: 12 }}>
              {availableOnly && availableCoins.length
                ? "Try another coin name or symbol."
                : availableOnly
                  ? "Uncheck available balance only to browse all supported assets."
                  : "Try another coin name or symbol."}
            </div>
          </div>
        ) : (
          <div>
            {filteredCoins.map(coin => {
              const balance = getCoinBalance(wallet, coin);
              return (
                <button
                  key={coin.symbol}
                  type="button"
                  onClick={() => setSelectedCoin(coin)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 2px",
                    border: "none",
                    borderBottom: `1px solid ${D.border}`,
                    background: balance > 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    color: D.fg,
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: 0,
                    opacity: balance > 0 ? 1 : 0.72,
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
                      {balance > 0 ? `Available ${coin.symbol}` : `Zero balance ${coin.symbol}`}
                    </span>
                  </span>
                  <ChevronRight size={17} color={D.dim} style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}