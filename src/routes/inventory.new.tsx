import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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
import { useShop } from "@/lib/shop-store";
import type { Unit } from "@/lib/shop-data";
import { toast } from "sonner";

export const Route = createFileRoute("/inventory/new")({
  head: () => ({
    meta: [
      { title: "Add a product — Apni Dukaan" },
      {
        name: "description",
        content: "Add a new item with unit, opening stock, buying price, selling price and alerts.",
      },
      { property: "og:title", content: "Add a product — Apni Dukaan" },
      {
        property: "og:description",
        content: "Create a product with prices, unit and low-stock alert.",
      },
    ],
  }),
  component: NewProductPage,
});

const units: Unit[] = ["kg", "litre", "pack", "dozen", "piece"];
const categories = ["Grocery", "Cooking", "Dairy", "Beverages", "Household", "Snacks"];

function NewProductPage() {
  const { addProduct } = useShop();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="-ml-2 rounded-full">
          <Link to="/inventory" aria-label="Back to inventory">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Inventory</span>
      </div>

      <header>
        <h1 className="text-2xl font-semibold">Add product</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Naya item stock mein add karein.
        </p>
      </header>

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = String(fd.get("name") || "").trim();
          if (!name) {
            toast.error("Product ka naam likhein");
            return;
          }
          addProduct({
            name,
            urdu: String(fd.get("urdu") || ""),
            category: String(fd.get("category") || "Grocery"),
            unit: (String(fd.get("unit")) as Unit) || "kg",
            stock: Number(fd.get("stock") || 0),
            lowStockAt: Number(fd.get("lowStockAt") || 5),
            buyPrice: Number(fd.get("buyPrice") || 0),
            sellPrice: Number(fd.get("sellPrice") || 0),
            supplier: String(fd.get("supplier") || "Al-Madina Traders"),
            barcode: String(Math.floor(8964000000000 + Math.random() * 999999)),
          });
          toast.success(`${name} added to inventory`);
          navigate({ to: "/inventory" });
        }}
      >
        <div className="panel space-y-4 p-4">
          <Row label="Product name" name="name" placeholder="e.g. Chini" />
          <Row label="Urdu name (optional)" name="urdu" placeholder="چینی" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select name="category" defaultValue="Grocery">
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
              <Label className="text-xs text-muted-foreground">Unit</Label>
              <Select name="unit" defaultValue="kg">
                <SelectTrigger className="h-11 w-full rounded-xl border-border bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="panel grid grid-cols-2 gap-3 p-4">
          <Row label="Buying price (Rs)" name="buyPrice" type="number" placeholder="248" />
          <Row label="Selling price (Rs)" name="sellPrice" type="number" placeholder="280" />
          <Row label="Opening stock" name="stock" type="number" placeholder="20" />
          <Row label="Low stock alert" name="lowStockAt" type="number" placeholder="10" />
        </div>

        <div className="panel p-4">
          <Row label="Supplier" name="supplier" placeholder="Al-Madina Traders" />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline" className="h-12 rounded-xl border-border">
            <Link to="/inventory">Cancel</Link>
          </Button>
          <Button type="submit" className="h-12 rounded-xl">
            Save product
          </Button>
        </div>
      </form>
    </div>
  );
}

function Row({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        step="any"
        placeholder={placeholder}
        className="h-11 rounded-xl border-border bg-surface"
      />
    </div>
  );
}
