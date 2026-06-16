import { addHours } from "date-fns";
import { Armchair, CheckCircle2 } from "lucide-react";

import { checkIn, createReservation } from "@/app/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, formatKrw } from "@/lib/utils";

export const dynamic = "force-dynamic";

function statusVariant(status: string) {
  if (status === "AVAILABLE") return "success";
  if (status === "RESERVED") return "warning";
  if (status === "OCCUPIED") return "secondary";
  return "destructive";
}

export default async function ReservationsPage() {
  const user = await requireUser();
  const [seats, reservations] = await Promise.all([
    prisma.seat.findMany({ orderBy: [{ type: "asc" }, { code: "asc" }] }),
    prisma.reservation.findMany({
      where: { userId: user.id },
      include: { seat: true },
      orderBy: { startsAt: "desc" },
      take: 10
    })
  ]);
  const availableSeats = seats.filter((seat) => seat.status === "AVAILABLE");
  const defaultStart = addHours(new Date(), 1).toISOString().slice(0, 16);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-3xl">Reserve a seat</CardTitle>
          <CardDescription>Choose a seat, start time, and session duration. Reservations are confirmed after Toss payment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createReservation} className="space-y-5">
            <div className="space-y-2">
              <Label>Seat</Label>
              <Select name="seatId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select an available seat" />
                </SelectTrigger>
                <SelectContent>
                  {availableSeats.map((seat) => (
                    <SelectItem key={seat.id} value={seat.id}>
                      {seat.code} · {seat.name} · {formatKrw(seat.hourlyRateKrw)}/h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start time</Label>
                <Input id="startsAt" name="startsAt" type="datetime-local" defaultValue={defaultStart} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">Duration</Label>
                <Select name="durationMinutes" defaultValue="120">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[60, 120, 180, 240, 360].map((minutes) => (
                      <SelectItem key={minutes} value={String(minutes)}>
                        {minutes / 60} hours
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Input id="note" name="note" placeholder="Optional request" />
            </div>
            <FormSubmitButton className="w-full" variant="accent" pendingLabel="Creating checkout...">
              Continue to reservation payment
            </FormSubmitButton>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Seat map</CardTitle>
            <CardDescription>Open desks, quiet zones, premium desks, focus booths, and meeting rooms.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {seats.map((seat) => (
              <div key={seat.id} className="rounded-3xl border bg-white/75 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-semibold">{seat.code}</p>
                    <p className="text-sm text-muted-foreground">{seat.name}</p>
                  </div>
                  <Badge variant={statusVariant(seat.status)}>{seat.status}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span>{seat.type.replaceAll("_", " ")}</span>
                  <span className="font-semibold">{formatKrw(seat.hourlyRateKrw)}/h</span>
                </div>
                {seat.status === "AVAILABLE" ? (
                  <form action={checkIn} className="mt-4">
                    <input type="hidden" name="seatId" value={seat.id} />
                    <FormSubmitButton variant="outline" size="sm" className="w-full" pendingLabel="Checking in...">
                      <CheckCircle2 className="h-4 w-4" /> Check in now
                    </FormSubmitButton>
                  </form>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your reservations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="flex flex-col gap-3 rounded-3xl border bg-white/75 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Armchair className="h-5 w-5 text-[#98763d]" />
                  <div>
                    <p className="font-semibold">{reservation.seat.name}</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(reservation.startsAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{reservation.status}</Badge>
                  {reservation.status === "CONFIRMED" ? (
                    <form action={checkIn}>
                      <input type="hidden" name="reservationId" value={reservation.id} />
                      <input type="hidden" name="seatId" value={reservation.seatId} />
                      <FormSubmitButton size="sm" variant="accent" pendingLabel="Checking in...">
                        Check in
                      </FormSubmitButton>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
