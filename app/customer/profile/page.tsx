import { updateProfile } from "@/app/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="glass-panel">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.imageUrl ?? undefined} alt={user.name} />
              <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <Badge variant="accent">{user.role}</Badge>
              <CardTitle className="mt-2 text-3xl">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={user.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={user.phone ?? ""} placeholder="010-0000-0000" />
            </div>
            <div className="rounded-3xl border bg-white/75 p-5 text-sm text-muted-foreground">
              OAuth providers: Kakao {user.kakaoProviderId ? "connected" : "not connected"} · Naver {user.naverProviderId ? "connected" : "not connected"}
            </div>
            <FormSubmitButton variant="accent" pendingLabel="Saving...">
              Save profile
            </FormSubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
