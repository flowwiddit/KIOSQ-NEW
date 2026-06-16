"use server";

import {
  MembershipPlan,
  MembershipStatus,
  OrderStatus,
  PassStatus,
  ReservationStatus,
  SeatStatus,
  TransactionStatus,
  TransactionType,
  UserRole,
  type ProductCategory,
  type SeatType
} from "@prisma/client";
import { addDays, differenceInMinutes } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { captureServerEvent } from "@/lib/posthog";
import { createPaymentRedirects } from "@/lib/toss";
import { createOrderId } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().max(30).optional()
});

const reservationSchema = z.object({
  seatId: z.string().min(1),
  startsAt: z.string().datetime(),
  durationMinutes: z.coerce.number().int().min(30).max(360),
  note: z.string().max(500).optional()
});

const membershipSchema = z.object({
  plan: z.nativeEnum(MembershipPlan)
});

const productOrderSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20)
});

const productSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  category: z.custom<ProductCategory>(),
  description: z.string().min(2).max(500),
  priceKrw: z.coerce.number().int().min(0),
  stock: z.coerce.number().int().min(0),
  isActive: z.coerce.boolean().default(true)
});

const seatSchema = z.object({
  seatId: z.string().min(1),
  status: z.nativeEnum(SeatStatus)
});

function planDetails(plan: MembershipPlan) {
  switch (plan) {
    case MembershipPlan.DAILY_PASS:
      return { title: "Daily Pass", amountKrw: 18000, totalMinutes: 720, expiresAt: addDays(new Date(), 1), type: TransactionType.STUDY_PASS };
    case MembershipPlan.WEEKLY_PASS:
      return { title: "Weekly Pass", amountKrw: 89000, totalMinutes: 4200, expiresAt: addDays(new Date(), 7), type: TransactionType.STUDY_PASS };
    case MembershipPlan.MONTHLY_MEMBERSHIP:
      return {
        title: "Monthly Membership",
        amountKrw: 249000,
        totalMinutes: 14400,
        expiresAt: addDays(new Date(), 30),
        type: TransactionType.MEMBERSHIP
      };
  }
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const data = profileSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined
  });

  await prisma.user.update({
    where: { id: user.id },
    data
  });

  revalidatePath("/customer/profile");
}

export async function createReservation(formData: FormData) {
  const user = await requireUser();
  const data = reservationSchema.parse({
    seatId: formData.get("seatId"),
    startsAt: formData.get("startsAt"),
    durationMinutes: formData.get("durationMinutes"),
    note: formData.get("note") || undefined
  });

  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(startsAt.getTime() + data.durationMinutes * 60_000);

  const overlapping = await prisma.reservation.findFirst({
    where: {
      seatId: data.seatId,
      status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt }
    }
  });

  if (overlapping) {
    throw new Error("This seat is already reserved for the selected time.");
  }

  const seat = await prisma.seat.findUniqueOrThrow({ where: { id: data.seatId } });

  if (seat.status === SeatStatus.MAINTENANCE) {
    throw new Error("This seat is currently under maintenance.");
  }

  const reservationFee = await prisma.pricingRule.findUnique({ where: { key: "reservation-fee" } });
  const amountKrw = reservationFee?.amountKrw ?? 2000;
  const orderId = createOrderId("reservation");

  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId: user.id,
        type: TransactionType.RESERVATION,
        status: TransactionStatus.PENDING,
        orderId,
        amountKrw,
        description: `${seat.name} reservation`,
        metadata: { seatId: seat.id, startsAt, endsAt }
      }
    });

    await tx.reservation.create({
      data: {
        userId: user.id,
        seatId: seat.id,
        status: ReservationStatus.PENDING,
        startsAt,
        endsAt,
        durationMinutes: data.durationMinutes,
        note: data.note,
        transactionId: transaction.id
      }
    });

    await tx.seat.update({
      where: { id: seat.id },
      data: { status: SeatStatus.RESERVED }
    });
  });

  await captureServerEvent(user.clerkId, "reservation_created", { seat: seat.code, amountKrw });
  const redirects = createPaymentRedirects(orderId);
  redirect(`/payments/checkout?orderId=${encodeURIComponent(orderId)}&successUrl=${encodeURIComponent(redirects.successUrl)}&failUrl=${encodeURIComponent(redirects.failUrl)}`);
}

export async function createMembershipCheckout(formData: FormData) {
  const user = await requireUser();
  const data = membershipSchema.parse({ plan: formData.get("plan") });
  const details = planDetails(data.plan);
  const orderId = createOrderId(data.plan.toLowerCase());

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: details.type,
      status: TransactionStatus.PENDING,
      orderId,
      amountKrw: details.amountKrw,
      description: details.title,
      metadata: {
        plan: data.plan,
        totalMinutes: details.totalMinutes,
        expiresAt: details.expiresAt
      }
    }
  });

  await captureServerEvent(user.clerkId, "membership_checkout_started", { plan: data.plan, amountKrw: details.amountKrw });
  redirect(`/payments/checkout?orderId=${encodeURIComponent(orderId)}`);
}

