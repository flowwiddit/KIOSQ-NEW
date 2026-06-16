import { MembershipPlan } from "@prisma/client";
import { CalendarDays, Clock, Crown } from "lucide-react";

import { createMembershipCheckout } from "@/app/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, formatKrw, minutesToHours } from "@/lib/utils";

export const dynamic = "force-dynamic";

const plans = [
  {
    plan: MembershipPlan.DAILY_PASS,
    title: "Daily Pass",
    price: 18000,
    minutes: 720,
    icon: Clock,
    description: "12 hours for focused day visits."
  },
  {
    plan: MembershipPlan.WEEKLY_PASS,
    title: "Weekly Pass",
    price: 89000,
    minutes: 4200,
    icon: CalendarDays,
    description: "70 hours valid for seven days."
  },
  {
    plan: MembershipPlan.MONTHLY_MEMBERSHIP,
    title: "Monthly Membership",
    price: 249000,
    minutes: 14400,
    icon: Crown,
    description: "240 hours for premium monthly routines."
  }
];

export default async function MembershipsPage() {
  const user = await requireUser();
  const [memberships, passes] = await Promise.all([
    prisma.membership.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.studyPass.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="accent">Memberships</Badge>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Choose your study rhythm</h1>
        <p className="mt-2 text-muted-foreground">All plans track remaining time, expiration, and purchase history automatically.</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.plan} className={plan.plan === MembershipPlan.MONTHLY_MEMBERSHIP ? "bg-[#0a0a0a] text-white" : "bg-white/80"}>
            <CardHeader>
              <plan.icon className={plan.plan === MembershipPlan.MONTHLY_MEMBERSHIP ? "h-8 w-8 text-accent" : "h-8 w-8 text-[#98763d]"} />
              <CardTitle>{plan.title}</CardTitle>
              <CardDescription className={plan.plan === MembershipPlan.MONTHLY_MEMBERSHIP ? "text-white/55" : undefined}>
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl font-semibold">{formatKrw(plan.price)}</p>
              <p className={plan.plan === MembershipPlan.MONTHLY_MEMBERSHIP ? "mt-2 text-sm text-white/55" : "mt-2 text-sm text-muted-foreground"}>
                {minutesToHours(plan.minutes)} included
              </p>
              <form action={createMembershipCheckout} className="mt-6">
                <input type="hidden" name="plan" value={plan.plan} />
                <FormSubmitButton className="w-full" variant={plan.plan === MembershipPlan.MONTHLY_MEMBERSHIP ? "accent" : "default"} pendingLabel="Opening checkout...">
                  Purchase
                </FormSubmitButton>
              </form>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Memberships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberships.map((membership) => {
              const percentage = Math.round((membership.remainingMinutes / membership.totalMinutes) * 100);
              return (
                <div key={membership.id} className="rounded-3xl border bg-white/75 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{membership.title}</p>
                    <Badge variant="outline">{membership.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Expires {formatDateTime(membership.expiresAt)}</p>
                  <Progress className="mt-4" value={percentage} />
                  <p className="mt-2 text-sm font-medium">{minutesToHours(membership.remainingMinutes)} remaining</p>
                </div>
              );
            })}
            {memberships.length === 0 ? <p className="text-sm text-muted-foreground">No monthly memberships yet.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study passes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {passes.map((pass) => {
              const percentage = Math.round((pass.remainingMinutes / pass.totalMinutes) * 100);
              return (
                <div key={pass.id} className="rounded-3xl border bg-white/75 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{pass.name}</p>
                    <Badge variant="outline">{pass.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Expires {formatDateTime(pass.expiresAt)}</p>
                  <Progress className="mt-4" value={percentage} />
                  <p className="mt-2 text-sm font-medium">{minutesToHours(pass.remainingMinutes)} remaining</p>
                </div>
              );
            })}
            {passes.length === 0 ? <p className="text-sm text-muted-foreground">No study passes yet.</p> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
