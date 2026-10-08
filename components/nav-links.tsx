"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/news", label: "News" },
] as const;

const baseClass = "border-b-2 px-3 py-1.5 font-medium transition-colors";
const activeClass = "border-brand text-brand";
const inactiveClass =
  "border-transparent text-muted hover:border-border hover:text-brand";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`${baseClass} ${active ? activeClass : inactiveClass}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
