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
      <header style={{ borderBottom: "1px solid #2a2e2a", padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#a8b5a4", color: "#101210", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14 }}>
            kg
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>KiloPart</div>
            <div style={{ fontSize: 12, color: "#8a9088", marginTop: 2 }}>Tonnage & paye d'équipe</div>
          </div>
        </div>
      </header>

      <main style={{ padding: "20px 16px 100px" }}>
        {tab === "today" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <button onClick={() => shiftDate(-1)} style={btnStyle}>‹</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 600, textTransform: "capitalize" }}>{formatDateLong(date)}</div>
                <div style={{ fontSize: 12, color: "#8a9088" }}>{date === todayISO() ? "Journée en cours" : date}</div>
              </div>
              <button onClick={() => shiftDate(1)} style={btnStyle}>›</button>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#8a9088", marginBottom: 8 }}>TONNAGE DU JOUR</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <input
                  value={kgText}
                  onChange={(e) => {
                    setKgText(e.target.value);
                    const n = parseLocaleNumber(e.target.value);
                    if (n !== null) setTotalKg(n);
                  }}
                  placeholder="0"
                  inputMode="decimal"
                  style={{ ...inputStyle, fontSize: 36, fontWeight: 700, width: "100%" }}
                />
                <span style={{ fontSize: 18, color: "#8a9088" }}>kg</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#8a9088", marginBottom: 4 }}>TARIF</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <input
                      value={rateText}
                      onChange={(e) => {
                        setRateText(e.target.value);
                        const n = parseLocaleNumber(e.target.value);
                        if (n !== null) {
                          setRate(n);
                          setDefaultRate(n);
                        }
                      }}
                      inputMode="decimal"
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 12, color: "#8a9088" }}>€/kg</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#8a9088", marginBottom: 4 }}>PART ÉGALE</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {presentCount > 0 ? formatKg(totalKg / presentCount) : "—"} kg
                  </div>
                  <div style={{ fontSize: 12, color: "#8a9088" }}>{presentCount} présent{presentCount > 1 ? "s" : ""}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, color: "#8a9088" }}>TOTAL KG</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{formatKg(totalKg)}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 12, color: "#8a9088" }}>PAYE ÉQUIPE</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{formatEuro(totalEuro)}</div>
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Équipe</div>
              {results.map((r) => (
                <div key={r.workerId} style={{ ...cardStyle, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 13, color: "#8a9088" }}>
                      {r.present ? `${formatKg(r.kg)} kg · ${formatEuro(r.euro)}` : "Absent"}
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#8a9088" }}>Présent</span>
                    <input
                      type="checkbox"
                      checked={r.present}
                      onChange={(e) => updateShare(r.workerId, { present: e.target.checked })}
                    />
                  </label>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "team" && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Équipe</div>
            {workers.map((w) => (
              <div key={w.id} style={{ ...cardStyle, marginBottom: 10, display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={w.name}
                  onChange={(e) => renameWorker(w.id, e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={() => removeWorker(w.id)}
                  style={{ ...btnStyle, color: "#e88", borderColor: "#422" }}
                >
                  ✕
                </button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nouveau nom"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => {
                  if (newName.trim()) {
                    addWorker(newName);
                    setNewName("");
                  }
                }}
                style={{ ...btnStyle, background: "#a8b5a4", color: "#101210", border: "none" }}
              >
                Ajouter
              </button>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Historique</div>
            {history.length === 0 && (
              <div style={{ color: "#8a9088", textAlign: "center", padding: 40 }}>
                Aucune journée enregistrée
              </div>
            )}
            {history.map((d) => {
              const res = splitTonnage(d.totalKg, d.ratePerKg, d.shares);
              const euro = res.reduce((s, r) => s + r.euro, 0);
              return (
                <button
                  key={d.date}
                  onClick={() => {
                    setDate(d.date);
                    setTab("today");
                  }}
                  style={{ ...cardStyle, marginBottom: 10, width: "100%", textAlign: "left", cursor: "pointer" }}
                >
                  <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{formatDateLong(d.date)}</div>
                  <div style={{ fontSize: 13, color: "#8a9088", marginTop: 4 }}>
                    {formatKg(d.totalKg)} kg · {formatEuro(euro)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: "1px solid #2a2e2a",
        background: "rgba(16,18,16,0.95)",
        backdropFilter: "blur(8px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {([
            { id: "today" as Tab, label: "Aujourd'hui" },
            { id: "history" as Tab, label: "Historique" },
            { id: "team" as Tab, label: "Équipe" },
          ]).map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                background: "none",
                border: "none",
                color: tab === item.id ? "#a8b5a4" : "#8a9088",
                padding: "14px 0",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#161916",
  border: "1px solid #2a2e2a",
  borderRadius: 12,
  padding: 16,
};

const inputStyle: React.CSSProperties = {
  background: "#1a1d1a",
  border: "1px solid #2a2e2a",
  borderRadius: 8,
  color: "#e8ebe6",
  padding: "10px 12px",
  fontSize: 16,
  width: "100%",
  outline: "none",
};

const btnStyle: React.CSSProperties = {
  background: "#1a1d1a",
  border: "1px solid #2a2e2a",
  borderRadius: 8,
  color: "#e8ebe6",
  padding: "8px 14px",
  fontSize: 16,
  cursor: "pointer",
};
