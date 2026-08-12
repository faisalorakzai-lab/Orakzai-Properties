/**
 * priceEngine.ts
 * Internal AMM price engine for property tokens.
 *
 * AMM Formula: New Price = Current Price * (1 + (Net Trade Amount / 100) * 0.01)
 *   - Every $100 USD of BUY  volume → +1.0% price
 *   - Every $100 USD of SELL volume → -1.0% price
 */

const ABP_KEY = (t: string) => `orakzai_abp_${t}`;

interface State {
  abp:   number;   // Admin Base Price (admin-set anchor)
  netImpact: number; // cumulative net impact factor (dimensionless)
  price: number;   // current live price
}

const _state: Record<string, State> = {};

/* ─────────────────────────────────────────────
   Initialization
───────────────────────────────────────────── */
export function initEngine(ticker: string, defaultPrice: number): number {
  if (_state[ticker]) return _state[ticker].price;
  let abp = defaultPrice;
  try {
    const s = localStorage.getItem(ABP_KEY(ticker));
    if (s) abp = parseFloat(s);
  } catch {}
  _state[ticker] = { abp, netImpact: 0, price: abp };
  return abp;
}

export function getPrice(ticker: string): number {
  return _state[ticker]?.price ?? 0;
}

export function getABP(ticker: string): number {
  return _state[ticker]?.abp ?? 0;
}

export function getNetImpact(ticker: string): number {
  return _state[ticker]?.netImpact ?? 0;
}

/* ─────────────────────────────────────────────
   Admin override — sets base price directly
───────────────────────────────────────────── */
export function adminSetABP(ticker: string, newABP: number): number {
  if (!_state[ticker]) _state[ticker] = { abp: newABP, netImpact: 0, price: newABP };
  _state[ticker].abp = newABP;
  _state[ticker].price = newABP * (1 + _state[ticker].netImpact);
  try { localStorage.setItem(ABP_KEY(ticker), String(newABP)); } catch {}
  window.dispatchEvent(new CustomEvent("adminPriceJump", { detail: { ticker, price: _state[ticker].price } }));
  return _state[ticker].price;
}

/* ─────────────────────────────────────────────
   Trade execution — AMM formula
   New Price = Current Price * (1 + (netUsd / 100) * 0.01)
───────────────────────────────────────────── */
export function applyTrade(ticker: string, side: "BUY" | "SELL", totalUsdt: number): number {
  if (!_state[ticker]) return 0;

  /* Only apply price impact for trades above $100 */
  if (totalUsdt >= 100) {
    /* Impact = (net USD / 100) * 1% per $100 */
    const sign      = side === "BUY" ? 1 : -1;
    const pctChange = (totalUsdt / 100) * 0.01 * sign;
    _state[ticker].price = Math.max(
      0.000001,
      _state[ticker].price * (1 + pctChange),
    );
    /* Track cumulative impact relative to ABP for reference */
    _state[ticker].netImpact = (_state[ticker].price / _state[ticker].abp) - 1;
  }

  return _state[ticker].price;
}

/* ─────────────────────────────────────────────
   Micro-tick — tiny random drift between trades
   (simulates market noise; does NOT modify ABP)
───────────────────────────────────────────── */
export function tickPrice(ticker: string): number {
  if (!_state[ticker]) return 0;
  const drift = (Math.random() - 0.499) * _state[ticker].abp * 0.0006;
  _state[ticker].price = Math.max(0.0001, _state[ticker].price + drift);
  return _state[ticker].price;
}

/* ─────────────────────────────────────────────
   Legacy alias kept for back-compat
───────────────────────────────────────────── */
export function getTA(ticker: string): number {
  return _state[ticker]?.netImpact ?? 0;
}
