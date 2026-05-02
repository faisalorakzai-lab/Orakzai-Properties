import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, Show } from "@clerk/react";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
  Shield, Download, X, ChevronRight, Lock,
  RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff,
  Loader2, Wifi, WifiOff, KeyRound, Copy, Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = basePath;

type WalletData = {
  id: string;
  balance: string;
  currency: string;
  isPinSet: boolean;
};

type Txn = {
  id: string;
  txnId: string;
  userId: string;
  counterpartyId: string | null;
  amount: string;
  type: string;
  status: string;
  note: string | null;
  balanceAfter: string | null;
  createdAt: string;
};

const TXN_META: Record<string, { label: string; icon: string; credit: boolean }> = {
  deposit:            { label: "Deposit",         icon: "↓", credit: true  },
  withdrawal:         { label: "Withdrawal",       icon: "↑", credit: false },
  transfer_in:        { label: "Received",         icon: "↓", credit: true  },
  transfer_out:       { label: "Sent",             icon: "↑", credit: false },
  investment:         { label: "Investment",       icon: "↑", credit: false },
  investment_return:  { label: "Return",           icon: "↓", credit: true  },
  trade_fee:          { label: "Trading Fee",      icon: "↑", credit: false },
};

function formatPKR(n: number) {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `${(n / 100_000).toFixed(2)} L`;
  return n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function useAnimatedBalance(target: number) {
  const [displayed, setDisplayed] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const start = prev.current;
    const end = target;
    if (start === end) return;
    prev.current = end;
    const duration = 1400;
    const t0 = Date.now();
    let raf: number;
    const tick = () => {
      const p = Math.min((Date.now() - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplayed(start + (end - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return displayed;
}

function PinPad({ value, onChange, maxLen = 4 }: { value: string; onChange: (v: string) => void; maxLen?: number }) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-3 mb-2">
        {Array.from({ length: maxLen }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${i < value.length ? "bg-[#C9A84C] border-[#C9A84C]" : "border-[#2a4060] bg-transparent"}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
        {keys.map((k, i) => (
          <button
            key={i}
            type="button"
            disabled={!k}
            onClick={() => {
              if (k === "⌫") onChange(value.slice(0, -1));
              else if (value.length < maxLen) onChange(value + k);
            }}
            className={`h-12 rounded-xl text-lg font-semibold transition-all ${k ? "bg-[#0f2040] border border-[#1e3a5f] text-white hover:bg-[#1e3a5f] hover:border-[#C9A84C]/40 active:scale-95" : "opacity-0 pointer-events-none"}`}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-md rounded-2xl border border-[#1e3a5f] overflow-hidden"
            style={{ background: "linear-gradient(160deg, #0a1628 0%, #0f1e35 100%)" }}
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]">
              <h3 className="text-[#e2e8f0] font-semibold text-sm">{title}</h3>
              <button onClick={onClose} className="text-[#4a6080] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DepositModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: (txn: Txn, newBalance: string) => void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const bankDetails = [
    { label: "Bank", value: "Meezan Bank" },
    { label: "Account Title", value: "Orakzai Properties (Pvt) Ltd" },
    { label: "Account No.", value: "0343-0101234567-03" },
    { label: "IBAN", value: "PK36MEZN0000000343101234567" },
  ];

  const copy = (v: string, k: string) => {
    navigator.clipboard.writeText(v);
    setCopied(k);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleDeposit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/wallet/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: parseFloat(amount), note: note || "Bank Transfer Deposit" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("done");
      onSuccess(data.txn, data.newBalance);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep("form"); setAmount(""); setNote(""); setError(""); };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Deposit Funds">
      {step === "form" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#1e3a5f] overflow-hidden">
            <div className="px-3 py-2 bg-[#0a1628] border-b border-[#1e3a5f]">
              <p className="text-[10px] text-[#4a6080] uppercase tracking-widest">Bank Transfer Details</p>
            </div>
            <div className="divide-y divide-[#0f2040]">
              {bankDetails.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-[10px] text-[#4a6080]">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[#e2e8f0] font-mono">{value}</span>
                    <button onClick={() => copy(value, label)} className="text-[#4a6080] hover:text-[#C9A84C] transition-colors">
                      {copied === label ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#4a6080] uppercase tracking-widest block mb-1.5">Amount (PKR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500000"
              className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 placeholder-[#2a4060]"
            />
          </div>
          <div>
            <label className="text-[10px] text-[#4a6080] uppercase tracking-widest block mb-1.5">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Transfer reference..."
              className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 placeholder-[#2a4060]"
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={() => { if (!amount || parseFloat(amount) <= 0) { setError("Enter a valid amount"); return; } setStep("confirm"); setError(""); }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        </div>
      )}
      {step === "confirm" && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <p className="text-[#4a6080] text-xs mb-1">You are depositing</p>
            <p className="text-4xl font-bold text-[#C9A84C]">PKR {parseFloat(amount).toLocaleString("en-PK")}</p>
          </div>
          <div className="rounded-xl bg-[#0a1628] border border-[#1e3a5f] px-4 py-3 space-y-2">
            <div className="flex justify-between text-xs"><span className="text-[#4a6080]">Method</span><span className="text-white">Bank Transfer</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#4a6080]">Note</span><span className="text-white">{note || "Bank Transfer Deposit"}</span></div>
            <div className="flex justify-between text-xs"><span className="text-[#4a6080]">Fee</span><span className="text-green-400">Free</span></div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setStep("form")} className="flex-1 py-2.5 rounded-xl border border-[#1e3a5f] text-[#6a7f99] text-sm hover:border-[#C9A84C]/30 transition-colors">Back</button>
            <button onClick={handleDeposit} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Deposit"}
            </button>
          </div>
        </div>
      )}
      {step === "done" && (
        <div className="text-center py-6 space-y-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}>
            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
          </motion.div>
          <p className="text-white font-semibold">Deposit Successful</p>
          <p className="text-[#4a6080] text-xs">PKR {parseFloat(amount).toLocaleString("en-PK")} added to your wallet</p>
          <button onClick={() => { onClose(); reset(); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] font-bold text-sm hover:opacity-90 mt-2">Done</button>
        </div>
      )}
    </Modal>
  );
}

function WithdrawModal({ open, onClose, isPinSet, balance, onSuccess, onNeedPin }: { open: boolean; onClose: () => void; isPinSet: boolean; balance: number; onSuccess: (txn: Txn, newBalance: string) => void; onNeedPin: () => void }) {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"form" | "pin" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleWithdraw = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/wallet/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: parseFloat(amount), bankName, accountNumber, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("done");
      onSuccess(data.txn, data.newBalance);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep("form"); setAmount(""); setBankName(""); setAccountNumber(""); setPin(""); setError(""); };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Withdraw Funds">
      {step === "form" && (
        <div className="space-y-4">
          {!isPinSet && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-amber-400 text-xs font-medium">PIN Required</p>
                <p className="text-amber-400/70 text-xs mt-0.5">Set a wallet PIN before making withdrawals.</p>
                <button onClick={() => { onClose(); onNeedPin(); }} className="text-amber-400 text-xs underline mt-1">Set PIN now</button>
              </div>
            </div>
          )}
          <div>
            <label className="text-[10px] text-[#4a6080] uppercase tracking-widest block mb-1.5">Amount (PKR)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 placeholder-[#2a4060]" />
            <p className="text-[10px] text-[#2a4060] mt-1">Available: PKR {formatPKR(balance)}</p>
          </div>
          <div>
            <label className="text-[10px] text-[#4a6080] uppercase tracking-widest block mb-1.5">Bank Name</label>
            <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HBL, Meezan, UBL" className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 placeholder-[#2a4060]" />
          </div>
          <div>
            <label className="text-[10px] text-[#4a6080] uppercase tracking-widest block mb-1.5">Account Number / IBAN</label>
            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="PK36MEZN000..." className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 placeholder-[#2a4060]" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={() => {
              if (!amount || parseFloat(amount) <= 0) return setError("Enter a valid amount");
              if (parseFloat(amount) > balance) return setError("Insufficient balance");
              if (!bankName || !accountNumber) return setError("Enter bank details");
              if (!isPinSet) return;
              setError("");
              setStep("pin");
            }}
            disabled={!isPinSet}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Continue to PIN Verification
          </button>
        </div>
      )}
      {step === "pin" && (
        <div className="space-y-5">
          <div className="text-center">
            <Shield className="w-8 h-8 text-[#C9A84C] mx-auto mb-2" />
            <p className="text-white text-sm font-medium">Enter Your Wallet PIN</p>
            <p className="text-[#4a6080] text-xs mt-1">Authorise withdrawal of PKR {parseFloat(amount).toLocaleString("en-PK")}</p>
          </div>
          <PinPad value={pin} onChange={setPin} />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setStep("form"); setPin(""); setError(""); }} className="flex-1 py-2.5 rounded-xl border border-[#1e3a5f] text-[#6a7f99] text-sm">Back</button>
            <button onClick={handleWithdraw} disabled={loading || pin.length < 4} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Withdraw"}
            </button>
          </div>
        </div>
      )}
      {step === "done" && (
        <div className="text-center py-6 space-y-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}>
            <CheckCircle2 className="w-14 h-14 text-amber-400 mx-auto" />
          </motion.div>
          <p className="text-white font-semibold">Withdrawal Requested</p>
          <p className="text-[#4a6080] text-xs">Your request is being processed. Funds will arrive within 1–2 business days.</p>
          <button onClick={() => { onClose(); reset(); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] font-bold text-sm mt-2">Done</button>
        </div>
      )}
    </Modal>
  );
}

function TransferModal({ open, onClose, isPinSet, balance, onSuccess, onNeedPin }: { open: boolean; onClose: () => void; isPinSet: boolean; balance: number; onSuccess: (txn: Txn, newBalance: string) => void; onNeedPin: () => void }) {
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"form" | "pin" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const needsPin = parseFloat(amount) >= 50_000;

  const handleTransfer = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/wallet/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipientUserId: recipientId.trim(), amount: parseFloat(amount), note, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("done");
      onSuccess(data.txn, data.newBalance);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep("form"); setRecipientId(""); setAmount(""); setNote(""); setPin(""); setError(""); };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Send Funds">
      {step === "form" && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-[#4a6080] uppercase tracking-widest block mb-1.5">Recipient Orakzai User ID</label>
            <input type="text" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} placeholder="user_2abc..." className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#C9A84C]/50 placeholder-[#2a4060]" />
            <p className="text-[10px] text-[#2a4060] mt-1">Ask recipient for their Orakzai User ID from Profile settings</p>
          </div>
          <div>
            <label className="text-[10px] text-[#4a6080] uppercase tracking-widest block mb-1.5">Amount (PKR)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 placeholder-[#2a4060]" />
            {parseFloat(amount) >= 50_000 && (
              <p className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> PIN required for transfers ≥ PKR 50,000</p>
            )}
          </div>
          <div>
            <label className="text-[10px] text-[#4a6080] uppercase tracking-widest block mb-1.5">Note (optional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Payment for..." className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50 placeholder-[#2a4060]" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={() => {
              if (!recipientId.trim()) return setError("Enter recipient User ID");
              if (!amount || parseFloat(amount) <= 0) return setError("Enter a valid amount");
              if (parseFloat(amount) > balance) return setError("Insufficient balance");
              if (needsPin && !isPinSet) { onClose(); onNeedPin(); return; }
              setError("");
              if (needsPin) setStep("pin");
              else handleTransfer();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] font-bold text-sm hover:opacity-90 transition-opacity"
          >
            {needsPin ? "Continue to PIN" : "Send Funds"}
          </button>
        </div>
      )}
      {step === "pin" && (
        <div className="space-y-5">
          <div className="text-center">
            <Shield className="w-8 h-8 text-[#C9A84C] mx-auto mb-2" />
            <p className="text-white text-sm font-medium">Verify Identity</p>
            <p className="text-[#4a6080] text-xs mt-1">Authorise transfer of PKR {parseFloat(amount).toLocaleString("en-PK")}</p>
          </div>
          <PinPad value={pin} onChange={setPin} />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setStep("form"); setPin(""); setError(""); }} className="flex-1 py-2.5 rounded-xl border border-[#1e3a5f] text-[#6a7f99] text-sm">Back</button>
            <button onClick={handleTransfer} disabled={loading || pin.length < 4} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Transfer"}
            </button>
          </div>
        </div>
      )}
      {step === "done" && (
        <div className="text-center py-6 space-y-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}>
            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
          </motion.div>
          <p className="text-white font-semibold">Transfer Complete</p>
          <p className="text-[#4a6080] text-xs">PKR {parseFloat(amount).toLocaleString("en-PK")} sent successfully.</p>
          <button onClick={() => { onClose(); reset(); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] font-bold text-sm mt-2">Done</button>
        </div>
      )}
    </Modal>
  );
}

function SetPinModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"set" | "confirm" | "done">("set");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSet = async () => {
    if (pin !== confirm) return setError("PINs do not match");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/wallet/set-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("done");
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setStep("set"); setPin(""); setConfirm(""); setError(""); };

  return (
    <Modal open={open} onClose={() => { onClose(); reset(); }} title="Set Wallet PIN">
      {step === "set" && (
        <div className="space-y-5">
          <div className="text-center">
            <KeyRound className="w-8 h-8 text-[#C9A84C] mx-auto mb-2" />
            <p className="text-[#4a6080] text-xs">Choose a 4-digit PIN to secure withdrawals and large transfers</p>
          </div>
          <PinPad value={pin} onChange={setPin} />
          <button onClick={() => { if (pin.length < 4) return; setStep("confirm"); }} disabled={pin.length < 4} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] font-bold text-sm disabled:opacity-40">
            Next — Confirm PIN
          </button>
        </div>
      )}
      {step === "confirm" && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-white text-sm font-medium">Confirm Your PIN</p>
            <p className="text-[#4a6080] text-xs mt-1">Enter your PIN again to confirm</p>
          </div>
          <PinPad value={confirm} onChange={setConfirm} />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setStep("set"); setConfirm(""); setError(""); }} className="flex-1 py-2.5 rounded-xl border border-[#1e3a5f] text-[#6a7f99] text-sm">Back</button>
            <button onClick={handleSet} disabled={loading || confirm.length < 4} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set PIN"}
            </button>
          </div>
        </div>
      )}
      {step === "done" && (
        <div className="text-center py-6 space-y-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}>
            <Shield className="w-14 h-14 text-[#C9A84C] mx-auto" />
          </motion.div>
          <p className="text-white font-semibold">PIN Set Successfully</p>
          <p className="text-[#4a6080] text-xs">Your wallet is now secured with a PIN.</p>
          <button onClick={() => { onClose(); reset(); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] font-bold text-sm mt-2">Done</button>
        </div>
      )}
    </Modal>
  );
}

export default function WalletPage() {
  const { user, isSignedIn } = useUser();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState<"" | "deposit" | "withdraw" | "transfer" | "pin">("");
  const [sseConnected, setSseConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const balance = parseFloat(wallet?.balance ?? "0");
  const animatedBalance = useAnimatedBalance(balance);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/wallet/me`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setWallet(data);
    } catch {}
  }, []);

  const fetchTxns = useCallback(async (type = "all") => {
    try {
      const q = type !== "all" ? `?type=${type}` : "";
      const res = await fetch(`${API}/api/wallet/transactions${q}`, { credentials: "include" });
      if (!res.ok) return;
      setTxns(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (!isSignedIn) { setLoading(false); return; }
    Promise.all([fetchWallet(), fetchTxns()]).finally(() => setLoading(false));
  }, [isSignedIn, fetchWallet, fetchTxns]);

  useEffect(() => {
    if (!isSignedIn) return;
    const es = new EventSource(`${API}/api/wallet/stream`, { withCredentials: true });
    esRef.current = es;
    es.addEventListener("connected", () => setSseConnected(true));
    es.addEventListener("balance_update", (e) => {
      const d = JSON.parse(e.data);
      setWallet((w) => w ? { ...w, balance: d.balance } : w);
      if (d.txn) setTxns((prev) => [d.txn, ...prev]);
    });
    es.onerror = () => setSseConnected(false);
    return () => { es.close(); setSseConnected(false); };
  }, [isSignedIn]);

  const onTxnSuccess = (txn: Txn, newBalance: string) => {
    setWallet((w) => w ? { ...w, balance: newBalance } : w);
    setTxns((prev) => [txn, ...prev]);
  };

  const downloadReceipt = (txnId: string) => {
    window.open(`${API}/api/wallet/receipt/${txnId}`, "_blank");
  };

  const filteredTxns = filter === "all" ? txns : txns.filter((t) => {
    if (filter === "deposits") return t.type === "deposit";
    if (filter === "withdrawals") return t.type === "withdrawal";
    if (filter === "transfers") return t.type.startsWith("transfer");
    if (filter === "investments") return t.type === "investment" || t.type === "investment_return";
    return true;
  });

  const totalIn = txns.filter((t) => TXN_META[t.type]?.credit).reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalOut = txns.filter((t) => !TXN_META[t.type]?.credit).reduce((s, t) => s + parseFloat(t.amount), 0);

  if (!isSignedIn && !loading) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#050d1a 0%,#07111e 40%,#060e1a 100%)" }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
          <Wallet className="w-12 h-12 text-[#C9A84C]" />
          <h2 className="text-xl font-serif text-white">Sign in to access your Wallet</h2>
          <Link href="/sign-in">
            <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A84C] to-[#e8c060] text-[#0a1220] font-bold text-sm">Sign In</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg,#050d1a 0%,#07111e 40%,#060e1a 100%)" }}>
      <Navbar />
      <div className="pt-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* ── Balance Card ── */}
          <motion.div
            className="relative rounded-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #0a1628 0%, #0f2040 35%, #1a2a10 60%, #0a1a0a 100%)",
              }}
            />
            <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse 70% 60% at 20% 50%, #C9A84C18 0%, transparent 60%), radial-gradient(circle at 80% 20%, #C9A84C0a 0%, transparent 50%)" }} />
            <div className="absolute inset-0 border border-[#C9A84C]/25 rounded-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />

            <div className="relative px-6 py-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[10px] text-[#C9A84C]/60 uppercase tracking-[.2em] font-medium mb-1">Total Balance</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[#C9A84C]/60 text-sm font-light">PKR</span>
                      <span className="text-5xl font-bold text-white tabular-nums tracking-tight" style={{ textShadow: "0 0 40px #C9A84C44" }}>
                        {formatPKR(animatedBalance)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#4a6080] mt-1">{animatedBalance.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border ${sseConnected ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" : "text-[#4a6080] border-[#2a4060]/30 bg-[#0a1628]/50"}`}>
                    {sseConnected ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                    {sseConnected ? "Live" : "Offline"}
                  </div>
                  {wallet && !wallet.isPinSet && (
                    <button onClick={() => setModal("pin")} className="flex items-center gap-1 text-[10px] text-amber-400/80 hover:text-amber-400 transition-colors">
                      <Lock className="w-2.5 h-2.5" /> Set PIN
                    </button>
                  )}
                  {wallet?.isPinSet && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400/60">
                      <Shield className="w-2.5 h-2.5" /> PIN Protected
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Total In", value: formatPKR(totalIn), color: "text-emerald-400" },
                  { label: "Total Out", value: formatPKR(totalOut), color: "text-red-400" },
                  { label: "Transactions", value: txns.length.toString(), color: "text-[#C9A84C]" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 px-3 py-2.5 text-center">
                    <p className="text-[9px] text-[#4a6080] uppercase tracking-widest mb-1">{label}</p>
                    <p className={`text-sm font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "deposit", label: "Deposit", icon: ArrowDownLeft, color: "from-emerald-500/20 to-emerald-600/10 hover:from-emerald-500/30 border-emerald-500/30 text-emerald-400" },
                  { key: "withdraw", label: "Withdraw", icon: ArrowUpRight, color: "from-red-500/20 to-red-600/10 hover:from-red-500/30 border-red-500/30 text-red-400" },
                  { key: "transfer", label: "Transfer", icon: ArrowLeftRight, color: "from-[#C9A84C]/20 to-[#C9A84C]/10 hover:from-[#C9A84C]/30 border-[#C9A84C]/30 text-[#C9A84C]" },
                ].map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => setModal(key as any)}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl bg-gradient-to-b border backdrop-blur-sm transition-all duration-200 active:scale-95 ${color}`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Transaction History ── */}
          <motion.div
            className="rounded-2xl border border-[#1e3a5f] overflow-hidden"
            style={{ background: "linear-gradient(160deg,#08111f 0%,#0a1528 100%)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]/60">
              <h3 className="text-[#e2e8f0] font-semibold text-sm">Transaction History</h3>
              <button onClick={() => { fetchWallet(); fetchTxns(filter); }} className="text-[#4a6080] hover:text-[#C9A84C] transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-1 px-4 py-3 border-b border-[#1e3a5f]/40 overflow-x-auto">
              {["all", "deposits", "withdrawals", "transfers", "investments"].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); fetchTxns(f === "all" ? "all" : f.slice(0, -1)); }}
                  className={`px-3 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all capitalize ${filter === f ? "bg-[#C9A84C] text-[#0a1220]" : "text-[#4a6080] hover:text-white hover:bg-[#1e3a5f]/40"}`}
                >
                  {f}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" />
              </div>
            ) : filteredTxns.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-10 h-10 text-[#1e3a5f] mx-auto mb-3" />
                <p className="text-[#4a6080] text-sm">No transactions yet</p>
                <p className="text-[#2a4060] text-xs mt-1">Deposit funds to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-[#0f2040]">
                {filteredTxns.map((txn, i) => {
                  const meta = TXN_META[txn.type] ?? { label: txn.type, icon: "·", credit: true };
                  const isCredit = meta.credit;
                  return (
                    <motion.div
                      key={txn.id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                        <span className={`text-xs font-bold ${isCredit ? "text-emerald-400" : "text-red-400"}`}>{meta.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-[#e2e8f0]">{meta.label}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${txn.status === "success" ? "bg-emerald-500/15 text-emerald-400" : txn.status === "pending" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"}`}>
                            {txn.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#4a6080] truncate mt-0.5">{txn.note || txn.txnId}</p>
                        <p className="text-[9px] text-[#2a4060] mt-0.5">{new Date(txn.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <p className={`text-sm font-bold tabular-nums ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
                          {isCredit ? "+" : "−"} {parseFloat(txn.amount).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        {txn.status === "success" && (
                          <button
                            onClick={() => downloadReceipt(txn.txnId)}
                            className="flex items-center gap-1 text-[9px] text-[#4a6080] hover:text-[#C9A84C] transition-colors"
                          >
                            <Download className="w-2.5 h-2.5" /> Receipt
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* ── Security Info ── */}
          <motion.div
            className="rounded-2xl border border-[#1e3a5f]/60 px-5 py-4 flex items-start gap-3"
            style={{ background: "linear-gradient(135deg,#08111f,#0a1528)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Shield className="w-5 h-5 text-[#C9A84C] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[#e2e8f0] text-xs font-semibold mb-0.5">Bank-Grade Security</p>
              <p className="text-[#4a6080] text-[10px] leading-relaxed">All transactions are encrypted and immutably logged. PIN verification is required for withdrawals and transfers above PKR 50,000. Real-time SSE keeps your balance instantly updated without page reload.</p>
            </div>
            {!wallet?.isPinSet && (
              <button onClick={() => setModal("pin")} className="flex-shrink-0 flex items-center gap-1 text-[10px] text-[#C9A84C] border border-[#C9A84C]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#C9A84C]/10 transition-colors whitespace-nowrap">
                <KeyRound className="w-3 h-3" /> Set PIN
              </button>
            )}
          </motion.div>
        </div>
      </div>

      <DepositModal open={modal === "deposit"} onClose={() => setModal("")} onSuccess={onTxnSuccess} />
      <WithdrawModal open={modal === "withdraw"} onClose={() => setModal("")} isPinSet={wallet?.isPinSet ?? false} balance={balance} onSuccess={onTxnSuccess} onNeedPin={() => setModal("pin")} />
      <TransferModal open={modal === "transfer"} onClose={() => setModal("")} isPinSet={wallet?.isPinSet ?? false} balance={balance} onSuccess={onTxnSuccess} onNeedPin={() => setModal("pin")} />
      <SetPinModal open={modal === "pin"} onClose={() => setModal("")} onSuccess={() => { setWallet((w) => w ? { ...w, isPinSet: true } : w); }} />
    </div>
  );
}
