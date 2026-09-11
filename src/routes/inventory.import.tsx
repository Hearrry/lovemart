import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  FileSpreadsheet,
  Loader2,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useShop } from "@/lib/shop-store";
import { rs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Unit } from "@/lib/shop-data";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/inventory/import")({
  head: () => ({
    meta: [
      { title: "Import stock from Excel — Apni Dukaan" },
      {
        name: "description",
        content:
          "Upload an Excel sheet, preview rows, validate prices and stock, then import products in bulk.",
      },
      { property: "og:title", content: "Import stock from Excel — Apni Dukaan" },
      {
        property: "og:description",
        content: "Upload, preview, validate and import your stock sheet.",
      },
    ],
  }),
  component: ImportPage,
});

type Row = {
  name: string;
  unit: Unit;
  stock: number;
  buyPrice: number;
  sellPrice: number;
  issue?: { level: "error" | "warning"; text: string };
};

const STEPS = ["Upload", "Preview", "Validate", "Import"] as const;

function ImportPage() {
  const { importProducts } = useShop();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [skipErrors, setSkipErrors] = useState(true);
  const [uploadedRows, setUploadedRows] = useState<Row[]>([]);

  const errors = uploadedRows.filter((r) => r.issue?.level === "error");
  const warnings = uploadedRows.filter((r) => r.issue?.level === "warning");
  const clean = uploadedRows.filter((r) => r.issue?.level !== "error");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];

      const parsedRows: Row[] = json.map((row, idx) => {
        // Flexible column mapping
        const name = String(row.name || row.Product || row.Item || "");
        const unit = (String(row.unit || row.Unit || "kg") as Unit);
        const stock = Number(row.stock || row.Stock || row.Quantity || 0);
        const buyPrice = Number(row.buyPrice || row["Buying Price"] || row.cost || 0);
        const sellPrice = Number(row.sellPrice || row["Selling Price"] || row.price || 0);

        let issue: Row["issue"];
        if (!name) {
          issue = { level: "error", text: "Product name is missing" };
        } else if (sellPrice < buyPrice) {
          issue = { level: "error", text: "Selling price is below buying price" };
        } else if (stock === 0) {
          issue = { level: "warning", text: "Opening stock is 0" };
        }

        return { name, unit, stock, buyPrice, sellPrice, issue };
      });

      setUploadedRows(parsedRows);
      setStep(1);
      toast.success(`Loaded ${parsedRows.length} rows from sheet`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse Excel file. Please check the format.");
    } finally {
      setUploading(false);
    }
  }

  function runImport() {
    const rows = (skipErrors ? clean : uploadedRows).map((r) => ({
      name: r.name,
      urdu: "",
      category: "Grocery",
      unit: r.unit,
      stock: r.stock,
      lowStockAt: Math.max(5, Math.round(r.stock * 0.15)),
      buyPrice: r.buyPrice,
      sellPrice: r.sellPrice,
      supplier: "Al-Madina Traders",
      barcode: String(Math.floor(8964000000000 + Math.random() * 999999)),
    }));
    importProducts(rows);
    setStep(3);
    toast.success(`${rows.length} products imported`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="-ml-2 rounded-full">
          <Link to="/inventory" aria-label="Back to inventory">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Inventory</span>
      </div>

      <header>
        <h1 className="text-2xl font-semibold">Import from Excel</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Poora stock ek sheet se update karein.
        </p>
      </header>

      <ol className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <li key={s} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span
              className={cn(
                "h-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-border",
              )}
            />
            <span
              className={cn(
                "truncate text-[11px] font-medium",
                i <= step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="panel rise flex flex-col items-center gap-3 border-dashed px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <UploadCloud className="size-6" />
          </span>
          <p className="font-medium">Drop your stock sheet here</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            .xlsx or .csv with columns: name, unit, stock, buying price, selling price.
          </p>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 z-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button className="h-11 rounded-xl px-6" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Reading sheet…
                </>
              ) : (
                "Choose file"
              )}
            </Button>
          </div>
          {uploading && <Progress value={70} className="mt-3 h-1.5 w-48" />}
          <button
            type="button"
            className="mt-1 text-xs text-muted-foreground underline underline-offset-4"
          >
            Download sample template
          </button>
        </div>
      )}

      {step >= 1 && (
        <div className="panel rise overflow-hidden">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
              <FileSpreadsheet className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">Imported sheet</span>
              <span className="block truncate text-xs text-muted-foreground">
                {uploadedRows.length} rows detected
              </span>
            </span>
            <Badge variant="outline" className="shrink-0 rounded-full text-[11px]">
              Verified
            </Badge>
          </div>

          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-2 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-2 py-2 text-right font-medium">Stock</th>
                  <th className="px-2 py-2 text-right font-medium">Buy</th>
                  <th className="px-4 py-2 text-right font-medium">Sell</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {uploadedRows.map((r, i) => (
                  <tr
                    key={i}
                    className={cn(
                      step >= 2 && r.issue?.level === "error" && "bg-destructive/5",
                      step >= 2 && r.issue?.level === "warning" && "bg-warning/5",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <span className="block truncate font-medium">{r.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        per {r.unit}
                        {step >= 2 && r.issue ? (
                          <span
                            className={cn(
                              "ml-1",
                              r.issue.level === "error" ? "text-destructive" : "text-warning",
                            )}
                          >
                            · {r.issue.text}
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="num px-2 py-2.5 text-right">{r.stock}</td>
                    <td className="num px-2 py-2.5 text-right">{rs(r.buyPrice)}</td>
                    <td className="num px-4 py-2.5 text-right font-medium">{rs(r.sellPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            className="h-12 rounded-xl border-border"
            onClick={() => setStep(0)}
          >
            Choose another file
          </Button>
          <Button className="h-12 rounded-xl" onClick={() => setStep(2)}>
            Validate rows
          </Button>
        </div>
      )}

      {step === 2 && (
        <>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <Summary
              icon={<Check className="size-4" />}
              tone="success"
              value={clean.length - warnings.length}
              label="Ready to import"
            />
            <Summary
              icon={<TriangleAlert className="size-4" />}
              tone="warning"
              value={warnings.length}
              label="Warnings"
            />
            <Summary
              icon={<CircleAlert className="size-4" />}
              tone="danger"
              value={errors.length}
              label="Errors"
            />
          </div>

          {errors.length > 0 && (
            <label className="panel flex items-start gap-3 p-4 text-sm">
              <input
                type="checkbox"
                checked={skipErrors}
                onChange={(e) => setSkipErrors(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--color-primary)]"
              />
              <span>
                <span className="block font-medium">Skip rows with errors</span>
                <span className="block text-xs text-muted-foreground">
                  {errors.length} row will be left out. You can fix and re-upload later.
                </span>
              </span>
            </label>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-12 rounded-xl border-border"
              onClick={() => setStep(1)}
            >
              Back to preview
            </Button>
            <Button className="h-12 rounded-xl" onClick={runImport}>
              Import {skipErrors ? clean.length : uploadedRows.length} products
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="panel rise flex flex-col items-center gap-2 px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-success/12 text-success">
            <Check className="size-7" />
          </span>
          <p className="text-lg font-semibold">Import complete</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {(skipErrors ? clean : uploadedRows).length} products updated. Stock levels are live now.
          </p>
          <Button className="mt-3 h-11 rounded-xl px-6" onClick={() => navigate({ to: "/inventory" })}>
            View inventory
          </Button>
        </div>
      )}
    </div>
  );
}

function Summary({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "success" | "warning" | "danger";
}) {
  return (
    <div className="panel flex items-center gap-3 p-4">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg",
          tone === "success" && "bg-success/12 text-success",
          tone === "warning" && "bg-warning/12 text-warning",
          tone === "danger" && "bg-destructive/10 text-destructive",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="num block text-lg font-semibold">{value}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}
