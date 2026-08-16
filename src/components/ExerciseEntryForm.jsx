import { useState } from "react";
import { Pencil, AlertTriangle } from "lucide-react";
import { getExerciseWarning } from "../lib/exercise";

export function ExerciseEntryForm({ pending, onCancel, onSave, profile }) {
  const [name, setName] = useState(pending.exerciseName);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("");

  const canSave = name.trim() && reps && sets;
  const injuryWarning = getExerciseWarning(name, profile);

  const inputStyle = {
    width: "100%", background: "#0a0a0a", border: "1px solid #333", borderRadius: 10,
    padding: "10px 12px", color: "#fff", fontFamily: "Atkinson Hyperlegible", fontSize: 16, marginTop: 4,
  };
  const labelStyle = { fontSize: 13, color: "#c4c4c4", fontFamily: "Quicksand", fontWeight: 700 };

  return (
    <div style={{
      background: "radial-gradient(circle at 50% 30%, #1a1a1a 0%, #000000 70%)",
      borderRadius: 18, padding: 16, border: "1px solid #2a2a2a", marginBottom: 18,
      boxShadow: "0 10px 22px rgba(0,0,0,0.55)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        {pending.photo && <img src={pending.photo} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Exercise</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, marginTop: 2 }} />
            <Pencil size={16} color="#666" />
          </div>
        </div>
      </div>

      {injuryWarning && (
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#FF3B30", fontWeight: 700, display: "flex", alignItems: "flex-start", gap: 6 }}>
          <AlertTriangle size={16} color="#FF3B30" style={{ flexShrink: 0, marginTop: 1 }} /> {injuryWarning}
        </p>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Weight (kg)</label>
          <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} placeholder="0" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Reps</label>
          <input type="number" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} style={inputStyle} placeholder="0" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Sets</label>
          <input type="number" inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} style={inputStyle} placeholder="0" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, background: "rgba(255,255,255,0.08)", color: "#e0e0e0", border: "none", borderRadius: 12, padding: "12px 0", fontFamily: "Quicksand", fontWeight: 700, cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() => onSave({ exerciseName: name.trim(), weight: Number(weight) || 0, reps: Number(reps), sets: Number(sets), photo: pending.photo || null })}
          style={{
            flex: 2, background: canSave ? "linear-gradient(180deg, #FF7A00, #E3690A)" : "#333",
            color: "#fff", border: "none", borderRadius: 12, padding: "12px 0",
            fontFamily: "Quicksand", fontWeight: 700, cursor: canSave ? "pointer" : "default",
          }}
        >
          Save set
        </button>
      </div>
    </div>
  );
}
