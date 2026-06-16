import { updateSeatStatus } from "@/app/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OwnerSeatsPage() {
  const [seats, reservations] = await Promise.all([
    prisma.seat.findMany({ include: { currentUser: true }, orderBy: [{ type: "asc" }, { code: "asc" }] }),
    prisma.reservation.findMany({ include: { user: true, seat: true }, orderBy: { startsAt: "desc" }, take: 20 })
  ]);

  return (
    <div className="space-y-6">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-3xl">Seat management</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {seats.map((seat) => (
            <div key={seat.id} className="rounded-3xl border bg-white/75 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-xl font-semibold">{seat.code}</p>
                  <p className="text-sm text-muted-foreground">{seat.name} · {seat.type.replaceAll("_", " ")}</p>
                </div>
                <Badge variant="outline">{seat.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Current user: {seat.currentUser?.name ?? "None"}</p>
              <form action={updateSeatStatus} className="mt-4 flex gap-2">
                <input type="hidden" name="seatId" value={seat.id} />
                <Select name="status" defaultValue={seat.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE"].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormSubmitButton size="sm" variant="accent" pendingLabel="Saving...">
                  Save
                </FormSubmitButton>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent reservations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="grid gap-3 rounded-3xl border bg-white/75 p-4 md:grid-cols-4">
              <p className="font-semibold">{reservation.seat.code}</p>
              <p>{reservation.user.name}</p>
              <p className="text-muted-foreground">{formatDateTime(reservation.startsAt)}</p>
              <Badge variant="outline" className="w-fit">{reservation.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
