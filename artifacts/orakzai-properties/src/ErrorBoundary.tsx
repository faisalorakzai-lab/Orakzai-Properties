import { Component, type ReactNode, type ErrorInfo } from "react";

  const GOLD = "#C9A84C";

  interface Props { children: ReactNode; }
  interface State { error: Error | null; }

  export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
      return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }

    render() {
      if (!this.state.error) return this.props.children;
      return (
        <div style={{
          minHeight: "100dvh", background: "#040b14",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: "rgba(201,168,76,0.08)",
            border: "1.5px solid rgba(201,168,76,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={1.8} strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1 style={{ color: "#EEF2FF", fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#4a6080", fontSize: 14, textAlign: "center", maxWidth: 320, marginBottom: 32, lineHeight: 1.6 }}>
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = "/"; }}
            style={{
              padding: "12px 28px", borderRadius: 14,
              background: "linear-gradient(135deg,#C9A84C,#b8943e)",
              border: "none", color: "#040b14",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
            Return Home
          </button>
        </div>
      );
    }
  }
  