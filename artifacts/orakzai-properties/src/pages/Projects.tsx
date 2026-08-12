import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import {
  Search, MapPin, X, Building2, HardHat, Star, Users,
  ChevronDown, Bookmark, BookmarkCheck, ShoppingCart,
  KeyRound, CreditCard, ChevronRight, Globe, TrendingUp,
  BadgeCheck, List, Eye, Sparkles, LayoutGrid,
  ArrowRightLeft, CalendarCheck, Layers, Filter,
  SlidersHorizontal, ArrowUpDown, UserCheck, Briefcase,
  Wrench, Package, Phone, Award, Clock, Zap,
  Building, Hammer, Paintbrush, Truck, MessageCircle,
  CheckCircle2, MapPinned, ShieldCheck, ThumbsUp,
} from "lucide-react";

/* ── Design tokens ─────────────────────────────────────────────────── */
const T = {
  bg:        "#04080F",
  panel:     "rgba(255,255,255,0.028)",
  border:    "rgba(255,255,255,0.065)",
  borderGold:"rgba(201,168,76,0.35)",
  gold:      "#C9A84C",
  goldFaint: "rgba(201,168,76,0.06)",
  goldGlow:  "rgba(201,168,76,0.18)",
  fg:        "#EEF2FF",
  dim:       "#6B7591",
  dimMid:    "#9AA2B8",
  green:     "#10B981",
  greenGlow: "rgba(16,185,129,0.18)",
  red:       "#F43F5E",
  purple:    "#8B5CF6",
  cyan:      "#22D3EE",
  card:      "rgba(10,16,28,0.80)",
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? "https://uvgtgeauhjbdatrmmaob.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_VuaEqan3EBtGHbpTI0KdJg_OimrHkqM"
);

/* ─────────────────── TYPES ─────────────────────────────────────────── */
interface Project {
  id: number; title: string; subtitle: string; location: string;
  city: string; city2: string; country: string; type: string;
  listing_type: string; transaction_type: string;
  min_investment: number; min_label: string; roi: string;
  duration: string; status: string; funded_percent: number;
  investors: number; featured: boolean; installment: boolean;
  possession: string; image: string; developer: string; tags: string[];
}

interface Professional {
  id: number;
  name: string;
  company?: string;
  category: string;         // "agent" | "agency" | "builder" | "private_seller" | "off_plan" | "construction" | "architect" | "interior"
  sub_category: string;     // maps to sub-filter values
  verified: boolean;
  featured: boolean;
  location: string;
  city: string;
  country: string;
  avatar: string;
  rating: number;
  reviews: number;
  experience_years: number;
  active_listings?: number;
  completed_projects?: number;
  specializations: string[];
  description: string;
  phone?: string;
  whatsapp?: string;
  status: string;           // "approved" | "pending"
}

interface Supplier {
  id: number;
  name: string;
  sub_category: string;     // "steel_cement" | "bricks_blocks" | "tiles_sanitary" | "hardware"
  verified: boolean;
  featured: boolean;
  location: string;
  city: string;
  country: string;
  logo: string;
  rating: number;
  reviews: number;
  products: string[];
  min_order: string;
  delivery: string;
  bulk_discount: boolean;
  description: string;
  phone?: string;
  status: string;
}

interface ServiceProvider {
  id: number;
  name: string;
  trade: string;            // "plumber" | "electrician" | "hvac" | "painter" | "carpenter"
  verified: boolean;
  featured: boolean;
  location: string;
  city: string;
  country: string;
  avatar: string;
  rating: number;
  reviews: number;
  experience_years: number;
  hourly_rate?: string;
  job_rate?: string;
  coverage_areas: string[];
  skills: string[];
  availability: string;     // "Available Now" | "Busy" | "Available Tomorrow"
  description: string;
  phone?: string;
  status: string;
}

