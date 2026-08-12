/**
 * CryptoDepositFlow — Binance-style 3-step deposit flow
 *  Step 1: Select Asset  (full-screen slide-up)
 *  Step 2: Choose Network (bottom sheet over Step 1)
 *  Step 3: Deposit Address + QR Code (full-screen slide from right)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowLeft, Copy, Check, ChevronDown, AlertCircle, X, Share2, Info,
  ScrollText, Filter, ChevronRight, List, CheckCircle2,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { getUserCryptoProfile, type UserCryptoProfile } from "@/lib/userCrypto";
import { ASSET_DEFS } from "@/store/AppStoreContext";

/* ─── Design tokens (dark theme, Binance-style) ─────────────────────────────── */
const D = {
  bg:     "#0B0E11",
  dark:   "#181A20",
  panel:  "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  gold:   "#C9A84C",
  fg:     "#EEF2FF",
  dim:    "#6B7591",
  mid:    "#9AA2B8",
  green:  "#10B981",
  red:    "#F43F5E",
  yellow: "#F59E0B",
};

/* ─── Coin list ──────────────────────────────────────────────────────────────── */
export interface Coin {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  tag?: string;
  suspended?: boolean;
  trending?: boolean;
  /** Remote/local URL for the token logo image */
  logoUrl?: string;
}

/* ─── Trending order — tokens always shown at the top ────────────────────────── */
const TRENDING_SYMBOLS = ["PKR", "USDT", "OKBOND", "BTC", "ETH"];

/* ─── CDN helper — returns the logo URL for a crypto symbol ─────────────────── */
const CDN = (sym: string) =>
  `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${sym.toLowerCase()}.svg`;

/* ─── Visual style + logo overrides for platform property tokens ─────────────── */
const PROPERTY_STYLE: Record<string, { icon: string; color: string; bg: string }> = {
  ASC:    { icon: "A",  color: "#10B981", bg: "rgba(16,185,129,0.12)"  },
  CSC:    { icon: "C",  color: "#3B82F6", bg: "rgba(59,130,246,0.12)"  },
  DHA9:   { icon: "D",  color: "#F97316", bg: "rgba(249,115,22,0.12)"  },
  GBR:    { icon: "G",  color: "#A855F7", bg: "rgba(168,85,247,0.12)"  },
  OKBOND: { icon: "◈",  color: "#C9A84C", bg: "rgba(201,168,76,0.12)"  },
  BTI:    { icon: "B",  color: "#22D3EE", bg: "rgba(34,211,238,0.12)"  },
};

