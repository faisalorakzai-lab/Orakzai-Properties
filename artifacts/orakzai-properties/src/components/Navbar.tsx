import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Show, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Menu, X, Building2, Plus } from "lucide-react";
import { useClerk } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { signOut } = useClerk();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse" },
    { href: "/invest", label: "Invest" },
    { href: "/project/azan-smart-city", label: "Azan Smart City" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#070e1a]/95 backdrop-blur-md border-b border-[#C9A84C]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 group">
            <Building2 className="h-6 w-6 text-[#C9A84C]" />
            <div>
              <div className="font-serif text-[#C9A84C] font-semibold text-sm leading-none">Orakzai</div>
              <div className="text-[9px] text-[#4a6080] tracking-widest uppercase">Properties</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${location === link.href ? "text-[#C9A84C]" : "text-[#6a7f99] hover:text-white"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2.5">
            <Show when="signed-out">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-[#6a7f99] hover:text-white text-xs h-8">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold text-xs h-8 px-4">
                  Get Started
                </Button>
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/post-property">
                <Button size="sm" className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold gap-1.5 text-xs h-8 px-3">
                  <Plus className="h-3.5 w-3.5" /> Post Property
                </Button>
              </Link>
            </Show>
          </div>

          <button
            className="md:hidden text-[#6a7f99] hover:text-white"
            onClick={() => setOpen(!open)}
            data-testid="nav-mobile-toggle"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[#070e1a] border-t border-[#C9A84C]/10 px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm text-[#6a7f99] hover:text-[#C9A84C] py-1.5"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#1e3a5f] space-y-2">
            <Show when="signed-out">
              <Link href="/sign-in" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full border-[#C9A84C]/30 text-[#C9A84C] text-xs">Sign In</Button>
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/post-property" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-bold text-xs">Post Property</Button>
              </Link>
              <Link href="/my-properties" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full text-[#6a7f99] text-xs">My Listings</Button>
              </Link>
            </Show>
          </div>
        </div>
      )}
    </nav>
  );
}
