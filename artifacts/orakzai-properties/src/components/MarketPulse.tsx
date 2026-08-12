import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

const markets = [
  {
    city: "Lahore",
    index: 247.8,
    change: +3.2,
    sentiment: "Bullish",
    volume: "1,240 deals",
    segments: [
      { label: "Residential", pct: 62 },
      { label: "Commercial", pct: 24 },
      { label: "Plots", pct: 14 },
    ],
  },
  {
    city: "Islamabad",
    index: 312.4,
    change: +1.7,
    sentiment: "Stable",
    volume: "890 deals",
    segments: [
      { label: "Residential", pct: 55 },
      { label: "Commercial", pct: 28 },
      { label: "Plots", pct: 17 },
    ],
  },
  {
    city: "Karachi",
    index: 198.1,
    change: -0.8,
    sentiment: "Cautious",
    volume: "2,100 deals",
    segments: [
      { label: "Residential", pct: 70 },
      { label: "Commercial", pct: 22 },
      { label: "Plots", pct: 8 },
    ],
  },
];

const sentimentColor: Record<string, string> = {
  Bullish: "text-emerald-400",
  Stable: "text-[#C9A84C]",
  Cautious: "text-orange-400",
};

const sentimentBg: Record<string, string> = {
  Bullish: "bg-emerald-500/10 border-emerald-500/20",
  Stable: "bg-[#C9A84C]/10 border-[#C9A84C]/20",
  Cautious: "bg-orange-500/10 border-orange-500/20",
};

const MiniChart = ({ change }: { change: number }) => {
  const points =
    change > 0
      ? [20, 18, 22, 17, 24, 20, 26, 22, 28]
      : change < 0
        ? [28, 24, 26, 22, 24, 20, 22, 18, 20]
        : [22, 24, 21, 23, 22, 24, 22, 23, 22];

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const h = 32;
  const w = 80;
  const step = w / (points.length - 1);
  const toY = (v: number) => h - ((v - min) / range) * (h - 4) - 2;

  const pathD = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${i * step},${toY(v)}`)
    .join(" ");

  const color = change > 0 ? "#10b981" : change < 0 ? "#f97316" : "#C9A84C";

  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function MarketPulse() {
  return (
    <div className="rounded-2xl border border-[#C9A84C]/20 bg-gradient-to-br from-[#0d1e30] to-[#0a1220] overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-white/5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#C9A84C]" />
            <span className="font-semibold text-white text-sm">Investment Pulse</span>
          </div>
          <div className="text-[#4a6080] text-[11px] mt-0.5">Pakistan Real Estate Market Sentiment</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-[10px] font-semibold">LIVE</span>
        </div>
      </div>

      <div className="divide-y divide-white/5">
        {markets.map((m, i) => (
          <motion.div
            key={m.city}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="px-5 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[#f1f5f9] text-sm">{m.city}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sentimentBg[m.sentiment]} ${sentimentColor[m.sentiment]}`}>
                    {m.sentiment}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#f1f5f9] font-bold text-base">{m.index}</span>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${m.change > 0 ? "text-emerald-400" : m.change < 0 ? "text-orange-400" : "text-[#94a3b8]"}`}>
                    {m.change > 0 ? <TrendingUp className="h-3 w-3" /> : m.change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {m.change > 0 ? "+" : ""}{m.change}%
                  </span>
                  <span className="text-[#4a6080] text-[11px]">{m.volume}</span>
                </div>

                {/* Segment bar */}
                <div className="mt-2.5 flex rounded-full overflow-hidden h-1.5 gap-0.5">
                  {m.segments.map((seg, si) => (
                    <motion.div
                      key={seg.label}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${seg.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + si * 0.1, duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{
                        background: si === 0 ? "#C9A84C" : si === 1 ? "#3b82f6" : "#8b5cf6",
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-3 mt-1.5">
                  {m.segments.map((seg, si) => (
                    <span key={seg.label} className="text-[10px] text-[#4a6080] flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: si === 0 ? "#C9A84C" : si === 1 ? "#3b82f6" : "#8b5cf6" }} />
                      {seg.label} {seg.pct}%
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0 opacity-70">
                <MiniChart change={m.change} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