export async function createProductOrder(formData: FormData) {
  const user = await requireUser();
  const data = productOrderSchema.parse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity")
  });
  const product = await prisma.product.findUniqueOrThrow({ where: { id: data.productId } });

  if (!product.isActive || product.stock < data.quantity) {
    throw new Error("Product is unavailable or out of stock.");
  }

  const totalKrw = product.priceKrw * data.quantity;
  const orderId = createOrderId("store");

  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId: user.id,
        type: TransactionType.PRODUCT_ORDER,
        status: TransactionStatus.PENDING,
        orderId,
        amountKrw: totalKrw,
        description: `${product.name} x ${data.quantity}`,
        metadata: { productId: product.id, quantity: data.quantity }
      }
    });

    await tx.order.create({
      data: {
        userId: user.id,
        status: OrderStatus.PENDING,
        totalKrw,
        pickupCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
        transactionId: transaction.id,
        items: {
          create: {
            productId: product.id,
            quantity: data.quantity,
            priceKrw: product.priceKrw
          }
        }
      }
    });

    await tx.product.update({
      where: { id: product.id },
      data: { stock: { decrement: data.quantity } }
    });
  });

  await captureServerEvent(user.clerkId, "product_order_created", { product: product.slug, totalKrw });
  redirect(`/payments/checkout?orderId=${encodeURIComponent(orderId)}`);
}

export async function checkIn(formData: FormData) {
  const user = await requireUser();
  const reservationId = z.string().optional().parse(formData.get("reservationId") || undefined);
  const seatId = z.string().min(1).parse(formData.get("seatId"));

  const activeCheckIn = await prisma.checkIn.findFirst({
    where: { userId: user.id, status: "ACTIVE" }
  });

  if (activeCheckIn) {
    throw new Error("You already have an active check-in.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.checkIn.create({
      data: {
        userId: user.id,
        seatId,
        reservationId
      }
    });

    await tx.seat.update({
      where: { id: seatId },
      data: { status: SeatStatus.OCCUPIED, currentUserId: user.id }
    });

    if (reservationId) {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.CHECKED_IN }
      });
    }
  });

  await captureServerEvent(user.clerkId, "checked_in", { seatId });
  revalidatePath("/customer");
  revalidatePath("/owner");
}

export async function checkOut(formData: FormData) {
  const user = await requireUser();
  const checkInId = z.string().min(1).parse(formData.get("checkInId"));
  const checkInRecord = await prisma.checkIn.findUniqueOrThrow({ where: { id: checkInId } });

  if (checkInRecord.userId !== user.id) {
    throw new Error("You cannot check out another user.");
  }

  const checkedOutAt = new Date();
  const minutesUsed = Math.max(1, differenceInMinutes(checkedOutAt, checkInRecord.checkedInAt));

  await prisma.$transaction(async (tx) => {
    await tx.checkIn.update({
      where: { id: checkInId },
      data: { status: "COMPLETED", checkedOutAt, minutesUsed }
    });

    await tx.seat.update({
      where: { id: checkInRecord.seatId },
      data: { status: SeatStatus.AVAILABLE, currentUserId: null }
    });

    if (checkInRecord.reservationId) {
      await tx.reservation.update({
        where: { id: checkInRecord.reservationId },
        data: { status: ReservationStatus.COMPLETED }
      });
    }

    const membership = await tx.membership.findFirst({
      where: { userId: user.id, status: MembershipStatus.ACTIVE, remainingMinutes: { gt: 0 }, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: "asc" }
    });

    if (membership) {
      await tx.membership.update({
        where: { id: membership.id },
        data: { remainingMinutes: Math.max(0, membership.remainingMinutes - minutesUsed) }
      });
    } else {
      const pass = await tx.studyPass.findFirst({
        where: { userId: user.id, status: PassStatus.ACTIVE, remainingMinutes: { gt: 0 }, expiresAt: { gt: new Date() } },
        orderBy: { expiresAt: "asc" }
      });

      if (pass) {
        await tx.studyPass.update({
          where: { id: pass.id },
          data: { remainingMinutes: Math.max(0, pass.remainingMinutes - minutesUsed) }
        });
      }
    }
  });

  await captureServerEvent(user.clerkId, "checked_out", { minutesUsed });
  revalidatePath("/customer");
  revalidatePath("/owner");
}

export async function upsertProduct(formData: FormData) {
  await requireRole([UserRole.OWNER]);
  const data = productSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    category: formData.get("category"),
    description: formData.get("description"),
    priceKrw: formData.get("priceKrw"),
    stock: formData.get("stock"),
    isActive: formData.get("isActive") === "on"
  });

  await prisma.product.upsert({
    where: { slug: data.slug },
    update: data,
    create: data
  });

  revalidatePath("/owner/products");
}

export async function updateSeatStatus(formData: FormData) {
  await requireRole([UserRole.OWNER, UserRole.STAFF]);
  const data = seatSchema.parse({
    seatId: formData.get("seatId"),
    status: formData.get("status")
  });

  await prisma.seat.update({
    where: { id: data.seatId },
    data: {
      status: data.status,
      currentUserId: data.status === SeatStatus.AVAILABLE || data.status === SeatStatus.MAINTENANCE ? null : undefined
    }
  });

  revalidatePath("/owner/seats");
}
