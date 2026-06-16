import { notFound } from "next/navigation";

import { TossCheckout } from "@/components/payments/toss-checkout";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTossClientKey } from "@/lib/toss";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const user = await requireUser();
  const { orderId } = await searchParams;

  if (!orderId) {
    notFound();
  }

  const transaction = await prisma.transaction.findUnique({
    where: { orderId }
  });

  if (!transaction || transaction.userId !== user.id) {
    notFound();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <TossCheckout
        clientKey={getTossClientKey()}
        order={{
          orderId: transaction.orderId,
          orderName: transaction.description,
          amount: transaction.amountKrw,
          customerName: user.name,
          customerEmail: user.email,
          successUrl: absoluteUrl(`/payments/success?orderId=${encodeURIComponent(transaction.orderId)}`),
          failUrl: absoluteUrl(`/payments/fail?orderId=${encodeURIComponent(transaction.orderId)}`)
        }}
      />
    </main>
  );
}
