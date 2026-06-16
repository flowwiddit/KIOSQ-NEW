import { UserRole } from "@prisma/client";

import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole([UserRole.OWNER, UserRole.STAFF]);

  return (
    <AppShell role={user.role} section="owner">
      {children}
    </AppShell>
  );
}
