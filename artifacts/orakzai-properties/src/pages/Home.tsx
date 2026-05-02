import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, MapPin, TrendingUp, Shield, Building, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { useListProperties, useGetPropertyStats, useListProjects } from "@workspace/api-client-react";
import { Link } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");

  const { data: properties } = useListProperties({});
  const { data: stats } = useGetPropertyStats();
  const { data: projects } = useListProjects();

  const featured = properties?.slice(0, 6) ?? [];
  const project = projects?.[0];

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    setLocation(`/browse?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050d1a] via-[#0a1929] to-[#0f2040]" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #C9A84C22 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1e3a5f44 0%, transparent 50%)" }} />
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M0 0h1v60H0zM30 0h1v60H30zM60 0h1v60H60zM0 0v1h60V0zM0 30v1h60V30zM0 60v1h60V60z' fill='%23C9A84C' fill-opacity='0.5'/%3E%3C/svg%3E\")" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full px-4 py-1.5 mb-6">
              <Star className="h-3.5 w-3.5 text-[#C9A84C] fill-[#C9A84C]" />
              <span className="text-[#C9A84C] text-xs font-semibold tracking-wider uppercase">Pakistan's Premium Real Estate</span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight mb-4">
              Find Your
              <span className="block text-[#C9A84C]">Dream Property</span>
            </h1>
            <p className="text-[#94a3b8] text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Orakzai Properties — Lahore & Islamabad's most trusted name in premium real estate. Buy, sell, and rent with confidence.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-md border border-[#C9A84C]/20 rounded-2xl p-4 md:p-6 max-w-4xl mx-auto shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                <Input
                  placeholder="Search properties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9 bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9] placeholder:text-[#4a6080] h-11"
                  data-testid="input-search"
                />
              </div>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9] h-11" data-testid="select-city">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f1929] border-[#1e3a5f] text-[#f1f5f9]">
                  <SelectItem value="Lahore">Lahore</SelectItem>
                  <SelectItem value="Islamabad">Islamabad</SelectItem>
                  <SelectItem value="Karachi">Karachi</SelectItem>
                  <SelectItem value="Rawalpindi">Rawalpindi</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold h-11"
                data-testid="button-search"
              >
                Search
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {["buy", "rent", "sell"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat === category ? "" : cat); }}
                  data-testid={`filter-category-${cat}`}
                  className={`text-xs px-3 py-1 rounded-full border transition-all capitalize ${category === cat ? "bg-[#C9A84C] border-[#C9A84C] text-[#0a1220] font-semibold" : "border-[#1e3a5f] text-[#94a3b8] hover:border-[#C9A84C]/50"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
          <div className="h-6 w-0.5 bg-gradient-to-b from-[#C9A84C]/50 to-transparent" />
        </div>
      </section>

      {/* Stats Banner */}
      {stats && (
        <section className="border-y border-[#C9A84C]/20 bg-[#0a1220]/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#C9A84C] font-serif">{stats.total}+</div>
                <div className="text-[#94a3b8] text-sm mt-1">Total Listings</div>
              </div>
              {stats.byCity.slice(0, 2).map((c) => (
                <div key={c.label} className="text-center">
                  <div className="text-3xl font-bold text-[#C9A84C] font-serif">{c.count}</div>
                  <div className="text-[#94a3b8] text-sm mt-1">{c.label} Properties</div>
                </div>
              ))}
              <div className="text-center">
                <div className="text-3xl font-bold text-[#C9A84C] font-serif">100%</div>
                <div className="text-[#94a3b8] text-sm mt-1">Verified Listings</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Properties */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-2">Handpicked For You</div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">Featured Properties</h2>
            </div>
            <Link href="/browse">
              <Button variant="ghost" className="text-[#C9A84C] hover:text-[#e8c060] gap-1 hidden md:flex">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <PropertyCard {...p} price={Number(p.price)} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[#94a3b8]">No properties listed yet.</div>
          )}
          <div className="text-center mt-8 md:hidden">
            <Link href="/browse">
              <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-semibold">Browse All Properties</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Azan Smart City Banner */}
      {project && (
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden border border-[#C9A84C]/40 bg-gradient-to-br from-[#0f2040] via-[#1a3060] to-[#0a1220] shadow-2xl shadow-[#C9A84C]/10">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #C9A84C 0%, transparent 60%)" }} />
              <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='80' height='80' fill='none'/%3E%3Cpath d='M0 40h80M40 0v80' stroke='%23C9A84C' stroke-width='0.5'/%3E%3C/svg%3E\")" }} />
              <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-[#C9A84C]/20 border border-[#C9A84C]/40 rounded-full px-3 py-1 mb-4">
                    <TrendingUp className="h-3.5 w-3.5 text-[#C9A84C]" />
                    <span className="text-[#C9A84C] text-xs font-semibold tracking-wider uppercase">Flagship Mega Project</span>
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">{project.name}</h2>
                  <p className="text-[#94a3b8] mb-2 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[#C9A84C]" />{project.location}</p>
                  <p className="text-[#b0c0d0] text-sm mb-6 line-clamp-3">{project.description}</p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {project.plotSizes.slice(0, 4).map((s) => (
                      <span key={s} className="text-xs bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] px-3 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs text-[#94a3b8] mb-2">
                      <span>Development Progress</span>
                      <span className="text-[#C9A84C] font-semibold">{project.progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-[#0a1220] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#e8c060]"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${project.progressPercent}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 0.3 }}
                      />
                    </div>
                  </div>
                  <Link href="/project/azan-smart-city">
                    <Button className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold gap-2">
                      Explore Project <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:flex flex-col gap-4 min-w-[200px]">
                  <div className="bg-white/5 border border-[#C9A84C]/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-[#C9A84C] font-serif">PKR {(Number(project.pricePerMarla) / 100000).toFixed(0)}L</div>
                    <div className="text-[#94a3b8] text-xs mt-1">Starting per Marla</div>
                  </div>
                  <div className="bg-white/5 border border-[#C9A84C]/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white font-serif">{project.totalPlots?.toLocaleString()}</div>
                    <div className="text-[#94a3b8] text-xs mt-1">Total Plots</div>
                  </div>
                  <div className="bg-white/5 border border-[#C9A84C]/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400 font-serif capitalize">{project.status}</div>
                    <div className="text-[#94a3b8] text-xs mt-1">Project Status</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why Orakzai */}
      <section className="py-16 px-4 border-t border-[#C9A84C]/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-2">Why Choose Us</div>
            <h2 className="font-serif text-3xl font-bold text-white">The Orakzai Promise</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Verified Listings", desc: "Every property is personally vetted by our team before listing. No fraud, no fake listings." },
              { icon: Building, title: "Premium Inventory", desc: "Exclusive access to Lahore and Islamabad's finest residential, commercial, and plot inventory." },
              { icon: TrendingUp, title: "Investment Expertise", desc: "15+ years of market intelligence helping clients maximize their real estate returns." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white/5 border border-[#C9A84C]/15 rounded-2xl p-6 hover:border-[#C9A84C]/40 transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-[#C9A84C]" />
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-[#94a3b8] text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#C9A84C]/10 bg-[#050d1a] py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-[#C9A84C]" />
            <span className="font-serif text-[#C9A84C] font-semibold">Orakzai Properties</span>
          </div>
          <p className="text-[#4a6080] text-xs">© 2025 Orakzai Properties. All rights reserved. Lahore & Islamabad.</p>
        </div>
      </footer>
    </div>
  );
}