/* ─────────────────── SEED DATA ─────────────────────────────────────── */
const SEED_PROJECTS: Project[] = [
  { id:1,  title:"Azan Smart City",          subtitle:"Pakistan's first fully integrated smart city — CPEC corridor",     location:"Chakri Road, Rawalpindi",      city:"Rawalpindi",city2:"Rawalpindi",country:"Pakistan",type:"Residential",listing_type:"marketplace",transaction_type:"buy",        min_investment:2500000, min_label:"₨ 25L",  roi:"22% p.a.",duration:"3 Years", status:"Phase 1", funded_percent:68,investors:342, featured:true, installment:false,possession:"2026",image:"https://images.unsplash.com/photo-1448630360428-65456885c650?w=700&q=85",developer:"Azan Developers",      tags:["Smart City","CPEC","Eco-Friendly"]},
  { id:2,  title:"DHA Lahore Phase 9",        subtitle:"Premium residential plots in the most coveted address in Lahore",  location:"DHA Phase 9, Lahore",         city:"Lahore",    city2:"Lahore",   country:"Pakistan",type:"Residential",listing_type:"marketplace",transaction_type:"buy",        min_investment:5000000, min_label:"₨ 50L",  roi:"16% p.a.",duration:"2 Years", status:"Active",  funded_percent:81,investors:218, featured:false,installment:true, possession:"Ready",image:"https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=700&q=85",developer:"DHA Lahore",           tags:["Verified","Ready","Prime"]},
  { id:3,  title:"Capital Smart City",        subtitle:"Award-winning smart city on the CPEC corridor near Islamabad",    location:"CPEC Route, Islamabad",        city:"Islamabad", city2:"Islamabad",country:"Pakistan",type:"Mixed Use",  listing_type:"marketplace",transaction_type:"installment",min_investment:3500000, min_label:"₨ 35L",  roi:"18% p.a.",duration:"4 Years", status:"Funding", funded_percent:54,investors:507, featured:true, installment:true, possession:"2027",image:"https://images.unsplash.com/photo-1466442929976-97f336a657be?w=700&q=85",developer:"Future Dev Holdings",  tags:["Smart City","Installment","Overseas"]},
  { id:4,  title:"Bahria Heights – Karachi",  subtitle:"High-rise luxury residential & commercial in Pakistan's mega city",location:"Bahria Town, Karachi",        city:"Karachi",   city2:"Karachi",  country:"Pakistan",type:"Commercial", listing_type:"marketplace",transaction_type:"rent",        min_investment:1000000, min_label:"₨ 10L",  roi:"20% p.a.",duration:"2 Years", status:"Active",  funded_percent:73,investors:891, featured:false,installment:false,possession:"Ready",image:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=700&q=85",developer:"Bahria Town",          tags:["High-Rise","Commercial","Rental"]},
  { id:5,  title:"Gulberg Galleria",          subtitle:"Prime commercial plaza in Lahore's thriving business district",   location:"Gulberg III, Lahore",         city:"Lahore",    city2:"Lahore",   country:"Pakistan",type:"Commercial", listing_type:"marketplace",transaction_type:"rent",        min_investment:2000000, min_label:"₨ 20L",  roi:"19% p.a.",duration:"3 Years", status:"Pre-Launch",funded_percent:22,investors:97,  featured:false,installment:true, possession:"2026",image:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=85",developer:"Gulberg Developers",   tags:["Commercial","Pre-Launch","Prime"]},
  { id:6,  title:"Blue World City Overseas",  subtitle:"Pakistan's largest tourism real estate project on CPEC",          location:"Chakri Interchange, Islamabad",city:"Islamabad", city2:"Islamabad",country:"Pakistan",type:"Residential",listing_type:"marketplace",transaction_type:"installment",min_investment:500000,  min_label:"₨ 5L",   roi:"14% p.a.",duration:"5 Years", status:"Active",  funded_percent:61,investors:1240,featured:false,installment:true, possession:"2028",image:"https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=700&q=85",developer:"Blue Group",           tags:["Overseas","Tourism","Installment"]},
  { id:7,  title:"Orakzai Heights Tower",     subtitle:"25-storey luxury mixed-use tower — DHA Lahore flagship project", location:"DHA Phase 6, Lahore",         city:"Lahore",    city2:"Lahore",   country:"Pakistan",type:"Mixed Use",  listing_type:"construction",transaction_type:"buy",        min_investment:5000000, min_label:"₨ 50L",  roi:"22% p.a.",duration:"36 Months",status:"Phase 2", funded_percent:55,investors:189, featured:true, installment:true, possession:"2026",image:"https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=85",developer:"Orakzai Properties",  tags:["Flagship","Luxury Tower","DHA"]},
  { id:8,  title:"Ring Road Corridor",        subtitle:"Industrial & commercial plots along the new ring road",           location:"Ring Road, Rawalpindi",       city:"Rawalpindi",city2:"Rawalpindi",country:"Pakistan",type:"Industrial", listing_type:"construction",transaction_type:"buy",        min_investment:1500000, min_label:"₨ 15L",  roi:"21% p.a.",duration:"3 Years", status:"Active",  funded_percent:47,investors:183, featured:false,installment:false,possession:"2025",image:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=85",developer:"Ring Road Authority",  tags:["Industrial","Commercial","Infrastructure"]},
  { id:9,  title:"Orakzai Ocean Tower Dubai", subtitle:"Premium waterfront serviced apartments in Dubai Maritime City",  location:"Dubai Maritime City, UAE",    city:"Dubai",     city2:"Dubai",    country:"UAE",     type:"Residential",listing_type:"marketplace",transaction_type:"buy",        min_investment:15000000,min_label:"₨ 1.5Cr",roi:"9.75% p.a.",duration:"2 Years",status:"Active",  funded_percent:72,investors:94,  featured:true, installment:false,possession:"2025",image:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=700&q=85",developer:"Orakzai Properties",  tags:["Dubai","Waterfront","International"]},
];

const SEED_PROFESSIONALS: Professional[] = [
  // Agents
  { id:1, name:"Usman Malik", company:"Elite Property Consultants", category:"agent", sub_category:"independent", verified:true, featured:true,  location:"DHA Phase 5, Lahore",    city:"Lahore",    country:"Pakistan", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", rating:4.9, reviews:187, experience_years:12, active_listings:34, completed_projects:210, specializations:["DHA Lahore","Bahria Town","Investment Properties"], description:"Top-rated independent agent with 12+ years in DHA and Bahria Town. Specializes in high-yield investment properties.", status:"approved" },
  { id:2, name:"Sara Ahmed",  company:"Sara Ahmed – Independent Agent", category:"agent", sub_category:"independent", verified:true, featured:false, location:"F-7, Islamabad",          city:"Islamabad", country:"Pakistan", avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80", rating:4.7, reviews:94,  experience_years:7,  active_listings:18, completed_projects:132, specializations:["Islamabad Sectors","Apartments","Commercial"],     description:"Certified property consultant in Islamabad. Expert in F & G sector residential and commercial.", status:"approved" },
  { id:3, name:"Orakzai Properties", company:"Orakzai Properties – Lahore HQ", category:"agency", sub_category:"agency", verified:true, featured:true, location:"Gulberg III, Lahore",    city:"Lahore",    country:"Pakistan", avatar:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&q=80", rating:5.0, reviews:412, experience_years:15, active_listings:120,completed_projects:680, specializations:["Luxury Towers","Investment","Off-Plan Projects","UAE"], description:"Pakistan's premier real estate investment firm with presence in Lahore, Islamabad, Karachi, and Dubai.", status:"approved" },
  { id:4, name:"Pak Realty Group", company:"Pak Realty Group – Karachi", category:"agency", sub_category:"agency", verified:true, featured:false, location:"Clifton, Karachi",       city:"Karachi",   country:"Pakistan", avatar:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80", rating:4.6, reviews:228, experience_years:10, active_listings:87, completed_projects:445, specializations:["Karachi","Commercial","Bahria Town Karachi"],       description:"Leading real estate agency in Karachi, serving DHA, Bahria, and Clifton markets.", status:"approved" },
  // Developers
  { id:5, name:"Future Dev Holdings", company:"Future Dev Holdings", category:"builder", sub_category:"builder", verified:true, featured:true,  location:"CPEC Route, Islamabad",  city:"Islamabad", country:"Pakistan", avatar:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80", rating:4.8, reviews:142, experience_years:20, active_listings:5,  completed_projects:12, specializations:["Smart Cities","CPEC Projects","Mixed Use"],          description:"Award-winning developer behind Capital Smart City. Pioneer of sustainable, tech-integrated communities.", status:"approved" },
  { id:6, name:"Ahmad Khan",  company:"AK Private Seller", category:"private_seller", sub_category:"private_seller", verified:true, featured:false, location:"Johar Town, Lahore",     city:"Lahore",    country:"Pakistan", avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80", rating:4.5, reviews:18,  experience_years:0,  active_listings:3,  completed_projects:8,  specializations:["5 Marla","Residential","Johar Town"],               description:"Private seller with 3 fully constructed houses in Johar Town. No agent, direct owner deal.", status:"approved" },
  { id:7, name:"Blue Group",  company:"Blue Group of Companies", category:"off_plan",  sub_category:"off_plan",  verified:true, featured:true,  location:"Chakri Interchange, Islamabad",city:"Islamabad",country:"Pakistan",avatar:"https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=200&q=80", rating:4.7, reviews:324, experience_years:18, active_listings:8,  completed_projects:6,  specializations:["Off-Plan","Tourism City","CPEC","Installment"],      description:"Pioneers of off-plan tourism real estate in Pakistan. Blue World City spans 5,000+ acres.", status:"approved" },
  // Contractors & Designers
  { id:8, name:"Horizon Builders",  company:"Horizon Construction Co.", category:"construction", sub_category:"construction", verified:true, featured:true,  location:"DHA Phase 8, Lahore",   city:"Lahore",  country:"Pakistan", avatar:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80", rating:4.8, reviews:76, experience_years:15, active_listings:0, completed_projects:43, specializations:["Grey Structure","Finishing","Commercial Builds"],    description:"ISO-certified construction firm. Complete build solutions from excavation to finishing.", status:"approved" },
  { id:9, name:"Zara Design Studio", company:"Zara Design Studio",      category:"interior",     sub_category:"interior",     verified:true, featured:true,  location:"Gulberg II, Lahore",    city:"Lahore",  country:"Pakistan", avatar:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80", rating:5.0, reviews:51, experience_years:8,  active_listings:0, completed_projects:89, specializations:["Luxury Interiors","Commercial Fit-Out","3D Rendering"],description:"Award-winning interior design studio. Known for luxury residential and hotel projects.",  status:"approved" },
  { id:10,name:"ArchiVision",       company:"ArchiVision – Architecture",category:"architect",   sub_category:"architect",    verified:true, featured:false, location:"F-8, Islamabad",        city:"Islamabad",country:"Pakistan",avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",rating:4.6, reviews:33, experience_years:12, active_listings:0, completed_projects:61, specializations:["Residential Design","Smart Homes","PCATP Certified"],description:"PCATP-certified architectural firm. From concept to completion across Pakistan.",           status:"approved" },
];

const SEED_SUPPLIERS: Supplier[] = [
  { id:1, name:"Pak Steel Mart",      sub_category:"steel_cement",   verified:true, featured:true,  location:"SITE, Karachi",      city:"Karachi",   country:"Pakistan", logo:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80", rating:4.7, reviews:312, products:["Mild Steel Bars","TMT Bars","OPC Cement","PPC Cement"], min_order:"50 Bags / 1 Ton", delivery:"City-wide in 24h", bulk_discount:true, description:"Wholesale steel and cement supplier serving contractors and developers since 2001.", status:"approved" },
  { id:2, name:"GoldenBrick Co.",     sub_category:"bricks_blocks",  verified:true, featured:true,  location:"Bhalwal, Sargodha",  city:"Sargodha",  country:"Pakistan", logo:"https://images.unsplash.com/photo-1517646931032-20f27b9ce2cf?w=200&q=80", rating:4.5, reviews:178, products:["Red Clay Bricks","AAC Blocks","Fly Ash Bricks","Pavers"],   min_order:"5,000 Bricks",   delivery:"Nationwide in 48h",bulk_discount:true, description:"Premium brick manufacturer. Machine-pressed bricks with certified compression strength.", status:"approved" },
  { id:3, name:"TileWorld Pakistan",  sub_category:"tiles_sanitary", verified:true, featured:false, location:"Kot Lakhpat, Lahore",city:"Lahore",    country:"Pakistan", logo:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&q=80", rating:4.8, reviews:89,  products:["Porcelain Tiles","Sanitaryware","Vanities","Shower Systems"],min_order:"50 Sq ft",       delivery:"Lahore next-day",  bulk_discount:true, description:"Authorized dealer of Roca, Kohler, and local premium tile brands.",                    status:"approved" },
  { id:4, name:"BuildSmart Hardware", sub_category:"hardware",       verified:true, featured:false, location:"Hafeez Centre, Lahore",city:"Lahore",  country:"Pakistan", logo:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80", rating:4.4, reviews:64,  products:["PVC Fittings","Electrical Cables","Door Hardware","Power Tools"],min_order:"No Minimum",  delivery:"Same-day pickup",  bulk_discount:false,description:"One-stop hardware shop for contractors, builders, and DIY. 10,000+ SKUs in stock.",   status:"approved" },
];

const SEED_SERVICES: ServiceProvider[] = [
  { id:1, name:"Bilal Khan",      trade:"plumber",      verified:true, featured:true,  location:"DHA Phase 4, Lahore",    city:"Lahore",    country:"Pakistan", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", rating:4.9, reviews:214, experience_years:10, hourly_rate:"₨ 1,500/hr", job_rate:"₨ 3,000 – 15,000",coverage_areas:["DHA Lahore","Johar Town","Gulberg"], skills:["New Installation","Leak Repair","Water Heaters","Drainage"], availability:"Available Now",    description:"Licensed master plumber. Guaranteed leak-free work with 30-day warranty.", status:"approved" },
  { id:2, name:"Tariq Electricals",trade:"electrician",  verified:true, featured:true,  location:"G-11, Islamabad",        city:"Islamabad", country:"Pakistan", avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80", rating:4.8, reviews:167, experience_years:14, hourly_rate:"₨ 1,800/hr", job_rate:"₨ 2,500 – 25,000",coverage_areas:["G & F Sectors","Islamabad","Rawalpindi"], skills:["DB Board","Load Shedding Solutions","Solar Wiring","CCTV"],  availability:"Available Now",    description:"PNEC-certified master electrician. Residential, commercial, and industrial wiring.",  status:"approved" },
  { id:3, name:"CoolAir HVAC",    trade:"hvac",          verified:true, featured:false, location:"PECHS, Karachi",          city:"Karachi",   country:"Pakistan", avatar:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=80", rating:4.7, reviews:98,  experience_years:9,  hourly_rate:"₨ 2,000/hr", job_rate:"₨ 5,000 – 50,000",coverage_areas:["PECHS","Clifton","DHA Karachi"],       skills:["AC Installation","Maintenance","Duct Work","VRF Systems"],  availability:"Available Tomorrow",description:"Authorized service partner for Gree, Haier, and Daikin air conditioning systems.", status:"approved" },
  { id:4, name:"PaintPro Lahore", trade:"painter",       verified:true, featured:false, location:"Bahria Town, Lahore",    city:"Lahore",    country:"Pakistan", avatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80", rating:4.6, reviews:143, experience_years:8,  hourly_rate:"₨ 1,200/hr", job_rate:"₨ 8,000 – 80,000",coverage_areas:["Bahria Town","DHA Lahore","Raiwind Rd"],  skills:["Emulsion Paint","Epoxy Flooring","Wallpaper","Wood Polish"],  availability:"Available Now",    description:"Professional painting team. Interior/exterior, residential and commercial projects.",   status:"approved" },
  { id:5, name:"Master Carpenter", trade:"carpenter",    verified:true, featured:false, location:"Model Town, Lahore",     city:"Lahore",    country:"Pakistan", avatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80", rating:4.8, reviews:77,  experience_years:18, hourly_rate:"₨ 1,600/hr", job_rate:"₨ 5,000 – 120,000",coverage_areas:["Model Town","Garden Town","Johar Town"],  skills:["Custom Furniture","Kitchen Cabinets","Wardrobes","Door Frames"],availability:"Busy",           description:"18 years of custom furniture craftsmanship. Specializes in premium kitchen and wardrobe units.", status:"approved" },
];

/* ─────────────────── CATEGORY TABS ──────────────────────────────────── */
const PROPERTY_TABS = ["buy","sell","rent","booking","investment","installment"];
const PROFESSIONAL_TABS = ["agents","developers","contractors","suppliers","services"];

const CATEGORY_TABS = [
  { key:"buy",          label:"Buy",                    icon:ShoppingCart,  placeholder:"Search buy properties, areas…",          mode:"property"     },
  { key:"sell",         label:"Sell",                   icon:ArrowRightLeft,placeholder:"Search sell listings, cities…",           mode:"property"     },
  { key:"rent",         label:"Rent",                   icon:KeyRound,      placeholder:"Search rental properties…",               mode:"property"     },
  { key:"booking",      label:"Booking",                icon:CalendarCheck, placeholder:"Search pre-launch bookings…",             mode:"property"     },
  { key:"investment",   label:"Investment",             icon:TrendingUp,    placeholder:"Search investment projects…",             mode:"property"     },
  { key:"installment",  label:"Installment",            icon:CreditCard,    placeholder:"Search installment plans…",               mode:"property"     },
  { key:"agents",       label:"Agents & Agencies",      icon:UserCheck,     placeholder:"Search verified agents in your city…",   mode:"professional" },
  { key:"developers",   label:"Developers & Owners",    icon:Building,      placeholder:"Search builders, developers, sellers…",  mode:"professional" },
  { key:"contractors",  label:"Contractors & Designers",icon:Hammer,        placeholder:"Search architects, designers, builders…",mode:"professional" },
  { key:"suppliers",    label:"Suppliers",              icon:Package,       placeholder:"Search verified material suppliers…",    mode:"supplier"     },
  { key:"services",     label:"Services & Trades",      icon:Wrench,        placeholder:"Search plumbers, electricians, trades…", mode:"service"      },
];

/* ─────────────────── SUB-CATEGORIES ─────────────────────────────────── */
const SUB_CATEGORIES: Record<string, { key: string; label: string; placeholder: string }[]> = {
  agents: [
    { key:"all",         label:"All",                 placeholder:"Search verified agents in your city…"  },
    { key:"independent", label:"Independent Agents",  placeholder:"Search independent property agents…"   },
    { key:"agency",      label:"Registered Agencies", placeholder:"Search registered real estate agencies…"},
  ],
  developers: [
    { key:"all",           label:"All",               placeholder:"Search builders, developers, sellers…"  },
    { key:"builder",       label:"Builders & Developers",placeholder:"Search property builders & developers…"},
    { key:"private_seller",label:"Private Sellers",   placeholder:"Search direct owner & private sellers…" },
    { key:"off_plan",      label:"Off-Plan Projects",  placeholder:"Search off-plan & pre-launch projects…" },
  ],
  contractors: [
    { key:"all",          label:"All",                 placeholder:"Search architects, designers, builders…"},
    { key:"construction", label:"Construction Companies",placeholder:"Search construction companies…"       },
    { key:"architect",    label:"Architects",          placeholder:"Search certified architects in your city…"},
    { key:"interior",     label:"Interior Designers",  placeholder:"Search interior design studios…"        },
  ],
  suppliers: [
    { key:"all",           label:"All",                placeholder:"Search verified material suppliers…"    },
    { key:"steel_cement",  label:"Steel & Cement",     placeholder:"Search steel bars, cement, concrete…"  },
    { key:"bricks_blocks", label:"Bricks & Blocks",    placeholder:"Search bricks, AAC blocks, pavers…"    },
    { key:"tiles_sanitary",label:"Tiles & Sanitary",   placeholder:"Search tiles, sanitaryware, vanities…" },
    { key:"hardware",      label:"General Hardware",   placeholder:"Search hardware, fittings, tools…"     },
  ],
  services: [
    { key:"all",         label:"All",                  placeholder:"Search plumbers, electricians, trades…" },
    { key:"plumber",     label:"Plumber",              placeholder:"Search plumbers in your area…"          },
    { key:"electrician", label:"Electrician",          placeholder:"Search certified electricians near you…"},
    { key:"hvac",        label:"HVAC / AC",            placeholder:"Search AC installation & repair…"       },
    { key:"painter",     label:"Painter & Polisher",   placeholder:"Search painters & polishers…"           },
    { key:"carpenter",   label:"Carpenter",            placeholder:"Search carpenters & furniture makers…"  },
  ],
};

const COUNTRIES = [
  { label:"All Countries", value:"all"     },
  { label:"🇵🇰 Pakistan",  value:"Pakistan"},
  { label:"🇦🇪 UAE",       value:"UAE"     },
  { label:"🇹🇷 Turkey",    value:"Turkey"  },
  { label:"🇬🇧 UK",        value:"UK"      },
];

const OPT_CITIES = [
  { label:"All Cities",  value:"All Cities"},
  { label:"Lahore",      value:"Lahore"    },
  { label:"Islamabad",   value:"Islamabad" },
  { label:"Karachi",     value:"Karachi"   },
  { label:"Rawalpindi",  value:"Rawalpindi"},
  { label:"Dubai",       value:"Dubai"     },
];

const OPT_TYPES = [
  { label:"Asset Type",  value:"all"        },
  { label:"Apartments",  value:"Residential"},
  { label:"Plots",       value:"Plots"      },
  { label:"Commercial",  value:"Commercial" },
  { label:"Villas",      value:"Villas"     },
  { label:"Mixed Use",   value:"Mixed Use"  },
  { label:"Industrial",  value:"Industrial" },
];

const OPT_PRICE = [
  { label:"Price Range", value:"all"     },
  { label:"Under ₨ 10L", value:"under10" },
  { label:"₨ 10L – 50L", value:"10to50"  },
  { label:"₨ 50L – 1Cr", value:"50to100" },
  { label:"Above ₨ 1Cr", value:"above100"},
];

const OPT_SORT = [
  { label:"Featured",    value:"featured"  },
  { label:"Newest",      value:"newest"    },
  { label:"Highest ROI", value:"roi"       },
  { label:"Most Funded", value:"funded"    },
  { label:"Lowest Price",value:"minInvest" },
];

/* ─────────────────── SMALL UI HELPERS ───────────────────────────────── */
function StatusChip({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    "Active":     { color:T.green,  bg:T.greenGlow                   },
    "Phase 1":    { color:T.gold,   bg:T.goldFaint                   },
    "Phase 2":    { color:T.gold,   bg:T.goldFaint                   },
    "Funding":    { color:T.cyan,   bg:"rgba(34,211,238,0.1)"        },
    "Pre-Launch": { color:T.purple, bg:"rgba(139,92,246,0.12)"       },
    "Funded":     { color:T.green,  bg:T.greenGlow                   },
  };
  const cfg = map[status] ?? { color:T.dimMid, bg:"rgba(255,255,255,0.06)" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 9px", borderRadius:999, background:cfg.bg, border:`1px solid ${cfg.color}35`, color:cfg.color, fontSize:9, fontWeight:700 }}>
      <motion.span animate={{ opacity:[1,0.3,1] }} transition={{ duration:2, repeat:Infinity }}
        style={{ width:5, height:5, borderRadius:"50%", background:cfg.color, display:"inline-block" }} />
      {status}
    </span>
  );
}

function AvailabilityChip({ availability }: { availability: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    "Available Now":       { color:T.green,  bg:T.greenGlow                   },
    "Available Tomorrow":  { color:T.cyan,   bg:"rgba(34,211,238,0.1)"        },
    "Busy":                { color:T.red,    bg:"rgba(244,63,94,0.1)"         },
  };
  const cfg = map[availability] ?? { color:T.dimMid, bg:"rgba(255,255,255,0.06)" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 9px", borderRadius:999, background:cfg.bg, border:`1px solid ${cfg.color}35`, color:cfg.color, fontSize:9, fontWeight:700 }}>
      <motion.span animate={{ opacity:[1,0.3,1] }} transition={{ duration:2, repeat:Infinity }}
        style={{ width:5, height:5, borderRadius:"50%", background:cfg.color, display:"inline-block" }} />
      {availability}
    </span>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={9}
          color={i <= Math.round(rating) ? T.gold : T.border}
          fill={i <= Math.round(rating) ? T.gold : "none"} />
      ))}
    </div>
  );
}

function FundingBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? T.green : pct > 50 ? T.gold : T.cyan;
  return (
    <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
      <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(pct,100)}%` }} transition={{ duration:1.1, ease:"easeOut" }}
        style={{ height:"100%", borderRadius:2, background:`linear-gradient(90deg, ${color}, ${color}80)` }} />
    </div>
  );
}

function FilterPill({ value, options, onChange }: {
  value: string; options: { label: string; value: string }[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value) ?? options[0];
  const active = value !== options[0].value;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("touchstart", close); };
  }, [open]);

  return (
    <div ref={ref} style={{ position:"relative", flexShrink:0 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display:"flex", alignItems:"center", gap:5, height:34, padding:"0 12px", borderRadius:8, fontSize:12, fontWeight:active ? 700 : 500, cursor:"pointer", background:active ? T.goldFaint : "rgba(255,255,255,0.04)", border:active ? `1px solid ${T.borderGold}` : `1px solid ${T.border}`, color:active ? T.gold : T.dimMid, whiteSpace:"nowrap", transition:"all .15s", WebkitTapHighlightColor:"transparent" }}>
        {current.label}
        <ChevronDown size={10} style={{ transform:open ? "rotate(180deg)" : "none", transition:"transform .2s" }} />
      </button>
      {open && (
        <div style={{ position:"absolute", top:40, left:0, zIndex:9999, minWidth:160, borderRadius:12, overflow:"hidden", background:"rgba(8,14,28,0.99)", border:`1px solid ${T.borderGold}`, boxShadow:`0 16px 48px rgba(0,0,0,0.8)`, backdropFilter:"blur(20px)" }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 14px", fontSize:13, cursor:"pointer", color:value === opt.value ? T.gold : T.dimMid, fontWeight:value === opt.value ? 700 : 400, background:value === opt.value ? T.goldFaint : "transparent", border:"none", WebkitTapHighlightColor:"transparent" }}>
              {value === opt.value ? "✓  " : "   "}{opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CountrySelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = COUNTRIES.find(c => c.value === value) ?? COUNTRIES[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("touchstart", close); };
  }, [open]);

  return (
    <div ref={ref} style={{ position:"relative", flexShrink:0 }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display:"flex", alignItems:"center", gap:4, padding:"0 12px 0 10px", height:"100%", background:"none", border:"none", cursor:"pointer", color:value !== "all" ? T.gold : T.dimMid, fontSize:12, fontWeight:700, WebkitTapHighlightColor:"transparent", whiteSpace:"nowrap" }}>
        {current.label}
        <ChevronDown size={10} style={{ transform:open ? "rotate(180deg)" : "none", transition:"transform .2s", color:T.dim }} />
      </button>
      {open && (
        <div style={{ position:"absolute", top:52, right:0, zIndex:9999, minWidth:170, borderRadius:12, overflow:"hidden", background:"rgba(8,14,28,0.99)", border:`1px solid ${T.borderGold}`, boxShadow:`0 16px 48px rgba(0,0,0,0.8)`, backdropFilter:"blur(20px)" }}>
          {COUNTRIES.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ display:"block", width:"100%", textAlign:"left", padding:"11px 16px", fontSize:13, cursor:"pointer", color:value === opt.value ? T.gold : T.dimMid, fontWeight:value === opt.value ? 700 : 400, background:value === opt.value ? T.goldFaint : "transparent", border:"none", WebkitTapHighlightColor:"transparent" }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────── PROPERTY CARDS ─────────────────────────────────── */
function PropertyCard({ p, bookmarked, onBookmark }: { p: Project; bookmarked: boolean; onBookmark: () => void }) {
  const [, setLocation] = useLocation();
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ type:"spring", stiffness:220, damping:26 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => setLocation(`/invest/${p.id}`)}
      style={{ background:T.card, backdropFilter:"blur(12px)", border:`1px solid ${hov ? T.borderGold : (p.featured ? "rgba(201,168,76,0.18)" : T.border)}`, borderRadius:18, overflow:"hidden", cursor:"pointer", boxShadow:hov ? `0 20px 56px rgba(0,0,0,0.55)` : "0 4px 20px rgba(0,0,0,0.3)", transform:hov ? "translateY(-3px)" : "translateY(0)", transition:"all .25s" }}>

      <div style={{ position:"relative", height:170, overflow:"hidden" }}>
        <img src={p.image} alt={p.title}
          style={{ width:"100%", height:"100%", objectFit:"cover", transform:hov ? "scale(1.05)" : "scale(1)", transition:"transform .4s" }}
          onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=85"; }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(4,8,15,0) 25%, rgba(4,8,15,0.85) 100%)" }} />
        <div style={{ position:"absolute", top:10, left:10, display:"flex", gap:5, alignItems:"center" }}>
          {p.featured && (
            <div style={{ display:"flex", alignItems:"center", gap:3, background:`linear-gradient(135deg,${T.gold},#8B6010)`, borderRadius:20, padding:"3px 9px" }}>
              <Star size={8} color="#0a0800" fill="#0a0800" />
              <span style={{ fontSize:8, fontWeight:900, color:"#0a0800" }}>FEATURED</span>
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:3, background:"rgba(16,185,129,0.2)", border:"1px solid rgba(16,185,129,0.4)", borderRadius:20, padding:"3px 9px", fontSize:8, color:T.green, fontWeight:700 }}>
            <BadgeCheck size={7} /> Verified
          </div>
        </div>
        <motion.button whileTap={{ scale:0.85 }}
          onClick={e => { e.stopPropagation(); onBookmark(); }}
          style={{ position:"absolute", top:8, right:8, width:32, height:32, borderRadius:"50%", background:"rgba(4,8,15,0.72)", backdropFilter:"blur(8px)", border:`1px solid ${bookmarked ? T.borderGold : T.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" } as any}>
          {bookmarked ? <BookmarkCheck size={13} color={T.gold} /> : <Bookmark size={13} color={T.dimMid} />}
        </motion.button>
        <div style={{ position:"absolute", bottom:10, left:12, right:12 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#fff", marginBottom:3, textShadow:"0 1px 4px rgba(0,0,0,0.7)" }}>{p.title}</div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <MapPin size={8} color={T.gold} />
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.72)" }}>{p.location}</span>
          </div>
        </div>
      </div>

      <div style={{ padding:"12px 14px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:20, height:20, borderRadius:5, background:T.goldFaint, border:`1px solid ${T.borderGold}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Building2 size={9} color={T.gold} />
            </div>
            <span style={{ fontSize:10, color:T.dimMid, fontWeight:600 }}>{p.developer}</span>
          </div>
          <StatusChip status={p.status} />
        </div>
        <div style={{ display:"flex", gap:5, marginBottom:10 }}>
          <div style={{ flex:1, background:"rgba(201,168,76,0.06)", border:`1px solid rgba(201,168,76,0.15)`, borderRadius:8, padding:"7px 8px", textAlign:"center" as const }}>
            <div style={{ fontSize:12, fontWeight:800, color:T.gold }}>{p.min_label}</div>
            <div style={{ fontSize:8, color:T.dim, marginTop:1 }}>Entry Price</div>
          </div>
          <div style={{ flex:1, background:"rgba(16,185,129,0.06)", border:`1px solid rgba(16,185,129,0.15)`, borderRadius:8, padding:"7px 8px", textAlign:"center" as const }}>
            <div style={{ fontSize:12, fontWeight:800, color:T.green }}>{p.roi}</div>
            <div style={{ fontSize:8, color:T.dim, marginTop:1 }}>ROI p.a.</div>
          </div>
          <div style={{ flex:1, background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 8px", textAlign:"center" as const }}>
            <div style={{ fontSize:12, fontWeight:800, color:T.fg }}>{p.possession}</div>
            <div style={{ fontSize:8, color:T.dim, marginTop:1 }}>Possession</div>
          </div>
        </div>
        <div style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <Users size={8} color={T.dim} />
              <span style={{ fontSize:10, color:T.dim }}>{p.investors.toLocaleString()} investors</span>
            </div>
            <span style={{ fontSize:10, fontWeight:800, color:T.gold }}>{p.funded_percent}% funded</span>
          </div>
          <FundingBar pct={p.funded_percent} />
        </div>
        <motion.button whileTap={{ scale:0.97 }}
          onClick={e => { e.stopPropagation(); setLocation(`/invest/${p.id}`); }}
          style={{ width:"100%", padding:"10px", borderRadius:10, background:`linear-gradient(135deg, ${T.gold}, #8B6010)`, border:"none", color:"#0a0800", fontSize:12, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 } as any}>
          <Eye size={12} /> View Project
        </motion.button>
      </div>
    </motion.div>
  );
}

function PropertyRow({ p, bookmarked, onBookmark }: { p: Project; bookmarked: boolean; onBookmark: () => void }) {
  const [, setLocation] = useLocation();
  const [hov, setHov] = useState(false);
  return (
    <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ type:"spring", stiffness:240, damping:26 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => setLocation(`/invest/${p.id}`)}
      style={{ background:T.card, backdropFilter:"blur(10px)", border:`1px solid ${hov ? T.borderGold : T.border}`, borderRadius:14, display:"flex", gap:12, padding:12, cursor:"pointer", alignItems:"center", boxShadow:hov ? `0 8px 28px rgba(0,0,0,0.45)` : "none", transition:"all .2s" }}>
      <div style={{ width:72, height:72, borderRadius:12, overflow:"hidden", flexShrink:0 }}>
        <img src={p.image} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"cover", transform:hov ? "scale(1.07)" : "scale(1)", transition:"transform .3s" }}
          onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=85"; }} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
          <span style={{ fontSize:13, fontWeight:800, color:T.fg, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</span>
          {p.featured && <Star size={9} color={T.gold} fill={T.gold} style={{ flexShrink:0 }} />}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:5 }}>
          <MapPin size={8} color={T.gold} />
          <span style={{ fontSize:10, color:T.dim, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.location}</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:12, fontWeight:800, color:T.gold }}>{p.min_label}</span>
          <span style={{ fontSize:11, fontWeight:700, color:T.green }}>{p.roi}</span>
          <StatusChip status={p.status} />
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
        <motion.button whileTap={{ scale:0.85 }} onClick={e => { e.stopPropagation(); onBookmark(); }}
          style={{ background:"none", border:"none", cursor:"pointer" } as any}>
          {bookmarked ? <BookmarkCheck size={15} color={T.gold} /> : <Bookmark size={15} color={T.dim} />}
        </motion.button>
        <ChevronRight size={14} color={T.dim} />
      </div>
    </motion.div>
  );
}

/* ─────────────────── PROFESSIONAL CARD ──────────────────────────────── */
function ProfessionalCard({ p }: { p: Professional }) {
  const [hov, setHov] = useState(false);
  const categoryLabels: Record<string, string> = {
    agent:"Independent Agent", agency:"Registered Agency",
    builder:"Builder / Developer", private_seller:"Private Seller", off_plan:"Off-Plan Developer",
    construction:"Construction Co.", architect:"Architect", interior:"Interior Designer",
  };

  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ type:"spring", stiffness:220, damping:26 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:T.card, backdropFilter:"blur(12px)", border:`1px solid ${hov ? T.borderGold : (p.featured ? "rgba(201,168,76,0.18)" : T.border)}`, borderRadius:18, overflow:"hidden", cursor:"pointer", boxShadow:hov ? `0 20px 56px rgba(0,0,0,0.55)` : "0 4px 20px rgba(0,0,0,0.3)", transform:hov ? "translateY(-3px)" : "translateY(0)", transition:"all .25s" }}>

      {/* Header gradient band */}
      <div style={{ height:70, background:`linear-gradient(135deg, rgba(201,168,76,0.12), rgba(139,92,246,0.08))`, borderBottom:`1px solid ${T.border}`, position:"relative", display:"flex", alignItems:"flex-end", padding:"0 14px 10px" }}>
        {p.featured && (
          <div style={{ position:"absolute", top:10, right:10, display:"flex", alignItems:"center", gap:3, background:`linear-gradient(135deg,${T.gold},#8B6010)`, borderRadius:20, padding:"3px 9px" }}>
            <Star size={8} color="#0a0800" fill="#0a0800" />
            <span style={{ fontSize:8, fontWeight:900, color:"#0a0800" }}>FEATURED</span>
          </div>
        )}
        <div style={{ fontSize:9, color:T.dimMid, fontWeight:600, background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, borderRadius:20, padding:"3px 9px" }}>
          {categoryLabels[p.category] ?? p.category}
        </div>
      </div>

      <div style={{ padding:"0 14px 14px" }}>
        {/* Avatar + name row */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginTop:-22, marginBottom:10 }}>
          <div style={{ width:44, height:44, borderRadius:12, overflow:"hidden", border:`2px solid ${T.gold}`, flexShrink:0 }}>
            <img src={p.avatar} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}
              onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"; }} />
          </div>
          <div style={{ flex:1, paddingTop:24 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ fontSize:14, fontWeight:800, color:T.fg }}>{p.name}</span>
              {p.verified && <ShieldCheck size={13} color={T.green} />}
            </div>
            {p.company && <div style={{ fontSize:10, color:T.dimMid, marginTop:1 }}>{p.company}</div>}
          </div>
        </div>

        {/* Rating + location */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <RatingStars rating={p.rating} />
            <span style={{ fontSize:10, fontWeight:700, color:T.gold }}>{p.rating}</span>
            <span style={{ fontSize:10, color:T.dim }}>({p.reviews})</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
            <MapPin size={8} color={T.gold} />
            <span style={{ fontSize:10, color:T.dim }}>{p.city}</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:"flex", gap:5, marginBottom:10 }}>
          <div style={{ flex:1, background:T.goldFaint, border:`1px solid rgba(201,168,76,0.15)`, borderRadius:8, padding:"6px 8px", textAlign:"center" as const }}>
            <div style={{ fontSize:13, fontWeight:800, color:T.gold }}>{p.experience_years}y</div>
            <div style={{ fontSize:8, color:T.dim }}>Experience</div>
          </div>
          {p.active_listings !== undefined && (
            <div style={{ flex:1, background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 8px", textAlign:"center" as const }}>
              <div style={{ fontSize:13, fontWeight:800, color:T.fg }}>{p.active_listings}</div>
              <div style={{ fontSize:8, color:T.dim }}>Listings</div>
            </div>
          )}
          {p.completed_projects !== undefined && (
            <div style={{ flex:1, background:"rgba(16,185,129,0.05)", border:`1px solid rgba(16,185,129,0.15)`, borderRadius:8, padding:"6px 8px", textAlign:"center" as const }}>
              <div style={{ fontSize:13, fontWeight:800, color:T.green }}>{p.completed_projects}</div>
              <div style={{ fontSize:8, color:T.dim }}>Completed</div>
            </div>
          )}
        </div>

        {/* Specializations */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:12 }}>
          {p.specializations.slice(0,3).map(s => (
            <span key={s} style={{ fontSize:9, color:T.dimMid, background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, borderRadius:20, padding:"3px 8px" }}>{s}</span>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display:"flex", gap:6 }}>
          <motion.button whileTap={{ scale:0.97 }}
            style={{ flex:1, padding:"9px", borderRadius:10, background:`linear-gradient(135deg, ${T.gold}, #8B6010)`, border:"none", color:"#0a0800", fontSize:11, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 } as any}>
            <MessageCircle size={11} /> Contact
          </motion.button>
          <motion.button whileTap={{ scale:0.97 }}
            style={{ flex:1, padding:"9px", borderRadius:10, background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, color:T.fg, fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 } as any}>
            <Eye size={11} /> View Profile
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────── SUPPLIER CARD ──────────────────────────────────── */
function SupplierCard({ s }: { s: Supplier }) {
  const [hov, setHov] = useState(false);
  const subLabels: Record<string, string> = {
    steel_cement:"Steel & Cement", bricks_blocks:"Bricks & Blocks",
    tiles_sanitary:"Tiles & Sanitary", hardware:"General Hardware",
  };

  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ type:"spring", stiffness:220, damping:26 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:T.card, backdropFilter:"blur(12px)", border:`1px solid ${hov ? T.borderGold : (s.featured ? "rgba(201,168,76,0.18)" : T.border)}`, borderRadius:18, overflow:"hidden", cursor:"pointer", boxShadow:hov ? `0 20px 56px rgba(0,0,0,0.55)` : "0 4px 20px rgba(0,0,0,0.3)", transform:hov ? "translateY(-3px)" : "translateY(0)", transition:"all .25s" }}>

      <div style={{ height:60, background:`linear-gradient(135deg, rgba(34,211,238,0.08), rgba(201,168,76,0.06))`, borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", padding:"0 14px", gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:10, overflow:"hidden", border:`1px solid ${T.borderGold}` }}>
          <img src={s.logo} alt={s.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ fontSize:13, fontWeight:800, color:T.fg }}>{s.name}</span>
            {s.verified && <ShieldCheck size={12} color={T.green} />}
          </div>
          <div style={{ fontSize:9, color:T.dimMid }}>{subLabels[s.sub_category] ?? s.sub_category}</div>
        </div>
        {s.featured && (
          <div style={{ display:"flex", alignItems:"center", gap:3, background:`linear-gradient(135deg,${T.gold},#8B6010)`, borderRadius:20, padding:"3px 9px" }}>
            <Star size={7} color="#0a0800" fill="#0a0800" />
            <span style={{ fontSize:8, fontWeight:900, color:"#0a0800" }}>TOP</span>
          </div>
        )}
      </div>

      <div style={{ padding:"12px 14px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <RatingStars rating={s.rating} />
            <span style={{ fontSize:10, fontWeight:700, color:T.gold }}>{s.rating}</span>
            <span style={{ fontSize:10, color:T.dim }}>({s.reviews})</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:3 }}>
            <MapPin size={8} color={T.gold} />
            <span style={{ fontSize:10, color:T.dim }}>{s.city}</span>
          </div>
        </div>

        {/* Products */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
          {s.products.slice(0,4).map(prod => (
            <span key={prod} style={{ fontSize:9, color:T.cyan, background:"rgba(34,211,238,0.07)", border:"1px solid rgba(34,211,238,0.18)", borderRadius:20, padding:"3px 8px" }}>{prod}</span>
          ))}
        </div>

        {/* Info row */}
        <div style={{ display:"flex", gap:5, marginBottom:12 }}>
          <div style={{ flex:1, background:T.goldFaint, border:`1px solid rgba(201,168,76,0.15)`, borderRadius:8, padding:"6px 8px" }}>
            <div style={{ fontSize:9, color:T.dim, marginBottom:1 }}>Min Order</div>
            <div style={{ fontSize:10, fontWeight:700, color:T.fg }}>{s.min_order}</div>
          </div>
          <div style={{ flex:1, background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 8px" }}>
            <div style={{ fontSize:9, color:T.dim, marginBottom:1 }}>Delivery</div>
            <div style={{ fontSize:10, fontWeight:700, color:T.fg }}>{s.delivery}</div>
          </div>
          {s.bulk_discount && (
            <div style={{ flex:1, background:"rgba(16,185,129,0.06)", border:`1px solid rgba(16,185,129,0.2)`, borderRadius:8, padding:"6px 8px", display:"flex", flexDirection:"column" as const, alignItems:"center" }}>
              <ThumbsUp size={12} color={T.green} />
              <div style={{ fontSize:9, color:T.green, fontWeight:700, marginTop:2 }}>Bulk Deal</div>
            </div>
          )}
        </div>

        <div style={{ display:"flex", gap:6 }}>
          <motion.button whileTap={{ scale:0.97 }}
            style={{ flex:1, padding:"9px", borderRadius:10, background:`linear-gradient(135deg, ${T.gold}, #8B6010)`, border:"none", color:"#0a0800", fontSize:11, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 } as any}>
            <Truck size={11} /> Bulk Delivery Request
          </motion.button>
          <motion.button whileTap={{ scale:0.97 }}
            style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, color:T.fg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" } as any}>
            <Phone size={13} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────── SERVICE PROVIDER CARD ──────────────────────────── */
function ServiceCard({ s }: { s: ServiceProvider }) {
  const [hov, setHov] = useState(false);
  const tradeIcons: Record<string, any> = {
    plumber:Wrench, electrician:Zap, hvac:Wind, painter:Paintbrush, carpenter:Hammer,
  };
  const tradeLabels: Record<string, string> = {
    plumber:"Plumber", electrician:"Electrician", hvac:"HVAC / AC Technician",
    painter:"Painter & Polisher", carpenter:"Carpenter",
  };
  const TradeIcon = tradeIcons[s.trade] ?? Wrench;

  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ type:"spring", stiffness:220, damping:26 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:T.card, backdropFilter:"blur(12px)", border:`1px solid ${hov ? T.borderGold : (s.featured ? "rgba(201,168,76,0.18)" : T.border)}`, borderRadius:18, overflow:"hidden", cursor:"pointer", boxShadow:hov ? `0 20px 56px rgba(0,0,0,0.55)` : "0 4px 20px rgba(0,0,0,0.3)", transform:hov ? "translateY(-3px)" : "translateY(0)", transition:"all .25s" }}>

      <div style={{ height:66, background:`linear-gradient(135deg, rgba(139,92,246,0.1), rgba(201,168,76,0.06))`, borderBottom:`1px solid ${T.border}`, position:"relative", display:"flex", alignItems:"flex-end", padding:"0 14px 8px" }}>
        <div style={{ fontSize:9, color:T.purple, fontWeight:700, background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.25)", borderRadius:20, padding:"3px 9px", display:"flex", alignItems:"center", gap:4 }}>
          <TradeIcon size={9} />
          {tradeLabels[s.trade] ?? s.trade}
        </div>
        <div style={{ position:"absolute", top:10, right:10 }}>
          <AvailabilityChip availability={s.availability} />
        </div>
      </div>

      <div style={{ padding:"0 14px 14px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginTop:-20, marginBottom:10 }}>
          <div style={{ width:40, height:40, borderRadius:12, overflow:"hidden", border:`2px solid ${T.gold}`, flexShrink:0 }}>
            <img src={s.avatar} alt={s.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}
              onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80"; }} />
          </div>
          <div style={{ flex:1, paddingTop:22 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ fontSize:14, fontWeight:800, color:T.fg }}>{s.name}</span>
              {s.verified && <ShieldCheck size={13} color={T.green} />}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
              <MapPinned size={8} color={T.gold} />
              <span style={{ fontSize:10, color:T.dim }}>{s.city}</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:10 }}>
          <RatingStars rating={s.rating} />
          <span style={{ fontSize:10, fontWeight:700, color:T.gold }}>{s.rating}</span>
          <span style={{ fontSize:10, color:T.dim }}>({s.reviews} reviews)</span>
          <span style={{ fontSize:9, color:T.dimMid, marginLeft:"auto" }}>{s.experience_years}y exp.</span>
        </div>

        {/* Rate cards */}
        <div style={{ display:"flex", gap:5, marginBottom:10 }}>
          {s.hourly_rate && (
            <div style={{ flex:1, background:T.goldFaint, border:`1px solid rgba(201,168,76,0.15)`, borderRadius:8, padding:"6px 8px" }}>
              <div style={{ fontSize:9, color:T.dim }}>Hourly Rate</div>
              <div style={{ fontSize:11, fontWeight:800, color:T.gold }}>{s.hourly_rate}</div>
            </div>
          )}
          {s.job_rate && (
            <div style={{ flex:1, background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 8px" }}>
              <div style={{ fontSize:9, color:T.dim }}>Per Job</div>
              <div style={{ fontSize:11, fontWeight:800, color:T.fg }}>{s.job_rate}</div>
            </div>
          )}
        </div>

        {/* Skills */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:12 }}>
          {s.skills.slice(0,4).map(skill => (
            <span key={skill} style={{ fontSize:9, color:T.dimMid, background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}`, borderRadius:20, padding:"3px 8px" }}>{skill}</span>
          ))}
        </div>

        {/* Coverage areas */}
        <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:12, padding:"6px 10px", background:"rgba(255,255,255,0.02)", borderRadius:8, border:`1px solid ${T.border}` }}>
          <MapPinned size={9} color={T.gold} style={{ flexShrink:0 }} />
          <span style={{ fontSize:10, color:T.dimMid }}>{s.coverage_areas.join(" · ")}</span>
        </div>

        <motion.button whileTap={{ scale:0.97 }}
          style={{ width:"100%", padding:"10px", borderRadius:10, background:`linear-gradient(135deg, ${T.gold}, #8B6010)`, border:"none", color:"#0a0800", fontSize:12, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 } as any}>
          <CalendarCheck size={12} /> Book Service
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─────────────────── WIND ICON (not in lucide-react) ────────────────── */
function Wind({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function Projects() {
  const [activeTab,    setActiveTab]    = useState("buy");
  const [activeSubTab, setActiveSubTab] = useState("all");
  const [search,       setSearch]       = useState("");
  const [country,      setCountry]      = useState("all");
  const [city,         setCity]         = useState("All Cities");
  const [assetType,    setAssetType]    = useState("all");
  const [priceRange,   setPriceRange]   = useState("all");
  const [sortBy,       setSortBy]       = useState("featured");
  const [viewMode,     setViewMode]     = useState<"grid"|"list">("grid");
  const [bookmarked,   setBookmarked]   = useState<Set<number>>(new Set());
  const [projects,     setProjects]     = useState<Project[]>(SEED_PROJECTS);
  const [professionals,setProfessionals]= useState<Professional[]>(SEED_PROFESSIONALS);
  const [suppliers,    setSuppliers]    = useState<Supplier[]>(SEED_SUPPLIERS);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>(SEED_SERVICES);
  const [loading,      setLoading]      = useState(true);
  const [mobile,       setMobile]       = useState(window.innerWidth < 640);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  /* ── Supabase fetch: projects ── */
  useEffect(() => {
    supabase.from("investment_projects").select("*").order("featured", { ascending:false })
      .then(({ data, error }) => {
        if (!error && data?.length) {
          const mapped = data.map(p => ({
            ...p,
            min_investment: p.min_investment || p.minInvestment || 0,
            investors: p.investors || 0,
            funded_percent: p.funded_percent || p.fundedPercent || 0,
            image: p.image || p.banner_image || p.bannerImage || "",
            min_label: p.min_label || (p.min_investment ? `₨ ${(p.min_investment / 100000).toFixed(0)}L` : "₨ 0"),
            tags: Array.isArray(p.tags) ? p.tags : [],
            roi: p.roi || "0% p.a.",
          }));
          setProjects(mapped as Project[]);
        }
        setLoading(false);
      });
  }, []);

  /* ── Supabase fetch: professionals (approved from onboarding portal) ── */
  useEffect(() => {
    supabase.from("professionals").select("*").eq("status","approved").order("featured", { ascending:false })
      .then(({ data, error }) => {
        if (!error && data?.length) setProfessionals(data as Professional[]);
      });
    supabase.from("suppliers").select("*").eq("status","approved").order("featured", { ascending:false })
      .then(({ data, error }) => {
        if (!error && data?.length) setSuppliers(data as Supplier[]);
      });
    supabase.from("service_providers").select("*").eq("status","approved").order("featured", { ascending:false })
      .then(({ data, error }) => {
        if (!error && data?.length) setServiceProviders(data as ServiceProvider[]);
      });
  }, []);

  const toggleBM = (id: number) =>
    setBookmarked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const currentTabCfg = CATEGORY_TABS.find(t => t.key === activeTab) ?? CATEGORY_TABS[0];
  const subCats = SUB_CATEGORIES[activeTab] ?? [];
  const currentSubCat = subCats.find(s => s.key === activeSubTab);
  const activePlaceholder = currentSubCat?.placeholder ?? currentTabCfg.placeholder;
  const isPropertyTab = PROPERTY_TABS.includes(activeTab);
  const isProfessionalTab = ["agents","developers","contractors"].includes(activeTab);
  const isSupplierTab = activeTab === "suppliers";
  const isServiceTab = activeTab === "services";

  /* ── Filter logic ── */
  const filteredProjects = useMemo(() => {
    if (!isPropertyTab) return [];
    let list = [...projects];
    if (activeTab === "construction") {
      list = list.filter(p => p.listing_type === "construction");
    } else if (activeTab === "installment") {
      list = list.filter(p => p.installment === true);
    } else if (activeTab === "investment") {
      list = list.filter(p => p.transaction_type === "investment" || p.transaction_type === "installment" || (p.funded_percent > 0 && p.investors > 0));
    } else {
      list = list.filter(p => p.transaction_type === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || (p.city ?? "").toLowerCase().includes(q) || (p.developer ?? "").toLowerCase().includes(q) || (p.tags ?? []).some(t => t.toLowerCase().includes(q)));
    }
    if (country !== "all") list = list.filter(p => p.country === country);
    if (city !== "All Cities") list = list.filter(p => (p.city2 ?? p.city) === city);
    if (assetType !== "all") list = list.filter(p => p.type === assetType);
    if (priceRange === "under10") list = list.filter(p => p.min_investment < 1000000);
    else if (priceRange === "10to50") list = list.filter(p => p.min_investment >= 1000000 && p.min_investment < 5000000);
    else if (priceRange === "50to100") list = list.filter(p => p.min_investment >= 5000000 && p.min_investment < 10000000);
    else if (priceRange === "above100") list = list.filter(p => p.min_investment >= 10000000);
    list.sort((a, b) => {
      if (sortBy === "featured")   return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (sortBy === "roi")        return parseFloat(b.roi) - parseFloat(a.roi);
      if (sortBy === "funded")     return b.funded_percent - a.funded_percent;
      if (sortBy === "minInvest")  return a.min_investment - b.min_investment;
      return 0;
    });
    return list;
  }, [projects, activeTab, search, country, city, assetType, priceRange, sortBy, isPropertyTab]);

  const filteredProfessionals = useMemo(() => {
    if (!isProfessionalTab) return [];
    const categoryMap: Record<string, string[]> = {
      agents:      ["agent","agency"],
      developers:  ["builder","private_seller","off_plan"],
      contractors: ["construction","architect","interior"],
    };
    const allowedCats = categoryMap[activeTab] ?? [];
    let list = professionals.filter(p => allowedCats.includes(p.category));
    if (activeSubTab !== "all") list = list.filter(p => p.sub_category === activeSubTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.company ?? "").toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.specializations.some(s => s.toLowerCase().includes(q)));
    }
    if (country !== "all") list = list.filter(p => p.country === country);
    if (city !== "All Cities") list = list.filter(p => p.city === city);
    list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating);
    return list;
  }, [professionals, activeTab, activeSubTab, search, country, city, isProfessionalTab]);

  const filteredSuppliers = useMemo(() => {
    if (!isSupplierTab) return [];
    let list = [...suppliers];
    if (activeSubTab !== "all") list = list.filter(s => s.sub_category === activeSubTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.products.some(p => p.toLowerCase().includes(q)));
    }
    if (country !== "all") list = list.filter(s => s.country === country);
    if (city !== "All Cities") list = list.filter(s => s.city === city);
    list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating);
    return list;
  }, [suppliers, activeTab, activeSubTab, search, country, city, isSupplierTab]);

  const filteredServices = useMemo(() => {
    if (!isServiceTab) return [];
    let list = [...serviceProviders];
    if (activeSubTab !== "all") list = list.filter(s => s.trade === activeSubTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.skills.some(k => k.toLowerCase().includes(q)) || s.trade.toLowerCase().includes(q));
    }
    if (country !== "all") list = list.filter(s => s.country === country);
    if (city !== "All Cities") list = list.filter(s => s.city === city);
    list.sort((a, b) => {
      if (a.availability === "Available Now" && b.availability !== "Available Now") return -1;
      if (b.availability === "Available Now" && a.availability !== "Available Now") return 1;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating;
    });
    return list;
  }, [serviceProviders, activeTab, activeSubTab, search, country, city, isServiceTab]);

  const totalCount = isPropertyTab
    ? filteredProjects.length
    : isProfessionalTab ? filteredProfessionals.length
    : isSupplierTab ? filteredSuppliers.length
    : filteredServices.length;

  const hasFilters = city !== "All Cities" || assetType !== "all" || priceRange !== "all" || country !== "all";
  const clearFilters = () => { setCity("All Cities"); setAssetType("all"); setPriceRange("all"); setCountry("all"); setSearch(""); };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setActiveSubTab("all");
    setSearch("");
  };

  /* ─────────────────── RENDER ─────────────────────────────────────── */
  return (
    <div style={{ minHeight:"100dvh", background:T.bg, color:T.fg, fontFamily:"'Plus Jakarta Sans', sans-serif", paddingBottom:100 }}>

      {/* Ambient */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
        <div style={{ position:"absolute", top:"2%", left:"15%", width:500, height:400, borderRadius:"50%", background:`radial-gradient(circle, ${T.goldGlow} 0%, transparent 70%)`, filter:"blur(80px)" }} />
        <div style={{ position:"absolute", bottom:"10%", right:"5%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", filter:"blur(100px)" }} />
      </div>

      <div style={{ position:"relative", zIndex:1, maxWidth:900, margin:"0 auto" }}>

        {/* ══ STICKY TOP PANEL ═══════════════════════════════════════ */}
        <div style={{ position:"sticky", top:0, zIndex:40, background:"rgba(4,8,15,0.97)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${T.border}`, paddingBottom:10 }}>

          {/* PRIMARY CATEGORY TABS */}
          <div ref={tabsRef} style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none", padding:"12px 14px 0", gap:6 }}>
            {CATEGORY_TABS.map(tab => {
              const active = activeTab === tab.key;
              const Icon = tab.icon;
              const isPro = PROFESSIONAL_TABS.includes(tab.key);
              return (
                <motion.button key={tab.key} whileTap={{ scale:0.95 }}
                  onClick={() => handleTabChange(tab.key)}
                  style={{ flexShrink:0, display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:10, cursor:"pointer", border:"none",
                    background: active ? (isPro ? "rgba(139,92,246,0.1)" : T.goldFaint) : "rgba(255,255,255,0.04)",
                    borderBottom: active ? `2px solid ${isPro ? T.purple : T.gold}` : "2px solid transparent",
                    color: active ? (isPro ? T.purple : T.gold) : T.dimMid,
                    fontSize:13, fontWeight:active ? 800 : 500, transition:"all .18s", WebkitTapHighlightColor:"transparent",
                  } as any}>
                  <Icon size={13} color={active ? (isPro ? T.purple : T.gold) : T.dimMid} />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>

          {/* SUB-CATEGORY BAR (contextual) */}
          <AnimatePresence>
            {subCats.length > 0 && (
              <motion.div
                key={`sub-${activeTab}`}
                initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                transition={{ duration:.2 }}
                style={{ overflow:"hidden" }}>
                <div style={{ display:"flex", gap:5, padding:"8px 14px 0", overflowX:"auto", scrollbarWidth:"none" }}>
                  {subCats.map(sub => {
                    const active = activeSubTab === sub.key;
                    return (
                      <motion.button key={sub.key} whileTap={{ scale:0.95 }}
                        onClick={() => { setActiveSubTab(sub.key); setSearch(""); }}
                        style={{ flexShrink:0, padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:active ? 700 : 500, cursor:"pointer", transition:"all .15s", WebkitTapHighlightColor:"transparent",
                          background: active ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)",
                          border: active ? `1px solid ${T.borderGold}` : `1px solid ${T.border}`,
                          color: active ? T.gold : T.dimMid,
                          boxShadow: active ? `0 0 10px ${T.goldGlow}` : "none",
                        } as any}>
                        {sub.label}
                        {active && (
                          <motion.span layoutId="subTabUnderline"
                            style={{ display:"block", height:2, background:T.gold, borderRadius:1, marginTop:2 }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SEARCH BAR */}
          <div style={{ margin:"10px 14px 0", display:"flex", alignItems:"center", background:"rgba(255,255,255,0.05)", border:`1px solid ${T.border}`, borderRadius:12, height:48, overflow:"hidden" }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, padding:"0 14px" }}>
              <Search size={15} color={T.gold} style={{ flexShrink:0 }} />
              <input
                key={`${activeTab}-${activeSubTab}`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={activePlaceholder}
                style={{ flex:1, background:"none", border:"none", outline:"none", fontSize:13, color:T.fg, fontFamily:"inherit", minWidth:0 }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background:"none", border:"none", cursor:"pointer", padding:0, flexShrink:0 }}>
                  <X size={13} color={T.dim} />
                </button>
              )}
            </div>
            <div style={{ width:1, height:26, background:T.border, flexShrink:0 }} />
            <CountrySelector value={country} onChange={setCountry} />
          </div>

          {/* FILTER BAR (only for property tabs) */}
          {isPropertyTab && (
            <div style={{ display:"flex", gap:6, padding:"8px 14px 0", overflowX:"auto", scrollbarWidth:"none", alignItems:"center" }}>
              <SlidersHorizontal size={12} color={T.dim} style={{ flexShrink:0 }} />
              <FilterPill value={city}       options={OPT_CITIES} onChange={setCity} />
              <FilterPill value={assetType}  options={OPT_TYPES}  onChange={setAssetType} />
              <FilterPill value={priceRange} options={OPT_PRICE}  onChange={setPriceRange} />
              <FilterPill value={sortBy}     options={OPT_SORT}   onChange={setSortBy} />
              {hasFilters && (
                <motion.button whileTap={{ scale:0.94 }} onClick={clearFilters}
                  style={{ height:34, padding:"0 10px", borderRadius:8, fontSize:11, cursor:"pointer", background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.25)", color:T.red, display:"flex", alignItems:"center", gap:3, flexShrink:0, WebkitTapHighlightColor:"transparent" } as any}>
                  <X size={9} /> Clear
                </motion.button>
              )}
            </div>
          )}

          {/* CITY FILTER for professional/service/supplier tabs */}
          {!isPropertyTab && (
            <div style={{ display:"flex", gap:6, padding:"8px 14px 0", overflowX:"auto", scrollbarWidth:"none", alignItems:"center" }}>
              <SlidersHorizontal size={12} color={T.dim} style={{ flexShrink:0 }} />
              <FilterPill value={city} options={OPT_CITIES} onChange={setCity} />
              {city !== "All Cities" && (
                <motion.button whileTap={{ scale:0.94 }} onClick={() => setCity("All Cities")}
                  style={{ height:34, padding:"0 10px", borderRadius:8, fontSize:11, cursor:"pointer", background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.25)", color:T.red, display:"flex", alignItems:"center", gap:3, flexShrink:0 } as any}>
                  <X size={9} /> Clear
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* ══ RESULTS BAR ════════════════════════════════════════════ */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 14px 10px" }}>
          <div>
            <span style={{ fontSize:13, fontWeight:700, color:T.fg }}>
              {loading ? "Loading…" : `${totalCount} ${totalCount === 1 ? "result" : "results"}`}
            </span>
            {!loading && isPropertyTab && filteredProjects.length > 0 && (
              <span style={{ fontSize:11, color:T.dim, marginLeft:6 }}>
                · {filteredProjects.reduce((s,p) => s + p.investors,0).toLocaleString()} investors
              </span>
            )}
          </div>
          {isPropertyTab && (
            <div style={{ display:"flex", gap:5 }}>
              {(["grid","list"] as const).map(m => (
                <motion.button key={m} whileTap={{ scale:0.9 }} onClick={() => setViewMode(m)}
                  style={{ width:32, height:32, borderRadius:8, background:viewMode === m ? T.goldFaint : "rgba(255,255,255,0.04)", border:viewMode === m ? `1px solid ${T.borderGold}` : `1px solid ${T.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" } as any}>
                  {m === "grid" ? <LayoutGrid size={13} color={viewMode === m ? T.gold : T.dim} /> : <List size={13} color={viewMode === m ? T.gold : T.dim} />}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* ══ LISTINGS ═══════════════════════════════════════════════ */}
        <div style={{ padding:"0 14px" }}>
          {loading && isPropertyTab ? (
            <div style={{ textAlign:"center", padding:"80px 16px" }}>
              <motion.div animate={{ rotate:360 }} transition={{ duration:1.2, repeat:Infinity, ease:"linear" }}
                style={{ width:40, height:40, borderRadius:"50%", border:`2px solid ${T.border}`, borderTop:`2px solid ${T.gold}`, margin:"0 auto 14px" }} />
              <div style={{ fontSize:12, color:T.dim }}>Loading…</div>
            </div>
          ) : totalCount === 0 ? (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ textAlign:"center", padding:"56px 20px", background:T.panel, borderRadius:18, border:`1px solid ${T.border}` }}>
              <Building2 size={32} color={T.dim} style={{ opacity:.3, marginBottom:12 }} />
              <div style={{ fontSize:15, fontWeight:700, color:T.fg, marginBottom:6 }}>No listings found</div>
              <div style={{ fontSize:12, color:T.dim, marginBottom:18 }}>Try adjusting your filters or search terms</div>
              <motion.button whileTap={{ scale:0.97 }} onClick={clearFilters}
                style={{ padding:"10px 24px", borderRadius:12, background:`linear-gradient(135deg, ${T.gold}, #8B6010)`, color:"#0a0800", fontWeight:800, fontSize:12, border:"none", cursor:"pointer" }}>
                Clear Filters
              </motion.button>
            </motion.div>

          ) : isPropertyTab ? (
            /* PROPERTY GRID / LIST */
            viewMode === "grid" ? (
              <div style={{ display:"grid", gridTemplateColumns:mobile ? "1fr" : "repeat(2,1fr)", gap:14 }}>
                {filteredProjects.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i * 0.04 }}>
                    <PropertyCard p={p} bookmarked={bookmarked.has(p.id)} onBookmark={() => toggleBM(p.id)} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {filteredProjects.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i * 0.04 }}>
                    <PropertyRow p={p} bookmarked={bookmarked.has(p.id)} onBookmark={() => toggleBM(p.id)} />
                  </motion.div>
                ))}
              </div>
            )

          ) : isProfessionalTab ? (
            /* PROFESSIONAL GRID */
            <div style={{ display:"grid", gridTemplateColumns:mobile ? "1fr" : "repeat(2,1fr)", gap:14 }}>
              {filteredProfessionals.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i * 0.05 }}>
                  <ProfessionalCard p={p} />
                </motion.div>
              ))}
            </div>

          ) : isSupplierTab ? (
            /* SUPPLIER GRID */
            <div style={{ display:"grid", gridTemplateColumns:mobile ? "1fr" : "repeat(2,1fr)", gap:14 }}>
              {filteredSuppliers.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i * 0.05 }}>
                  <SupplierCard s={s} />
                </motion.div>
              ))}
            </div>

          ) : (
            /* SERVICE PROVIDER GRID */
            <div style={{ display:"grid", gridTemplateColumns:mobile ? "1fr" : "repeat(2,1fr)", gap:14 }}>
              {filteredServices.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:i * 0.05 }}>
                  <ServiceCard s={s} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          {!loading && totalCount > 0 && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.4 }} style={{ marginTop:24 }}>
              <div style={{ padding:"20px", borderRadius:18, background:`linear-gradient(135deg, ${T.goldFaint}, rgba(139,92,246,0.04))`, border:`1px solid ${T.borderGold}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:900, color:T.fg, marginBottom:3 }}>
                    {isPropertyTab ? "Can't find your ideal property?" : isProfessionalTab ? "List your services on Orakzai?" : isSupplierTab ? "Register your supply business?" : "Join as a verified service provider?"}
                  </div>
                  <div style={{ fontSize:12, color:T.dim }}>
                    {isPropertyTab ? "AI advisor matches you with the best opportunities." : "Apply through our onboarding portal and get verified."}
                  </div>
                </div>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  style={{ padding:"10px 18px", borderRadius:12, background:`linear-gradient(135deg, ${T.gold}, #8B6010)`, border:"none", color:"#0a0800", fontSize:12, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                  <Sparkles size={12} /> {isPropertyTab ? "AI Match" : "Apply Now"}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        <style>{`::-webkit-scrollbar{display:none}`}</style>
      </div>
    </div>
  );
}
