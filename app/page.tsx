import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, Clock, ShieldCheck, Sparkles } from "lucide-react";

import { HeroMotion } from "@/components/marketing/hero-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const capabilities = [
  "Self-service check-in/out",
  "Toss Payments checkout",
  "Clerk, Kakao, Naver login",
  "Owner revenue and occupancy dashboard",
  "Membership and pass automation",
  "Seat status and device monitoring"
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight">
          KIOSQ
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/customer">Customer</Link>
          <Link href="/owner">Owner</Link>
          <Link href="/sign-in">Login</Link>
        </nav>
        <Button asChild variant="accent">
          <Link href="/sign-up">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pt-20">
        <HeroMotion>
          <Badge variant="accent" className="mb-6">
            Premium Study Cafe OS for Korea
          </Badge>
          <h1 className="max-w-4xl font-display text-5xl font-semibold tracking-[-0.055em] text-balance sm:text-7xl lg:text-8xl">
            Operate a quiet, profitable study cafe without friction.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            KIOSQ combines customer memberships, seat reservations, check-in control, store orders, Toss Payments, and owner analytics in one deployable system.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="accent">
              <Link href="/customer/reservations">Reserve a seat</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/owner">View owner dashboard</Link>
            </Button>
          </div>
        </HeroMotion>

        <div className="relative">
          <div className="absolute -inset-10 rounded-full bg-accent/20 blur-3xl" />
          <Card className="glass-panel relative overflow-hidden rounded-[2rem] border-white/70">
            <CardContent className="p-6 sm:p-8">
              <div className="rounded-[1.5rem] bg-[#0a0a0a] p-5 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/55">Revenue today</p>
                    <p className="mt-1 font-display text-4xl font-semibold">₩1,284,000</p>
                  </div>
                  <BarChart3 className="h-10 w-10 text-accent" />
                </div>
                <div className="mt-8 grid grid-cols-3 gap-3">
                  {[
                    ["68%", "Occupancy"],
                    ["42", "Active"],
                    ["18", "Available"]
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-white/8 p-4">
                      <p className="font-display text-2xl font-semibold">{value}</p>
                      <p className="mt-1 text-xs text-white/55">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {capabilities.map((capability) => (
                  <div key={capability} className="flex items-center gap-3 rounded-2xl border bg-white/70 p-4 text-sm font-medium">
                    <BadgeCheck className="h-5 w-5 text-[#98763d]" />
                    {capability}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 sm:px-8 md:grid-cols-3">
        {[
          { icon: Sparkles, title: "Luxury minimal UX", body: "Responsive customer and owner portals with premium visual hierarchy." },
          { icon: Clock, title: "Real-time time control", body: "Track remaining minutes, reservations, active check-ins, and checkout usage." },
          { icon: ShieldCheck, title: "Production integrations", body: "Clerk auth, Toss payments, PostHog analytics, Supabase PostgreSQL and Storage." }
        ].map((item) => (
          <Card key={item.title} className="bg-white/75">
            <CardContent className="p-6">
              <item.icon className="h-7 w-7 text-[#98763d]" />
              <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
