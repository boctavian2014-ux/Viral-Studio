"use client";

import { BarChart3, Film, Flame, FolderOpen, Settings, TrendingUp, User } from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Trends", icon: Flame },
  { href: "/create", label: "Create", icon: Film },
  { href: "/library", label: "Library", icon: FolderOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-[#1c1c24] bg-[#0b0b0f]">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <TrendingUp className="h-6 w-6 text-[#3b82f6]" />
            Viral Studio
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#a1a1aa] transition hover:bg-[#1c1c24] hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg p-2 text-[#a1a1aa] transition hover:bg-[#1c1c24] hover:text-white"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#1c1c24] bg-[#14141c] px-3 py-2 text-sm text-white transition hover:border-[#2a2a32]"
          >
            <User className="h-4 w-4" />
            Profile
          </button>
        </div>
      </div>
    </header>
  );
}