/* ─── 100+ global crypto + fiat list with logos ──────────────────────────────── */
const GLOBAL_CRYPTO: Omit<Coin, "trending">[] = [
  // Fiat
  { symbol: "PKR",     name: "Pakistani Rupee",       icon: "₨", color: "#22D3EE", bg: "rgba(34,211,238,0.12)", tag: "Fiat" },
  // Top crypto
  { symbol: "BTC",     name: "Bitcoin",               icon: "₿", color: "#F97316", bg: "rgba(249,115,22,0.12)",  logoUrl: CDN("btc")     },
  { symbol: "ETH",     name: "Ethereum",              icon: "Ξ", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)",  logoUrl: CDN("eth")     },
  { symbol: "USDT",    name: "TetherUS",              icon: "₮", color: "#10B981", bg: "rgba(16,185,129,0.12)",  logoUrl: CDN("usdt")    },
  { symbol: "USDC",    name: "USD Coin",              icon: "$", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("usdc")    },
  { symbol: "BNB",     name: "BNB",                   icon: "⬡", color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  logoUrl: CDN("bnb")     },
  { symbol: "SOL",     name: "Solana",                icon: "◎", color: "#A855F7", bg: "rgba(168,85,247,0.1)",   logoUrl: CDN("sol")     },
  { symbol: "XRP",     name: "XRP",                   icon: "✕", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   logoUrl: CDN("xrp")     },
  { symbol: "ADA",     name: "Cardano",               icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("ada")     },
  { symbol: "DOGE",    name: "Dogecoin",              icon: "Ð", color: "#FBBF24", bg: "rgba(251,191,36,0.1)",   logoUrl: CDN("doge")    },
  { symbol: "TRX",     name: "TRON",                  icon: "●", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    logoUrl: CDN("trx")     },
  { symbol: "MATIC",   name: "Polygon",               icon: "●", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)",   logoUrl: CDN("matic")   },
  { symbol: "DOT",     name: "Polkadot",              icon: "●", color: "#E879F9", bg: "rgba(232,121,249,0.1)",  logoUrl: CDN("dot")     },
  { symbol: "LINK",    name: "Chainlink",             icon: "⬡", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("link")    },
  { symbol: "AVAX",    name: "Avalanche",             icon: "●", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    logoUrl: CDN("avax")    },
  { symbol: "LTC",     name: "Litecoin",              icon: "Ł", color: "#9AA2B8", bg: "rgba(154,162,184,0.1)",  logoUrl: CDN("ltc")     },
  { symbol: "BCH",     name: "Bitcoin Cash",          icon: "₿", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("bch")     },
  { symbol: "UNI",     name: "Uniswap",               icon: "🦄", color: "#F72585", bg: "rgba(247,37,133,0.1)",  logoUrl: CDN("uni")     },
  { symbol: "XLM",     name: "Stellar",               icon: "✦", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   logoUrl: CDN("xlm")     },
  { symbol: "DAI",     name: "Dai",                   icon: "◈", color: "#F59E0B", bg: "rgba(245,158,11,0.1)",   logoUrl: CDN("dai")     },
  { symbol: "XMR",     name: "Monero",                icon: "ɱ", color: "#F97316", bg: "rgba(249,115,22,0.1)",   logoUrl: CDN("xmr")     },
  { symbol: "AAVE",    name: "Aave",                  icon: "●", color: "#A855F7", bg: "rgba(168,85,247,0.1)",   logoUrl: CDN("aave")    },
  { symbol: "ARB",     name: "Arbitrum",              icon: "●", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   logoUrl: CDN("arb")     },
  { symbol: "APT",     name: "Aptos",                 icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("apt")     },
  { symbol: "OP",      name: "Optimism",              icon: "●", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    logoUrl: CDN("op")      },
  { symbol: "NEAR",    name: "NEAR Protocol",         icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("near")    },
  { symbol: "ICP",     name: "Internet Computer",     icon: "●", color: "#A855F7", bg: "rgba(168,85,247,0.1)",   logoUrl: CDN("icp")     },
  { symbol: "FIL",     name: "Filecoin",              icon: "●", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   logoUrl: CDN("fil")     },
  { symbol: "VET",     name: "VeChain",               icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("vet")     },
  { symbol: "HBAR",    name: "Hedera",                icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("hbar")    },
  { symbol: "IMX",     name: "Immutable X",           icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("imx")     },
  { symbol: "INJ",     name: "Injective",             icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("inj")     },
  { symbol: "SUI",     name: "Sui",                   icon: "●", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   logoUrl: CDN("sui")     },
  { symbol: "QNT",     name: "Quant",                 icon: "●", color: "#F97316", bg: "rgba(249,115,22,0.1)",   logoUrl: CDN("qnt")     },
  { symbol: "GRT",     name: "The Graph",             icon: "●", color: "#A855F7", bg: "rgba(168,85,247,0.1)",   logoUrl: CDN("grt")     },
  { symbol: "STX",     name: "Stacks",                icon: "●", color: "#F97316", bg: "rgba(249,115,22,0.1)",   logoUrl: CDN("stx")     },
  { symbol: "MKR",     name: "Maker",                 icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("mkr")     },
  { symbol: "SNX",     name: "Synthetix",             icon: "●", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   logoUrl: CDN("snx")     },
  { symbol: "COMP",    name: "Compound",              icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("comp")    },
  { symbol: "ENS",     name: "Ethereum Name Service", icon: "●", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   logoUrl: CDN("ens")     },
  { symbol: "CRV",     name: "Curve DAO",             icon: "●", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    logoUrl: CDN("crv")     },
  { symbol: "SAND",    name: "The Sandbox",           icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("sand")    },
  { symbol: "AXS",     name: "Axie Infinity",         icon: "●", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   logoUrl: CDN("axs")     },
  { symbol: "MANA",    name: "Decentraland",          icon: "●", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    logoUrl: CDN("mana")    },
  { symbol: "CHZ",     name: "Chiliz",                icon: "●", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    logoUrl: CDN("chz")     },
  { symbol: "THETA",   name: "Theta Network",         icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("theta")   },
  { symbol: "EOS",     name: "EOS",                   icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("eos")     },
  { symbol: "XTZ",     name: "Tezos",                 icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("xtz")     },
  { symbol: "ALGO",    name: "Algorand",              icon: "●", color: "#9AA2B8", bg: "rgba(154,162,184,0.1)",  logoUrl: CDN("algo")    },
  { symbol: "EGLD",    name: "MultiversX",            icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("egld")    },
  { symbol: "FLOW",    name: "Flow",                  icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("flow")    },
  { symbol: "FTM",     name: "Fantom",                icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("ftm")     },
  { symbol: "DASH",    name: "Dash",                  icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("dash")    },
  { symbol: "ZEC",     name: "Zcash",                 icon: "ⓩ", color: "#F59E0B", bg: "rgba(245,158,11,0.1)",   logoUrl: CDN("zec")     },
  { symbol: "ZIL",     name: "Zilliqa",               icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("zil")     },
  { symbol: "KAVA",    name: "Kava",                  icon: "●", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    logoUrl: CDN("kava")    },
  { symbol: "ATOM",    name: "Cosmos",                icon: "●", color: "#A855F7", bg: "rgba(168,85,247,0.1)",   logoUrl: CDN("atom")    },
  { symbol: "OSMO",    name: "Osmosis",               icon: "●", color: "#A855F7", bg: "rgba(168,85,247,0.1)",   logoUrl: CDN("osmo")    },
  { symbol: "ROSE",    name: "Oasis Network",         icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("rose")    },
  { symbol: "ONE",     name: "Harmony",               icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("one")     },
  { symbol: "KCS",     name: "KuCoin Token",          icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("kcs")     },
  { symbol: "HT",      name: "Huobi Token",           icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("ht")      },
  { symbol: "OKB",     name: "OKB",                   icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("okb")     },
  { symbol: "CRO",     name: "Cronos",                icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("cro")     },
  { symbol: "SHIB",    name: "Shiba Inu",             icon: "●", color: "#F97316", bg: "rgba(249,115,22,0.1)",   logoUrl: CDN("shib")    },
  { symbol: "PEPE",    name: "Pepe",                  icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("pepe")    },
  { symbol: "WIF",     name: "dogwifhat",             icon: "●", color: "#FBBF24", bg: "rgba(251,191,36,0.1)",   logoUrl: CDN("wif")     },
  { symbol: "BONK",    name: "Bonk",                  icon: "●", color: "#F97316", bg: "rgba(249,115,22,0.1)",   logoUrl: CDN("bonk")    },
  { symbol: "TON",     name: "Toncoin",               icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("ton")     },
  { symbol: "NOT",     name: "Notcoin",               icon: "●", color: "#F59E0B", bg: "rgba(245,158,11,0.1)",   logoUrl: CDN("not")     },
  { symbol: "WLD",     name: "Worldcoin",             icon: "●", color: "#9AA2B8", bg: "rgba(154,162,184,0.1)",  logoUrl: CDN("wld")     },
  { symbol: "SEI",     name: "Sei",                   icon: "●", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    logoUrl: CDN("sei")     },
  { symbol: "CFX",     name: "Conflux",               icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("cfx")     },
  { symbol: "HYPE",    name: "Hyperliquid",            icon: "⚡", color: "#22D3EE", bg: "rgba(34,211,238,0.1)"   },
  { symbol: "LEO",     name: "UNUS SED LEO",          icon: "𝑳", color: "#F59E0B", bg: "rgba(245,158,11,0.1)",   logoUrl: CDN("leo")     },
  { symbol: "USD1",    name: "USD1",                  icon: "$", color: "#A3E635", bg: "rgba(163,230,53,0.1)"   },
  { symbol: "PYTH",    name: "Pyth Network",          icon: "●", color: "#A855F7", bg: "rgba(168,85,247,0.1)",   logoUrl: CDN("pyth")    },
  { symbol: "JTO",     name: "Jito",                  icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("jto")     },
  { symbol: "JUP",     name: "Jupiter",               icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("jup")     },
  { symbol: "DYM",     name: "Dymension",             icon: "●", color: "#A855F7", bg: "rgba(168,85,247,0.1)",   logoUrl: CDN("dym")     },
  { symbol: "MANTA",   name: "Manta Network",         icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("manta")   },
  { symbol: "ALT",     name: "AltLayer",              icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("alt")     },
  { symbol: "ENA",     name: "Ethena",                icon: "●", color: "#A855F7", bg: "rgba(168,85,247,0.1)",   logoUrl: CDN("ena")     },
  { symbol: "MEW",     name: "cat in a dogs world",   icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("mew")     },
  { symbol: "W",       name: "Wormhole",              icon: "●", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   logoUrl: CDN("w")       },
  { symbol: "IO",      name: "IO.net",                icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("io")      },
  { symbol: "ZK",      name: "ZKsync",                icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("zk")      },
  { symbol: "RENDER",  name: "Render",                icon: "●", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    logoUrl: CDN("render")  },
  { symbol: "ONDO",    name: "Ondo",                  icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("ondo")    },
  { symbol: "TRUMP",   name: "TRUMP",                 icon: "●", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    logoUrl: CDN("trump")   },
  { symbol: "JASMY",   name: "JasmyCoin",             icon: "●", color: "#EF4444", bg: "rgba(239,68,68,0.1)",    logoUrl: CDN("jasmy")   },
  { symbol: "FET",     name: "Fetch.ai",              icon: "●", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   logoUrl: CDN("fet")     },
  { symbol: "AGIX",    name: "SingularityNET",        icon: "●", color: "#A855F7", bg: "rgba(168,85,247,0.1)",   logoUrl: CDN("agix")    },
  { symbol: "OCEAN",   name: "Ocean Protocol",        icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("ocean")   },
  { symbol: "LDO",     name: "Lido DAO",              icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("ldo")     },
  { symbol: "RPL",     name: "Rocket Pool",           icon: "●", color: "#F97316", bg: "rgba(249,115,22,0.1)",   logoUrl: CDN("rpl")     },
  { symbol: "SSV",     name: "SSV Network",           icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("ssv")     },
  { symbol: "PENDLE",  name: "Pendle",                icon: "●", color: "#22C55E", bg: "rgba(34,197,94,0.1)",    logoUrl: CDN("pendle")  },
  { symbol: "GMX",     name: "GMX",                   icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("gmx")     },
  { symbol: "DYDX",    name: "dYdX",                  icon: "●", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   logoUrl: CDN("dydx")    },
  { symbol: "PERP",    name: "Perpetual Protocol",    icon: "●", color: "#22D3EE", bg: "rgba(34,211,238,0.1)",   logoUrl: CDN("perp")    },
  { symbol: "SXP",     name: "Solar",                 icon: "●", color: "#F97316", bg: "rgba(249,115,22,0.1)",   logoUrl: CDN("sxp")     },
  { symbol: "TWT",     name: "Trust Wallet Token",    icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("twt")     },
  { symbol: "KSM",     name: "Kusama",                icon: "●", color: "#E879F9", bg: "rgba(232,121,249,0.1)",  logoUrl: CDN("ksm")     },
  { symbol: "SCRT",    name: "Secret Network",        icon: "●", color: "#F59E0B", bg: "rgba(245,158,11,0.1)",   logoUrl: CDN("scrt")    },
  { symbol: "BAND",    name: "Band Protocol",         icon: "●", color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   logoUrl: CDN("band")    },
];

