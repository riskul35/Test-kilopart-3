export const DEFAULT_RATE = 0.0239;

export type Worker = {
  id: string;
  name: string;
};

export type ShareInput = {
  workerId: string;
  name: string;
  present: boolean;
  percent: number;
};

export type ShareResult = {
  workerId: string;
  name: string;
  present: boolean;
  percent: number;
  equalShareKg: number;
  kg: number;
  euro: number;
};

export type DayRecord = {
  date: string;
  totalKg: number;
  ratePerKg: number;
  shares: ShareInput[];
  savedAt: number;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(100, Math.max(0, value));
}

export function splitTonnage(
  totalKg: number,
  ratePerKg: number,
  shares: ShareInput[],
): ShareResult[] {
  const total = Number.isFinite(totalKg) && totalKg > 0 ? totalKg : 0;
  const rate = Number.isFinite(ratePerKg) && ratePerKg > 0 ? ratePerKg : 0;
  const present = shares.filter((s) => s.present);
  const n = present.length;

  const empty = (s: ShareInput): ShareResult => ({
    workerId: s.workerId,
    name: s.name,
    present: s.present,
    percent: clampPercent(s.percent),
    equalShareKg: 0,
    kg: 0,
    euro: 0,
  });

  if (n === 0 || total === 0) {
    return shares.map(empty);
  }

  const equalShareKg = total / n;
  const acc = new Map<string, { base: number; given: number; received: number }>();

  for (const s of present) {
    const pct = clampPercent(s.percent) / 100;
    const base = equalShareKg * pct;
    acc.set(s.workerId, { base, given: equalShareKg - base, received: 0 });
  }

  for (const s of present) {
    const rec = acc.get(s.workerId);
    if (!rec || rec.given <= 0) continue;
    const others = present.filter((o) => o.workerId !== s.workerId);
    if (others.length === 0) {
      rec.received += rec.given;
      rec.given = 0;
      continue;
    }
    const bonus = rec.given / others.length;
    for (const o of others) {
      const other = acc.get(o.workerId);
      if (other) other.received += bonus;
    }
  }

  return shares.map((s) => {
    const rec = acc.get(s.workerId);
    if (!rec) return empty(s);
    const kg = rec.base + rec.received;
    return {
      workerId: s.workerId,
      name: s.name,
      present: true,
      percent: clampPercent(s.percent),
      equalShareKg,
      kg,
      euro: kg * rate,
    };
  });
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatKg(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
}

export function formatEuro(value: number): string {
  if (!Number.isFinite(value)) return "0,00 €";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatRate(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  }).format(value);
}

export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(y, (m ?? 1) - 1, d ?? 1));
}

export function parseLocaleNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/\u00a0/g, "").replace(/\s/g, "").replace(",", ".");
  if (cleaned === "" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function uid(): string {
  return `w-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
