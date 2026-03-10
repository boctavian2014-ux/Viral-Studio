"use client";

import {
  BarChart3,
  FolderOpen,
  Lightbulb,
  Settings,
  Sparkles,
  Video,
  FileText,
  Layers,
  Factory,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/trends", label: "Trend Radar", icon: Sparkles },
  { href: "/ideas", label: "Idea Generator", icon: Lightbulb },
  { href: "/scripts", label: "Scripts", icon: FileText },
  { href: "/scenes", label: "Scene Builder", icon: Layers },
  { href: "/studio", label: "Video Studio", icon: Video },
  { href: "/factory", label: "Mass Factory", icon: Factory },
  { href: "/library", label: "Library", icon: FolderOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-[240px] border-r border-[#1c1c24] bg-[#0b0b0f]">
      <nav className="flex flex-col gap-0.5 p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-[#1c1c24] text-white"
                  : "text-[#a1a1aa] hover:bg-[#14141c] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