/**
 * Build the canonical asset list — single source of truth.
 *
 * Priority:  Platform property tokens (ASSET_DEFS)  >  global crypto/fiat.
 * Property tokens from ASSET_DEFS use their local logo file when available.
 * Any ticker present in ASSET_DEFS is excluded from GLOBAL_CRYPTO to avoid duplicates.
 */
function buildCoins(): Coin[] {
  // 1. Property tokens — sourced directly from the store's ASSET_DEFS
  const propertyCoins: Coin[] = Object.values(ASSET_DEFS).map(def => ({
    symbol:  def.ticker,
    name:    def.name,
    tag:     "Property",
    // Use local /public/tokens/ logo when available, else fall back to CDN
    logoUrl: def.logo ? `/${def.logo}` : CDN(def.ticker),
    ...(PROPERTY_STYLE[def.ticker] ?? {
      icon:  def.ticker[0],
      color: "#C9A84C",
      bg:    "rgba(201,168,76,0.1)",
    }),
  }));

  // 2. Global crypto/fiat — exclude any symbol already provided by ASSET_DEFS
  const propertySym = new Set(propertyCoins.map(c => c.symbol));
  const cryptoCoins: Coin[] = GLOBAL_CRYPTO
    .filter(c => !propertySym.has(c.symbol))
    .map(c => ({ ...c }));

  // 3. Merge, deduplicate by symbol, mark trending
  const seen = new Set<string>();
  return [...propertyCoins, ...cryptoCoins]
    .filter(c => { if (seen.has(c.symbol)) return false; seen.add(c.symbol); return true; })
    .map(c => ({ ...c, trending: TRENDING_SYMBOLS.includes(c.symbol) }));
}

/* COINS is computed once (module-level) so memos downstream stay stable */
export const COINS: Coin[] = buildCoins();

/* ─── Network definitions ────────────────────────────────────────────────────── */
interface Network {
  id: string;
  name: string;
  fullName: string;
  minDeposit: string;
  confirmations: number;
  arrival: string;
  contractSuffix?: string;
  creditBundles?: number;
  unlockBundles?: number;
}

