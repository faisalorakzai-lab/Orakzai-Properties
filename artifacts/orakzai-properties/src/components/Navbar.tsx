import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Show, useClerk } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, Plus, BarChart3, Wallet, Briefcase } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const logoShield = `${basePath}/logo-shield.png`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { signOut } = useClerk();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse" },
    { href: "/invest", label: "Invest" },
    { href: "/pricing", label: "Pricing" },
    { href: "/project/azan-smart-city", label: "Azan Smart City" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#070e1a]/95 backdrop-blur-md border-b border-[#C9A84C]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 group">
            <img src={logoShield} alt="Orakzai Properties" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
            <div>
              <div className="font-sans text-[#C9A84C] font-semibold text-sm leading-none">Orakzai</div>
              <div className="text-[9px] text-[#4a6080] tracking-widest uppercase">Properties</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`text-sm font-medium transition-colors ${location === link.href ? "text-[#C9A84C]" : "text-[#6a7f99] hover:text-white"}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2.5">
            <Show when="signed-out">
              <Link href="/sign-in"><Button variant="ghost" size="sm" className="text-[#6a7f99] hover:text-white text-xs h-8">Sign In</Button></Link>
              <Link href="/sign-up"><Button size="sm" className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold text-xs h-8 px-4">Get Started</Button></Link>
            </Show>
            <Show when="signed-in">
              <Link href="/wallet"><Button variant="ghost" size="sm" className={`gap-1.5 text-xs h-8 px-3 ${location === "/wallet" ? "text-[#C9A84C]" : "text-[#6a7f99] hover:text-white"}`}><Wallet className="h-3.5 w-3.5" /> Wallet</Button></Link>
              <Link href="/portfolio"><Button variant="ghost" size="sm" className={`gap-1.5 text-xs h-8 px-3 ${location === "/portfolio" ? "text-[#C9A84C]" : "text-[#6a7f99] hover:text-white"}`}><BarChart3 className="h-3.5 w-3.5" /> Portfolio</Button></Link>
              <Link href="/agent/dashboard"><Button variant="ghost" size="sm" className={`gap-1.5 text-xs h-8 px-3 ${location === "/agent/dashboard" ? "text-[#C9A84C]" : "text-[#6a7f99] hover:text-white"}`}><Briefcase className="h-3.5 w-3.5" /> Agent</Button></Link>
              <NotificationBell />
              <Link href="/post-property"><Button size="sm" className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold gap-1.5 text-xs h-8 px-3"><Plus className="h-3.5 w-3.5" /> Post Property</Button></Link>
            </Show>
          </div>

          <button className="md:hidden text-[#6a7f99] hover:text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[#070e1a] border-t border-[#C9A84C]/10 px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="block text-sm text-[#6a7f99] hover:text-[#C9A84C] py-1.5" onClick={() => setOpen(false)}>{link.label}</Link>
          ))}
          <div className="pt-2 border-t border-[#1e3a5f] space-y-2">
            <Show when="signed-out">
              <Link href="/sign-in" onClick={() => setOpen(false)}><Button variant="outline" size="sm" className="w-full border-[#C9A84C]/30 text-[#C9A84C] text-xs">Sign In</Button></Link>
            </Show>
            <Show when="signed-in">
              <Link href="/wallet" onClick={() => setOpen(false)}><Button variant="ghost" size="sm" className="w-full text-[#6a7f99] text-xs gap-1.5"><Wallet className="h-3.5 w-3.5" /> My Wallet</Button></Link>
              <Link href="/portfolio" onClick={() => setOpen(false)}><Button variant="ghost" size="sm" className="w-full text-[#6a7f99] text-xs gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Portfolio</Button></Link>
              <Link href="/agent/dashboard" onClick={() => setOpen(false)}><Button variant="ghost" size="sm" className="w-full text-[#6a7f99] text-xs gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Agent Dashboard</Button></Link>
              <Link href="/post-property" onClick={() => setOpen(false)}><Button size="sm" className="w-full bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold text-xs">Post Property</Button></Link>
              <Button variant="ghost" size="sm" className="w-full text-red-400 hover:text-red-300 text-xs" onClick={() => { signOut(); setOpen(false); }}>Sign Out</Button>
            </Show>
          </div>
        </div>
      )}
    </nav>
  );
}
