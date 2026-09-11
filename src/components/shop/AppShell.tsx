import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home,
  ShoppingCart,
  Package,
  LayoutGrid,
  Plus,
  Truck,
  Users,
  Receipt,
  BarChart3,
  UserCog,
  Settings,
  Wallet,
  Store,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const primaryNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/sell", label: "Sell", icon: ShoppingCart },
  { to: "/inventory", label: "Stock", icon: Package },
] as const;

export const deskNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/sell", label: "Sell", icon: ShoppingCart },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/purchases", label: "Purchases", icon: Truck },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/cash-drawer", label: "Cash drawer", icon: Wallet },
  { to: "/staff", label: "Staff", icon: UserCog },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const quickActions = [
  { to: "/sell", label: "New sale", desc: "Open the counter", icon: ShoppingCart },
  { to: "/inventory/new", label: "Add product", desc: "New item in stock", icon: Package },
  { to: "/purchases", label: "Record purchase", desc: "Stock from supplier", icon: Truck },
  { to: "/expenses", label: "Add kharcha", desc: "Log an expense", icon: Receipt },
  { to: "/customers", label: "Udhaar payment", desc: "Receive from customer", icon: Users },
  { to: "/inventory/import", label: "Import Excel", desc: "Bulk update stock", icon: LayoutGrid },
] as const;

function useActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
}

export function AppShell({ children }: { children: ReactNode }) {
  const isActive = useActive();
  const [quickOpen, setQuickOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar px-3 py-5 lg:flex">
        <Link to="/" className="mb-6 flex items-center gap-2.5 px-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Store className="size-4.5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">Apni Dukaan</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              Gulshan Kiryana Store
            </span>
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5">
          {deskNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                isActive(item.to) &&
                  "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

      </aside>

      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-28 sm:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
          {primaryNav.slice(0, 2).map((item) => (
            <NavTab key={item.to} {...item} active={isActive(item.to)} />
          ))}
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={() => setQuickOpen(true)}
              aria-label="Quick actions"
              className="grid size-13 -translate-y-4 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lift transition-transform active:scale-95"
            >
              <Plus className="size-6" />
            </button>
          </div>
          <NavTab {...primaryNav[2]} active={isActive("/inventory")} />
          <NavTab to="/more" label="More" icon={LayoutGrid} active={isActive("/more")} />
        </div>
      </nav>

      <Sheet open={quickOpen} onOpenChange={setQuickOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-border">
          <SheetHeader className="pb-1">
            <SheetTitle>Quick actions</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4 pb-8">
            {quickActions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => {
                  setQuickOpen(false);
                  navigate({ to: a.to });
                }}
                className="flex flex-col items-start gap-2 rounded-xl border border-border bg-surface p-3 text-left transition-colors active:bg-secondary"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <a.icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{a.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {a.desc}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NavTab({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg py-2.5 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("size-5 transition-transform", active && "scale-105")} />
      {label}
    </Link>
  );
}
