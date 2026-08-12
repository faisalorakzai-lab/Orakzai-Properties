import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Info,
  Search,
  Share2,
} from "lucide-react";
import { useLocation } from "wouter";

const D = {
  bg: "#000000",
  panel: "#15171D",
  panelSoft: "#1E1F24",
  border: "rgba(255,255,255,0.09)",
  fg: "#F5F5F7",
  mid: "#A5A7B0",
  dim: "#858894",
  gold: "#C9A84C",
  blue: "#9AB8FF",
  green: "#10B981",
};

const GUIDE_IMAGES = {
  stepsOneToFour: "/withdraw-guide-steps-1-4.jpg",
  stepsFiveToEight: "/withdraw-guide-steps-5-8.jpg",
  onChainOverview: "/withdraw-guide-on-chain-overview.jpg",
  onChainConfirm: "/withdraw-guide-on-chain-confirm.jpg",
};

function GuideImage({ src, alt }: { src: string; alt: string }) {
  return (
    <figure style={{ margin: "20px 0 26px" }}>
      <div
        style={{
          overflow: "hidden",
          borderRadius: 13,
          border: `1px solid ${D.border}`,
          background: D.panel,
          boxShadow: "0 12px 36px rgba(0,0,0,0.28)",
        }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          style={{ display: "block", width: "100%", height: "auto" }}
        />
      </div>
    </figure>
  );
}

function StepList({
  steps,
}: {
  steps: Array<{ text: string; emphasis?: string[] }>;
}) {
  return (
    <ol
      style={{
        display: "grid",
        gap: 16,
        margin: "18px 0 0",
        padding: 0,
        listStyle: "none",
      }}
    >
      {steps.map((step, index) => (
        <li
          key={step.text}
          style={{
            display: "grid",
            gridTemplateColumns: "26px minmax(0, 1fr)",
            gap: 10,
            alignItems: "start",
            color: D.fg,
            fontSize: 15,
            lineHeight: 1.58,
          }}
        >
          <span style={{ color: D.gold, fontWeight: 800 }}>{index + 1}.</span>
          <span>
            {step.emphasis?.reduce<React.ReactNode[]>((parts, phrase) => {
              const next: React.ReactNode[] = [];
              parts.forEach((part) => {
                if (typeof part !== "string") {
                  next.push(part);
                  return;
                }
                const pieces = part.split(phrase);
                pieces.forEach((piece, pieceIndex) => {
                  if (pieceIndex > 0) next.push(<strong key={`${phrase}-${pieceIndex}`} style={{ color: "#FFFFFF" }}>{phrase}</strong>);
                  if (piece) next.push(piece);
                });
              });
              return next;
            }, [step.text])}
          </span>
        </li>
      ))}
    </ol>
  );
}

const onChainSteps = [
  { text: "Tap Assets / Wallets at the bottom of the App homepage.", emphasis: ["Assets / Wallets"] },
  { text: "Tap Withdraw.", emphasis: ["Withdraw"] },
  { text: "Select the cryptocurrency / token to withdraw." },
  { text: "Choose the withdrawal method: Withdraw Asset (On-Chain).", emphasis: ["Withdraw Asset (On-Chain)"] },
  { text: "Enter the Withdrawal Address, select the Network, and enter the Withdrawal Quantity, then tap Confirm.", emphasis: ["Withdrawal Address", "Network", "Withdrawal Quantity", "Confirm"] },
  { text: "Double-check all transaction details, then tap Confirm Withdrawal.", emphasis: ["Confirm Withdrawal"] },
  { text: "Enter the Email verification code and the 2FA / Authenticator code, then tap Confirm.", emphasis: ["Email verification code", "2FA / Authenticator code", "Confirm"] },
  { text: "The withdrawal request is submitted. Please wait for the blockchain confirmation." },
];

const internalTransferSteps = [
  { text: "Tap Assets → Withdraw.", emphasis: ["Assets", "Withdraw"] },
  { text: "Select the token to transfer." },
  { text: "Choose Send to OkzByte Users (Internal Transfer).", emphasis: ["Send to OkzByte Users (Internal Transfer)"] },
  { text: "Enter the recipient's account information (Email, Mobile Number, or OkzByte UID) and Quantity, then tap Submit.", emphasis: ["Email", "Mobile Number", "OkzByte UID", "Quantity", "Submit"] },
  { text: "Double-check the recipient UID and details, then tap Confirm.", emphasis: ["recipient UID", "Confirm"] },
  { text: "Enter the security verification codes and tap Confirm. Zero-fee transfer completes instantly.", emphasis: ["security verification codes", "Confirm"] },
];

export default function WithdrawalHelp() {
  const [, setLocation] = useLocation();

  const shareGuide = async () => {
    const shareData = {
      title: "How to Withdraw on OkzByte",
      text: "Step-by-step guide for on-chain withdrawals and OkzByte Pay internal transfers.",
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Sharing can be cancelled by the user; no error state is needed.
    }
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        overflowX: "hidden",
        background: D.bg,
        color: D.fg,
        fontFamily: "'Inter', sans-serif",
        paddingBottom: "calc(36px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "calc(env(safe-area-inset-top, 10px) + 13px) 18px 13px",
          background: "rgba(0,0,0,0.94)",
          borderBottom: `1px solid ${D.border}`,
          backdropFilter: "blur(18px)",
        }}
      >
        <button
          type="button"
          aria-label="Back to Withdraw"
          onClick={() => setLocation("/withdraw/on-chain")}
          style={{ display: "grid", placeItems: "center", width: 36, height: 36, border: 0, background: "transparent", color: D.fg, cursor: "pointer", flexShrink: 0 }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-0.2px" }}>
          How to Withdraw on OkzByte
        </h1>
        <button
          type="button"
          aria-label="Share withdrawal guide"
          onClick={shareGuide}
          style={{ display: "grid", placeItems: "center", width: 36, height: 36, border: 0, background: "transparent", color: D.mid, cursor: "pointer", flexShrink: 0 }}
        >
          <Share2 size={21} />
        </button>
      </header>

      <article style={{ width: "min(100% - 36px, 560px)", margin: "0 auto", padding: "22px 0 48px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 26 }}>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: 0, border: 0, background: "transparent", color: D.mid, fontSize: 14, cursor: "pointer" }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>‹</span> Category List
          </button>
          <button
            type="button"
            aria-label="Search help articles"
            style={{ display: "grid", placeItems: "center", width: 34, height: 34, border: 0, borderRadius: 999, background: "transparent", color: D.mid, cursor: "pointer" }}
          >
            <Search size={21} />
          </button>
        </div>

        <div style={{ marginBottom: 34 }}>
          <h2 style={{ margin: 0, color: D.fg, fontSize: "clamp(25px, 7vw, 34px)", lineHeight: 1.16, fontWeight: 850, letterSpacing: "-0.8px" }}>
            How to Withdraw on OkzByte (App)
          </h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 22, color: D.dim, fontSize: 13 }}>
            <time dateTime="2026-08-10T13:15:05">2026-08-10 13:15:05</time>
            <button
              type="button"
              onClick={shareGuide}
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: 0, border: 0, background: "transparent", color: D.blue, fontSize: 14, cursor: "pointer" }}
            >
              <Share2 size={16} /> Share Now
            </button>
          </div>
        </div>

        <section aria-labelledby="on-chain-title" style={{ marginBottom: 42 }}>
          <h3 id="on-chain-title" style={{ margin: "0 0 20px", color: D.fg, fontSize: "clamp(22px, 6vw, 28px)", lineHeight: 1.2, fontWeight: 850 }}>
            1. How to Make an On-Chain Withdrawal
          </h3>
          <p style={{ margin: 0, color: D.mid, fontSize: 14, lineHeight: 1.6 }}>
            Follow these steps to withdraw crypto or tokens from OkzByte to another exchange or wallet.
          </p>
          <StepList steps={onChainSteps.slice(0, 4)} />
          <GuideImage src={GUIDE_IMAGES.stepsOneToFour} alt="OkzByte withdrawal steps one through four" />
          <StepList steps={onChainSteps.slice(4)} />
          <GuideImage src={GUIDE_IMAGES.stepsFiveToEight} alt="OkzByte withdrawal steps five through eight" />
        </section>

        <section aria-labelledby="internal-transfer-title" style={{ marginBottom: 42 }}>
          <h3 id="internal-transfer-title" style={{ margin: "0 0 20px", color: D.fg, fontSize: "clamp(22px, 6vw, 28px)", lineHeight: 1.2, fontWeight: 850 }}>
            2. How to Make an Internal Transfer
          </h3>
          <p style={{ margin: 0, color: D.mid, fontSize: 14, lineHeight: 1.6 }}>
            Send funds instantly to another OkzByte user without a network fee.
          </p>
          <StepList steps={internalTransferSteps} />
          <GuideImage src={GUIDE_IMAGES.stepsOneToFour} alt="OkzByte Assets and withdrawal method selection screens" />
        </section>

        <section aria-labelledby="important-notes-title">
          <h3 id="important-notes-title" style={{ margin: "0 0 20px", color: D.fg, fontSize: "clamp(22px, 6vw, 28px)", lineHeight: 1.2, fontWeight: 850 }}>
            3. Important Notes on Withdrawals
          </h3>
          <div style={{ display: "grid", gap: 12, padding: 18, borderRadius: 16, background: "rgba(201,168,76,0.09)", border: "1px solid rgba(201,168,76,0.32)" }}>
            {[
              "Always ensure the destination network matches the selected withdrawal network (for example, Polygon, BSC, or TRC20).",
              "If the token requires a Memo or Tag, copy it accurately before confirming the withdrawal.",
              "Withdrawal fees vary by token network and are displayed directly on the withdrawal page.",
            ].map((note) => (
              <div key={note} style={{ display: "flex", alignItems: "flex-start", gap: 11, color: "#E6D8A8", fontSize: 14, lineHeight: 1.55 }}>
                <CheckCircle2 size={18} color={D.gold} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{note}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 14, padding: 14, borderRadius: 12, background: "rgba(44,89,190,0.22)", color: "#C7D7FF", fontSize: 12, lineHeight: 1.5 }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Blockchain withdrawals cannot be reversed once confirmed. Check the address, network, amount, and fee before submitting.</span>
          </div>
        </section>
      </article>
    </main>
  );
}