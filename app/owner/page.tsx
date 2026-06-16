import { startOfDay, startOfMonth, subDays } from "date-fns";
import { Activity, Armchair, CalendarCheck, CreditCard, MonitorCheck, TrendingUp, Users, Wallet } from "lucide-react";

import { TrendChart } from "@/components/owner/trend-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatKrw } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const now = new Date();
  const today = startOfDay(now);
  const monthStart = startOfMonth(now);
  const [revenueToday, revenueMonth, activeCustomers, occupiedSeats, totalSeats, reservationsToday, membershipSales, unhealthyDevices] =
    await Promise.all([
      prisma.transaction.aggregate({ where: { status: "PAID", createdAt: { gte: today } }, _sum: { amountKrw: true } }),
      prisma.transaction.aggregate({ where: { status: "PAID", createdAt: { gte: monthStart } }, _sum: { amountKrw: true } }),
      prisma.checkIn.count({ where: { status: "ACTIVE" } }),
      prisma.seat.count({ where: { status: "OCCUPIED" } }),
      prisma.seat.count(),
      prisma.reservation.count({ where: { startsAt: { gte: today } } }),
      prisma.transaction.count({ where: { status: "PAID", type: { in: ["MEMBERSHIP", "STUDY_PASS"] }, createdAt: { gte: monthStart } } }),
      prisma.deviceStatus.count({ where: { status: { not: "ONLINE" } } })
    ]);
  const availableSeats = await prisma.seat.count({ where: { status: "AVAILABLE" } });
  const occupancy = totalSeats ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

  const days = Array.from({ length: 14 }, (_, index) => subDays(today, 13 - index));
  const paidTransactions = await prisma.transaction.findMany({
    where: { status: "PAID", createdAt: { gte: days[0] } },
    select: { amountKrw: true, createdAt: true, type: true }
  });
  const checkIns = await prisma.checkIn.findMany({
    where: { createdAt: { gte: days[0] } },
    select: { createdAt: true }
  });
  const chartData = days.map((day) => {
    const key = day.toISOString().slice(0, 10);
    const revenue = paidTransactions
      .filter((transaction) => transaction.createdAt.toISOString().slice(0, 10) === key)
      .reduce((sum, transaction) => sum + transaction.amountKrw, 0);
    const membership = paidTransactions.filter(
      (transaction) => transaction.createdAt.toISOString().slice(0, 10) === key && ["MEMBERSHIP", "STUDY_PASS"].includes(transaction.type)
    ).length;
    const occupancyValue = checkIns.filter((checkIn) => checkIn.createdAt.toISOString().slice(0, 10) === key).length;

    return {
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      revenue: Math.round(revenue / 1000),
      occupancy: occupancyValue,
      memberships: membership
    };
  });

  const cards = [
    { title: "Revenue Today", value: formatKrw(revenueToday._sum.amountKrw ?? 0), icon: Wallet },
    { title: "Revenue This Month", value: formatKrw(revenueMonth._sum.amountKrw ?? 0), icon: TrendingUp },
    { title: "Active Customers", value: activeCustomers.toString(), icon: Users },
    { title: "Current Occupancy", value: `${occupancy}%`, icon: Activity },
    { title: "Available Seats", value: availableSeats.toString(), icon: Armchair },
    { title: "Reservations Today", value: reservationsToday.toString(), icon: CalendarCheck },
    { title: "Membership Sales", value: membershipSales.toString(), icon: CreditCard },
    { title: "Device Status", value: unhealthyDevices === 0 ? "Healthy" : `${unhealthyDevices} alerts`, icon: MonitorCheck }
  ];

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="accent">Owner dashboard</Badge>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Cafe operations command center</h1>
        <p className="mt-2 text-muted-foreground">Revenue, occupancy, reservations, memberships, products, and device health in one view.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-white/80">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <card.icon className="h-5 w-5 text-[#98763d]" />
              </div>
              <p className="mt-4 font-display text-3xl font-semibold tracking-tight">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Amounts shown in thousands of KRW.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={chartData} valueKey="revenue" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Trend</CardTitle>
            <CardDescription>Daily check-in volume.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={chartData} valueKey="occupancy" color="#0A0A0A" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Membership Trend</CardTitle>
            <CardDescription>Membership and pass sales.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={chartData} valueKey="memberships" color="#7C3AED" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
