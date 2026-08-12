import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Clipboard,
  FileText,
  Grid2X2,
  Info,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

type Screen = "withdraw" | "history";

function IconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full text-[#a4a6b3] transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b56d]"
    >
      {children}
    </button>
  );
}

function Header({
  screen,
  onBack,
  onHistory,
}: {
  screen: Screen;
  onBack: () => void;
  onHistory: () => void;
}) {
  return (
    <header className="flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
      <IconButton label={screen === "history" ? "Back to withdraw" : "Back"} onClick={onBack}>
        <ArrowLeft size={23} strokeWidth={1.8} />
      </IconButton>
      <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#f5f4f2]">
        {screen === "history" ? "Spot History" : "Withdraw"}
      </h1>
      {screen === "withdraw" ? (
        <IconButton label="Open withdrawal history" onClick={onHistory}>
          <FileText size={21} strokeWidth={1.7} />
        </IconButton>
      ) : (
        <IconButton label="Search history">
          <Search size={20} strokeWidth={1.7} />
        </IconButton>
      )}
    </header>
  );
}

function AssetRow() {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-[13px] border border-white/[0.08] bg-[#17181e] px-4 py-[15px] text-left transition-colors hover:bg-[#1c1d24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b56d]"
    >
      <span className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#23a67c] text-[13px] font-bold text-white shadow-[0_0_0_4px_rgba(35,166,124,0.12)]">
          T
        </span>
        <span className="text-[17px] font-semibold text-[#f3f1ed]">USDT</span>
      </span>
      <ChevronRight size={20} className="text-[#858792]" />
    </button>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2.5 text-[14px] font-medium text-[#a6a7b2]">{children}</div>;
}

function WithdrawScreen() {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [remarks, setRemarks] = useState("");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <main className="space-y-5 px-[18px] pb-32 pt-5">
        <AssetRow />

        <section>
          <FieldLabel>Address</FieldLabel>
          <div className="flex h-[58px] items-center rounded-[12px] border border-white/[0.07] bg-[#1b1c22] px-4 transition-colors focus-within:border-[#777986]">
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              aria-label="Withdrawal address"
              placeholder="Please enter the address"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[#e8e6e2] outline-none placeholder:text-[#777983]"
            />
            {address ? (
              <button type="button" aria-label="Clear address" onClick={() => setAddress("")} className="mr-2 text-[#8e909a]">
                <X size={17} />
              </button>
            ) : null}
            <Clipboard size={20} className="text-[#8c8e99]" />
            <span className="mx-3 h-5 w-px bg-white/[0.1]" />
            <Grid2X2 size={20} className="text-[#8c8e99]" />
          </div>
        </section>

        <section>
          <FieldLabel>Network</FieldLabel>
          <button
            type="button"
            onClick={() => setNetwork(network ? "" : "BSC / BNB Smart Chain (BEP20)")}
            aria-label="Select withdrawal network"
            className="flex h-[58px] w-full items-center justify-between rounded-[12px] border border-white/[0.07] bg-[#1b1c22] px-4 text-left transition-colors hover:bg-[#202127] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d8b56d]"
          >
            <span className={network ? "text-[14px] text-[#eceae7]" : "text-[15px] text-[#777983]"}>
              {network || "Please select withdrawal network"}
            </span>
            <ChevronRight size={20} className="shrink-0 text-[#8c8e99]" />
          </button>
        </section>

        <section>
          <FieldLabel>Amount</FieldLabel>
          <div className="flex h-[58px] items-center rounded-[12px] border border-[#777986] bg-[#1b1c22] px-4 transition-colors focus-within:border-[#d8b56d]">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-label="Withdrawal amount"
              placeholder="Please enter the withdrawal quantity"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[#f1efeb] outline-none placeholder:text-[#777983]"
            />
            <button type="button" onClick={() => setAmount("1000001500")} className="mr-3 text-[15px] font-medium text-[#91a9db] hover:text-[#b2c7f2]">
              All
            </button>
            <span className="text-[15px] font-semibold text-[#e9e7e3]">USDT</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[13px]">
            <span className="text-[#8b8d97]">Available</span>
            <span className="font-mono text-[#a5a6b0]">1,000,001,500 USDT</span>
          </div>
        </section>

        <section>
          <FieldLabel>Remarks <span className="font-normal text-[#72747f]">(optional)</span></FieldLabel>
          <input
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            aria-label="Withdrawal remarks"
            placeholder="Please enter withdrawal instructions"
            className="h-[58px] w-full rounded-[12px] border border-white/[0.07] bg-[#1b1c22] px-4 text-[15px] text-[#edeae6] outline-none transition-colors placeholder:text-[#777983] focus:border-[#777986]"
          />
        </section>

        <section className="pt-1">
          <FieldLabel>Withdrawal Notification</FieldLabel>
          <div className="rounded-[12px] border border-white/[0.06] bg-[#15161b] px-3.5 py-3 text-[12px] leading-[1.65] text-[#9698a2]">
            <p><span className="text-[#d8d9df]">1.</span> Minimum withdrawal amount: <b className="font-medium text-[#e7e5e1]">0.2 USDT</b>.</p>
            <p><span className="text-[#d8d9df]">2.</span> Withdrawals to MEXC users are credited quickly.</p>
            <p><span className="text-[#d8d9df]">3.</span> Double-check the address and network before sending.</p>
            <button type="button" className="mt-1 text-[#9fb4e5] underline underline-offset-2">Learn More</button>
          </div>
        </section>
      </main>

      <aside className="fixed bottom-0 z-10 w-full max-w-[390px] border-t border-white/[0.09] bg-[#08090b]/95 px-[18px] pb-5 pt-3 backdrop-blur-xl">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[13px] text-[#a5a6af]">
              Received <Info size={13} className="text-[#737580]" />
            </div>
            <div className="text-[21px] font-semibold tracking-[-0.02em] text-[#f1efeb]">{amount || "0"} <span className="text-[15px]">USDT</span></div>
            <div className="mt-1 text-[12px] text-[#777984]">Network Fee 0 USDT</div>
          </div>
          <button
            type="button"
            disabled
            className="h-[49px] w-[142px] rounded-full bg-[#25242a] text-[15px] font-semibold text-[#686975] shadow-inner shadow-white/[0.03]"
          >
            Confirm
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 text-[11px] text-[#62646e]">
          <ShieldCheck size={13} /> Always verify the destination before confirming
        </div>
      </aside>
    </div>
  );
}

function HistoryScreen() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="border-b border-white/[0.07] px-5 pt-4">
        <div className="mb-3 flex gap-6 text-[14px]">
          <span className="text-[#777985]">Spot Statement</span>
          <span className="border-b-2 border-[#eeeae4] pb-3 font-medium text-[#f3f1ed]">Funding History</span>
        </div>
        <div className="flex gap-5 overflow-hidden whitespace-nowrap pb-3 text-[13px]">
          <span className="text-[#777985]">Deposit</span>
          <span className="rounded-md bg-[#303139] px-2.5 py-1 text-[#f3f1ed]">Withdrawal</span>
          <span className="text-[#777985]">Transfer History</span>
          <span className="text-[#777985]">Send</span>
          <span className="text-[#777985]">Others</span>
          <span className="text-[#d6d3cf]">Filters <ChevronRight className="inline rotate-90" size={13} /></span>
        </div>
      </div>
      <main className="px-[18px] pt-5">
        <p className="mb-7 text-[13px] text-[#898b95]">2026.08.03 - 2026.08.09</p>
        <article className="border-b border-white/[0.1] pb-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-[#f0eeea]">DMAIL</h2>
            <span className="flex items-center gap-1 text-[15px] text-[#b4b5be]">Completed <ChevronRight size={17} /></span>
          </div>
          <dl className="space-y-3 text-[15px]">
            <div className="flex justify-between gap-5"><dt className="text-[#8e909b]">Network</dt><dd className="max-w-[220px] text-right leading-5 text-[#e7e5e2]">BSC<br />BNB Smart Chain (BEP20)</dd></div>
            <div className="flex justify-between"><dt className="text-[#8e909b]">Amount</dt><dd className="text-[#e7e5e2]">10</dd></div>
            <div className="flex justify-between"><dt className="text-[#8e909b]">Fee</dt><dd className="text-[#e7e5e2]">0</dd></div>
            <div className="flex justify-between"><dt className="text-[#8e909b]">Time</dt><dd className="font-mono text-[14px] text-[#e7e5e2]">2026-08-08 15:02:59</dd></div>
          </dl>
        </article>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#394333] bg-[#172019] p-3.5 text-[12px] leading-5 text-[#9faea0]">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#83b08a]" />
          Your withdrawal was processed successfully on BNB Smart Chain.
        </div>
      </main>
    </div>
  );
}

export function WithdrawFlow() {
  const [screen, setScreen] = useState<Screen>("withdraw");

  return (
    <div
      className="min-h-[100dvh] bg-[#050608] p-0 text-[#f2f0ec] sm:flex sm:items-center sm:justify-center sm:p-4"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      <div className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-[#08090b] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:h-[844px] sm:rounded-[24px] sm:border sm:border-white/[0.1]">
        <Header screen={screen} onBack={() => setScreen("withdraw")} onHistory={() => setScreen("history")} />
        <div key={screen} className="flex min-h-0 flex-1 animate-[fadeIn_220ms_ease-out]">
          {screen === "withdraw" ? <WithdrawScreen /> : <HistoryScreen />}
        </div>
        <style>{`@keyframes fadeIn { from { opacity: .35; transform: translateX(${screen === "history" ? "8px" : "-8px"}); } to { opacity: 1; transform: translateX(0); } }`}</style>
      </div>
    </div>
  );
}