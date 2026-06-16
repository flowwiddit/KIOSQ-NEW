import { ProductCategory } from "@prisma/client";

import { upsertProduct } from "@/app/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { prisma } from "@/lib/db";
import { formatKrw } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OwnerProductsPage() {
  const products = await prisma.product.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-3xl">Product management</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertProduct} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input name="name" placeholder="Signature Latte" required />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input name="slug" placeholder="signature-latte" required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select name="category" defaultValue={ProductCategory.COFFEE}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ProductCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="description" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Price KRW</Label>
                <Input name="priceKrw" type="number" min={0} required />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input name="stock" type="number" min={0} required />
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border bg-white/75 p-4 text-sm font-medium">
              <input name="isActive" type="checkbox" defaultChecked />
              Active in customer catalog
            </label>
            <FormSubmitButton variant="accent" pendingLabel="Saving product...">
              Save product
            </FormSubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {products.map((product) => (
            <div key={product.id} className="rounded-3xl border bg-white/75 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.slug}</p>
                </div>
                <Badge variant={product.isActive ? "success" : "secondary"}>{product.isActive ? "Active" : "Hidden"}</Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="font-display text-2xl font-semibold">{formatKrw(product.priceKrw)}</span>
                <span className="text-sm text-muted-foreground">{product.stock} stock</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
