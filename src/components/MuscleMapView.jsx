import { useState } from "react";
import { Camera, X, Dumbbell } from "lucide-react";
import { cardStyle, primaryBtn } from "../styles/theme";
import { guessMuscleGroupStandalone } from "../lib/exercise";

export function MuscleMapView({ workoutLog, workoutHistory, sex, exerciseLibrary, onQuickAdd, onSnapNew, busy }) {
  const [view, setView] = useState("front"); // 'front' | 'back'
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const isFemale = sex === "female";

  // tally volume (sets) per muscle over the last 7 days, including today
  const volumeByMuscle = {};
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const allEntries = [
    ...(workoutLog || []),
    ...Object.values(workoutHistory || {}).flat(),
  ];
  allEntries.forEach((e) => {
    if (!e || !e.exerciseName) return;
    const ts = e.id || 0;
    if (ts && ts < cutoff) return;
    const muscle = e.muscleGroup || guessMuscleGroupStandalone(e.exerciseName);
    volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + (e.sets || 1);
  });
  const maxVol = Math.max(1, ...Object.values(volumeByMuscle));

  const colorFor = (muscle) => {
    const v = volumeByMuscle[muscle] || 0;
    if (v === 0) return "#7a7a7a";
    const t = Math.min(1, v / maxVol);
    const from = [140, 95, 50]; // lighter orange-brown, matches brightened body
    const to = [255, 122, 0]; // brand orange
    const rC = Math.round(from[0] + (to[0] - from[0]) * t);
    const gC = Math.round(from[1] + (to[1] - from[1]) * t);
    const bC = Math.round(from[2] + (to[2] - from[2]) * t);
    return `rgb(${rC}, ${gC}, ${bC})`;
  };

  // silhouette: soft body outline drawn behind the zones, sized a few px
  // larger on every edge so it peeks out past the muscle shapes
  const SILHOUETTE = (
    <g fill="#4d4d4d" opacity={0.5}>
      <circle cx="150" cy="30" r="20" />
      <path d="M138,46 L162,46 L160,60 L140,60 Z" />
      <path d="M92,54 Q150,44 208,54 L200,150 Q150,160 100,150 Z" />
      <rect x="0" y="38" width="96" height="52" rx="15" />
      <rect x="204" y="38" width="96" height="52" rx="15" />
      <rect x="98" y="140" width="104" height="52" rx="20" />
      <rect x="108" y="146" width="42" height="172" rx="18" />
      <rect x="150" y="146" width="42" height="172" rx="18" />
    </g>
  );

  // zone definitions: muscle name -> SVG path/shape per view.
  // Arms are outstretched in a T-pose. Each arm's shoulder edge lines up
  // exactly with the shoulder joint circle, and the bicep/forearm segments
  // share an exact edge at the elbow so there's no gap between them.
  const frontZones = [
    { muscle: "Shoulders", d: "M94,60 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 M182,60 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0" },
    { muscle: "Chest", d: "M120,58 Q150,50 180,58 Q184,81 177,104 Q150,98 123,104 Q116,81 120,58 Z" },
    { muscle: "Biceps", d: "M94,55 L94,81 Q67,85 40,77 L40,51 Q67,43 94,55 Z M206,55 L206,81 Q233,85 260,77 L260,51 Q233,43 206,55 Z" },
    { muscle: "Forearms", d: "M40,51 L40,77 Q23,79 6,73 L6,47 Q23,41 40,51 Z M260,51 L260,77 Q277,79 294,73 L294,47 Q277,41 260,51 Z" },
    { muscle: "Abs", d: "M130,104 L170,104 Q172,125 166,146 L134,146 Q128,125 130,104 Z" },
    { muscle: "Obliques", d: "M123,104 L130,104 L126,146 L119,146 Q116,125 123,104 Z M177,104 L170,104 L174,146 L181,146 Q184,125 177,104 Z" },
    { muscle: "Quads", d: "M120,150 L146,150 Q150,188 142,226 L116,226 Q108,188 120,150 Z M180,150 L154,150 Q150,188 158,226 L184,226 Q192,188 180,150 Z" },
    { muscle: "Calves", d: "M118,226 L142,226 Q146,253 138,280 L114,280 Q106,253 118,226 Z M182,226 L158,226 Q154,253 162,280 L186,280 Q194,253 182,226 Z" },
  ];
  const backZones = [
    { muscle: "Shoulders", d: "M94,60 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 M182,60 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0" },
    { muscle: "Upper back", d: "M120,58 Q150,50 180,58 Q184,74 178,90 Q150,96 122,90 Q116,74 120,58 Z" },
    { muscle: "Lats", d: "M118,90 L142,90 Q146,110 138,130 L114,130 Q108,110 118,90 Z M182,90 L158,90 Q154,110 162,130 L186,130 Q192,110 182,90 Z" },
    { muscle: "Triceps", d: "M94,55 L94,81 Q67,85 40,77 L40,51 Q67,43 94,55 Z M206,55 L206,81 Q233,85 260,77 L260,51 Q233,43 206,55 Z" },
    { muscle: "Forearms", d: "M40,51 L40,77 Q23,79 6,73 L6,47 Q23,41 40,51 Z M260,51 L260,77 Q277,79 294,73 L294,47 Q277,41 260,51 Z" },
    { muscle: "Lower back", d: "M126,130 L174,130 Q178,146 170,162 L130,162 Q122,146 126,130 Z" },
    { muscle: "Glutes", d: "M112,162 L188,162 Q194,179 184,196 L116,196 Q106,179 112,162 Z" },
    { muscle: "Hamstrings", d: "M120,196 L146,196 Q150,227 142,258 L116,258 Q108,227 120,196 Z M180,196 L154,196 Q150,227 158,258 L184,258 Q192,227 180,196 Z" },
    { muscle: "Calves", d: "M118,258 L142,258 Q146,284 138,310 L114,310 Q106,284 118,258 Z M182,258 L158,258 Q154,284 162,310 L186,310 Q194,284 182,258 Z" },
  ];
  const zones = view === "front" ? frontZones : backZones;

  const MUSCLE_INFO = {
    "Shoulders": { desc: "Deltoids, cap the shoulder joint and lift/rotate the arm.", suggest: ["Overhead press", "Lateral raise", "Arnold press"] },
    "Chest": { desc: "Pectorals, push muscles across the front of the chest.", suggest: ["Bench press", "Push ups", "Chest fly"] },
    "Biceps": { desc: "Front of the upper arm, bends the elbow.", suggest: ["Bicep curl", "Hammer curl", "Chin ups"] },
    "Triceps": { desc: "Back of the upper arm, straightens the elbow.", suggest: ["Tricep pushdown", "Skullcrusher", "Dips"] },
    "Forearms": { desc: "Controls grip strength and wrist movement.", suggest: ["Wrist curl", "Farmer's carry", "Dead hang"] },
    "Abs": { desc: "Rectus abdominis, flexes the spine, front core.", suggest: ["Crunch", "Plank", "Leg raise"] },
    "Obliques": { desc: "Sides of the core, twisting and side-bending.", suggest: ["Russian twist", "Side plank", "Woodchop"] },
    "Quads": { desc: "Front of the thigh, straightens the knee.", suggest: ["Squat", "Leg press", "Lunge"] },
    "Hamstrings": { desc: "Back of the thigh, bends the knee, extends the hip.", suggest: ["Romanian deadlift", "Leg curl", "Good morning"] },
    "Glutes": { desc: "Buttocks, drives hip extension and power.", suggest: ["Hip thrust", "Squat", "Glute kickback"] },
    "Calves": { desc: "Back of the lower leg, points the foot/toe.", suggest: ["Calf raise", "Jump rope", "Seated calf raise"] },
    "Lats": { desc: "Latissimus dorsi, wide back muscles, pulling motion.", suggest: ["Pulldown", "Pull ups", "Lat row"] },
    "Upper back": { desc: "Traps and rhomboids, shoulder blade control.", suggest: ["Shrug", "Face pull", "Rear delt fly"] },
    "Lower back": { desc: "Erector spinae, supports and extends the spine.", suggest: ["Back extension", "Good morning", "Deadlift"] },
  };

  const muscleExercises = (exerciseLibrary || []).filter((ex) => {
    const g = ex.muscleGroup || guessMuscleGroupStandalone(ex.name);
    return g === selectedMuscle;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setView("front")}
          style={{ fontSize: 14, padding: "8px 16px", borderRadius: 999, border: view === "front" ? "1.5px solid #FF7A00" : "1.5px solid rgba(255,255,255,0.25)", background: view === "front" ? "rgba(255,122,0,0.15)" : "#1a1a1a", color: view === "front" ? "#FF7A00" : "#e0e0e0", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer" }}
        >
          Front
        </button>
        <button
          onClick={() => setView("back")}
          style={{ fontSize: 14, padding: "8px 16px", borderRadius: 999, border: view === "back" ? "1.5px solid #FF7A00" : "1.5px solid rgba(255,255,255,0.25)", background: view === "back" ? "rgba(255,122,0,0.15)" : "#1a1a1a", color: view === "back" ? "#FF7A00" : "#e0e0e0", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer" }}
        >
          Back
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width="100%" height="auto" style={{ maxWidth: 260, display: "block" }} viewBox="0 0 300 320" preserveAspectRatio="xMidYMid meet">
          {SILHOUETTE}
          {zones.map((z, i) => (
            <path
              key={i}
              d={z.d}
              fill={colorFor(z.muscle)}
              opacity={selectedMuscle && selectedMuscle !== z.muscle ? 0.4 : 0.9}
              stroke={selectedMuscle === z.muscle ? "#FF7A00" : "none"}
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedMuscle(selectedMuscle === z.muscle ? null : z.muscle)}
            />
          ))}
        </svg>
      </div>

      <div style={{ marginTop: 20 }}>
        {Object.keys(volumeByMuscle).length === 0 && (
          <p style={{ textAlign: "center", color: "#e0e0e0", fontSize: 14, fontWeight: 600 }}>No workouts logged in the last 7 days yet.</p>
        )}
        {[...new Set(zones.map((z) => z.muscle))].map((muscle) => (
          <div
            key={muscle}
            onClick={() => setSelectedMuscle(selectedMuscle === muscle ? null : muscle)}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, cursor: "pointer", padding: "4px 6px", borderRadius: 8, background: selectedMuscle === muscle ? "rgba(255,122,0,0.1)" : "transparent" }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 4, background: colorFor(muscle), flexShrink: 0 }} />
            <span style={{ fontSize: 15, color: "#fff", fontWeight: 700, flex: 1 }}>{muscle}</span>
            <span style={{ fontSize: 14, color: "#eee", fontWeight: 600 }}>{volumeByMuscle[muscle] || 0} sets</span>
          </div>
        ))}
      </div>

      {selectedMuscle && (
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p style={{ margin: 0, fontFamily: "Quicksand", fontWeight: 700, fontSize: 18, color: "#fff" }}>{selectedMuscle}</p>
            <button onClick={() => setSelectedMuscle(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={20} color="#c4c4c4" />
            </button>
          </div>
          {MUSCLE_INFO[selectedMuscle]?.desc && (
            <p style={{ margin: "6px 0 14px", fontSize: 15, color: "#fff", fontWeight: 500, lineHeight: 1.5 }}>{MUSCLE_INFO[selectedMuscle].desc}</p>
          )}

          {muscleExercises.length > 0 ? (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#FF7A00" }}>Your saved exercises</p>
              {muscleExercises.map((ex) => (
                <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  {ex.photo ? (
                    <img src={ex.photo} alt={ex.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1.5px solid #FF7A00" }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Dumbbell size={20} color="#666" />
                    </div>
                  )}
                  <span style={{ flex: 1, fontSize: 16, color: "#fff", fontFamily: "Quicksand", fontWeight: 700 }}>{ex.name}</span>
                  <button
                    onClick={() => onQuickAdd && onQuickAdd(ex)}
                    style={{ fontSize: 13, padding: "6px 12px", borderRadius: 999, border: "1.5px solid rgba(52,199,89,0.5)", background: "rgba(52,199,89,0.12)", color: "#34C759", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer" }}
                  >
                    Log a set
                  </button>
                </div>
              ))}
            </>
          ) : (
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "#e0e0e0", fontWeight: 600 }}>No saved exercises for this muscle yet.</p>
          )}

          {MUSCLE_INFO[selectedMuscle]?.suggest?.length > 0 && (
            <>
              <p style={{ margin: "14px 0 6px", fontSize: 13, fontWeight: 700, color: "#FF7A00" }}>Ideas to try</p>
              <p style={{ margin: 0, fontSize: 15, color: "#fff", fontWeight: 500, lineHeight: 1.6 }}>{MUSCLE_INFO[selectedMuscle].suggest.join(", ")}</p>
            </>
          )}

          {onSnapNew && (
            <button
              onClick={onSnapNew}
              disabled={busy === "workout"}
              style={{ ...primaryBtn, marginTop: 16, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: busy === "workout" ? 0.6 : 1 }}
            >
              <Camera size={18} /> {busy === "workout" ? "Reading photo..." : "Snap this exercise"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
