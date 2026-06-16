import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <AppShell role={user.role} section="customer">
      {children}
    </AppShell>
  );
}
