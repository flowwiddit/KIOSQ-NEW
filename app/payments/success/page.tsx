import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { fulfillPaidTransaction } from "@/lib/payments";
import { confirmTossPayment } from "@/lib/toss";

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
}) {
  const params = await searchParams;
  const { paymentKey, orderId, amount } = params;

  if (paymentKey && orderId && amount) {
    const transaction = await prisma.transaction.findUnique({
      where: { orderId }
    });

    if (transaction && transaction.amountKrw === Number(amount)) {
      const payment = await confirmTossPayment({
        paymentKey,
        orderId,
        amount: Number(amount)
      });

      await fulfillPaidTransaction(orderId, {
        paymentKey: payment.paymentKey,
        method: payment.method,
        receiptUrl: payment.receipt?.url
      });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <Card className="glass-panel max-w-lg">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">Payment complete</h1>
          <p className="mt-3 text-muted-foreground">Your purchase has been activated and is visible in your KIOSQ account.</p>
          <Button asChild className="mt-7" variant="accent">
            <Link href="/customer/history">View purchase history</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
