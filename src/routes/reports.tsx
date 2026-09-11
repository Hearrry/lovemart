import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, SectionHeader, Stat } from "@/components/shop/Stat";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShop } from "@/lib/shop-store";
import { rs } from "@/lib/format";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Sales reports & profit — Apni Dukaan" },
      {
        name: "description",
        content: "Daily sales trend, profit, payment mix and best-selling products for your shop.",
      },
      { property: "og:title", content: "Sales reports & profit — Apni Dukaan" },
      {
        property: "og:description",
        content: "See the trend, the mix and your best sellers at a glance.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { sales, products, expenses } = useShop();
  const [range, setRange] = useState("7");

  const days = Number(range);

  const series = useMemo(() => {
    const out: { day: string; sales: number; profit: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const rows = sales.filter((s) => new Date(s.at).toDateString() === key);
      out.push({
        day: d.toLocaleDateString("en-PK", { weekday: "short" }),
        sales: rows.reduce((s, x) => s + x.total, 0),
        profit: rows.reduce((s, x) => s + (x.total - x.cost), 0),
      });
    }
    return out;
  }, [sales, days]);

  const totalSales = series.reduce((s, x) => s + x.sales, 0);
  const totalProfit = series.reduce((s, x) => s + x.profit, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

  const mix = ["cash", "online", "udhaar"].map((m) => ({
    method: m,
    total: sales.filter((s) => s.method === m).reduce((s, x) => s + x.total, 0),
  }));
  const mixTotal = mix.reduce((s, x) => s + x.total, 0) || 1;

  const best = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number }>();
    for (const s of sales) {
      for (const l of s.lines) {
        const cur = map.get(l.productId) ?? { qty: 0, revenue: 0 };
        map.set(l.productId, {
          qty: cur.qty + l.qty,
          revenue: cur.revenue + l.qty * l.price,
        });
      }
    }
    return [...map.entries()]
      .map(([id, v]) => ({ product: products.find((p) => p.id === id), ...v }))
      .filter((x) => x.product)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [sales, products]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Kaisa chal raha hai" />

      <Tabs value={range} onValueChange={setRange}>
        <TabsList className="w-full rounded-xl">
          <TabsTrigger value="7" className="flex-1 rounded-lg">
            7 days
          </TabsTrigger>
          <TabsTrigger value="14" className="flex-1 rounded-lg">
            14 days
          </TabsTrigger>
          <TabsTrigger value="30" className="flex-1 rounded-lg">
            30 days
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Sales" value={rs(totalSales)} />
        <Stat label="Profit" value={rs(totalProfit)} />
        <Stat label="Expenses" value={rs(totalExpense)} />
      </div>

      <section className="panel p-4">
        <SectionHeader title="Sales trend" subtitle={`Last ${days} days`} />
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ left: -18, right: 6, top: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--color-muted-foreground)"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--color-muted-foreground)"
                tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-border-strong)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  fontSize: 12,
                }}
                formatter={(v: number | string) => rs(Number(v))}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#salesFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel p-4">
        <SectionHeader title="Payment mix" subtitle="How customers pay" />
        <div className="space-y-3">
          {mix.map((m) => (
            <div key={m.method} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="capitalize">{m.method}</span>
                <span className="num font-medium">
                  {rs(m.total)}{" "}
                  <span className="text-xs text-muted-foreground">
                    {Math.round((m.total / mixTotal) * 100)}%
                  </span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${(m.total / mixTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Best sellers" subtitle="By revenue" />
        <div className="panel divide-y divide-border">
          {best.map((b, i) => (
            <div key={b.product!.id} className="flex items-center gap-3 px-4 py-3.5">
              <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{b.product!.name}</span>
                <span className="num block truncate text-xs text-muted-foreground">
                  {b.qty} {b.product!.unit} sold
                </span>
              </span>
              <span className="num shrink-0 text-sm font-semibold">{rs(b.revenue)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
