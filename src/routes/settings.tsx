import { createFileRoute } from "@tanstack/react-router";
import { Bell, Building2, Percent, Printer, ShieldCheck, Trash2 } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/shop/Stat";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useShop } from "@/lib/shop-store";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Shop settings — Apni Dukaan" },
      {
        name: "description",
        content: "Shop details, receipt printing, low-stock alerts and tax preferences.",
      },
      { property: "og:title", content: "Shop settings — Apni Dukaan" },
      { property: "og:description", content: "Set up your shop name, receipts and alerts." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, updateProfile, signOut } = useAuth();
  const { eraseAllData } = useShop();
  const [form, setForm] = useState({
    shop_name: "",
    owner_name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        shop_name: profile.shop_name,
        owner_name: profile.owner_name,
        phone: profile.phone,
        address: profile.address,
      });
    }
  }, [profile]);

  async function handleSave() {
    try {
      await updateProfile(form);
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    }
  }

  async function handleEraseAll() {
    if (!confirm("Are you absolutely sure? This will delete ALL your products, sales, customers and data forever. This cannot be undone.")) {
      return;
    }
    try {
      await eraseAllData();
      toast.success("All data erased");
      await signOut();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to erase data");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Settings" subtitle="Dukaan ki setting" />

      <section>
        <SectionHeader title="Shop details" />
        <div className="panel space-y-4 p-4">
          <Row
            icon={<Building2 className="size-4" />}
            label="Shop name"
            value={form.shop_name}
            onChange={(v) => setForm((f) => ({ ...f, shop_name: v }))}
          />
          <Row
            label="Owner"
            value={form.owner_name}
            onChange={(v) => setForm((f) => ({ ...f, owner_name: v }))}
          />
          <Row
            label="Phone"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
          />
          <Row
            label="Address"
            value={form.address}
            onChange={(v) => setForm((f) => ({ ...f, address: v }))}
          />
        </div>
      </section>

      <section>
        <SectionHeader title="Preferences" />
        <div className="panel divide-y divide-border">
          <Toggle
            icon={<Printer className="size-4" />}
            title="Auto-print receipt"
            desc="Print as soon as payment is taken"
            defaultChecked
          />
          <Toggle
            icon={<Bell className="size-4" />}
            title="Low stock alerts"
            desc="Notify when an item hits its alert level"
            defaultChecked
          />
          <Toggle
            icon={<Percent className="size-4" />}
            title="Show margin on bills"
            desc="Only visible to the owner"
          />
          <Toggle
            icon={<ShieldCheck className="size-4" />}
            title="Staff PIN lock"
            desc="Require a PIN before opening reports"
            defaultChecked
          />
        </div>
      </section>

      <Button
        className="h-12 w-full rounded-xl"
        onClick={handleSave}
      >
        Save settings
      </Button>

      <section className="pt-6">
        <SectionHeader title="Danger Zone" />
        <div className="panel p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Erase all shop data</p>
              <p className="text-xs text-muted-foreground">
                Delete everything and sign out. You will have to start from scratch.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-lg"
              onClick={handleEraseAll}
            >
              Erase
            </Button>
          </div>
        </div>
      </section>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Apni Dukaan · secure profile management
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border-border bg-surface"
      />
    </div>
  );
}

function Toggle({
  icon,
  title,
  desc,
  defaultChecked,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{desc}</span>
      </span>
      <Switch defaultChecked={!!defaultChecked} className="shrink-0" />
    </div>
  );
}
