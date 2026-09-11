import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, TrendingDown, TrendingUp, RotateCcw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useShop } from "@/lib/shop-store";
import { clockTime, dayLabel, rs } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/$productId")({
  head: () => ({
    meta: [
      { title: "Product detail — Apni Dukaan" },
      {
        name: "description",
        content: "Stock level, pricing, margin and full stock movement history for a product.",
      },
      { property: "og:title", content: "Product detail — Apni Dukaan" },
      {
        property: "og:description",
        content: "See stock, cost, margin and every movement for this item.",
      },
    ],
  }),
  component: ProductDetail,
});

const moveIcon = {
  purchase: TrendingUp,
  sale: TrendingDown,
  adjust: Settings2,
  return: RotateCcw,
};

function ProductDetail() {
  const { productId } = Route.useParams();
  const { products, moves, updateProduct } = useShop();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === productId);
  const [editing, setEditing] = useState(false);

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="font-medium">Product not found</p>
        <Button asChild variant="ghost" className="mt-3">
          <Link to="/inventory">Back to inventory</Link>
        </Button>
      </div>
    );
  }

  const history = moves
    .filter((m) => m.productId === product.id)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const low = product.stock <= product.lowStockAt;
  const margin = product.sellPrice - product.buyPrice;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="-ml-2 rounded-full">
          <Link to="/inventory" aria-label="Back to inventory">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Inventory</span>
      </div>

      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">{product.name}</h1>
          <p className="truncate text-sm text-muted-foreground">
            {product.urdu} · {product.category} · {product.supplier}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full border-border"
          onClick={() => setEditing(true)}
        >
          <Pencil className="size-3.5" /> Edit
        </Button>
      </header>

      <div className="panel p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-muted-foreground">
          In stock
        </p>
        <p className={cn("num mt-1 text-[40px] leading-none font-semibold", low && "text-warning")}>
          {product.stock}
          <span className="ml-1.5 text-lg font-medium text-muted-foreground">{product.unit}</span>
        </p>
        {low && (
          <Badge className="mt-3 rounded-full bg-warning/12 px-2.5 text-[11px] font-medium text-warning hover:bg-warning/12">
            Below alert level of {product.lowStockAt} {product.unit}
          </Badge>
        )}
        <Separator className="my-4" />
        <div className="grid grid-cols-3 gap-3">
          <Cell label="Buying" value={rs(product.buyPrice)} />
          <Cell label="Selling" value={rs(product.sellPrice)} />
          <Cell
            label="Margin"
            value={`${rs(margin)}`}
            hint={`${Math.round((margin / product.buyPrice) * 100)}%`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="panel p-4">
          <p className="text-[11px] uppercase tracking-[0.09em] text-muted-foreground">
            Stock value
          </p>
          <p className="num mt-1 text-xl font-semibold">{rs(product.stock * product.buyPrice)}</p>
        </div>
        <div className="panel p-4">
          <p className="text-[11px] uppercase tracking-[0.09em] text-muted-foreground">Barcode</p>
          <p className="num mt-1 truncate text-xl font-semibold">{product.barcode}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold">Stock history</h2>
        <div className="panel divide-y divide-border">
          {history.map((m) => {
            const Icon = moveIcon[m.type];
            const positive = m.qty > 0;
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3.5">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-lg",
                    positive ? "bg-success/12 text-success" : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium capitalize">{m.type}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {m.note} · {dayLabel(m.at)}, {clockTime(m.at)}
                  </span>
                </span>
                <span
                  className={cn(
                    "num shrink-0 text-sm font-semibold",
                    positive ? "text-success" : "text-foreground",
                  )}
                >
                  {positive ? "+" : ""}
                  {m.qty} {product.unit}
                </span>
              </div>
            );
          })}
          {history.length === 0 && (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              No movements recorded yet.
            </p>
          )}
        </div>
      </section>

      <Sheet open={editing} onOpenChange={setEditing}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Edit {product.name}</SheetTitle>
          </SheetHeader>
          <form
            className="space-y-4 px-4 pb-8"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateProduct(product.id, {
                name: String(fd.get("name")),
                stock: Number(fd.get("stock")),
                lowStockAt: Number(fd.get("lowStockAt")),
                buyPrice: Number(fd.get("buyPrice")),
                sellPrice: Number(fd.get("sellPrice")),
              });
              setEditing(false);
              toast.success("Product updated");
            }}
          >
            <Field name="name" label="Product name" defaultValue={product.name} />
            <div className="grid grid-cols-2 gap-3">
              <Field name="stock" label="Stock" type="number" defaultValue={product.stock} />
              <Field
                name="lowStockAt"
                label="Low stock alert"
                type="number"
                defaultValue={product.lowStockAt}
              />
              <Field
                name="buyPrice"
                label="Buying price"
                type="number"
                defaultValue={product.buyPrice}
              />
              <Field
                name="sellPrice"
                label="Selling price"
                type="number"
                defaultValue={product.sellPrice}
              />
            </div>
            <Button type="submit" className="h-12 w-full rounded-xl">
              Save changes
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full text-destructive hover:text-destructive"
              onClick={() => {
                setEditing(false);
                navigate({ to: "/inventory" });
                toast("Product hidden from list", { description: "Demo only — nothing deleted." });
              }}
            >
              Remove product
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Cell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="num mt-0.5 truncate text-base font-semibold">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        step="any"
        defaultValue={defaultValue}
        className="h-11 rounded-xl border-border bg-surface"
      />
    </div>
  );
}
