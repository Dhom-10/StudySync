"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, LogOut } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [{ href: "/record", label: "Record", icon: Mic }];

export function DashboardSidebar() {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-foreground/10 bg-card">
      <div className="px-5 py-5">
        <Link href="/record" className="inline-block">
          <BrandMark />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-foreground text-card" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-foreground/10 p-3">
        <button
          onClick={() => logout.mutate()}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" /> Log out
        </button>
      </div>
    </aside>
  );
}
