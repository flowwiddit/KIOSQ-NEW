import { ShoppingBag } from "lucide-react";

import { createProductOrder } from "@/app/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";
import { formatKrw } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }]
  });

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="accent">Store</Badge>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">Cafe products and services</h1>
        <p className="mt-2 text-muted-foreground">Order drinks, snacks, or printing credits for pickup at the service bar.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="bg-white/80">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>{product.category.replaceAll("_", " ")}</CardDescription>
                </div>
                <Badge variant="outline">{product.stock} left</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="min-h-12 text-sm leading-6 text-muted-foreground">{product.description}</p>
              <div className="mt-5 flex items-end justify-between">
                <p className="font-display text-3xl font-semibold">{formatKrw(product.priceKrw)}</p>
                <ShoppingBag className="h-7 w-7 text-[#98763d]" />
              </div>
              <form action={createProductOrder} className="mt-6 flex gap-3">
                <input type="hidden" name="productId" value={product.id} />
                <Input className="w-24" name="quantity" type="number" min={1} max={20} defaultValue={1} aria-label="Quantity" />
                <FormSubmitButton className="flex-1" variant="accent" disabled={product.stock <= 0} pendingLabel="Creating order...">
                  Order
                </FormSubmitButton>
              </form>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
