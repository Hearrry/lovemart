import { createFileRoute } from "@tanstack/react-router";
import { Phone, UserPlus } from "lucide-react";
import { PageHeader, Stat } from "@/components/shop/Stat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useShop } from "@/lib/shop-store";
import { rs } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff")({
  head: () => ({
    meta: [
      { title: "Staff & shifts — Apni Dukaan" },
      {
        name: "description",
        content: "Manage salesmen, shifts, salaries and per-person sales for your shop.",
      },
      { property: "og:title", content: "Staff & shifts — Apni Dukaan" },
      { property: "og:description", content: "Who is on shift and how much they sold today." },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const { staff } = useShop();
  const onDuty = staff.filter((s) => s.active).length;
  const payroll = staff.reduce((s, x) => s + x.salary, 0);
  const todaySales = staff.reduce((s, x) => s + x.todaySales, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff"
        subtitle="Team & shifts"
        action={
          <Button size="sm" className="rounded-full">
            <UserPlus className="size-4" /> Add
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="On duty" value={onDuty} hint={`of ${staff.length}`} />
        <Stat label="Sold today" value={rs(todaySales)} />
        <Stat label="Monthly payroll" value={rs(payroll)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {staff.map((s) => (
          <div key={s.id} className="panel p-4">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-muted-foreground">
                {s.name.slice(0, 1)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{s.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {s.role} · {s.shift}
                </span>
              </span>
              <Badge
                className={cn(
                  "shrink-0 rounded-full px-2 text-[10px] font-medium",
                  s.active
                    ? "bg-success/12 text-success hover:bg-success/12"
                    : "bg-secondary text-muted-foreground hover:bg-secondary",
                )}
              >
                {s.active ? "On duty" : "Off"}
              </Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
              <Mini label="Today" value={rs(s.todaySales)} />
              <Mini label="Salary" value={s.salary ? rs(s.salary) : "—"} />
              <div className="flex items-end justify-end">
                <Button variant="outline" size="icon" className="size-8 rounded-full border-border">
                  <Phone className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="num truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
