import { useEffect, useMemo, useState, useRef } from "react";
import { useStore, defaultShares } from "./store";
import {
  splitTonnage,
  todayISO,
  formatKg,
  formatEuro,
  formatRate,
  formatDateLong,
  parseLocaleNumber,
  type ShareInput,
} from "./lib";

type Tab = "today" | "history" | "team";

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const [date, setDate] = useState(todayISO());
  const workers = useStore((s) => s.workers);
  const defaultRate = useStore((s) => s.defaultRate);
  const days = useStore((s) => s.days);
  const saveDay = useStore((s) => s.saveDay);
  const addWorker = useStore((s) => s.addWorker);
  const renameWorker = useStore((s) => s.renameWorker);
  const removeWorker = useStore((s) => s.removeWorker);
  const setDefaultRate = useStore((s) => s.setDefaultRate);

  const existing = days[date];
  const [totalKg, setTotalKg] = useState(0);
  const [rate, setRate] = useState(defaultRate);
  const [shares, setShares] = useState<ShareInput[]>([]);
  const [kgText, setKgText] = useState("");
  const [rateText, setRateText] = useState(formatRate(defaultRate));
  const [newName, setNewName] = useState("");
  const skipSave = useRef(true);

  // Charge les données du jour (ou remet à 0 si nouveau jour)
  useEffect(() => {
    skipSave.current = true;

    if (existing) {
      setTotalKg(existing.totalKg);
      setRate(existing.ratePerKg);
      setShares(existing.shares);
      setKgText(existing.totalKg > 0 ? String(existing.totalKg).replace(".", ",") : "");
      setRateText(formatRate(existing.ratePerKg));
    } else {
      setTotalKg(0);
      setRate(defaultRate);
      setShares(defaultShares(workers));
      setKgText("");
      setRateText(formatRate(defaultRate));
    }
  }, [date]);

  const results = useMemo(
    () => splitTonnage(totalKg, rate, shares),
    [totalKg, rate, shares],
  );

  const presentCount = results.filter((r) => r.present).length;
  const totalEuro = results.reduce((s, r) => s + r.euro, 0);

  // Sauvegarde uniquement quand l'utilisateur modifie vraiment
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (totalKg <= 0 && !existing) return;
    saveDay({ date, totalKg, ratePerKg: rate, shares });
  }, [totalKg, rate, shares]);

  function shiftDate(delta: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setDate(`\( {y}- \){m}-${day}`);
  }

  function updateShare(workerId: string, patch: Partial<ShareInput>) {
    setShares((prev) =>
      prev.map((s) => (s.workerId === workerId ? { ...s, ...patch } : s)),
    );
  }

  const history = Object.values(days)
    .filter((d) => d.totalKg > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ minHeight: "100dvh", background: "#101210", color: "#e8ebe6", maxWidth: 480, margin: "0 auto" }}>
      <header style={{ borderBottom
