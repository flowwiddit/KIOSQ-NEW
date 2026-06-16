import { auth, currentUser } from "@clerk/nextjs/server";
import { UserRole, type User } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

function metadataRole(value: unknown): UserRole {
  if (value === UserRole.OWNER || value === UserRole.STAFF || value === UserRole.CUSTOMER) {
    return value;
  }

  return UserRole.CUSTOMER;
}

export async function getCurrentDbUser(): Promise<User | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? `${userId}@kiosq.local`;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || "KIOSQ Member";
  const role = metadataRole(clerkUser.publicMetadata.role);
  const kakaoProviderId = clerkUser.externalAccounts.find((account) => account.provider === "oauth_kakao")?.providerUserId;
  const naverProviderId = clerkUser.externalAccounts.find((account) => account.provider === "oauth_naver")?.providerUserId;

  return prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      email,
      name,
      imageUrl: clerkUser.imageUrl,
      role,
      kakaoProviderId,
      naverProviderId
    },
    create: {
      clerkId: userId,
      email,
      name,
      imageUrl: clerkUser.imageUrl,
      role,
      kakaoProviderId,
      naverProviderId
    }
  });
}

export async function requireUser() {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect("/customer");
  }

  return user;
}

export function canManageOperations(role: UserRole) {
  return role === UserRole.OWNER || role === UserRole.STAFF;
}
