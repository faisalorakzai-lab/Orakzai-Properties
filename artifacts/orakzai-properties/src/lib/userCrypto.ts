/**
 * Deterministic OkzByte identity & deposit address generator.
 * All values are derived from the Firebase UID — same UID always
 * produces the same addresses.  Results are cached in localStorage.
 */

const BASE58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function hashStr(s: string, seed: number = 0xdeadbeef): number {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    h = ((h << 13) | (h >>> 19)) >>> 0;
  }
  return h >>> 0;
}

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    s = s >>> 0;
    return s;
  };
}

/** 9-digit unique OkzByte user ID */
export function generateOkzByteUID(firebaseUid: string): string {
  const h = hashStr(firebaseUid, 0x4f4b5a42); // "OKZB"
  const num = (h % 900_000_000) + 100_000_000;
  return num.toString();
}

/** BEP20 (BSC) address: 0x + 40 hex chars */
export function generateBEP20Address(firebaseUid: string): string {
  const next = lcg(hashStr(firebaseUid, 0xbe200000));
  let hex = "";
  for (let i = 0; i < 5; i++) {
    hex += (next() >>> 0).toString(16).padStart(8, "0");
  }
  return "0x" + hex;
}

/** Polygon (ERC20) address: 0x + 40 hex chars (different seed) */
export function generatePolygonAddress(firebaseUid: string): string {
  const next = lcg(hashStr(firebaseUid, 0x504f4c59)); // "POLY"
  let hex = "";
  for (let i = 0; i < 5; i++) {
    hex += (next() >>> 0).toString(16).padStart(8, "0");
  }
  return "0x" + hex;
}

/** TRC20 (Tron) address: T + 33 base58 chars = 34 total */
export function generateTRC20Address(firebaseUid: string): string {
  const next = lcg(hashStr(firebaseUid, 0x54524332)); // "TRC2"
  let addr = "T";
  for (let i = 0; i < 33; i++) {
    addr += BASE58_CHARS[next() % BASE58_CHARS.length];
  }
  return addr;
}

export interface UserCryptoProfile {
  okzbyteUid: string;
  bep20Address: string;
  trc20Address: string;
  polygonAddress: string;
}

/** Get (or lazily create + cache) the crypto profile for a Firebase UID. */
export function getUserCryptoProfile(firebaseUid: string): UserCryptoProfile {
  if (typeof window === "undefined") {
    return buildProfile(firebaseUid);
  }
  const key = `okzbyte_crypto_${firebaseUid}`;
  try {
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached) as UserCryptoProfile;
  } catch {}
  const profile = buildProfile(firebaseUid);
  try {
    localStorage.setItem(key, JSON.stringify(profile));
  } catch {}
  return profile;
}

function buildProfile(uid: string): UserCryptoProfile {
  return {
    okzbyteUid:     generateOkzByteUID(uid),
    bep20Address:   generateBEP20Address(uid),
    trc20Address:   generateTRC20Address(uid),
    polygonAddress: generatePolygonAddress(uid),
  };
}
