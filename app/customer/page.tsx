import Link from "next/link";
import { Bell, Clock, DoorOpen, History, MapPin, Timer } from "lucide-react";

import { checkOut } from "@/app/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, formatKrw, minutesToHours } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const user = await requireUser();
  const [memberships, passes, activeCheckIn, upcomingReservations, transactions, notifications] = await Promise.all([
    prisma.membership.findMany({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { expiresAt: "asc" } }),
    prisma.studyPass.findMany({ where: { userId: user.id, status: "ACTIVE" }, orderBy: { expiresAt: "asc" } }),
    prisma.checkIn.findFirst({ where: { userId: user.id, status: "ACTIVE" }, include: { seat: true } }),
    prisma.reservation.findMany({
      where: { userId: user.id, status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN"] } },
      include: { seat: true },
      orderBy: { startsAt: "asc" },
      take: 3
    }),
    prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.notification.findMany({ where: { userId: user.id, readAt: null }, orderBy: { createdAt: "desc" }, take: 4 })
  ]);
  const remainingMinutes =
    memberships.reduce((total, item) => total + item.remainingMinutes, 0) + passes.reduce((total, item) => total + item.remainingMinutes, 0);
  const totalMinutes = memberships.reduce((total, item) => total + item.totalMinutes, 0) + passes.reduce((total, item) => total + item.totalMinutes, 0);
  const progress = totalMinutes > 0 ? Math.round((remainingMinutes / totalMinutes) * 100) : 0;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass-panel">
          <CardHeader>
            <Badge variant="accent" className="w-fit">
              Customer portal
            </Badge>
            <CardTitle className="text-4xl">Good focus, {user.name.split(" ")[0]}</CardTitle>
            <CardDescription>Manage your seat, time balance, reservations, purchases, and cafe notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/80 p-5">
                <Clock className="h-6 w-6 text-[#98763d]" />
                <p className="mt-4 text-sm text-muted-foreground">Remaining time</p>
                <p className="font-display text-3xl font-semibold">{minutesToHours(remainingMinutes)}</p>
                <Progress className="mt-4" value={progress} />
              </div>
              <div className="rounded-3xl bg-white/80 p-5">
                <MapPin className="h-6 w-6 text-[#98763d]" />
                <p className="mt-4 text-sm text-muted-foreground">Current seat</p>
                <p className="font-display text-3xl font-semibold">{activeCheckIn?.seat.code ?? "None"}</p>
                <p className="text-sm text-muted-foreground">{activeCheckIn?.seat.name ?? "Check in to start a session"}</p>
              </div>
              <div className="rounded-3xl bg-white/80 p-5">
                <Bell className="h-6 w-6 text-[#98763d]" />
                <p className="mt-4 text-sm text-muted-foreground">Notifications</p>
                <p className="font-display text-3xl font-semibold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0a0a] text-white">
          <CardHeader>
            <CardTitle>Active session</CardTitle>
            <CardDescription className="text-white/55">Check out when leaving to preserve remaining time accuracy.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeCheckIn ? (
              <form action={checkOut} className="space-y-5">
                <input type="hidden" name="checkInId" value={activeCheckIn.id} />
                <div className="rounded-3xl bg-white/10 p-5">
                  <p className="text-sm text-white/55">Checked in</p>
                  <p className="mt-1 font-display text-2xl font-semibold">{formatDateTime(activeCheckIn.checkedInAt)}</p>
                  <p className="mt-2 text-sm text-white/60">{activeCheckIn.seat.name}</p>
                </div>
                <FormSubmitButton variant="accent" className="w-full" pendingLabel="Checking out...">
                  <DoorOpen className="h-4 w-4" /> Check out
                </FormSubmitButton>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="rounded-3xl bg-white/10 p-5">
                  <Timer className="h-8 w-8 text-accent" />
                  <p className="mt-4 text-white/70">No active session. Reserve or choose an available seat to start.</p>
                </div>
                <Button asChild variant="accent" className="w-full">
                  <Link href="/customer/reservations">Reserve a seat</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming reservations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReservations.map((reservation) => (
              <div key={reservation.id} className="rounded-2xl border bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{reservation.seat.name}</p>
                  <Badge variant="outline">{reservation.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(reservation.startsAt)}</p>
              </div>
            ))}
            {upcomingReservations.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming reservations.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between rounded-2xl border bg-white/70 p-4">
                <div>
                  <p className="font-semibold">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">{transaction.status}</p>
                </div>
                <p className="font-semibold">{formatKrw(transaction.amountKrw)}</p>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link href="/customer/history">
                <History className="h-4 w-4" /> Full history
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="rounded-2xl border bg-white/70 p-4">
                <p className="font-semibold">{notification.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
              </div>
            ))}
            {notifications.length === 0 ? <p className="text-sm text-muted-foreground">You are all caught up.</p> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
