import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OwnerReservationsPage() {
  const reservations = await prisma.reservation.findMany({
    include: { user: true, seat: true, transaction: true },
    orderBy: { startsAt: "desc" },
    take: 100
  });

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-3xl">Reservations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reservations.map((reservation) => (
          <div key={reservation.id} className="grid gap-3 rounded-3xl border bg-white/75 p-5 lg:grid-cols-[0.8fr_1fr_1fr_0.8fr_0.7fr]">
            <div>
              <p className="font-semibold">{reservation.seat.code}</p>
              <p className="text-sm text-muted-foreground">{reservation.seat.type.replaceAll("_", " ")}</p>
            </div>
            <div>
              <p className="font-semibold">{reservation.user.name}</p>
              <p className="text-sm text-muted-foreground">{reservation.user.email}</p>
            </div>
            <p className="text-sm text-muted-foreground">{formatDateTime(reservation.startsAt)} - {formatDateTime(reservation.endsAt)}</p>
            <Badge variant="outline" className="w-fit">{reservation.status}</Badge>
            <Badge variant={reservation.transaction?.status === "PAID" ? "success" : "warning"} className="w-fit">
              {reservation.transaction?.status ?? "NO PAYMENT"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
