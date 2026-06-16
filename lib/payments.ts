import { MembershipPlan, OrderStatus, ReservationStatus, TransactionStatus, TransactionType } from "@prisma/client";
import { addDays } from "date-fns";

import { prisma } from "@/lib/db";

function planDetails(plan: MembershipPlan) {
  switch (plan) {
    case MembershipPlan.DAILY_PASS:
      return { title: "Daily Pass", totalMinutes: 720, expiresAt: addDays(new Date(), 1), amountKrw: 18000 };
    case MembershipPlan.WEEKLY_PASS:
      return { title: "Weekly Pass", totalMinutes: 4200, expiresAt: addDays(new Date(), 7), amountKrw: 89000 };
    case MembershipPlan.MONTHLY_MEMBERSHIP:
      return { title: "Monthly Membership", totalMinutes: 14400, expiresAt: addDays(new Date(), 30), amountKrw: 249000 };
  }
}

function getMetadataPlan(metadata: unknown): MembershipPlan | null {
  if (!metadata || typeof metadata !== "object" || !("plan" in metadata)) {
    return null;
  }

  const plan = (metadata as { plan?: unknown }).plan;

  if (plan === MembershipPlan.DAILY_PASS || plan === MembershipPlan.WEEKLY_PASS || plan === MembershipPlan.MONTHLY_MEMBERSHIP) {
    return plan;
  }

  return null;
}

export async function fulfillPaidTransaction(orderId: string, payment: { paymentKey?: string; method?: string; receiptUrl?: string }) {
  const transaction = await prisma.transaction.findUnique({
    where: { orderId },
    include: { reservations: true, productOrder: true }
  });

  if (!transaction || transaction.status === TransactionStatus.PAID) {
    return transaction;
  }

  return prisma.$transaction(async (tx) => {
    const paidTransaction = await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.PAID,
        tossPaymentKey: payment.paymentKey,
        method: payment.method,
        receiptUrl: payment.receiptUrl
      }
    });

    if (transaction.type === TransactionType.MEMBERSHIP || transaction.type === TransactionType.STUDY_PASS) {
      const plan = getMetadataPlan(transaction.metadata);

      if (plan) {
        const details = planDetails(plan);

        if (plan === MembershipPlan.MONTHLY_MEMBERSHIP) {
          await tx.membership.create({
            data: {
              userId: transaction.userId,
              plan,
              title: details.title,
              totalMinutes: details.totalMinutes,
              remainingMinutes: details.totalMinutes,
              startsAt: new Date(),
              expiresAt: details.expiresAt,
              priceKrw: transaction.amountKrw,
              transactionId: transaction.id
            }
          });
        } else {
          await tx.studyPass.create({
            data: {
              userId: transaction.userId,
              name: details.title,
              totalMinutes: details.totalMinutes,
              remainingMinutes: details.totalMinutes,
              expiresAt: details.expiresAt,
              priceKrw: transaction.amountKrw,
              transactionId: transaction.id
            }
          });
        }
      }
    }

    if (transaction.type === TransactionType.RESERVATION) {
      await tx.reservation.updateMany({
        where: { transactionId: transaction.id },
        data: { status: ReservationStatus.CONFIRMED }
      });
    }

    if (transaction.type === TransactionType.PRODUCT_ORDER) {
      await tx.order.updateMany({
        where: { transactionId: transaction.id },
        data: { status: OrderStatus.PAID }
      });
    }

    await tx.notification.create({
      data: {
        userId: transaction.userId,
        type: "PAYMENT",
        title: "Payment completed",
        body: `${transaction.description} payment of ₩${transaction.amountKrw.toLocaleString("ko-KR")} was completed.`,
        actionUrl: "/customer/history"
      }
    });

    return paidTransaction;
  });
}
