const ABP_KEY = (t: string) => `orakzai_abp_${t}`;

interface State { abp: number; ta: number; price: number }
const _state: Record<string, State> = {};

export function initEngine(ticker: string, defaultPrice: number): number {
  if (_state[ticker]) return _state[ticker].price;
  let abp = defaultPrice;
  try { const s = localStorage.getItem(ABP_KEY(ticker)); if (s) abp = parseFloat(s); } catch {}
  _state[ticker] = { abp, ta: 0, price: abp };
  return abp;
}

export function getPrice(ticker: string): number {
  return _state[ticker]?.price ?? 0;
}

export function getABP(ticker: string): number {
  return _state[ticker]?.abp ?? 0;
}

export function getTA(ticker: string): number {
  return _state[ticker]?.ta ?? 0;
}

export function adminSetABP(ticker: string, newABP: number): number {
  if (!_state[ticker]) _state[ticker] = { abp: newABP, ta: 0, price: newABP };
  _state[ticker].abp = newABP;
  _state[ticker].price = newABP * (1 + _state[ticker].ta);
  try { localStorage.setItem(ABP_KEY(ticker), String(newABP)); } catch {}
  window.dispatchEvent(new CustomEvent('adminPriceJump', { detail: { ticker, price: _state[ticker].price } }));
  return _state[ticker].price;
}

export function applyTrade(ticker: string, side: 'BUY' | 'SELL', totalUsdt: number): number {
  if (!_state[ticker]) return 0;
  if (totalUsdt > 100) {
    _state[ticker].ta += side === 'BUY' ? 0.0001 : -0.0001;
  }
  _state[ticker].price = _state[ticker].abp * (1 + _state[ticker].ta);
  return _state[ticker].price;
}

export function tickPrice(ticker: string): number {
  if (!_state[ticker]) return 0;
  const drift = (Math.random() - 0.499) * _state[ticker].abp * 0.0008;
  _state[ticker].price = Math.max(0.0001, _state[ticker].price + drift);
  return _state[ticker].price;
}
