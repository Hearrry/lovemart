import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "./supabase";
import { useAuth } from "./auth";
import type {
  CartLine,
  Customer,
  Expense,
  Product,
  Purchase,
  Sale,
  Staff,
  StockMove,
  Supplier,
  Unit,
} from "./shop-data";

type NewProduct = Omit<Product, "id">;

type ShopState = {
  ready: boolean;
  products: Product[];
  sales: Sale[];
  moves: StockMove[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: Purchase[];
  expenses: Expense[];
  staff: Staff[];
  refresh: () => Promise<void>;
  addProduct: (p: NewProduct) => Promise<Product | null>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  importProducts: (rows: NewProduct[]) => Promise<void>;
  recordSale: (
    lines: CartLine[],
    method: Sale["method"],
    customerName?: string,
  ) => Promise<Sale | null>;
  addExpense: (e: Omit<Expense, "id" | "at">) => Promise<void>;
  addCustomer: (c: { name: string; phone: string; area: string }) => Promise<void>;
  receivePayment: (customerId: string, amount: number) => Promise<void>;
  eraseAllData: () => Promise<void>;
};

const ShopContext = createContext<ShopState | null>(null);

/* ---------- row mappers ---------- */
type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => String(v ?? "");

const toProduct = (r: Row): Product => ({
  id: s(r["id"]),
  name: s(r["name"]),
  urdu: s(r["urdu"]),
  category: s(r["category"]),
  unit: s(r["unit"]) as Unit,
  stock: n(r["stock"]),
  lowStockAt: n(r["low_stock_at"]),
  buyPrice: n(r["buy_price"]),
  sellPrice: n(r["sell_price"]),
  supplier: s(r["supplier"]),
  barcode: s(r["barcode"]),
});

const productPayload = (p: Partial<Product>) => {
  const out: Row = {};
  if (p.name !== undefined) out["name"] = p.name;
  if (p.urdu !== undefined) out["urdu"] = p.urdu;
  if (p.category !== undefined) out["category"] = p.category;
  if (p.unit !== undefined) out["unit"] = p.unit;
  if (p.stock !== undefined) out["stock"] = p.stock;
  if (p.lowStockAt !== undefined) out["low_stock_at"] = p.lowStockAt;
  if (p.buyPrice !== undefined) out["buy_price"] = p.buyPrice;
  if (p.sellPrice !== undefined) out["sell_price"] = p.sellPrice;
  if (p.supplier !== undefined) out["supplier"] = p.supplier;
  if (p.barcode !== undefined) out["barcode"] = p.barcode;
  return out;
};

const toCustomer = (r: Row): Customer => ({
  id: s(r["id"]),
  name: s(r["name"]),
  phone: s(r["phone"]),
  area: s(r["area"]),
  balance: n(r["balance"]),
  lastPaid: s(r["last_paid"]),
});

const toSupplier = (r: Row): Supplier => ({
  id: s(r["id"]),
  name: s(r["name"]),
  phone: s(r["phone"]),
  city: s(r["city"]),
  payable: n(r["payable"]),
});

const toPurchase = (r: Row): Purchase => ({
  id: s(r["id"]),
  supplierId: s(r["supplier_id"]),
  supplierName: s(r["supplier_name"]),
  at: s(r["at"]),
  items: n(r["items"]),
  total: n(r["total"]),
  status: s(r["status"]) as Purchase["status"],
});

const toExpense = (r: Row): Expense => ({
  id: s(r["id"]),
  title: s(r["title"]),
  category: s(r["category"]) as Expense["category"],
  amount: n(r["amount"]),
  at: s(r["at"]),
});

const toStaff = (r: Row): Staff => ({
  id: s(r["id"]),
  name: s(r["name"]),
  role: s(r["role"]) as Staff["role"],
  phone: s(r["phone"]),
  salary: n(r["salary"]),
  shift: s(r["shift"]),
  active: Boolean(r["active"]),
  todaySales: n(r["today_sales"]),
});

const toSale = (r: Row): Sale => ({
  id: s(r["id"]),
  at: s(r["at"]),
  lines: (r["lines"] as CartLine[] | null) ?? [],
  total: n(r["total"]),
  cost: n(r["cost"]),
  method: s(r["method"]) as Sale["method"],
  ...(r["customer_id"] ? { customerId: s(r["customer_id"]) } : {}),
  ...(r["customer_name"] ? { customerName: s(r["customer_name"]) } : {}),
});

const toMove = (r: Row): StockMove => ({
  id: s(r["id"]),
  productId: s(r["product_id"]),
  type: s(r["type"]) as StockMove["type"],
  qty: n(r["qty"]),
  note: s(r["note"]),
  at: s(r["at"]),
});

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [ready, setReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [moves, setMoves] = useState<StockMove[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const refresh = useCallback(async () => {
    if (!userId || !isSupabaseConfigured) {
      setReady(true);
      return;
    }
    const [p, c, sp, pu, ex, st, sa, mv] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("customers").select("*").order("name"),
      supabase.from("suppliers").select("*").order("name"),
      supabase.from("purchases").select("*").order("at", { ascending: false }),
      supabase.from("expenses").select("*").order("at", { ascending: false }),
      supabase.from("staff").select("*").order("name"),
      supabase.from("sales").select("*").order("at", { ascending: false }).limit(500),
      supabase.from("stock_moves").select("*").order("at", { ascending: false }).limit(500),
    ]);
    setProducts(((p.data as Row[]) ?? []).map(toProduct));
    setCustomers(((c.data as Row[]) ?? []).map(toCustomer));
    setSuppliers(((sp.data as Row[]) ?? []).map(toSupplier));
    setPurchases(((pu.data as Row[]) ?? []).map(toPurchase));
    setExpenses(((ex.data as Row[]) ?? []).map(toExpense));
    setStaff(((st.data as Row[]) ?? []).map(toStaff));
    setSales(((sa.data as Row[]) ?? []).map(toSale));
    setMoves(((mv.data as Row[]) ?? []).map(toMove));
    setReady(true);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProducts([]); setSales([]); setMoves([]); setCustomers([]);
      setSuppliers([]); setPurchases([]); setExpenses([]); setStaff([]);
      setReady(false);
      return;
    }
    void refresh();
  }, [userId, refresh]);

  const addProduct = useCallback(
    async (p: NewProduct) => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("products")
        .insert({ ...productPayload(p), user_id: userId })
        .select("*")
        .single();
      if (error || !data) throw error ?? new Error("Could not save product");
      const created = toProduct(data as Row);
      setProducts((prev) => [created, ...prev]);
      return created;
    },
    [userId],
  );

  const updateProduct = useCallback(async (id: string, patch: Partial<Product>) => {
    const { error } = await supabase.from("products").update(productPayload(patch)).eq("id", id);
    if (error) throw error;
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const importProducts = useCallback(
    async (rows: NewProduct[]) => {
      if (!userId) return;
      for (const row of rows) {
        const existing = products.find(
          (p) => p.name.toLowerCase() === row.name.toLowerCase(),
        );
        if (existing) {
          await supabase.from("products").update(productPayload(row)).eq("id", existing.id);
        } else {
          await supabase.from("products").insert({ ...productPayload(row), user_id: userId });
        }
      }
      await refresh();
    },
    [products, refresh, userId],
  );

  const recordSale = useCallback(
    async (lines: CartLine[], method: Sale["method"], customerName?: string) => {
      if (!userId) return null;
      const priceOf = (pid: string) => products.find((p) => p.id === pid);
      const total = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
      const cost = lines.reduce(
        (sum, l) => sum + l.qty * (priceOf(l.productId)?.buyPrice ?? 0),
        0,
      );
      const customer = customerName
        ? customers.find((c) => c.name === customerName)
        : undefined;

      const { data, error } = await supabase
        .from("sales")
        .insert({
          user_id: userId,
          lines,
          total,
          cost,
          method,
          customer_id: customer?.id ?? null,
          customer_name: customerName ?? null,
        })
        .select("*")
        .single();
      if (error || !data) throw error ?? new Error("Could not save sale");
      const sale = toSale(data as Row);

      await Promise.all(
        lines.map((l) => {
          const p = priceOf(l.productId);
          if (!p) return Promise.resolve();
          return supabase
            .from("products")
            .update({ stock: Math.max(0, p.stock - l.qty) })
            .eq("id", p.id);
        }),
      );
      await supabase.from("stock_moves").insert(
        lines.map((l) => ({
          user_id: userId,
          product_id: l.productId,
          type: "sale",
          qty: -l.qty,
          note: `Sale ${sale.id.slice(0, 8)}`,
        })),
      );
      if (method === "udhaar" && customer) {
        await supabase
          .from("customers")
          .update({ balance: customer.balance + total })
          .eq("id", customer.id);
      }
      await refresh();
      return sale;
    },
    [customers, products, refresh, userId],
  );

  const addExpense = useCallback(
    async (e: Omit<Expense, "id" | "at">) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("expenses")
        .insert({ user_id: userId, title: e.title, category: e.category, amount: e.amount })
        .select("*")
        .single();
      if (error || !data) throw error ?? new Error("Could not save expense");
      setExpenses((prev) => [toExpense(data as Row), ...prev]);
    },
    [userId],
  );

  const addCustomer = useCallback(
    async (c: { name: string; phone: string; area: string }) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("customers")
        .insert({ user_id: userId, ...c })
        .select("*")
        .single();
      if (error || !data) throw error ?? new Error("Could not save customer");
      setCustomers((prev) => [...prev, toCustomer(data as Row)]);
    },
    [userId],
  );

  const receivePayment = useCallback(async (customerId: string, amount: number) => {
    const at = new Date().toISOString();
    setCustomers((prev) => {
      const next = prev.map((c) =>
        c.id === customerId
          ? { ...c, balance: Math.max(0, c.balance - amount), lastPaid: at }
          : c,
      );
      const target = next.find((c) => c.id === customerId);
      if (target) {
        void supabase
          .from("customers")
          .update({ balance: target.balance, last_paid: at })
          .eq("id", customerId);
      }
      return next;
    });
  }, []);

  const eraseAllData = useCallback(
    async () => {
      if (!userId) return;
      const tables = [
        "sales",
        "stock_moves",
        "products",
        "customers",
        "suppliers",
        "purchases",
        "expenses",
        "staff",
      ];
      try {
        await Promise.all(
          tables.map((t) => supabase.from(t).delete().eq("user_id", userId)),
        );
        await refresh();
      } catch (error) {
        console.error("Error erasing data:", error);
        throw error;
      }
    },
    [userId, refresh],
  );

  const value = useMemo<ShopState>(
    () => ({
      ready, products, sales, moves, customers, suppliers, purchases, expenses, staff,
      refresh, addProduct, updateProduct, importProducts, recordSale, addExpense,
      addCustomer, receivePayment, eraseAllData,
    }),
    [
      ready, products, sales, moves, customers, suppliers, purchases, expenses, staff,
      refresh, addProduct, updateProduct, importProducts, recordSale, addExpense,
      addCustomer, receivePayment, eraseAllData,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}

/* ---- Derived helpers ---- */

export function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export function useTodayStats() {
  const { sales, products, customers, expenses } = useShop();
  return useMemo(() => {
    const today = sales.filter((x) => isToday(x.at));
    const revenue = today.reduce((sum, x) => sum + x.total, 0);
    const profit = today.reduce((sum, x) => sum + (x.total - x.cost), 0);
    const cash = today.filter((x) => x.method === "cash").reduce((sum, x) => sum + x.total, 0);
    const online = today.filter((x) => x.method === "online").reduce((sum, x) => sum + x.total, 0);
    const udhaar = today.filter((x) => x.method === "udhaar").reduce((sum, x) => sum + x.total, 0);
    const lowStock = products.filter((p) => p.stock <= p.lowStockAt);
    const creditDue = customers.reduce((sum, c) => sum + c.balance, 0);
    const todayExpense = expenses
      .filter((e) => isToday(e.at))
      .reduce((sum, e) => sum + e.amount, 0);
    return {
      today, revenue, profit, cash, online, udhaar, lowStock, creditDue, todayExpense,
      orders: today.length,
    };
  }, [sales, products, customers, expenses]);
}
