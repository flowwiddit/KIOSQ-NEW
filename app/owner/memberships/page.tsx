import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/db";
import { formatDateTime, formatKrw, minutesToHours } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OwnerMembershipsPage() {
  const [memberships, passes, pricingRules] = await Promise.all([
    prisma.membership.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
    prisma.studyPass.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
    prisma.pricingRule.findMany({ orderBy: { amountKrw: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-3xl">Pricing management</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pricingRules.map((rule) => (
            <div key={rule.id} className="rounded-3xl border bg-white/75 p-5">
              <p className="font-semibold">{rule.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold">{formatKrw(rule.amountKrw)}</p>
              <p className="mt-2 text-sm text-muted-foreground">{rule.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Membership management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberships.map((membership) => {
              const progress = Math.round((membership.remainingMinutes / membership.totalMinutes) * 100);
              return (
                <div key={membership.id} className="rounded-3xl border bg-white/75 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{membership.user.name}</p>
                    <Badge variant="outline">{membership.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{membership.title} · expires {formatDateTime(membership.expiresAt)}</p>
                  <Progress className="mt-4" value={progress} />
                  <p className="mt-2 text-sm font-medium">{minutesToHours(membership.remainingMinutes)} remaining</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pass management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {passes.map((pass) => (
              <div key={pass.id} className="flex items-center justify-between rounded-3xl border bg-white/75 p-5">
                <div>
                  <p className="font-semibold">{pass.user.name}</p>
                  <p className="text-sm text-muted-foreground">{pass.name} · {minutesToHours(pass.remainingMinutes)} left</p>
                </div>
                <Badge variant="outline">{pass.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
