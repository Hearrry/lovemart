import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Phone, Search, UserPlus } from "lucide-react";
import { PageHeader, Stat } from "@/components/shop/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useShop } from "@/lib/shop-store";
import { dayLabel, rs } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Customer } from "@/lib/shop-data";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers & udhaar — Apni Dukaan" },
      {
        name: "description",
        content: "Customer khata: outstanding udhaar balances, last payment and quick recovery.",
      },
      { property: "og:title", content: "Customers & udhaar — Apni Dukaan" },
      {
        property: "og:description",
        content: "See who owes what and record payments in two taps.",
      },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { customers, receivePayment } = useShop();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Customer | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return customers
      .filter((c) => (s ? c.name.toLowerCase().includes(s) || c.phone.includes(s) : true))
      .sort((a, b) => b.balance - a.balance);
  }, [customers, q]);

  const totalDue = customers.reduce((s, c) => s + c.balance, 0);
  const withDue = customers.filter((c) => c.balance > 0).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        subtitle="Khata & udhaar"
        action={
          <Button size="sm" className="rounded-full">
            <UserPlus className="size-4" /> Add
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total udhaar" value={rs(totalDue)} tone="warning" />
        <Stat label="With balance" value={withDue} hint="customers" />
        <Stat label="Customers" value={customers.length} hint="in khata" />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or number"
          className="h-11 rounded-xl border-border bg-surface pl-9"
        />
      </div>

      <div className="panel divide-y divide-border">
        {list.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(c)}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/60"
          >
            <span className="num grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-muted-foreground">
              {c.name.slice(0, 1)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{c.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {c.area} · last paid {dayLabel(c.lastPaid)}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span
                className={cn(
                  "num block text-sm font-semibold",
                  c.balance > 0 ? "text-warning" : "text-success",
                )}
              >
                {c.balance > 0 ? rs(c.balance) : "Clear"}
              </span>
              <span className="block text-[11px] text-muted-foreground">{c.phone}</span>
            </span>
          </button>
        ))}
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>{active.name}</SheetTitle>
                <SheetDescription>
                  {active.area} · {active.phone}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8">
                <div className="panel p-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.09em] text-muted-foreground">
                    Outstanding udhaar
                  </p>
                  <p className="num mt-1 text-3xl font-semibold">{rs(active.balance)}</p>
                </div>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const amount = Number(fd.get("amount") || 0);
                    if (amount <= 0) return;
                    receivePayment(active.id, amount);
                    toast.success(`${rs(amount)} received from ${active.name}`);
                    setActive(null);
                  }}
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-xs text-muted-foreground">
                      Payment received (Rs)
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      inputMode="numeric"
                      placeholder={String(active.balance)}
                      className="h-12 rounded-xl border-border bg-surface text-lg"
                    />
                  </div>
                  <Button type="submit" className="h-12 w-full rounded-xl">
                    Record payment
                  </Button>
                </form>
                <Button variant="outline" className="h-11 w-full rounded-xl border-border">
                  <Phone className="size-4" /> Call customer
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
