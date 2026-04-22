"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Info, Home, ShieldCheck, Microscope } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Analyze", icon: Microscope },
  { href: "/about", label: "About", icon: Info },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
      <div className="glass rounded-full px-6 py-2 flex items-center gap-8 border-white/20 shadow-2xl backdrop-blur-2xl">
        <Link href="/" className="flex items-center gap-2 mr-4">
          <ShieldCheck className="w-6 h-6 text-lime-400" />
          <span className="font-bold text-lg tracking-tight hidden sm:block">TruthfulQA</span>
        </Link>
        
        <div className="flex items-center gap-1 sm:gap-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  isActive 
                    ? "bg-lime-400/10 text-lime-400" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
