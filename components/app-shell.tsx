import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Coffee, LayoutDashboard, Shield, Ticket, UserRound } from "lucide-react";
import type { UserRole } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const customerLinks = [
  { href: "/customer", label: "Home", icon: LayoutDashboard },
  { href: "/customer/reservations", label: "Reservations", icon: Ticket },
  { href: "/customer/memberships", label: "Memberships", icon: Shield },
  { href: "/customer/store", label: "Store", icon: Coffee },
  { href: "/customer/notifications", label: "Notifications", icon: LayoutDashboard },
  { href: "/customer/profile", label: "Profile", icon: UserRound }
];

const ownerLinks = [
  { href: "/owner", label: "Dashboard" },
  { href: "/owner/seats", label: "Seats" },
  { href: "/owner/reservations", label: "Reservations" },
  { href: "/owner/customers", label: "Customers" },
  { href: "/owner/memberships", label: "Memberships" },
  { href: "/owner/products", label: "Products" },
  { href: "/owner/reports", label: "Reports" },
  { href: "/owner/devices", label: "Devices" }
];

export function AppShell({
  children,
  role,
  section = "customer"
}: {
  children: React.ReactNode;
  role: UserRole;
  section?: "customer" | "owner";
}) {
  const links = section === "customer" ? customerLinks : ownerLinks;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href={section === "owner" ? "/owner" : "/customer"} className="font-display text-2xl font-semibold tracking-tight">
            KIOSQ
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Button key={link.href} asChild variant="ghost" size="sm">
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Badge variant={role === "OWNER" ? "accent" : "secondary"}>{role}</Badge>
            {role === "OWNER" || role === "STAFF" ? (
              <Button asChild variant={section === "owner" ? "secondary" : "outline"} size="sm">
                <Link href={section === "owner" ? "/customer" : "/owner"}>{section === "owner" ? "Customer" : "Owner"}</Link>
              </Button>
            ) : null}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 sm:px-6 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("shrink-0 rounded-full border bg-white/75 px-4 py-2 text-sm font-medium text-muted-foreground")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
