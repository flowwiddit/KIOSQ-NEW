import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { fulfillPaidTransaction } from "@/lib/payments";

const tossWebhookSchema = z.object({
  eventType: z.string(),
  data: z.object({
    orderId: z.string(),
    paymentKey: z.string().optional(),
    method: z.string().optional(),
    receipt: z
      .object({
        url: z.string().optional()
      })
      .optional()
  })
});

function isValidSignature(rawBody: string, signature: string | null) {
  const secret = process.env.TOSS_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  if (signature.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!isValidSignature(rawBody, request.headers.get("toss-signature"))) {
    return NextResponse.json({ message: "Invalid signature." }, { status: 401 });
  }

  const payload = tossWebhookSchema.parse(JSON.parse(rawBody));

  if (payload.eventType.includes("PAYMENT_STATUS_CHANGED") || payload.eventType.includes("DONE")) {
    await fulfillPaidTransaction(payload.data.orderId, {
      paymentKey: payload.data.paymentKey,
      method: payload.data.method,
      receiptUrl: payload.data.receipt?.url
    });
  }

  if (payload.eventType.includes("CANCELED")) {
    await prisma.transaction.updateMany({
      where: { orderId: payload.data.orderId },
      data: { status: "CANCELLED" }
    });
  }

  return NextResponse.json({ ok: true });
}
