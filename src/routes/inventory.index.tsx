import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronRight, FileSpreadsheet, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/shop/Stat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShop } from "@/lib/shop-store";
import { rs } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inventory/")({
  head: () => ({
    meta: [
      { title: "Inventory & stock levels — Apni Dukaan" },
      {
        name: "description",
        content:
          "Track stock, buying and selling prices, low-stock alerts and bulk Excel imports for your shop.",
      },
      { property: "og:title", content: "Inventory & stock levels — Apni Dukaan" },
      {
        property: "og:description",
        content: "Every item with stock, cost, margin and re-order alerts.",
      },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { products } = useShop();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products
      .filter((p) => (s ? p.name.toLowerCase().includes(s) || p.urdu.includes(s) : true))
      .filter((p) => (tab === "low" ? p.stock <= p.lowStockAt : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, q, tab]);

  const stockValue = products.reduce((s, p) => s + p.stock * p.buyPrice, 0);
  const lowCount = products.filter((p) => p.stock <= p.lowStockAt).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        subtitle={`${products.length} products · ${rs(stockValue)} stock value`}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="icon" className="rounded-full border-border">
              <Link to="/inventory/import" aria-label="Import from Excel">
                <FileSpreadsheet className="size-4" />
              </Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/inventory/new">
                <Plus className="size-4" /> Add
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            className="h-11 rounded-xl border-border bg-surface pl-9"
          />
        </div>
        <Tabs value={tab} onValueChange={setTab} className="shrink-0">
          <TabsList className="rounded-xl">
            <TabsTrigger value="all" className="rounded-lg px-4">
              All
            </TabsTrigger>
            <TabsTrigger value="low" className="rounded-lg px-4">
              Low stock
              {lowCount > 0 && (
                <span className="num ml-1.5 rounded-full bg-warning/15 px-1.5 text-[10px] font-semibold text-warning">
                  {lowCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="panel divide-y divide-border">
        {list.map((p) => {
          const low = p.stock <= p.lowStockAt;
          const margin = Math.round(((p.sellPrice - p.buyPrice) / p.buyPrice) * 100);
          return (
            <Link
              key={p.id}
              to="/inventory/$productId"
              params={{ productId: p.id }}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="num truncate text-xs text-muted-foreground">
                  Buy {rs(p.buyPrice)} · Sell {rs(p.sellPrice)} · {margin}% margin
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "num text-sm font-semibold",
                    low && "text-warning",
                  )}
                >
                  {p.stock} {p.unit}
                </p>
                {low ? (
                  <Badge className="mt-0.5 h-5 rounded-full bg-warning/12 px-2 text-[10px] font-medium text-warning hover:bg-warning/12">
                    Low
                  </Badge>
                ) : (
                  <p className="text-[11px] text-muted-foreground">{p.category}</p>
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
            </Link>
          );
        })}
        {list.length === 0 && (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            No products match “{q}”.
          </p>
        )}
      </div>
    </div>
  );
}
