import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Search,
  ArrowLeftRight,
  KeyRound,
  TrendingUp,
  Shuffle,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const services = [
  {
    id: "search",
    icon: Search,
    label: "Search",
    sublabel: "Browse all listings",
    href: "/browse",
    gradient: "from-[#1a2a40] to-[#0f1929]",
    iconBg: "bg-[#C9A84C]/15 border-[#C9A84C]/30",
    iconColor: "text-[#C9A84C]",
    badge: null,
  },
  {
    id: "buy-sell",
    icon: ArrowLeftRight,
    label: "Buy / Sell",
    sublabel: "Post & find sale properties",
    href: "/browse?category=buy",
    gradient: "from-[#1a2840] to-[#0f1929]",
    iconBg: "bg-emerald-500/15 border-emerald-500/25",
    iconColor: "text-emerald-400",
    badge: null,
  },
  {
    id: "rent",
    icon: KeyRound,
    label: "Rent",
    sublabel: "Long & short-term rentals",
    href: "/browse?category=rent",
    gradient: "from-[#1f1a3a] to-[#0f1929]",
    iconBg: "bg-violet-500/15 border-violet-500/25",
    iconColor: "text-violet-400",
    badge: null,
  },
  {
    id: "invest",
    icon: TrendingUp,
    label: "Invest",
    sublabel: "High-ROI developments",
    href: "/project/azan-smart-city",
    gradient: "from-[#2a1f10] to-[#0f1929]",
    iconBg: "bg-amber-500/15 border-amber-500/25",
    iconColor: "text-amber-400",
    badge: "HOT",
  },
  {
    id: "trade",
    icon: Shuffle,
    label: "Trade",
    sublabel: "Secondary property market",
    href: "/browse",
    gradient: "from-[#1a2a30] to-[#0f1929]",
    iconBg: "bg-cyan-500/15 border-cyan-500/25",
    iconColor: "text-cyan-400",
    badge: "NEW",
  },
  {
    id: "portfolio",
    icon: BarChart3,
    label: "Portfolio",
    sublabel: "Your assets & growth",
    href: "/my-properties",
    gradient: "from-[#1a2a20] to-[#0f1929]",
    iconBg: "bg-teal-500/15 border-teal-500/25",
    iconColor: "text-teal-400",
    badge: null,
  },
];

export default function ServiceGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
      {services.map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.07 }}
        >
          <Link href={s.href}>
            <div
              data-testid={`service-card-${s.id}`}
              className={`group relative rounded-2xl border border-white/8 bg-gradient-to-br ${s.gradient} p-4 md:p-5 cursor-pointer hover:border-[#C9A84C]/40 hover:shadow-lg hover:shadow-[#C9A84C]/5 transition-all duration-300 overflow-hidden`}
            >
              {/* shimmer on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.04) 0%, transparent 60%)" }} />

              <div className="relative z-10">
                {s.badge && (
                  <div className="absolute -top-1 -right-1 bg-[#C9A84C] text-[#0a1220] text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-full">
                    {s.badge}
                  </div>
                )}
                <div className={`h-10 w-10 md:h-11 md:w-11 rounded-xl border ${s.iconBg} flex items-center justify-center mb-3`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <div className="font-semibold text-[#f1f5f9] text-sm md:text-base leading-tight mb-1">{s.label}</div>
                <div className="text-[#6a7f99] text-[11px] leading-tight line-clamp-1">{s.sublabel}</div>
                <div className={`mt-3 flex items-center gap-1 ${s.iconColor} text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>
                  Explore <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
