import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function PaymentFailPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; code?: string; orderId?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <Card className="glass-panel max-w-lg">
        <CardContent className="p-8 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">Payment was not completed</h1>
          <p className="mt-3 text-muted-foreground">{params.message ?? "Please try again or choose a different payment method."}</p>
          {params.code ? <p className="mt-3 text-xs text-muted-foreground">Code: {params.code}</p> : null}
          <Button asChild className="mt-7" variant="outline">
            <Link href={params.orderId ? `/payments/checkout?orderId=${encodeURIComponent(params.orderId)}` : "/customer"}>
              Return to checkout
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
