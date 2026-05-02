import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Show, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Menu, X, Building2, User, LogOut, Plus, LayoutList } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClerk } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse" },
    { href: "/project/azan-smart-city", label: "Azan Smart City" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a1220]/95 backdrop-blur-md border-b border-[#C9A84C]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <Building2 className="h-7 w-7 text-[#C9A84C]" />
            <div>
              <div className="font-serif text-[#C9A84C] font-semibold text-base leading-none">Orakzai</div>
              <div className="text-[10px] text-[#94a3b8] tracking-widest uppercase">Properties</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${location === link.href ? "text-[#C9A84C]" : "text-[#94a3b8] hover:text-white"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Show when="signed-out">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-[#94a3b8] hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-semibold">
                  Get Started
                </Button>
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/post-property">
                <Button size="sm" className="bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-semibold gap-1.5">
                  <Plus className="h-4 w-4" /> Post Property
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full border border-[#C9A84C]/30 hover:border-[#C9A84C] h-9 w-9">
                    <User className="h-4 w-4 text-[#C9A84C]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#0f1929] border-[#C9A84C]/20 text-[#f1f5f9]">
                  <div className="px-3 py-2 text-xs text-[#94a3b8]">{user?.primaryEmailAddress?.emailAddress}</div>
                  <DropdownMenuSeparator className="bg-[#1e3a5f]" />
                  <DropdownMenuItem asChild className="hover:bg-[#1a2940] cursor-pointer">
                    <Link href="/my-properties" className="flex items-center gap-2">
                      <LayoutList className="h-4 w-4 text-[#C9A84C]" /> My Listings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#1e3a5f]" />
                  <DropdownMenuItem
                    onClick={() => signOut({ redirectUrl: `${window.location.origin}${basePath}/` })}
                    className="hover:bg-[#1a2940] cursor-pointer text-red-400 hover:text-red-300"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Show>
          </div>

          <button
            className="md:hidden text-[#94a3b8] hover:text-white"
            onClick={() => setOpen(!open)}
            data-testid="nav-mobile-toggle"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[#0a1220] border-t border-[#C9A84C]/10 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm text-[#94a3b8] hover:text-[#C9A84C] py-1"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#1e3a5f] flex flex-col gap-2">
            <Show when="signed-out">
              <Link href="/sign-in" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" className="w-full border-[#C9A84C]/30 text-[#C9A84C]">Sign In</Button>
              </Link>
            </Show>
            <Show when="signed-in">
              <Link href="/post-property" onClick={() => setOpen(false)}>
                <Button size="sm" className="w-full bg-[#C9A84C] hover:bg-[#e8c060] text-[#0a1220] font-semibold">Post Property</Button>
              </Link>
              <Link href="/my-properties" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full text-[#94a3b8]">My Listings</Button>
              </Link>
            </Show>
          </div>
        </div>
      )}
    </nav>
  );
}
