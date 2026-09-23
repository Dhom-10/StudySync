import type { LucideIcon } from "lucide-react";
import { Mic, Library, ListChecks, Tags, BarChart3, Users, Settings } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/record", label: "Record", icon: Mic },
  { href: "/lessons", label: "My Lessons", icon: Library },
  { href: "/assignments", label: "Assignments", icon: ListChecks },
  { href: "/subjects", label: "Subjects", icon: Tags },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];
