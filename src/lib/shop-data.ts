export type Unit = "kg" | "litre" | "pack" | "dozen" | "piece";

export type Product = {
  id: string;
  name: string;
  urdu: string;
  category: string;
  unit: Unit;
  stock: number;
  lowStockAt: number;
  buyPrice: number;
  sellPrice: number;
  supplier: string;
  barcode: string;
};

export type StockMove = {
  id: string;
  productId: string;
  type: "purchase" | "sale" | "adjust" | "return";
  qty: number;
  note: string;
  at: string;
};

export type CartLine = {
  productId: string;
  name: string;
  unit: Unit;
  qty: number;
  price: number;
};

export type Sale = {
  id: string;
  at: string;
  lines: CartLine[];
  total: number;
  cost: number;
  method: "cash" | "online" | "udhaar";
  customerId?: string;
  customerName?: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  area: string;
  balance: number;
  lastPaid: string;
};

export type Supplier = {
  id: string;
  name: string;
  phone: string;
  city: string;
  payable: number;
};

export type Purchase = {
  id: string;
  supplierId: string;
  supplierName: string;
  at: string;
  items: number;
  total: number;
  status: "paid" | "partial" | "unpaid";
};

export type Expense = {
  id: string;
  title: string;
  category: "Rent" | "Bijli" | "Transport" | "Staff" | "Chai / Misc" | "Repair";
  amount: number;
  at: string;
};

export type Staff = {
  id: string;
  name: string;
  role: "Owner" | "Salesman" | "Helper";
  phone: string;
  salary: number;
  shift: string;
  active: boolean;
  todaySales: number;
};

const NUMBER_WORDS: Record<string, number> = {
  aik: 1, ek: 1, one: 1, do: 2, two: 2, teen: 3, three: 3, char: 4, chaar: 4, four: 4,
  panch: 5, paanch: 5, five: 5, che: 6, chay: 6, six: 6, saat: 7, seven: 7,
  aath: 8, eight: 8, nau: 9, nine: 9, das: 10, dus: 10, ten: 10, adha: 0.5, half: 0.5,
};

const UNIT_WORDS = new Set([
  "kilo", "kilos", "kg", "kgs", "litre", "litres", "liter", "liters", "ltr",
  "packet", "packets", "pack", "packs", "dozen", "piece", "pieces", "adad", "de", "do",
]);

/** Common Urdu/Roman aliases → words found in product names. */
const ALIASES: Record<string, string[]> = {
  chini: ["chini", "sugar"],
  sugar: ["chini", "sugar"],
  ghee: ["ghee"],
  gheee: ["ghee"],
  chawal: ["rice", "chawal"],
  rice: ["rice", "chawal"],
  daal: ["daal", "dal"],
  dal: ["daal", "dal"],
  doodh: ["milk", "doodh"],
  milk: ["milk", "doodh"],
  tel: ["oil", "tel"],
  oil: ["oil", "tel"],
  chai: ["tea", "chai"],
  tea: ["tea", "chai"],
  patti: ["tea", "chai"],
  surf: ["surf", "detergent"],
  atta: ["atta", "flour"],
  flour: ["atta", "flour"],
  anda: ["egg", "anda"],
  eggs: ["egg", "anda"],
  namak: ["salt", "namak"],
};

export const VOICE_PHRASE = "1 kilo ghee, 2 kilo chini";

/** Parses a spoken grocery order like "1 kilo ghee, 2 kilo chini" against real stock. */
export function parseVoiceOrder(
  phrase: string,
  products: Product[],
): { productId: string; qty: number }[] {
  const chunks = phrase.toLowerCase().split(/[,،]|\band\b|\baur\b/g);
  const out: { productId: string; qty: number }[] = [];

  const match = (word: string) => {
    const needles = ALIASES[word] ?? [word];
    return products.find((p) => {
      const hay = `${p.name} ${p.urdu}`.toLowerCase();
      return needles.some((n) => hay.includes(n));
    });
  };

  for (const chunk of chunks) {
    const words = chunk.replace(/[^\p{L}0-9.\s]/gu, " ").split(/\s+/).filter(Boolean);
    let qty: number | null = null;
    let productId: string | null = null;

    for (const w of words) {
      if (qty === null) {
        if (/^\d+(\.\d+)?$/.test(w)) {
          qty = parseFloat(w);
          continue;
        }
        if (w in NUMBER_WORDS) {
          qty = NUMBER_WORDS[w] ?? null;
          continue;
        }
      }
      if (!productId && !UNIT_WORDS.has(w) && w.length > 2) {
        const hit = match(w);
        if (hit) productId = hit.id;
      }
    }

    if (productId) out.push({ productId, qty: qty ?? 1 });
  }
  return out;
}
