import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { fulfillPaidTransaction } from "@/lib/payments";
import { confirmTossPayment } from "@/lib/toss";

const confirmSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.coerce.number().int().positive()
});

export async function POST(request: Request) {
  const data = confirmSchema.parse(await request.json());
  const transaction = await prisma.transaction.findUnique({
    where: { orderId: data.orderId }
  });

  if (!transaction || transaction.amountKrw !== data.amount) {
    return NextResponse.json({ message: "Invalid order or amount." }, { status: 400 });
  }

  const payment = await confirmTossPayment(data);
  const paid = await fulfillPaidTransaction(data.orderId, {
    paymentKey: payment.paymentKey,
    method: payment.method,
    receiptUrl: payment.receipt?.url
  });

  return NextResponse.json({ ok: true, transaction: paid });
}
