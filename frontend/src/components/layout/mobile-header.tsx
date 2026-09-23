"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { NAV_ITEMS } from "./nav-items";
import { ReminderBell } from "./reminder-bell";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { useCurrentUser } from "@/hooks/use-auth";
import { useUiStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground [&_svg]:shrink-0">
          <SheetHeader className="px-4 pt-5">
            <SheetTitle className="text-sidebar-foreground [&_span]:text-sidebar-foreground">
              <BrandMark />
            </SheetTitle>
          </SheetHeader>
          <nav className="mt-2 space-y-1 px-3">
            {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === "admin").map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <BrandMark iconOnly />

      <div className="flex items-center gap-1">
        <ReminderBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
