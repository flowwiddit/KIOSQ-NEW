import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatDateTime, minutesToHours } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OwnerCustomersPage() {
  const customers = await prisma.user.findMany({
    include: {
      memberships: { where: { status: "ACTIVE" } },
      studyPasses: { where: { status: "ACTIVE" } },
      reservations: true,
      transactions: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-3xl">Customers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {customers.map((customer) => {
          const remaining =
            customer.memberships.reduce((sum, item) => sum + item.remainingMinutes, 0) +
            customer.studyPasses.reduce((sum, item) => sum + item.remainingMinutes, 0);

          return (
            <div key={customer.id} className="grid gap-3 rounded-3xl border bg-white/75 p-5 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
              <div>
                <p className="font-semibold">{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              </div>
              <Badge variant="outline" className="w-fit">{customer.role}</Badge>
              <p className="text-sm">Remaining: <span className="font-semibold">{minutesToHours(remaining)}</span></p>
              <p className="text-sm text-muted-foreground">Joined {formatDateTime(customer.createdAt)}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
