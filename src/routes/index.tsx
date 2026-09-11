import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Banknote,
  ChevronRight,
  Smartphone,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { PageHeader, SectionHeader, Stat } from "@/components/shop/Stat";
import { useShop, useTodayStats } from "@/lib/shop-store";
import { clockTime, rs } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today at the shop — Apni Dukaan" },
      {
        name: "description",
        content:
          "Live view of today's sales, orders, profit, low stock and udhaar due for your kiryana store.",
      },
      { property: "og:title", content: "Today at the shop — Apni Dukaan" },
      {
        property: "og:description",
        content: "Sales, profit, low stock and udhaar in one calm dashboard.",
      },
    ],
  }),
  component: HomePage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Assalam-o-alaikum";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function HomePage() {
  const { revenue, orders, profit, lowStock, creditDue, cash, online, udhaar, today, todayExpense } =
    useTodayStats();
  const { sales } = useShop();
  const target = 45000;

  const recent = sales.slice(0, 6);

  return (
    <div className="space-y-7">
      <PageHeader
        title={`${greeting()}, Zoya`}
        subtitle={new Date().toLocaleDateString("en-PK", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        action={
          <Button asChild size="sm" className="rounded-full">
            <Link to="/sell">New sale</Link>
          </Button>
        }
      />

      <section className="panel rise overflow-hidden p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-muted-foreground">
          Today's sales
        </p>
        <div className="mt-1 flex items-end gap-3">
          <span className="num text-[40px] leading-none font-semibold">{rs(revenue)}</span>
          <span className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-success">
            <ArrowUpRight className="size-3.5" />
            12% vs yesterday
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <Progress value={Math.min(100, (revenue / target) * 100)} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {Math.round((revenue / target) * 100)}% of {rs(target)} daily target
          </p>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
          <MiniSplit icon={<Banknote className="size-3.5" />} label="Cash" value={cash} />
          <MiniSplit icon={<Smartphone className="size-3.5" />} label="Online" value={online} />
          <MiniSplit icon={<Wallet className="size-3.5" />} label="Udhaar" value={udhaar} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orders" value={orders} hint="bills made today" />
        <Stat label="Profit" value={rs(profit)} hint={`after ${rs(todayExpense)} kharcha`} />
        <Stat
          label="Low stock"
          value={lowStock.length}
          tone={lowStock.length ? "warning" : "default"}
          hint="items need re-order"
        />
        <Stat label="Udhaar due" value={rs(creditDue)} hint="across 5 customers" />
      </section>

      {lowStock.length > 0 && (
        <section>
          <SectionHeader
            title="Needs re-order"
            subtitle="Stock at or below your alert level"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/inventory">View all</Link>
              </Button>
            }
          />
          <div className="panel divide-y divide-border">
            {lowStock.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to="/inventory/$productId"
                params={{ productId: p.id }}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/60"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning/12 text-warning">
                  <TriangleAlert className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    Alert at {p.lowStockAt} {p.unit} · {p.supplier}
                  </span>
                </span>
                <span className="num shrink-0 text-sm font-semibold text-warning">
                  {p.stock} {p.unit}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader
          title="Recent sales"
          subtitle={`${today.length} bills today`}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/reports">Reports</Link>
            </Button>
          }
        />
        <div className="panel divide-y divide-border">
          {recent.map((s) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {s.lines.map((l) => l.name).join(", ")}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  #{s.id} · {clockTime(s.at)}
                  {s.customerName ? ` · ${s.customerName}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="num block text-sm font-semibold">{rs(s.total)}</span>
                <Badge
                  variant="outline"
                  className="mt-0.5 h-5 rounded-full px-2 text-[10px] font-medium capitalize"
                >
                  {s.method}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MiniSplit({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="num mt-0.5 block truncate text-sm font-semibold">{rs(value)}</span>
    </div>
  );
}
