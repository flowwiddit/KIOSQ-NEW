import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { prisma } from "@/lib/db";

type ClerkWebhookUser = {
  id: string;
  email_addresses?: Array<{ email_address: string; id: string }>;
  primary_email_address_id?: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  image_url?: string | null;
  public_metadata?: {
    role?: "CUSTOMER" | "STAFF" | "OWNER";
  };
  external_accounts?: Array<{ provider: string; provider_user_id: string }>;
};

function emailFor(user: ClerkWebhookUser) {
  return (
    user.email_addresses?.find((email) => email.id === user.primary_email_address_id)?.email_address ??
    user.email_addresses?.[0]?.email_address ??
    `${user.id}@kiosq.local`
  );
}

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ message: "Missing CLERK_WEBHOOK_SECRET." }, { status: 500 });
  }

  const payload = await request.text();
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ message: "Missing svix headers." }, { status: 400 });
  }

  const wh = new Webhook(webhookSecret);
  const event = wh.verify(payload, {
    "svix-id": svixId,
    "svix-timestamp": svixTimestamp,
    "svix-signature": svixSignature
  }) as { type: string; data: ClerkWebhookUser };

  if (event.type === "user.created" || event.type === "user.updated") {
    const user = event.data;
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "KIOSQ Member";
    const kakaoProviderId = user.external_accounts?.find((account) => account.provider === "oauth_kakao")?.provider_user_id;
    const naverProviderId = user.external_accounts?.find((account) => account.provider === "oauth_naver")?.provider_user_id;

    await prisma.user.upsert({
      where: { clerkId: user.id },
      update: {
        email: emailFor(user),
        name,
        imageUrl: user.image_url,
        role: user.public_metadata?.role ?? "CUSTOMER",
        kakaoProviderId,
        naverProviderId
      },
      create: {
        clerkId: user.id,
        email: emailFor(user),
        name,
        imageUrl: user.image_url,
        role: user.public_metadata?.role ?? "CUSTOMER",
        kakaoProviderId,
        naverProviderId
      }
    });
  }

  if (event.type === "user.deleted") {
    await prisma.user.deleteMany({
      where: { clerkId: event.data.id }
    });
  }

  return NextResponse.json({ ok: true });
}
