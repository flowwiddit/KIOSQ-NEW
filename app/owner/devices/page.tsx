import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function variant(status: string) {
  if (status === "ONLINE") return "success";
  if (status === "DEGRADED") return "warning";
  if (status === "MAINTENANCE") return "secondary";
  return "destructive";
}

export default async function OwnerDevicesPage() {
  const devices = await prisma.deviceStatus.findMany({ orderBy: [{ status: "asc" }, { name: "asc" }] });

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-3xl">Device status</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => (
          <div key={device.id} className="rounded-3xl border bg-white/75 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{device.name}</p>
                <p className="text-sm text-muted-foreground">{device.type} · {device.location}</p>
              </div>
              <Badge variant={variant(device.status)}>{device.status}</Badge>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Last seen {formatDateTime(device.lastSeenAt)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
