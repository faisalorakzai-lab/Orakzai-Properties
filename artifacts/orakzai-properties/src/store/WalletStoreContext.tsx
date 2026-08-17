import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getWallet, type Currency } from "@/lib/walletEngine";

export type WalletAccountId = "spot" | "funding" | "realEstate" | "rwaStakingYield" | "yieldDesk";
export type WalletAccount = { id: WalletAccountId; label: string; shortLabel: string };
export type ModuleBalances = Record<Currency, number>;
export type ModuleLedger = Record<WalletAccountId, ModuleBalances>;

export type InternalTransferRecord = {
  id: string;
  from: WalletAccountId;
  to: WalletAccountId;
  asset: Currency;
  amount: number;
  time: string;
  status: "Completed";
};

export const WALLET_ACCOUNTS: WalletAccount[] = [
  { id: "spot", label: "Spot Wallet", shortLabel: "Spot" },
  { id: "funding", label: "Funding / Fiat", shortLabel: "Funding" },
  { id: "realEstate", label: "Real Estate Vaults", shortLabel: "Real Estate" },
  { id: "rwaStakingYield", label: "RWA Staking Yield", shortLabel: "RWA Yield" },
  { id: "yieldDesk", label: "Yield Desk", shortLabel: "Yield Desk" },
];

const KEY = "okzbyte_unified_wallet_v1";
const CURRENCIES: Currency[] = ["PKR", "USDT", "USDC", "OKBOND"];
const emptyBalances = (): ModuleBalances => ({ PKR: 0, USDT: 0, USDC: 0, OKBOND: 0 });

function initialLedger(): ModuleLedger {
  const wallet = typeof window !== "undefined" ? getWallet() : null;
  const spot = emptyBalances();
  spot.PKR = wallet?.balances.PKR ?? 100000;
  spot.USDT = wallet?.balances.USDT ?? 1000001.5;
  spot.USDC = wallet?.balances.USDC ?? 500;
  spot.OKBOND = wallet?.balances.OKBOND ?? 250;
  return {
    spot,
    funding: emptyBalances(),
    realEstate: { ...emptyBalances(), PKR: 14125000 },
    rwaStakingYield: emptyBalances(),
    yieldDesk: emptyBalances(),
  };
}

function readInitial(): { ledger: ModuleLedger; history: InternalTransferRecord[] } {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ledger: parsed.ledger ?? initialLedger(), history: parsed.history ?? [] };
    }
  } catch {}
  return { ledger: initialLedger(), history: [] };
}

const PRICES_PKR: Record<Currency, number> = { PKR: 1, USDT: 278, USDC: 278, OKBOND: 88 };

export type TransferResult = { ok: boolean; error?: string; record?: InternalTransferRecord };

type WalletStoreValue = {
  ledger: ModuleLedger;
  history: InternalTransferRecord[];
  totalValuePKR: number;
  getBalance: (account: WalletAccountId, asset: Currency) => number;
  transfer: (from: WalletAccountId, to: WalletAccountId, asset: Currency, amount: number) => TransferResult;
  credit: (account: WalletAccountId, asset: Currency, amount: number) => void;
  debit: (account: WalletAccountId, asset: Currency, amount: number) => boolean;
  resetWalletState: () => void;
};

const WalletStoreContext = createContext<WalletStoreValue | null>(null);

export function WalletStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(readInitial);
  const { ledger, history } = state;

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const getBalance = useCallback((account: WalletAccountId, asset: Currency) => ledger[account][asset] ?? 0, [ledger]);

  const transfer = useCallback((from: WalletAccountId, to: WalletAccountId, asset: Currency, amount: number): TransferResult => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return { ok: false, error: "Enter a valid transfer amount." };
    if (from === to) return { ok: false, error: "Choose two different accounts." };
    if ((ledger[from][asset] ?? 0) < value) return { ok: false, error: `Insufficient ${asset} balance in ${WALLET_ACCOUNTS.find(a => a.id === from)?.label}.` };
    const record: InternalTransferRecord = { id: `TRF-${Date.now().toString(36).toUpperCase()}`, from, to, asset, amount: value, time: new Date().toISOString(), status: "Completed" };
    setState(prev => ({
      history: [record, ...prev.history].slice(0, 100),
      ledger: {
        ...prev.ledger,
        [from]: { ...prev.ledger[from], [asset]: +(prev.ledger[from][asset] - value).toFixed(6) },
        [to]: { ...prev.ledger[to], [asset]: +(prev.ledger[to][asset] + value).toFixed(6) },
      },
    }));
    return { ok: true, record };
  }, [ledger]);

  const credit = useCallback((account: WalletAccountId, asset: Currency, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    setState(prev => ({ ...prev, ledger: { ...prev.ledger, [account]: { ...prev.ledger[account], [asset]: +(prev.ledger[account][asset] + amount).toFixed(6) } } }));
  }, []);

  const debit = useCallback((account: WalletAccountId, asset: Currency, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0 || ledger[account][asset] < amount) return false;
    setState(prev => ({ ...prev, ledger: { ...prev.ledger, [account]: { ...prev.ledger[account], [asset]: +(prev.ledger[account][asset] - amount).toFixed(6) } } }));
    return true;
  }, [ledger]);

  const resetWalletState = useCallback(() => setState({ ledger: initialLedger(), history: [] }), []);
  const totalValuePKR = useMemo(() => Object.values(ledger).reduce((total, balances) => total + CURRENCIES.reduce((sum, asset) => sum + balances[asset] * PRICES_PKR[asset], 0), 0), [ledger]);

  return <WalletStoreContext.Provider value={{ ledger, history, totalValuePKR, getBalance, transfer, credit, debit, resetWalletState }}>{children}</WalletStoreContext.Provider>;
}

export function useWalletStore() {
  const value = useContext(WalletStoreContext);
  if (!value) throw new Error("useWalletStore must be used inside <WalletStoreProvider>");
  return value;
}

export function accountIdFromLabel(label: string): WalletAccountId {
  return WALLET_ACCOUNTS.find(a => a.label === label)?.id ?? "spot";
}

export function accountLabel(account: WalletAccountId): string {
  return WALLET_ACCOUNTS.find(a => a.id === account)?.label ?? account;
}

export const WALLET_PKR_RATES = PRICES_PKR;
