import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, SectionHeader, Stat } from "@/components/shop/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useShop, isToday } from "@/lib/shop-store";
import { clockTime, dayLabel, rs } from "@/lib/format";
import { toast } from "sonner";
import type { Expense } from "@/lib/shop-data";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses & kharcha — Apni Dukaan" },
      {
        name: "description",
        content: "Log rent, bijli, transport and daily shop expenses to see true profit.",
      },
      { property: "og:title", content: "Expenses & kharcha — Apni Dukaan" },
      {
        property: "og:description",
        content: "Track every rupee going out of the shop.",
      },
    ],
  }),
  component: ExpensesPage,
});

const categories: Expense["category"][] = [
  "Rent",
  "Bijli",
  "Transport",
  "Staff",
  "Chai / Misc",
  "Repair",
];

function ExpensesPage() {
  const { expenses, addExpense } = useShop();
  const [open, setOpen] = useState(false);

  const monthTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const todayTotal = expenses.filter((e) => isToday(e.at)).reduce((s, e) => s + e.amount, 0);
  const byCategory = categories
    .map((c) => ({
      c,
      total: expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
    }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Dukaan ka kharcha"
        action={
          <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Add
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Today" value={rs(todayTotal)} />
        <Stat label="This month" value={rs(monthTotal)} />
        <Stat label="Entries" value={expenses.length} hint="logged" />
      </div>

      <section>
        <SectionHeader title="By category" subtitle="Where the money goes" />
        <div className="panel space-y-3 p-4">
          {byCategory.map((x) => (
            <div key={x.c} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{x.c}</span>
                <span className="num shrink-0 font-medium">{rs(x.total)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${(x.total / (byCategory[0]?.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="All expenses" />
        <div className="panel divide-y divide-border">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{e.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {e.category} · {dayLabel(e.at)}, {clockTime(e.at)}
                </span>
              </span>
              <span className="num shrink-0 text-sm font-semibold">−{rs(e.amount)}</span>
            </div>
          ))}
        </div>
      </section>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Add kharcha</SheetTitle>
          </SheetHeader>
          <form
            className="space-y-4 px-4 pb-8"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const title = String(fd.get("title") || "").trim();
              const amount = Number(fd.get("amount") || 0);
              if (!title || amount <= 0) {
                toast.error("Detail aur amount likhein");
                return;
              }
              addExpense({
                title,
                amount,
                category: String(fd.get("category")) as Expense["category"],
              });
              setOpen(false);
              toast.success("Expense added");
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs text-muted-foreground">
                What was it for?
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Suzuki loading"
                className="h-11 rounded-xl border-border bg-surface"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select name="category" defaultValue="Chai / Misc">
                <SelectTrigger className="h-11 w-full rounded-xl border-border bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs text-muted-foreground">
                Amount (Rs)
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                inputMode="numeric"
                placeholder="1800"
                className="h-12 rounded-xl border-border bg-surface text-lg"
              />
            </div>
            <Button type="submit" className="h-12 w-full rounded-xl">
              Save expense
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
