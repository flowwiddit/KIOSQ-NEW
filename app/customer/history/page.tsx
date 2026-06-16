import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, formatKrw } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PurchaseHistoryPage() {
  const user = await requireUser();
  const [transactions, orders] = await Promise.all([
    prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-3xl">Transaction history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex flex-col gap-3 rounded-3xl border bg-white/75 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(transaction.createdAt)} · {transaction.type}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-display text-xl font-semibold">{formatKrw(transaction.amountKrw)}</p>
                <Badge variant="outline">{transaction.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Store orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-3xl border bg-white/75 p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Pickup {order.pickupCode}</p>
                <Badge variant="outline">{order.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(order.createdAt)}</p>
              <div className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>{formatKrw(item.priceKrw * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {orders.length === 0 ? <p className="text-sm text-muted-foreground">No store orders yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
