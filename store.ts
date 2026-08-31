import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_RATE,
  type Worker,
  type ShareInput,
  type DayRecord,
  uid,
  todayISO,
} from "./lib";

type State = {
  workers: Worker[];
  defaultRate: number;
  days: Record<string, DayRecord>;
  addWorker: (name: string) => void;
  renameWorker: (id: string, name: string) => void;
  removeWorker: (id: string) => void;
  setDefaultRate: (rate: number) => void;
  saveDay: (record: Omit<DayRecord, "savedAt">) => void;
  deleteDay: (date: string) => void;
};

const DEFAULT_WORKERS: Worker[] = [
  { id: "w1", name: "Équipier 1" },
  { id: "w2", name: "Équipier 2" },
  { id: "w3", name: "Équipier 3" },
  { id: "w4", name: "Équipier 4" },
  { id: "w5", name: "Équipier 5" },
];

export function defaultShares(workers: Worker[]): ShareInput[] {
  return workers.map((w) => ({
    workerId: w.id,
    name: w.name,
    present: true,
    percent: 100,
  }));
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      workers: DEFAULT_WORKERS,
      defaultRate: DEFAULT_RATE,
      days: {},
      addWorker: (name) => {
        const trimmed = name.trim() || `Équipier ${get().workers.length + 1}`;
        set((s) => ({
          workers: [...s.workers, { id: uid(), name: trimmed }],
        }));
      },
      renameWorker: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({
          workers: s.workers.map((w) => (w.id === id ? { ...w, name: trimmed } : w)),
        }));
      },
      removeWorker: (id) => {
        set((s) => ({
          workers: s.workers.filter((w) => w.id !== id),
        }));
      },
      setDefaultRate: (rate) => {
        if (!Number.isFinite(rate) || rate < 0) return;
        set({ defaultRate: rate });
      },
      saveDay: (record) => {
        set((s) => ({
          days: {
            ...s.days,
            [record.date]: { ...record, savedAt: Date.now() },
          },
        }));
      },
      deleteDay: (date) => {
        set((s) => {
          const next = { ...s.days };
          delete next[date];
          return { days: next };
        });
      },
    }),
    { name: "kilopart-v1" },
  ),
);
