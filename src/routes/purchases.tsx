import { createFileRoute } from "@tanstack/react-router";
import { Phone, Plus, Truck } from "lucide-react";
import { PageHeader, SectionHeader, Stat } from "@/components/shop/Stat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useShop } from "@/lib/shop-store";
import { dayLabel, rs } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "Purchases & suppliers — Apni Dukaan" },
      {
        name: "description",
        content: "Track supplier orders, amounts payable and purchase history for your shop.",
      },
      { property: "og:title", content: "Purchases & suppliers — Apni Dukaan" },
      {
        property: "og:description",
        content: "Every supplier bill, what is paid and what is still due.",
      },
    ],
  }),
  component: PurchasesPage,
});

const statusStyle = {
  paid: "bg-success/12 text-success hover:bg-success/12",
  partial: "bg-warning/12 text-warning hover:bg-warning/12",
  unpaid: "bg-destructive/10 text-destructive hover:bg-destructive/10",
};

function PurchasesPage() {
  const { purchases, suppliers } = useShop();
  const payable = suppliers.reduce((s, x) => s + x.payable, 0);
  const monthTotal = purchases.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        subtitle="Supplier orders & payables"
        action={
          <Button size="sm" className="rounded-full">
            <Plus className="size-4" /> New
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Payable" value={rs(payable)} hint="across 3 suppliers" tone="warning" />
        <Stat label="This month" value={rs(monthTotal)} hint={`${purchases.length} orders`} />
        <Stat label="Suppliers" value={suppliers.length} hint="active accounts" />
        <Stat label="Avg order" value={rs(monthTotal / purchases.length)} hint="last 30 days" />
      </div>

      <section>
        <SectionHeader title="Recent orders" subtitle="Latest stock received" />
        <div className="panel divide-y divide-border">
          {purchases.map((p) => (
            <div key={p.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                <Truck className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{p.supplierName}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {p.id} · {p.items} items · {dayLabel(p.at)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="num block text-sm font-semibold">{rs(p.total)}</span>
                <Badge
                  className={cn(
                    "mt-0.5 h-5 rounded-full px-2 text-[10px] font-medium capitalize",
                    statusStyle[p.status],
                  )}
                >
                  {p.status}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Suppliers" subtitle="Who you buy from" />
        <div className="grid gap-3 sm:grid-cols-2">
          {suppliers.map((s) => (
            <div key={s.id} className="panel p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.city}</p>
                </div>
                <Button variant="outline" size="icon" className="size-8 shrink-0 rounded-full border-border">
                  <Phone className="size-3.5" />
                </Button>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <span className="text-xs text-muted-foreground">{s.phone}</span>
                <span className="text-right">
                  <span className="block text-[11px] text-muted-foreground">Payable</span>
                  <span
                    className={cn(
                      "num block text-base font-semibold",
                      s.payable > 0 ? "text-warning" : "text-success",
                    )}
                  >
                    {rs(s.payable)}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
