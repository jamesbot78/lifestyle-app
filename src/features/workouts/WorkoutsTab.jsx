import { Dumbbell, Camera, Loader2, Trash2 } from "lucide-react";
import { MuscleMapView } from "../../components/MuscleMapView";
import { RestTimer } from "../../components/RestTimer";
import { ExerciseEntryForm } from "../../components/ExerciseEntryForm";

export function WorkoutsTab({
  workoutLog, workoutCaloriesToday, workoutHistory, profile, exerciseLibrary,
  quickAddFromLibrary, workoutInputRef, handleWorkoutPhoto, busy, error,
  muscleNudge, pendingExercise, setPendingExercise, addWorkoutSet, deleteWorkoutEntry,
}) {
  return (
    <div style={{ padding: "24px 20px" }}>
      <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 24, margin: "0 0 4px", color: "#FFFFFF" }}>Today's workout</p>
      <p style={{ color: "#FFFFFF", fontSize: 16, margin: "0 0 18px" }}>
        {workoutLog.length > 0 ? `${workoutCaloriesToday} kcal burned so far` : "Snap a machine to log a set"}
      </p>

      <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 18, margin: "0 0 4px", color: "#fff" }}>Muscle map</p>
      <p style={{ color: "#e0e0e0", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>How much you've trained each muscle in the last 7 days</p>
      <MuscleMapView
        workoutLog={workoutLog}
        workoutHistory={workoutHistory}
        sex={profile?.sex}
        exerciseLibrary={exerciseLibrary}
        onQuickAdd={quickAddFromLibrary}
        onSnapNew={() => workoutInputRef.current?.click()}
        busy={busy}
      />

      <RestTimer />

      {muscleNudge && !pendingExercise && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "radial-gradient(circle at 30% 20%, #1a1200, #0a0a0a)",
            border: "1px solid #FF7A00", borderRadius: 14,
            padding: "12px 14px", marginBottom: 16,
          }}
        >
          <Dumbbell size={18} color="#FF7A00" style={{ flexShrink: 0 }} />
          <p style={{ color: "#F5D9B0", fontSize: 14, margin: 0, fontFamily: "Quicksand", fontWeight: 600 }}>
            {muscleNudge.text}
          </p>
        </div>
      )}

      {exerciseLibrary.length > 0 && !pendingExercise && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {exerciseLibrary.map((ex) => (
            <button
              key={ex.id}
              onClick={() => quickAddFromLibrary(ex)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#0a0a0a", border: "1px solid #FF7A00", borderRadius: 999,
                padding: "8px 14px", color: "#FFFFFF", fontFamily: "Quicksand", fontWeight: 700,
                fontSize: 13, cursor: "pointer",
              }}
            >
              <Dumbbell size={14} color="#FF7A00" />
              {ex.name}
            </button>
          ))}
        </div>
      )}

      <input ref={workoutInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleWorkoutPhoto} />
      <button
        onClick={() => workoutInputRef.current?.click()}
        disabled={busy === "workout"}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          background: "linear-gradient(180deg, #FF7A00, #E3690A)", color: "#fff", border: "none", borderRadius: 16,
          padding: "16px 0", fontFamily: "Quicksand", fontWeight: 700, fontSize: 17, cursor: "pointer",
          boxShadow: "0 10px 20px rgba(255,122,0,0.35)", marginBottom: 20,
        }}
      >
        {busy === "workout" ? <Loader2 size={20} className="spin" /> : <Camera size={20} />}
        {busy === "workout" ? "Reading machine..." : "Snap a new machine"}
      </button>

      {error && <p style={{ color: "#FF3B30", fontSize: 14, marginBottom: 14 }}>{error}</p>}

      {pendingExercise && (
        <ExerciseEntryForm
          pending={pendingExercise}
          onCancel={() => setPendingExercise(null)}
          onSave={(setData) => { addWorkoutSet(setData); setPendingExercise(null); }}
          profile={profile}
        />
      )}

      {workoutLog.length === 0 && !pendingExercise && (
        <p style={{ color: "#c4c4c4", fontSize: 15, textAlign: "center", marginTop: 30 }}>No sets logged yet today.</p>
      )}

      {workoutLog.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {workoutLog.map((w) => (
            <div key={w.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "radial-gradient(circle at 50% 30%, #1a1a1a 0%, #000000 70%)",
              borderRadius: 16, padding: "12px 14px", border: "1px solid #2a2a2a",
              boxShadow: "0 8px 18px rgba(0,0,0,0.5)",
            }}>
              {w.photo ? (
                <img src={w.photo} alt={w.exerciseName} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 10, background: "#222", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Dumbbell size={22} color="#FF7A00" />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#FFFFFF" }}>{w.exerciseName}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#c4c4c4" }}>
                  {w.weight}kg  ·  {w.sets} sets  ·  {w.reps} reps  ·  {w.caloriesBurned} kcal
                </p>
              </div>
              <button
                style={{ background: "rgba(255,59,48,0.15)", border: "none", borderRadius: 999, padding: 8, cursor: "pointer" }}
                onClick={() => deleteWorkoutEntry(w.id)}
                aria-label={`Remove ${w.exerciseName}`}
              >
                <Trash2 size={18} color="#FF3B30" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
