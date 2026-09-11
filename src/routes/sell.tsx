import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  Check,
  Mic,
  Minus,
  Plus,
  Printer,
  Search,
  Share2,
  ShoppingCart,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { rs } from "@/lib/format";
import { useShop } from "@/lib/shop-store";
import { parseVoiceOrder, VOICE_PHRASE, type CartLine, type Sale } from "@/lib/shop-data";
import { toast } from "sonner";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell — counter billing | Apni Dukaan" },
      {
        name: "description",
        content:
          "Fast mobile counter: search products, speak the order in Urdu, take cash or online payment and print a receipt.",
      },
      { property: "og:title", content: "Sell — counter billing | Apni Dukaan" },
      {
        property: "og:description",
        content: "Search or speak an order, then take cash or online payment in seconds.",
      },
    ],
  }),
  component: SellPage,
});

type Stage = "cart" | "receipt";

function SellPage() {
  const { products, recordSale } = useShop();
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<CartLine[]>([]);
  const [stage, setStage] = useState<Stage>("cart");
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.urdu.includes(q) ||
            p.category.toLowerCase().includes(q),
        )
      : products;
    return list.slice(0, 12);
  }, [products, query]);

  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  function addProduct(id: string, qty = 1) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setLines((prev) => {
      const found = prev.find((l) => l.productId === id);
      if (found) {
        return prev.map((l) =>
          l.productId === id ? { ...l, qty: +(l.qty + qty).toFixed(2) } : l,
        );
      }
      return [
        ...prev,
        { productId: p.id, name: p.name, unit: p.unit, qty, price: p.sellPrice },
      ];
    });
  }

  function setQty(id: string, qty: number) {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== id)
        : prev.map((l) => (l.productId === id ? { ...l, qty: +qty.toFixed(2) } : l)),
    );
  }

  function applyVoice(phrase: string) {
    const parsed = parseVoiceOrder(phrase, products);
    if (!parsed.length) {
      toast.error("Samajh nahi aaya", { description: "Try: “1 kilo ghee, 2 kilo chini”" });
      return;
    }
    parsed.forEach((p) => addProduct(p.productId, p.qty));
    toast.success(`${parsed.length} items added from voice`);
  }

  async function checkout(method: "cash" | "online") {
    const sale = await recordSale(lines, method);
    if (!sale) {
      toast.error("Could not record sale");
      return;
    }
    setReceipt(sale);
    setLines([]);
    setCheckoutOpen(false);
    setStage("receipt");
  }

  if (stage === "receipt" && receipt) {
    return <ReceiptView sale={receipt} onDone={() => setStage("cart")} />;
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
      <div className="space-y-4">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pb-1">
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-semibold sm:text-2xl">Counter</h1>
            <p className="truncate text-sm text-muted-foreground">
              Search, scan or speak the order
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 rounded-full px-2.5 py-1 text-xs">
            Bill #{1048}
          </Badge>
        </header>

        <div className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:px-0">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Chini, ghee, surf…"
                className="h-12 rounded-xl border-border bg-surface pl-9 text-base"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button
              type="button"
              size="icon"
              onClick={() => setVoiceOpen(true)}
              aria-label="Speak the order"
              className="size-12 shrink-0 rounded-xl"
            >
              <Mic className="size-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
          {results.map((p) => {
            const inCart = lines.find((l) => l.productId === p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => addProduct(p.id)}
                className={cn(
                  "group panel flex flex-col justify-between gap-3 p-3 text-left transition-all active:scale-[0.98]",
                  inCart && "border-primary/40 bg-accent/50",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm leading-snug font-medium">
                      {p.name}
                    </span>
                    {inCart ? (
                      <span className="num grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                        {inCart.qty}
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {p.stock <= p.lowStockAt ? (
                      <span className="text-warning">Only {p.stock} {p.unit} left</span>
                    ) : (
                      `${p.stock} ${p.unit} in stock`
                    )}
                  </span>
                </div>
                <span className="num text-sm font-semibold">
                  {rs(p.sellPrice)}
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                    /{p.unit}
                  </span>
                </span>
              </button>
            );
          })}
          {results.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              Koi product nahi mila for “{query}”.
            </p>
          )}
        </div>
      </div>

      {/* Desktop cart */}
      <aside className="hidden lg:block">
        <div className="panel sticky top-6 flex max-h-[calc(100vh-3rem)] flex-col">
          <CartBody lines={lines} setQty={setQty} onClear={() => setLines([])} />
          <div className="border-t border-border p-4">
            <Row label="Total" value={rs(total)} strong />
            <Button
              className="mt-3 h-12 w-full rounded-xl text-base"
              disabled={!lines.length}
              onClick={() => setCheckoutOpen(true)}
            >
              Checkout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile cart bar */}
      {lines.length > 0 && (
        <div className="fixed inset-x-0 bottom-[76px] z-30 px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="rise flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground shadow-lift transition-transform active:scale-[0.99]"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-foreground/15">
              <ShoppingCart className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-medium">
                {lines.length} item{lines.length > 1 ? "s" : ""} · {count} qty
              </span>
              <span className="block text-[11px] opacity-80">Tap to review & pay</span>
            </span>
            <span className="num shrink-0 text-lg font-semibold">{rs(total)}</span>
          </button>
        </div>
      )}

      <VoiceSheet open={voiceOpen} onOpenChange={setVoiceOpen} onResult={applyVoice} />

      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Review & pay</SheetTitle>
            <SheetDescription>Confirm the items, then choose payment.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-8">
            <div className="panel">
              <CartBody lines={lines} setQty={setQty} onClear={() => setLines([])} compact />
            </div>
            <div className="mt-4 space-y-1.5">
              <Row label="Items" value={String(lines.length)} />
              <Row label="Total quantity" value={String(count)} />
              <Row label="Amount" value={rs(total)} strong />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-14 flex-col gap-1 rounded-xl border-border"
                disabled={!lines.length}
                onClick={() => checkout("online")}
              >
                <Smartphone className="size-4" />
                <span className="text-sm font-medium">Online</span>
              </Button>
              <Button
                className="h-14 flex-col gap-1 rounded-xl"
                disabled={!lines.length}
                onClick={() => checkout("cash")}
              >
                <Banknote className="size-4" />
                <span className="text-sm font-medium">Cash</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CartBody({
  lines,
  setQty,
  onClear,
  compact,
}: {
  lines: CartLine[];
  setQty: (id: string, qty: number) => void;
  onClear: () => void;
  compact?: boolean;
}) {
  return (
    <>
      {!compact && (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-4 py-3">
          <h2 className="truncate text-sm font-semibold">Current bill</h2>
          {lines.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
            >
              Clear
            </button>
          )}
        </div>
      )}
      <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {lines.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            Cart khaali hai. Tap a product to start.
          </p>
        )}
        {lines.map((l) => (
          <div key={l.productId} className="rise flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{l.name}</p>
              <p className="num truncate text-xs text-muted-foreground">
                {rs(l.price)} × {l.qty} {l.unit}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border">
              <button
                type="button"
                aria-label={`Decrease ${l.name}`}
                onClick={() => setQty(l.productId, l.qty - 1)}
                className="grid size-8 place-items-center rounded-l-lg text-muted-foreground hover:bg-secondary"
              >
                {l.qty <= 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}
              </button>
              <span className="num w-8 text-center text-sm font-semibold">{l.qty}</span>
              <button
                type="button"
                aria-label={`Increase ${l.name}`}
                onClick={() => setQty(l.productId, l.qty + 1)}
                className="grid size-8 place-items-center rounded-r-lg text-muted-foreground hover:bg-secondary"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <span className="num w-20 shrink-0 text-right text-sm font-semibold">
              {rs(l.qty * l.price)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn("text-sm", strong ? "font-medium" : "text-muted-foreground")}>
        {label}
      </span>
      <span className={cn("num", strong ? "text-xl font-semibold" : "text-sm")}>{value}</span>
    </div>
  );
}

/* ---------- Simulated voice input ---------- */

function VoiceSheet({
  open,
  onOpenChange,
  onResult,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onResult: (phrase: string) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "listening" | "done">("idle");
  const [heard, setHeard] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!open) {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setPhase("idle");
      setHeard("");
    }
  }, [open]);

  function listen() {
    timers.current.forEach(clearTimeout);
    setPhase("listening");
    setHeard("");
    const words = VOICE_PHRASE.split(" ");
    words.forEach((w, i) => {
      timers.current.push(
        setTimeout(() => setHeard(words.slice(0, i + 1).join(" ")), 260 * (i + 1)),
      );
    });
    timers.current.push(
      setTimeout(() => setPhase("done"), 260 * words.length + 500),
    );
  }

  const parsedPreview =
    phase === "done"
      ? [
          { name: "Ghee (Dalda)", qty: 1, unit: "kg", price: 600 },
          { name: "Chini", qty: 2, unit: "kg", price: 280 },
        ]
      : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Bol kar likhwaayein</SheetTitle>
          <SheetDescription>
            Speak the order in Urdu or English — we add the items for you.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-5 px-4 pb-8">
          <button
            type="button"
            onClick={listen}
            aria-label="Start listening"
            className={cn(
              "mt-2 grid size-20 place-items-center rounded-full transition-colors",
              phase === "listening"
                ? "pulse-ring bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground hover:bg-accent/80",
            )}
          >
            <Mic className="size-8" />
          </button>

          <p className="min-h-6 text-center text-sm text-muted-foreground">
            {phase === "idle" && "Tap the mic and say your order"}
            {phase === "listening" && "Sun raha hoon…"}
            {phase === "done" && "Yeh suna:"}
          </p>

          {(phase === "listening" || phase === "done") && (
            <p className="min-h-8 text-center text-lg font-medium">
              “{heard || "…"}”
            </p>
          )}

          {phase === "done" && (
            <div className="rise w-full space-y-2">
              {parsedPreview.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success/12 text-success">
                    <Check className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {p.name} {p.qty}
                    {p.unit}
                  </span>
                  <span className="num shrink-0 text-sm font-semibold">
                    × {rs(p.price)}
                  </span>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" className="h-11 rounded-xl" onClick={listen}>
                  Dobara bolein
                </Button>
                <Button
                  className="h-11 rounded-xl"
                  onClick={() => {
                    onResult(VOICE_PHRASE);
                    onOpenChange(false);
                  }}
                >
                  Add to bill
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Receipt ---------- */

function ReceiptView({ sale, onDone }: { sale: Sale; onDone: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-5 py-4">
      <div className="rise flex flex-col items-center gap-2 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-success/12 text-success">
          <Check className="size-7" />
        </span>
        <h1 className="text-xl font-semibold">Payment received</h1>
        <p className="text-sm text-muted-foreground">
          {sale.method === "cash" ? "Cash" : "Online transfer"} · Bill #{sale.id}
        </p>
      </div>

      <div className="panel rise overflow-hidden">
        <div className="border-b border-dashed border-border px-5 py-4 text-center">
          <p className="text-sm font-semibold">Gulshan Kiryana Store</p>
          <p className="text-xs text-muted-foreground">
            Block 5, Gulshan-e-Iqbal, Karachi · 0300 1234567
          </p>
        </div>
        <div className="divide-y divide-border">
          {sale.lines.map((l) => (
            <div key={l.productId} className="flex items-start gap-3 px-5 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{l.name}</span>
                <span className="num block text-xs text-muted-foreground">
                  {l.qty} {l.unit} × {rs(l.price)}
                </span>
              </span>
              <span className="num shrink-0 text-sm font-semibold">
                {rs(l.qty * l.price)}
              </span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-dashed border-border px-5 py-4">
          <Row label="Subtotal" value={rs(sale.total)} />
          <Row label="Discount" value={rs(0)} />
          <Row label="Total paid" value={rs(sale.total)} strong />
        </div>
        <p className="border-t border-border px-5 py-3 text-center text-[11px] text-muted-foreground">
          Shukriya! Phir tashreef laaiye.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-12 rounded-xl border-border">
          <Printer className="size-4" /> Print
        </Button>
        <Button variant="outline" className="h-12 rounded-xl border-border">
          <Share2 className="size-4" /> WhatsApp
        </Button>
      </div>
      <div className="grid gap-2">
        <Button className="h-12 rounded-xl" onClick={onDone}>
          New sale
        </Button>
        <Button asChild variant="ghost" className="h-11">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
