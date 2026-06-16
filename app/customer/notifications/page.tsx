import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-3xl">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => (
          <div key={notification.id} className="rounded-3xl border bg-white/75 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{notification.title}</p>
                  <Badge variant={notification.readAt ? "secondary" : "accent"}>{notification.readAt ? "Read" : "Unread"}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{notification.body}</p>
                <p className="mt-3 text-xs text-muted-foreground">{formatDateTime(notification.createdAt)} · {notification.type}</p>
              </div>
              {notification.actionUrl ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={notification.actionUrl}>Open</Link>
                </Button>
              ) : null}
            </div>
          </div>
        ))}
        {notifications.length === 0 ? <p className="text-sm text-muted-foreground">No notifications yet.</p> : null}
      </CardContent>
    </Card>
  );
}
