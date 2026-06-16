import { startOfMonth } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatDateTime, formatKrw } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OwnerReportsPage() {
  const monthStart = startOfMonth(new Date());
  const [transactions, orders, reservations, revenueByType] = await Promise.all([
    prisma.transaction.findMany({ where: { createdAt: { gte: monthStart } }, include: { user: true }, orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ include: { user: true, items: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.reservation.findMany({ include: { user: true, seat: true }, orderBy: { startsAt: "desc" }, take: 20 }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { status: "PAID", createdAt: { gte: monthStart } },
      _sum: { amountKrw: true },
      _count: true
    })
  ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {revenueByType.map((item) => (
          <Card key={item.type} className="bg-white/80">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{item.type}</p>
              <p className="mt-3 font-display text-3xl font-semibold">{formatKrw(item._sum.amountKrw ?? 0)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item._count} sales</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-3xl">Sales reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="grid gap-3 rounded-3xl border bg-white/75 p-4 md:grid-cols-[1fr_1fr_0.8fr_0.6fr]">
              <p className="font-semibold">{transaction.description}</p>
              <p className="text-muted-foreground">{transaction.user.name}</p>
              <p>{formatDateTime(transaction.createdAt)}</p>
              <div className="text-left md:text-right">
                <p className="font-semibold">{formatKrw(transaction.amountKrw)}</p>
                <Badge variant="outline">{transaction.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="rounded-3xl border bg-white/75 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{order.user.name} · {order.pickupCode}</p>
                  <Badge variant="outline">{order.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{order.items.map((item) => `${item.product.name} x ${item.quantity}`).join(", ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reservation report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="rounded-3xl border bg-white/75 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{reservation.seat.code} · {reservation.user.name}</p>
                  <Badge variant="outline">{reservation.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(reservation.startsAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
