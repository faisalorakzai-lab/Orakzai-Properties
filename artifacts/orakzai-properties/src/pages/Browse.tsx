import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import PropertyCard from "@/components/PropertyCard";
import { useListProperties } from "@workspace/api-client-react";
import type { ListPropertiesParams } from "@workspace/api-client-react";

export default function Browse() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [type, setType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const params: ListPropertiesParams = {};
  if (search) params.search = search;
  if (city) params.city = city;
  if (category) params.category = category;
  if (type) params.type = type;
  if (minPrice) params.minPrice = Number(minPrice);
  if (maxPrice) params.maxPrice = Number(maxPrice);

  const { data: properties, isLoading } = useListProperties(params);

  const clearFilters = () => {
    setSearch(""); setCity(""); setCategory(""); setType(""); setMinPrice(""); setMaxPrice("");
  };

  const hasFilters = search || city || category || type || minPrice || maxPrice;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <div className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase mb-2">Browse Listings</div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">Property Marketplace</h1>
            <p className="text-[#94a3b8] text-sm mt-1">Discover premium properties across Pakistan's top cities</p>
          </div>

          {/* Search Bar */}
          <div className="bg-white/5 backdrop-blur-sm border border-[#C9A84C]/20 rounded-2xl p-4 mb-6">
            <div className="flex gap-3 items-center flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                <Input
                  placeholder="Search by title, area, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9] placeholder:text-[#4a6080] h-10"
                  data-testid="input-browse-search"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 gap-1.5 h-10"
                data-testid="button-toggle-filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters {hasFilters && <span className="bg-[#C9A84C] text-[#0a1220] rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">!</span>}
              </Button>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#94a3b8] hover:text-red-400 gap-1 h-10" data-testid="button-clear-filters">
                  <X className="h-4 w-4" /> Clear
                </Button>
              )}
            </div>

            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-[#1e3a5f] grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                <div>
                  <Label className="text-[#94a3b8] text-xs mb-1.5 block">City</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9] h-9 text-sm" data-testid="filter-city">
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1929] border-[#1e3a5f] text-[#f1f5f9]">
                      <SelectItem value="Lahore">Lahore</SelectItem>
                      <SelectItem value="Islamabad">Islamabad</SelectItem>
                      <SelectItem value="Karachi">Karachi</SelectItem>
                      <SelectItem value="Rawalpindi">Rawalpindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#94a3b8] text-xs mb-1.5 block">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9] h-9 text-sm" data-testid="filter-category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1929] border-[#1e3a5f] text-[#f1f5f9]">
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#94a3b8] text-xs mb-1.5 block">Property Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9] h-9 text-sm" data-testid="filter-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1929] border-[#1e3a5f] text-[#f1f5f9]">
                      <SelectItem value="plot">Plot</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#94a3b8] text-xs mb-1.5 block">Price Range (PKR)</Label>
                  <div className="flex gap-1">
                    <Input
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9] h-9 text-sm"
                      data-testid="filter-min-price"
                    />
                    <Input
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="bg-[#0a1929] border-[#1e3a5f] text-[#f1f5f9] h-9 text-sm"
                      data-testid="filter-max-price"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-[#94a3b8] text-sm">
              {isLoading ? "Loading..." : `${properties?.length ?? 0} properties found`}
            </p>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <PropertyCard {...p} price={Number(p.price)} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <Search className="h-12 w-12 text-[#C9A84C]/30 mx-auto mb-4" />
              <h3 className="font-serif text-xl text-white mb-2">No Properties Found</h3>
              <p className="text-[#94a3b8] text-sm mb-6">Try adjusting your search filters or clear them to see all listings.</p>
              <Button onClick={clearFilters} className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-semibold">Clear Filters</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
