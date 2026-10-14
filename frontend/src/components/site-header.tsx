import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function SiteHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-foreground/10 px-6 sm:px-14">
      <Link href="/" className="inline-flex items-center">
        <BrandMark />
      </Link>
      {children}
    </header>
  );
}
