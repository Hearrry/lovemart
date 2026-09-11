import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  ChevronRight,
  Receipt,
  Settings,
  Truck,
  UserCog,
  Users,
  Wallet,
  FileSpreadsheet,
} from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/shop/Stat";
import { useShop, useTodayStats } from "@/lib/shop-store";
import { rs } from "@/lib/format";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More tools — Apni Dukaan" },
      {
        name: "description",
        content: "Purchases, customers, expenses, reports, cash drawer, staff and settings.",
      },
      { property: "og:title", content: "More tools — Apni Dukaan" },
      { property: "og:description", content: "Everything else your shop needs, in one place." },
    ],
  }),
  component: MorePage,
});

const groups = [
  {
    title: "Money",
    items: [
      { to: "/purchases", label: "Purchases & suppliers", icon: Truck },
      { to: "/customers", label: "Customers & udhaar", icon: Users },
      { to: "/expenses", label: "Expenses", icon: Receipt },
      { to: "/cash-drawer", label: "Cash drawer", icon: Wallet },
    ],
  },
  {
    title: "Shop",
    items: [
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/inventory/import", label: "Import from Excel", icon: FileSpreadsheet },
      { to: "/staff", label: "Staff", icon: UserCog },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

function MorePage() {
  const { revenue, creditDue } = useTodayStats();
  const { products } = useShop();

  return (
    <div className="space-y-6">
      <PageHeader title="More" subtitle="Saari tools ek jagah" />

      <div className="panel grid grid-cols-3 divide-x divide-border">
        <Cell label="Today" value={rs(revenue)} />
        <Cell label="Udhaar" value={rs(creditDue)} />
        <Cell label="Products" value={String(products.length)} />
      </div>

      {groups.map((g) => (
        <section key={g.title}>
          <SectionHeader title={g.title} />
          <div className="panel divide-y divide-border">
            {g.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/60"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <item.icon className="size-4" />
                </span>
                <span className="min-w-0 truncate text-sm font-medium">{item.label}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 py-4 text-center">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="num mt-0.5 truncate text-base font-semibold">{value}</p>
    </div>
  );
}
