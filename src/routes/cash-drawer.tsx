import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Banknote, Lock, Smartphone, Wallet } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/shop/Stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTodayStats, useShop, isToday } from "@/lib/shop-store";
import { rs } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/cash-drawer")({
  head: () => ({
    meta: [
      { title: "Cash drawer & day close — Apni Dukaan" },
      {
        name: "description",
        content: "Opening float, cash in, cash out and end-of-day counting for your shop counter.",
      },
      { property: "og:title", content: "Cash drawer & day close — Apni Dukaan" },
      {
        property: "og:description",
        content: "Count the drawer and close the day with confidence.",
      },
    ],
  }),
  component: CashDrawerPage,
});

function CashDrawerPage() {
  const { cash, online } = useTodayStats();
  const { expenses } = useShop();
  const [counted, setCounted] = useState("");

  const opening = 5000;
  const cashOut = expenses.filter((e) => isToday(e.at)).reduce((s, e) => s + e.amount, 0);
  const expected = opening + cash - cashOut;
  const diff = counted === "" ? null : Number(counted) - expected;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Cash drawer" subtitle="Aaj ka hisaab" />

      <section className="panel p-5 text-center">
        <p className="text-[11px] uppercase tracking-[0.09em] text-muted-foreground">
          Expected in drawer
        </p>
        <p className="num mt-1 text-[40px] leading-none font-semibold">{rs(expected)}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Opening float {rs(opening)} + cash sales − kharcha
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <DrawerRow icon={<Wallet className="size-4" />} label="Opening float" value={opening} />
        <DrawerRow icon={<Banknote className="size-4" />} label="Cash sales" value={cash} positive />
        <DrawerRow icon={<Smartphone className="size-4" />} label="Online (not in drawer)" value={online} />
      </section>

      <section className="panel p-4">
        <SectionHeader title="Count the drawer" subtitle="Enter what you physically counted" />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="counted" className="text-xs text-muted-foreground">
              Counted cash (Rs)
            </Label>
            <Input
              id="counted"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              type="number"
              inputMode="numeric"
              placeholder={String(expected)}
              className="h-14 rounded-xl border-border bg-surface text-2xl"
            />
          </div>
          {diff !== null && (
            <div
              className={cn(
                "rise rounded-xl px-4 py-3 text-sm",
                diff === 0 && "bg-success/10 text-success",
                diff > 0 && "bg-accent text-accent-foreground",
                diff < 0 && "bg-destructive/10 text-destructive",
              )}
            >
              {diff === 0
                ? "Perfect match — drawer balanced."
                : diff > 0
                  ? `${rs(diff)} extra in the drawer.`
                  : `${rs(Math.abs(diff))} short.`}
            </div>
          )}
          <Button
            className="h-12 w-full rounded-xl"
            onClick={() => toast.success("Day closed", { description: "Drawer reconciled for today." })}
          >
            <Lock className="size-4" /> Close the day
          </Button>
        </div>
      </section>
    </div>
  );
}

function DrawerRow({
  icon,
  label,
  value,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  positive?: boolean;
}) {
  return (
    <div className="panel flex items-center gap-3 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] text-muted-foreground">{label}</span>
        <span className={cn("num block text-base font-semibold", positive && "text-success")}>
          {rs(value)}
        </span>
      </span>
    </div>
  );
}
