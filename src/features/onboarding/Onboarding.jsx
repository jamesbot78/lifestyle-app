import { useState, useEffect } from "react";
import { ChefHat } from "lucide-react";
import { labelStyle, inputStyle, primaryBtn, pillStyle } from "../../styles/theme";
import { calcTargets } from "../../lib/nutrition";
import { ReadAloudButton } from "../../components/ReadAloudButton";

export function Onboarding({ onDone }) {
  const [f, setF] = useState({ weight: "98.9", goalWeight: "70", height: "1.73", age: "48", sex: "male", activity: "moderate", pace: "aggressive" });
  const [weightUnit, setWeightUnit] = useState("kg");
  const [heightUnit, setHeightUnit] = useState("m");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [readingSupport, setReadingSupport] = useState(null); // null | true | false
  const [voiceName, setVoiceName] = useState("");
  const [availableVoices, setAvailableVoices] = useState([]);
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en")));
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const weightKg = f.weight ? (weightUnit === "kg" ? Number(f.weight) : Number(f.weight) * 0.453592) : "";
  const goalWeightKg = f.goalWeight ? (weightUnit === "kg" ? Number(f.goalWeight) : Number(f.goalWeight) * 0.453592) : "";
  let heightCm = "";
  if (heightUnit === "cm") heightCm = f.height ? Number(f.height) : "";
  else if (heightUnit === "m") heightCm = f.height ? Number(f.height) * 100 : "";
  else if (heightUnit === "ft") heightCm = (heightFt || heightIn) ? (Number(heightFt || 0) * 30.48 + Number(heightIn || 0) * 2.54) : "";

  const canSubmit = f.weight && f.goalWeight && f.age && (heightUnit === "ft" ? (heightFt || heightIn) : f.height);

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "radial-gradient(circle at 50% 20%, #2c2c2c 0%, #0a0a0a 75%)",
          borderRadius: 20,
          padding: "24px 20px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.55), inset 0 0 30px rgba(255,122,0,0.05), inset 0 14px 26px rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
      <ChefHat size={40} color="#FF7A00" />
      <h1 style={{ fontFamily: "Quicksand", fontSize: 26, margin: "12px 0 4px", color: "#fff" }}>Let's set your targets</h1>
      <p style={{ color: "#d5d5d5", marginBottom: 20 }}>A few numbers so I can work out your daily calories and macros.</p>

      <label style={labelStyle}>Would reading support help you</label>
      <p style={{ color: "#c4c4c4", fontSize: 13, marginTop: -2, marginBottom: 10 }}>Adds a "read aloud" button to sections with more text, so you can hear them read out with each word highlighted. Totally optional, off by default.</p>
      <div style={{ display: "flex", gap: 10, marginBottom: readingSupport ? 16 : 24 }}>
        {[[true, "Yes, turn it on"], [false, "No thanks"]].map(([v, l]) => (
          <button key={String(v)} onClick={() => setReadingSupport(v)} style={{ ...pillStyle(readingSupport === v), flex: "1 1 auto", textAlign: "center" }}>{l}</button>
        ))}
      </div>

      {readingSupport && availableVoices.length > 0 && (
        <>
          <label style={labelStyle}>Choose a voice</label>
          <select
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            style={{ ...inputStyle, marginBottom: 12 }}
          >
            <option value="">Default voice</option>
            {availableVoices.map((v) => (
              <option key={v.name} value={v.name}>{v.name}</option>
            ))}
          </select>
          <ReadAloudButton text="This is a sample of how this voice sounds." label="Preview voice" voiceName={voiceName} />
          <div style={{ marginBottom: 12 }} />
        </>
      )}

      <label style={labelStyle}>Weight unit</label>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[["kg", "Kilograms"], ["lb", "Pounds"]].map(([v, l]) => (
          <button key={v} onClick={() => setWeightUnit(v)} style={pillStyle(weightUnit === v)}>{l}</button>
        ))}
      </div>

      <label style={labelStyle}>Weight ({weightUnit})</label>
      <input style={inputStyle} type="number" inputMode="decimal" value={f.weight} onChange={set("weight")} placeholder={weightUnit === "kg" ? "e.g. 85" : "e.g. 187"} />

      <label style={labelStyle}>Goal weight ({weightUnit})</label>
      <input style={inputStyle} type="number" inputMode="decimal" value={f.goalWeight} onChange={set("goalWeight")} placeholder={weightUnit === "kg" ? "e.g. 75" : "e.g. 165"} />

      <label style={labelStyle}>Height unit</label>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[["m", "Meters"], ["cm", "Centimeters"], ["ft", "Feet and inches"]].map(([v, l]) => (
          <button key={v} onClick={() => setHeightUnit(v)} style={pillStyle(heightUnit === v)}>{l}</button>
        ))}
      </div>

      {heightUnit === "ft" ? (
        <>
          <label style={labelStyle}>Height (feet and inches)</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} type="number" inputMode="numeric" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="feet e.g. 5" />
            <input style={{ ...inputStyle, flex: 1 }} type="number" inputMode="numeric" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="inches e.g. 10" />
          </div>
        </>
      ) : (
        <>
          <label style={labelStyle}>Height ({heightUnit})</label>
          <input style={inputStyle} type="number" inputMode="decimal" value={f.height} onChange={set("height")} placeholder={heightUnit === "m" ? "e.g. 1.78" : "e.g. 178"} />
        </>
      )}

      <label style={labelStyle}>Age</label>
      <input style={inputStyle} type="number" inputMode="numeric" value={f.age} onChange={set("age")} placeholder="e.g. 30" />

      <label style={labelStyle}>Sex</label>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {["male", "female"].map((v) => (
          <button key={v} onClick={() => setF({ ...f, sex: v })} style={pillStyle(f.sex === v)}>{v}</button>
        ))}
      </div>

      <label style={labelStyle}>Activity level</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {[["sedentary", "Desk job (1,000–5,000 steps/day)"], ["moderate", "Moderate (5,000–10,000 steps/day)"], ["active", "Very active (10,000–30,000 steps/day)"]].map(([v, l]) => (
          <button key={v} onClick={() => setF({ ...f, activity: v })} style={pillStyle(f.activity === v)}>{l}</button>
        ))}
      </div>

      <label style={labelStyle}>How fast do you want to lose weight?</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
        {[["relaxed", "Gradual (~0.25kg/week)"], ["steady", "Standard (~0.5kg/week)"], ["aggressive", "High impact (~0.75kg/week)"]].map(([v, l]) => (
          <button key={v} onClick={() => setF({ ...f, pace: v })} style={{ ...pillStyle(f.pace === v), flex: "1 1 auto", textAlign: "center" }}>{l}</button>
        ))}
      </div>

      <button
        disabled={!canSubmit}
        onClick={() => {
          const metricProfile = { ...f, weight: weightKg, goalWeight: goalWeightKg, height: heightCm };
          onDone({
            ...metricProfile,
            startWeight: Number(weightKg),
            goalWeight: Number(goalWeightKg),
            weightUnit,
            heightUnit,
            readingSupport: !!readingSupport,
            voiceName: voiceName || "",
            ...calcTargets(metricProfile),
          });
        }}
        style={{ ...primaryBtn, opacity: canSubmit ? 1 : 0.5, width: "100%" }}
      >
        Continue
      </button>
      </div>
    </div>
  );
}