const COIN_NETWORKS: Record<string, Network[]> = {
  USDT: [
    { id: "BSC", name: "BSC", fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.01 USDT",   confirmations: 1, arrival: "1 min",  contractSuffix: "55d398", creditBundles: 1, unlockBundles: 2 },
    { id: "TRX", name: "TRX", fullName: "Tron (TRC20)",            minDeposit: ">0.01 USDT",   confirmations: 1, arrival: "1 min",  contractSuffix: "8ea8b4", creditBundles: 1, unlockBundles: 2 },
    { id: "ETH", name: "ETH", fullName: "Ethereum (ERC20)",        minDeposit: ">0.001 USDT",  confirmations: 6, arrival: "2 mins", contractSuffix: "dac17f", creditBundles: 1, unlockBundles: 2 },
    { id: "POL", name: "POL", fullName: "Polygon POS",             minDeposit: ">0.02 USDT",   confirmations: 1, arrival: "1 min",  contractSuffix: "58e8f",  creditBundles: 1, unlockBundles: 2 },
  ],
  USDC: [
    { id: "BSC", name: "BSC", fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.01 USDC",   confirmations: 1, arrival: "1 min",  contractSuffix: "8ac76a" },
    { id: "ETH", name: "ETH", fullName: "Ethereum (ERC20)",        minDeposit: ">0.001 USDC",  confirmations: 6, arrival: "2 mins", contractSuffix: "a0b867" },
    { id: "POL", name: "POL", fullName: "Polygon POS",             minDeposit: ">0.01 USDC",   confirmations: 1, arrival: "1 min",  contractSuffix: "2791bc" },
  ],
  BTC: [
    { id: "BTC", name: "BTC",    fullName: "Bitcoin Network",         minDeposit: ">0.001 BTC",   confirmations: 1, arrival: "10 mins" },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.0001 BTC",  confirmations: 1, arrival: "1 min"   },
  ],
  ETH: [
    { id: "ETH", name: "ETH",    fullName: "Ethereum (ERC20)",        minDeposit: ">0.001 ETH",   confirmations: 6, arrival: "2 mins"  },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.001 ETH",   confirmations: 1, arrival: "1 min"   },
    { id: "POL", name: "POL",    fullName: "Polygon POS",             minDeposit: ">0.01 ETH",    confirmations: 1, arrival: "1 min"   },
    { id: "ARB", name: "ARB",    fullName: "Arbitrum One",            minDeposit: ">0.001 ETH",   confirmations: 1, arrival: "1 min"   },
  ],
  BNB: [
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.001 BNB",   confirmations: 1, arrival: "1 min"   },
  ],
  SOL: [
    { id: "SOL", name: "SOL",    fullName: "Solana",                  minDeposit: ">0.01 SOL",    confirmations: 1, arrival: "1 min"   },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.01 SOL",    confirmations: 1, arrival: "1 min"   },
  ],
  APT: [
    { id: "APT", name: "APT",    fullName: "Aptos",                   minDeposit: ">0.00001 APT", confirmations: 1, arrival: "1 min"   },
  ],
  MATIC: [
    { id: "POL", name: "POL",    fullName: "Polygon POS",             minDeposit: ">0.01 MATIC",  confirmations: 1, arrival: "1 min"   },
    { id: "ETH", name: "ETH",    fullName: "Ethereum (ERC20)",        minDeposit: ">0.001 MATIC", confirmations: 6, arrival: "2 mins"  },
  ],
  OKBOND: [
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">1 OKBOND",    confirmations: 1, arrival: "1 min"   },
    { id: "ETH", name: "ETH",    fullName: "Ethereum (ERC20)",        minDeposit: ">1 OKBOND",    confirmations: 6, arrival: "2 mins"  },
  ],
  XRP: [
    { id: "XRP", name: "XRP",    fullName: "XRP Ledger",              minDeposit: ">0.1 XRP",     confirmations: 1, arrival: "1 min"   },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.01 XRP",    confirmations: 1, arrival: "1 min"   },
  ],
  TRX: [
    { id: "TRX", name: "TRX",    fullName: "Tron Network",            minDeposit: ">1 TRX",       confirmations: 1, arrival: "1 min"   },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.1 TRX",     confirmations: 1, arrival: "1 min"   },
  ],
  DOGE: [
    { id: "DOGE",name: "DOGE",   fullName: "Dogecoin Network",        minDeposit: ">1 DOGE",      confirmations: 3, arrival: "2 mins"  },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.1 DOGE",    confirmations: 1, arrival: "1 min"   },
  ],
  ADA: [
    { id: "ADA", name: "ADA",    fullName: "Cardano Network",         minDeposit: ">1 ADA",       confirmations: 15,arrival: "5 mins"  },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.1 ADA",     confirmations: 1, arrival: "1 min"   },
  ],
  LINK: [
    { id: "ETH", name: "ETH",    fullName: "Ethereum (ERC20)",        minDeposit: ">0.1 LINK",    confirmations: 6, arrival: "2 mins", contractSuffix: "514910" },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.1 LINK",    confirmations: 1, arrival: "1 min"   },
    { id: "POL", name: "POL",    fullName: "Polygon POS",             minDeposit: ">0.1 LINK",    confirmations: 1, arrival: "1 min"   },
  ],
  DOT: [
    { id: "DOT", name: "DOT",    fullName: "Polkadot Network",        minDeposit: ">0.1 DOT",     confirmations: 1, arrival: "2 mins"  },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.01 DOT",    confirmations: 1, arrival: "1 min"   },
  ],
  AVAX: [
    { id: "AVAX",name: "AVAX",   fullName: "Avalanche C-Chain",       minDeposit: ">0.01 AVAX",   confirmations: 1, arrival: "1 min"   },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.01 AVAX",   confirmations: 1, arrival: "1 min"   },
  ],
  ARB: [
    { id: "ARB", name: "ARB",    fullName: "Arbitrum One",            minDeposit: ">0.001 ARB",   confirmations: 1, arrival: "1 min"   },
    { id: "ETH", name: "ETH",    fullName: "Ethereum (ERC20)",        minDeposit: ">0.001 ARB",   confirmations: 6, arrival: "2 mins"  },
  ],
  HYPE: [
    { id: "ETH", name: "ETH",    fullName: "Ethereum (ERC20)",        minDeposit: ">0.1 HYPE",    confirmations: 6, arrival: "2 mins"  },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.1 HYPE",    confirmations: 1, arrival: "1 min"   },
  ],
  LEO: [
    { id: "ETH", name: "ETH",    fullName: "Ethereum (ERC20)",        minDeposit: ">0.01 LEO",    confirmations: 6, arrival: "2 mins", contractSuffix: "2af5d2" },
  ],
  ZEC: [
    { id: "ZEC", name: "ZEC",    fullName: "Zcash Network",           minDeposit: ">0.001 ZEC",   confirmations: 5, arrival: "5 mins"  },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.0001 ZEC",  confirmations: 1, arrival: "1 min"   },
  ],
  XMR: [
    { id: "XMR", name: "XMR",    fullName: "Monero Network",          minDeposit: ">0.002 XMR",   confirmations: 10,arrival: "20 mins" },
  ],
  XLM: [
    { id: "XLM", name: "XLM",    fullName: "Stellar Network",         minDeposit: ">1 XLM",       confirmations: 1, arrival: "1 min"   },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.1 XLM",     confirmations: 1, arrival: "1 min"   },
  ],
  BCH: [
    { id: "BCH", name: "BCH",    fullName: "Bitcoin Cash Network",    minDeposit: ">0.001 BCH",   confirmations: 3, arrival: "5 mins"  },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.0001 BCH",  confirmations: 1, arrival: "1 min"   },
  ],
  DAI: [
    { id: "ETH", name: "ETH",    fullName: "Ethereum (ERC20)",        minDeposit: ">0.1 DAI",     confirmations: 6, arrival: "2 mins", contractSuffix: "6b1754" },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.1 DAI",     confirmations: 1, arrival: "1 min"   },
    { id: "POL", name: "POL",    fullName: "Polygon POS",             minDeposit: ">0.1 DAI",     confirmations: 1, arrival: "1 min"   },
  ],
  USD1: [
    { id: "ETH", name: "ETH",    fullName: "Ethereum (ERC20)",        minDeposit: ">0.1 USD1",    confirmations: 6, arrival: "2 mins"  },
    { id: "BSC", name: "BSC",    fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.1 USD1",    confirmations: 1, arrival: "1 min",  contractSuffix: "8d0001" },
    { id: "TRX", name: "TRX",    fullName: "Tron (TRC20)",            minDeposit: ">0.1 USD1",    confirmations: 1, arrival: "1 min"   },
  ],
};

const DEFAULT_NETWORKS: Network[] = [
  { id: "BSC", name: "BSC", fullName: "BNB Smart Chain (BEP20)", minDeposit: ">0.01",  confirmations: 1, arrival: "1 min"  },
  { id: "ETH", name: "ETH", fullName: "Ethereum (ERC20)",        minDeposit: ">0.001", confirmations: 6, arrival: "2 mins" },
  { id: "POL", name: "POL", fullName: "Polygon POS",             minDeposit: ">0.01",  confirmations: 1, arrival: "1 min"  },
];

function getNetworksForCoin(symbol: string): Network[] {
  return COIN_NETWORKS[symbol] ?? DEFAULT_NETWORKS;
}

function getAddressForNetwork(networkId: string, profile: UserCryptoProfile): string {
  if (networkId === "TRX") return profile.trc20Address;
  if (networkId === "POL" || networkId === "MATIC") return profile.polygonAddress;
  // BTC-style (simplified deterministic display)
  if (networkId === "BTC") return "1" + profile.bep20Address.slice(2, 34);
  // SOL-style (base58 substring from bep20)
  if (networkId === "SOL") return profile.trc20Address.replace(/^T/, "So") + "abc";
  // APT-style
  if (networkId === "APT") return "0x" + profile.polygonAddress.slice(2);
  return profile.bep20Address; // BSC, ETH, ARB, etc.
}

/* ─── QR Code (via public QR API) ───────────────────────────────────────────── */
function QRCode({ data, icon, iconColor, size = 200 }: {
  data: string; icon: string; iconColor: string; size?: number;
}) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=${size}x${size}&margin=3&bgcolor=ffffff&color=000000&format=png`;
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{
      position: "relative", width: size + 24, height: size + 24,
      background: "#fff", borderRadius: 18, padding: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 12, display: "flex", alignItems: "center",
          justifyContent: "center", borderRadius: 6,
          background: "rgba(240,240,240,0.8)",
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid #ddd", borderTopColor: "#666" }}
          />
        </div>
      )}
      <img
        src={qrUrl} alt="QR Code" width={size} height={size}
        style={{ display: "block", borderRadius: 4, opacity: loaded ? 1 : 0, transition: "opacity .3s" }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      {/* Coin badge in center */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 38, height: 38, borderRadius: "50%",
        background: iconColor, border: "3px solid #fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 900, color: "#fff",
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        flexShrink: 0,
      }}>
        {icon}
      </div>
    </div>
  );
}

/* ─── Coin Row ───────────────────────────────────────────────────────────────── */
function CoinRow({ coin, onSelect }: { coin: Coin; onSelect: (c: Coin) => void }) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = !!coin.logoUrl && !imgErr;

  return (
    <div
      onClick={() => !coin.suspended && onSelect(coin)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "13px 16px",
        cursor: coin.suspended ? "default" : "pointer",
        opacity: coin.suspended ? 0.5 : 1,
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        transition: "background .15s",
      }}
      onMouseEnter={e => { if (!coin.suspended) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {/* Coin icon — logo image if available, text fallback otherwise */}
      <div style={{
        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
        background: coin.bg, border: `1px solid ${coin.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 800, color: coin.color,
        overflow: "hidden",
      }}>
        {showImg ? (
          <img
            src={coin.logoUrl}
            alt={coin.symbol}
            width={40}
            height={40}
            style={{ display: "block", borderRadius: "50%", objectFit: "cover" }}
            onError={() => setImgErr(true)}
          />
        ) : (
          coin.icon
        )}
      </div>
      {/* Name + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: D.fg }}>{coin.symbol}</span>
          {coin.tag === "Fiat" && (
            <span style={{ fontSize: 9, color: "#22D3EE", background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>
              Fiat
            </span>
          )}
          {coin.tag === "Property" && (
            <span style={{ fontSize: 9, color: D.gold, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>
              Property
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: D.dim, marginTop: 2 }}>{coin.name}</div>
      </div>
      {coin.suspended && (
        <span style={{ fontSize: 10, color: D.dim, background: "rgba(107,117,145,0.1)", border: "1px solid rgba(107,117,145,0.2)", borderRadius: 4, padding: "2px 7px", flexShrink: 0 }}>
          Suspended
        </span>
      )}
    </div>
  );
}

/* ─── STEP 1: Select Asset ───────────────────────────────────────────────────── */
function Step1SelectAsset({ onBack, onSelect }: {
  onBack: () => void;
  onSelect: (coin: Coin) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Real-time search filter */
  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toUpperCase();
    return COINS.filter(c =>
      c.symbol.startsWith(q) || c.symbol.includes(q) || c.name.toUpperCase().includes(q)
    );
  }, [query]);

  /* Trending — TRENDING_SYMBOLS order is preserved */
  const trending = useMemo(() => {
    const order = new Map(TRENDING_SYMBOLS.map((s, i) => [s, i]));
    return COINS.filter(c => c.trending).sort((a, b) =>
      (order.get(a.symbol) ?? 99) - (order.get(b.symbol) ?? 99)
    );
  }, []);

  /* Alphabetical groups — numeric keys (0-9) followed by A-Z, each sorted within group */
  const grouped = useMemo(() => {
    const map: Record<string, Coin[]> = {};
    for (const coin of COINS.filter(c => !c.trending)) {
      const first = coin.symbol[0].toUpperCase();
      const key = /[0-9]/.test(first) ? first : first;
      if (!map[key]) map[key] = [];
      map[key].push(coin);
    }
    // Sort within each group
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.symbol.localeCompare(b.symbol));
    }
    return map;
  }, []);

  /* Active letters (only those that have coins) */
  const activeLetters = useMemo(() =>
    Object.keys(grouped).sort((a, b) => {
      const aNum = /[0-9]/.test(a);
      const bNum = /[0-9]/.test(b);
      if (aNum && bNum) return a.localeCompare(b);
      if (aNum) return -1;
      if (bNum) return 1;
      return a.localeCompare(b);
    }),
  [grouped]);

  /* Smooth scroll to a letter section */
  const scrollToLetter = useCallback((letter: string) => {
    setActiveIdx(letter);
    const el = scrollRef.current?.querySelector<HTMLDivElement>(`[data-section="${letter}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setActiveIdx(null), 600);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: D.bg }}>
      {/* Header */}
      <div style={{
        padding: "calc(env(safe-area-inset-top,10px) + 12px) 16px 12px",
        borderBottom: `1px solid ${D.border}`,
        display: "flex", alignItems: "center", gap: 12,
        background: D.bg,
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: D.fg }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: D.fg, flex: 1, textAlign: "center", paddingRight: 28 }}>
          Select Asset
        </span>
      </div>

      {/* Search bar */}
      <div style={{ padding: "12px 16px 6px", background: D.bg }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.06)", border: `1px solid ${D.border}`,
          borderRadius: 12, padding: "10px 14px",
        }}>
          <Search size={15} color={D.dim} />
          <input
            type="text" placeholder="Search Coins" value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
            style={{ background: "none", border: "none", outline: "none", color: D.fg, fontSize: 14, flex: 1 }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: D.dim, padding: 0, display: "flex" }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Coin list with clickable alphabetical sidebar */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", position: "relative" }}>

        {/* Right-side A-Z index — interactive, shows only active letters */}
        {!query && (
          <div style={{
            position: "fixed", right: 4, top: "50%",
            transform: "translateY(-50%)",
            display: "flex", flexDirection: "column", alignItems: "center",
            zIndex: 50,
          }}>
            {activeLetters.map(l => (
              <button
                key={l}
                onClick={() => scrollToLetter(l)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 9, fontWeight: 700,
                  color: activeIdx === l ? D.gold : D.dim,
                  lineHeight: 1.5, padding: "1px 5px",
                  transition: "color 0.15s",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {filtered ? (
          filtered.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ color: D.dim, fontSize: 14 }}>No assets found for "{query}"</div>
            </div>
          ) : (
            <>
              {filtered.map(coin => (
                <CoinRow key={coin.symbol} coin={coin} onSelect={onSelect} />
              ))}
            </>
          )
        ) : (
          <>
            {/* Trending */}
            <div style={{ padding: "10px 16px 4px" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: D.gold, letterSpacing: "0.04em" }}>Trending</span>
            </div>
            {trending.map(coin => (
              <CoinRow key={coin.symbol} coin={coin} onSelect={onSelect} />
            ))}

            {/* Alphabetical groups — each group div gets a data-section attribute */}
            {activeLetters.map(letter => (
              <div key={letter} data-section={letter}>
                <div style={{ padding: "10px 16px 4px", background: D.bg, position: "sticky", top: 0, zIndex: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: D.dim }}>{letter}</span>
                </div>
                {grouped[letter].map(coin => (
                  <CoinRow key={coin.symbol} coin={coin} onSelect={onSelect} />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── STEP 2: Choose Network (bottom sheet) ──────────────────────────────────── */
function Step2ChooseNetwork({ open, coin, onBack, onSelect }: {
  open: boolean;
  coin: Coin | null;
  onBack: () => void;
  onSelect: (net: Network) => void;
}) {
  const networks = coin ? getNetworksForCoin(coin.symbol) : [];

  return (
    <AnimatePresence>
      {open && coin && (
        <motion.div
          key="net-backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            zIndex: 20,
          }}
          onClick={onBack}
        >
          <motion.div
            key="net-sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: D.dark, borderTopLeftRadius: 24, borderTopRightRadius: 24,
              paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
              border: `1px solid ${D.border}`, borderBottom: "none",
              maxHeight: "82%", overflowY: "auto",
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 2 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.14)" }} />
            </div>

            {/* Sheet header */}
            <div style={{ padding: "12px 20px 14px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: D.fg, marginBottom: 4 }}>Choose Network</div>
              <div style={{ fontSize: 11, color: D.dim, lineHeight: 1.5 }}>
                Make sure the sending platform supports the network you select.
              </div>
            </div>

            {/* Network cards */}
            <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {networks.map(net => (
                <motion.div
                  key={net.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(net)}
                  style={{
                    padding: "14px 16px", borderRadius: 14,
                    background: D.panel, border: `1px solid ${D.border}`,
                    cursor: "pointer", transition: "border-color .18s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.35)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = D.border; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: D.fg }}>{net.name}</span>
                    <span style={{ fontSize: 12, color: D.dim }}>{net.fullName}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, color: D.dim }}>{net.confirmations} block confirmation/s</span>
                    <span style={{ fontSize: 11, color: D.dim }}>Min. deposit {net.minDeposit}</span>
                    <span style={{ fontSize: 11, color: D.dim }}>Est. arrival {net.arrival}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Disclaimer */}
            <div style={{ margin: "12px 14px 0", padding: "10px 14px", background: "rgba(255,255,255,0.025)", borderRadius: 10, border: `1px solid ${D.border}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <AlertCircle size={13} color={D.dim} style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: D.dim, lineHeight: 1.55 }}>
                  Please note that only supported networks on OkzByte platform are shown, if you deposit via another network your assets may be lost.
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Deposit History Screen ─────────────────────────────────────────────────── */
const SAMPLE_HISTORY = [
  { coin: "USDT", date: "2026-03-26 01:59:58", amount: "+150",    status: "Completed", network: "TRX", txid: "3da13227f67740b54eb70590524ba1645df53bd7d03fb70ebbb42e2c9e109c2e" },
  { coin: "USDT", date: "2026-03-25 01:10:28", amount: "+54",     status: "Completed", network: "TRX", txid: "8fb22310a94517c3d2e87654af132bc9f12de34567890123456789012345678" },
  { coin: "USDT", date: "2026-03-03 09:56:01", amount: "+192.77", status: "Completed", network: "TRX", txid: "a1b2c3d4e5f6789012345abc678901234567890abcdef1234567890abcdef12" },
];
type HistoryItem = typeof SAMPLE_HISTORY[0];

function DepositHistoryScreen({ onBack, onSelectItem }: { onBack: () => void; onSelectItem: (item: HistoryItem) => void }) {
  const [tab, setTab] = useState<"Crypto" | "Cash">("Crypto");
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: D.bg }}>
      {/* Header */}
      <div style={{
        padding: "calc(env(safe-area-inset-top,10px) + 12px) 16px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${D.border}`, background: D.bg,
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: D.fg, padding: 4, display: "flex" }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: D.dim }}>Assets</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: D.fg }}>Deposit History</span>
        </div>
        <button style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <Filter size={14} color={D.dim} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${D.border}`, padding: "0 16px" }}>
        {(["Crypto", "Cash"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "12px 16px 10px", fontSize: 14, fontWeight: 600,
              color: tab === t ? D.fg : D.dim,
              borderBottom: tab === t ? `2px solid ${D.gold}` : "2px solid transparent",
              marginBottom: -1,
            }}
          >{t}</button>
        ))}
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Support link */}
        <button style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${D.border}`,
        }}>
          <span style={{ fontSize: 12, color: D.dim }}>Deposits not arrived? Check solutions here</span>
          <ChevronRight size={14} color={D.dim} />
        </button>

        {/* History items */}
        {SAMPLE_HISTORY.map((item, i) => (
          <div
            key={i}
            onClick={() => onSelectItem(item)}
            style={{
              padding: "14px 16px",
              borderBottom: `1px solid ${D.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: D.fg }}>{item.coin}</span>
              <span style={{ fontSize: 11, color: D.dim }}>{item.date}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0ECB81" }}>{item.amount}</span>
                <span style={{ fontSize: 11, color: "#0ECB81" }}>{item.status}</span>
              </div>
              <ChevronRight size={14} color={D.dim} />
            </div>
          </div>
        ))}

        {/* Empty state */}
        <div style={{ padding: "28px 16px", textAlign: "center" }}>
          <span style={{ fontSize: 12, color: D.dim }}>No more data</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Deposit Detail Screen ──────────────────────────────────────────────── */
function DetailRow({ label, value, monospace, truncate, link, onCopy, copied }: {
  label: string; value: string; monospace?: boolean; truncate?: boolean; link?: boolean;
  onCopy?: () => void; copied?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "13px 16px", borderBottom: `1px solid ${D.border}`, gap: 12 }}>
      <span style={{ fontSize: 12, color: D.dim, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: link ? "#2196F3" : D.fg, fontFamily: monospace ? "monospace" : "inherit", textAlign: "right", wordBreak: truncate ? "break-all" : "normal" }}>
          {value}
        </span>
        {onCopy && (
          <button onClick={onCopy} style={{ background: "none", border: "none", cursor: "pointer", color: D.dim, flexShrink: 0, padding: 2 }}>
            {copied ? <Check size={13} color="#0ECB81" /> : <Copy size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}

function DepositDetailScreen({ item, address, onBack }: { item: HistoryItem; address: string; onBack: () => void }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  function doCopy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
  }
  const TRADING_PAIRS = [
    { pair: "USDC/USDT", price: "1.00104",   chg: "+0.02%", up: true  },
    { pair: "BTC/USDT",  price: "62,837.43", chg: "-0.92%", up: false },
    { pair: "ETH/USDT",  price: "1,858.82",  chg: "-0.88%", up: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: D.bg }}>
      {/* Header */}
      <div style={{ padding: "calc(env(safe-area-inset-top,10px) + 12px) 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${D.border}` }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: D.fg, padding: 4, display: "flex" }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: D.fg }}>Deposit Details</span>
        <div style={{ width: 28 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 40 }}>
        {/* Amount + Status */}
        <div style={{ textAlign: "center", padding: "32px 24px 24px" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#0ECB81", marginBottom: 12, letterSpacing: "-0.5px" }}>
            {item.amount} {item.coin}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12 }}>
            <CheckCircle2 size={18} color="#0ECB81" />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#0ECB81" }}>Completed</span>
          </div>
          <div style={{ fontSize: 12, color: D.dim, lineHeight: 1.6, maxWidth: 290, margin: "0 auto" }}>
            Crypto has arrived in your OkzByte account. View your spot account balance for more details.
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 8, background: "rgba(255,255,255,0.03)", borderTop: `1px solid ${D.border}`, borderBottom: `1px solid ${D.border}` }} />

        {/* Detail rows */}
        <DetailRow label="Network" value={item.network} />
        <DetailRow label="Address" value={address} monospace truncate
          onCopy={() => doCopy(address, "address")} copied={copiedKey === "address"} />
        <DetailRow label="Txid" value={item.txid} monospace truncate link
          onCopy={() => doCopy(item.txid, "txid")} copied={copiedKey === "txid"} />
        <DetailRow label="Wallet" value="Spot Wallet" />
        <DetailRow label="Date"   value={item.date} />

        {/* Divider */}
        <div style={{ height: 8, background: "rgba(255,255,255,0.03)", borderTop: `1px solid ${D.border}`, borderBottom: `1px solid ${D.border}` }} />

        {/* Trading section */}
        <div>
          <div style={{ padding: "16px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: D.fg }}>Trading</span>
            <ChevronRight size={16} color={D.dim} />
          </div>
          {TRADING_PAIRS.map(p => (
            <div key={p.pair} style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${D.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: D.fg }}>{p.pair}</div>
                <div style={{ fontSize: 12, color: p.up ? "#0ECB81" : D.red, marginTop: 2 }}>
                  {p.price} <span style={{ fontSize: 11 }}>{p.chg}</span>
                </div>
              </div>
              <button style={{ background: "#F0B90B", color: "#000", border: "none", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Trade Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Deposit FAQ / User Guidance Screen ─────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: "How to deposit/withdraw cryptocurrency on the OkzByte app?",
    a: "Open the OkzByte app, tap 'Add Funds' from the Wallet screen, select 'Deposit Asset', choose your coin and network, then copy or scan the deposit address. For withdrawals, tap 'Withdraw', enter the destination address and amount, and confirm.",
  },
  {
    q: "How to deposit/withdraw cryptocurrency on the OkzByte website?",
    a: "Log in at okzbyte.com, navigate to Wallet → Deposit, select your asset and network, then send funds to the displayed address. For withdrawals, go to Wallet → Withdraw, enter your destination address, amount, and submit.",
  },
  {
    q: "How to choose a network? (BEP20 vs TRC20 vs Polygon)",
    a: "BEP20 (BSC) offers low fees and fast confirmations — best for USDT/BNB. TRC20 is ideal for USDT with near-zero fees. Polygon is great for USDC and token transfers with minimal cost. Always use the same network on both the sending and receiving ends to avoid losing funds.",
  },
];

const TUTORIAL_ITEMS = [
  {
    q: "How to deposit crypto on the OkzByte app?",
    a: "1. Tap 'Add Funds' → 'Deposit Asset'. 2. Search and select your coin (e.g. USDT). 3. Choose a network (e.g. BEP20). 4. Copy the address or scan the QR. 5. Send from your external wallet. 6. Wait for network confirmations.",
  },
  {
    q: "How to withdraw crypto on the OkzByte app?",
    a: "1. Tap 'Withdraw' from the Wallet. 2. Select the coin and network. 3. Paste the destination address. 4. Enter the amount. 5. Review the fee and confirm. 6. Approve via 2FA if enabled.",
  },
];

function FAQAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          background: "rgba(255,255,255,0.04)", borderRadius: 12,
          border: `1px solid ${D.border}`, overflow: "hidden",
        }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer",
              padding: "14px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 13, color: D.fg, textAlign: "left", flex: 1, lineHeight: 1.45 }}>{item.q}</span>
            <ChevronDown
              size={16} color={D.dim}
              style={{ flexShrink: 0, transform: open === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            />
          </button>
          {open === i && (
            <div style={{ padding: "0 14px 14px", fontSize: 12, color: D.dim, lineHeight: 1.65 }}>
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DepositFAQScreen({ onBack }: { onBack: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: D.bg }}>
      {/* Header */}
      <div style={{
        padding: "calc(env(safe-area-inset-top,10px) + 12px) 16px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${D.border}`, background: D.bg, gap: 12,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: D.fg, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          How to Deposit/Withdraw Cryp...
        </span>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: D.dim, padding: 4, display: "flex" }}>
          <X size={20} />
        </button>
      </div>

      {/* FAQ label + search/list */}
      <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${D.border}` }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: D.fg }}>FAQ</span>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: D.dim, padding: 2, display: "flex" }}>
            <Search size={18} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: D.dim, padding: 2, display: "flex" }}>
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 4, borderBottom: `1px solid ${D.border}` }}>
        <span style={{ fontSize: 11, color: D.dim }}>Withdrawal</span>
        <ChevronRight size={10} color={D.dim} />
        <span style={{ fontSize: 11, color: D.dim }}>Deposit/Withdraw Guide</span>
        <ChevronRight size={10} color={D.dim} />
        <span style={{ fontSize: 11, color: D.fg }}>How to ...inance?</span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 32px" }}>
        {/* Main heading */}
        <div style={{ marginBottom: 6 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: D.fg, margin: 0, lineHeight: 1.4 }}>
            How to Deposit/Withdraw Cryptocurrency on OkzByte?
          </h2>
        </div>
        <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: D.dim }}>Published on 2020-10-29 10:45</span>
          <span style={{ fontSize: 11, color: D.dim }}>Updated on 2026-03-18 18:34</span>
        </div>

        {/* FAQ accordion */}
        <FAQAccordion items={FAQ_ITEMS} />

        {/* Step-by-step tutorials */}
        <div style={{ marginTop: 24, marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: D.fg }}>Step-by-step tutorials</span>
        </div>
        <FAQAccordion items={TUTORIAL_ITEMS} />
      </div>
    </div>
  );
}

/* ─── STEP 3: Deposit Address + QR ──────────────────────────────────────────── */
function Step3DepositAddress({ coin, network, onBack, profile }: {
  coin: Coin;
  network: Network;
  onBack: () => void;
  profile: UserCryptoProfile;
}) {
  const address = getAddressForNetwork(network.id, profile);
  const [copied, setCopied]           = useState(false);
  const [showImportant, setShowImp]   = useState(!!network.contractSuffix);
  const [destination, setDestination] = useState<"Spot" | "Funding">("Spot");
  const [showDestDrop, setShowDDrop]  = useState(false);
  const [showMore, setShowMore]       = useState(false);
  const [showFAQ, setShowFAQ]         = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDepositItem, setSelectedDepositItem] = useState<HistoryItem | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contractShort = network.contractSuffix
    ? `***${network.contractSuffix}`
    : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: D.bg, position: "relative" }}>
      {/* Header */}
      <div style={{
        padding: "calc(env(safe-area-inset-top,10px) + 12px) 16px 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${D.border}`, background: D.bg,
      }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: D.fg, padding: 4, display: "flex" }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: D.fg }}>Deposit {coin.symbol}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowFAQ(true)}
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <Info size={14} color={D.dim} />
          </button>
          <button
            onClick={() => setShowHistory(true)}
            style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <ScrollText size={14} color={D.dim} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
        {/* QR code */}
        <div style={{ display: "flex", justifyContent: "center", padding: "28px 16px 24px" }}>
          <QRCode data={address} icon={coin.icon} iconColor={coin.color} size={200} />
        </div>

        <div style={{ height: 1, background: D.border, margin: "0 16px" }} />

        {/* Network section */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, color: D.dim, marginBottom: 6 }}>Network</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: D.fg, marginBottom: 2 }}>{network.name}</div>
              <div style={{ fontSize: 12, color: D.dim }}>{network.fullName}</div>
              {contractShort && (
                <div style={{ fontSize: 11, color: D.dim, marginTop: 4 }}>
                  Contract Information{" "}
                  <span style={{ color: D.mid, fontWeight: 600 }}>{contractShort}</span>
                </div>
              )}
            </div>
            <button style={{
              background: "rgba(255,255,255,0.05)", border: `1px solid ${D.border}`,
              borderRadius: 8, padding: "8px 12px", cursor: "pointer", color: D.dim, fontSize: 16,
            }}>
              ⇄
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: D.border, margin: "16px 16px 0" }} />

        {/* Deposit address */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: D.dim }}>Deposit Address</span>
            <span style={{ fontSize: 12, color: D.gold, fontWeight: 600 }}>›</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6, wordBreak: "break-all" }}>
                <span style={{ color: D.gold }}>{address.slice(0, 4)}</span>
                <span style={{ color: D.fg }}>{address.slice(4, -4)}</span>
                <span style={{ color: D.gold }}>{address.slice(-4)}</span>
              </div>
              {network.contractSuffix && (
                <div style={{ fontSize: 11, color: D.red, marginTop: 6, lineHeight: 1.55 }}>
                  Please make sure the {coin.symbol} coin you are depositing ends with the contract address {network.contractSuffix}.
                </div>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCopy}
              style={{
                background: copied ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${copied ? "rgba(16,185,129,0.35)" : D.border}`,
                borderRadius: 8, padding: "8px 10px", cursor: "pointer",
                color: copied ? "#10B981" : D.dim, display: "flex", alignItems: "center",
                flexShrink: 0, transition: "all .2s",
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </motion.button>
          </div>
        </div>

        <div style={{ height: 1, background: D.border, margin: "16px 16px 0" }} />

        {/* Details section */}
        <div style={{ padding: "16px 16px 0" }}>
          {/* Deposit to */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13, position: "relative" }}>
            <span style={{ fontSize: 13, color: D.dim }}>Deposit to</span>
            <button
              onClick={() => setShowDDrop(s => !s)}
              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: D.fg, fontSize: 13, fontWeight: 600 }}
            >
              {destination} Wallet <ChevronDown size={13} color={D.dim} />
            </button>
            {showDestDrop && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  position: "absolute", right: 0, top: "100%", marginTop: 4,
                  background: "#1E2028", border: `1px solid ${D.border}`, borderRadius: 10,
                  zIndex: 20, minWidth: 170, overflow: "hidden",
                }}
              >
                {(["Spot", "Funding"] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setDestination(opt); setShowDDrop(false); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "11px 14px", background: destination === opt ? "rgba(255,255,255,0.04)" : "none",
                      border: "none", cursor: "pointer",
                      fontSize: 13, color: destination === opt ? D.fg : D.dim,
                      fontWeight: destination === opt ? 700 : 400,
                    }}
                  >
                    {opt} Wallet
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 11 }}>
            <span style={{ fontSize: 13, color: D.dim }}>Minimum deposit</span>
            <span style={{ fontSize: 13, color: D.fg, fontWeight: 600 }}>{network.minDeposit}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 11 }}>
            <span style={{ fontSize: 13, color: D.dim }}>Credited (Trading enabled)</span>
            <span style={{ fontSize: 13, color: D.fg, fontWeight: 600 }}>{network.creditBundles ?? 1} bundle</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: D.dim }}>Unlocked (Withdrawal enabled)</span>
            <span style={{ fontSize: 13, color: D.fg, fontWeight: 600 }}>{network.unlockBundles ?? 2} bundle</span>
          </div>

          {/* Legal notices */}
          <div style={{ fontSize: 11, color: D.dim, lineHeight: 1.75 }}>
            Do not transact with Sanctioned Entities.{" "}
            <span style={{ color: D.gold, cursor: "pointer" }}>Learn more</span>
            <br />Do not send NFTs to this address.
            <br />Smart contract deposits are not supported with the exception of ETH via ERC20, BSC via BEP20, Arbitrum and Optimism networks.
          </div>

          {/* More details toggle */}
          <button
            onClick={() => setShowMore(s => !s)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              width: "100%", marginTop: 14, background: "none", border: "none",
              cursor: "pointer", color: D.dim, fontSize: 12, padding: "8px 0",
            }}
          >
            More Details {showMore ? "▲" : "▼"}
          </button>

          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ paddingTop: 12, borderTop: `1px solid ${D.border}` }}>
                  {[
                    ["Network", network.name],
                    ["Est. arrival", network.arrival],
                    ["Block confirmations", String(network.confirmations)],
                    ["Contract", contractShort ?? "N/A"],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 12 }}>
                      <span style={{ color: D.dim }}>{label}</span>
                      <span style={{ color: D.fg, fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky Save & Share button */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
        background: "linear-gradient(to top, #0B0E11 70%, rgba(11,14,17,0) 100%)",
      }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCopy}
          style={{
            width: "100%", padding: "15px", borderRadius: 14,
            background: `linear-gradient(135deg, ${D.gold}, #A07030)`,
            border: "none", color: "#0a0800", fontSize: 15, fontWeight: 800,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: `0 6px 24px rgba(201,168,76,0.35)`,
          }}
        >
          <Share2 size={16} />
          Save and Share Address
        </motion.button>
      </div>

      {/* Deposit History screen — slides in from the right */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            key="history-screen"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            style={{ position: "absolute", inset: 0, background: D.bg, display: "flex", flexDirection: "column", zIndex: 20 }}
          >
            <DepositHistoryScreen
              onBack={() => setShowHistory(false)}
              onSelectItem={(item) => setSelectedDepositItem(item)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deposit Detail screen — slides in from the right */}
      <AnimatePresence>
        {selectedDepositItem && (
          <motion.div
            key="detail-screen"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            style={{ position: "absolute", inset: 0, background: D.bg, display: "flex", flexDirection: "column", zIndex: 30 }}
          >
            <DepositDetailScreen
              item={selectedDepositItem}
              address={address}
              onBack={() => setSelectedDepositItem(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ / User Guidance screen — slides in from the right */}
      <AnimatePresence>
        {showFAQ && (
          <motion.div
            key="faq-screen"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            style={{ position: "absolute", inset: 0, background: D.bg, display: "flex", flexDirection: "column", zIndex: 20 }}
          >
            <DepositFAQScreen onBack={() => setShowFAQ(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Important" contract address popup */}
      <AnimatePresence>
        {showImportant && network.contractSuffix && (
          <motion.div
            key="important-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 50, padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{
                background: "#1E2028", borderRadius: 20, padding: "28px 24px",
                width: "100%", maxWidth: 340, textAlign: "center",
                border: `1px solid ${D.border}`,
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: D.fg, marginBottom: 14 }}>Important</div>
              <div style={{ fontSize: 13, color: D.mid, lineHeight: 1.65, marginBottom: 22 }}>
                Please make sure the {coin.symbol} coin you are depositing ends with the contract address{" "}
                <strong style={{ color: D.fg }}>{network.contractSuffix}</strong>.
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowImp(false)}
                style={{
                  width: "100%", padding: "13px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${D.gold}, #A07030)`,
                  border: "none", color: "#0a0800", fontSize: 15, fontWeight: 800, cursor: "pointer",
                }}
              >
                Ok
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Export: CryptoDepositFlow ─────────────────────────────────────────── */
type FlowStep = "select-asset" | "choose-network" | "deposit-address";

export function CryptoDepositFlow({ open, onClose }: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep]                     = useState<FlowStep>("select-asset");
  const [selectedCoin, setSelectedCoin]     = useState<Coin | null>(null);
  const [selectedNetwork, setSelectedNet]   = useState<Network | null>(null);
  const [profile, setProfile]               = useState<UserCryptoProfile | null>(null);

  // Reset state and load profile whenever flow opens
  useEffect(() => {
    if (open) {
      setStep("select-asset");
      setSelectedCoin(null);
      setSelectedNet(null);
      const uid = auth.currentUser?.uid ?? "guest-okzbyte-user";
      setProfile(getUserCryptoProfile(uid));
    }
  }, [open]);

  const handleSelectCoin = (coin: Coin) => {
    setSelectedCoin(coin);
    setStep("choose-network");
  };

  const handleSelectNetwork = (net: Network) => {
    setSelectedNet(net);
    setStep("deposit-address");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="deposit-flow-root"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: D.bg,
            display: "flex", flexDirection: "column",
          }}
        >
          {/* Step 1: Select Asset — always rendered as the base */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
            <Step1SelectAsset onBack={onClose} onSelect={handleSelectCoin} />

            {/* Step 2: Network bottom sheet — overlays Step 1 */}
            <Step2ChooseNetwork
              open={step === "choose-network"}
              coin={selectedCoin}
              onBack={() => setStep("select-asset")}
              onSelect={handleSelectNetwork}
            />

            {/* Step 3: Deposit address — slides in from the right over both steps */}
            <AnimatePresence>
              {step === "deposit-address" && selectedCoin && selectedNetwork && profile && (
                <motion.div
                  key="step3"
                  initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 340, damping: 32 }}
                  style={{ position: "absolute", inset: 0, background: D.bg, display: "flex", flexDirection: "column" }}
                >
                  <Step3DepositAddress
                    coin={selectedCoin}
                    network={selectedNetwork}
                    onBack={() => setStep("choose-network")}
                    profile={profile}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
