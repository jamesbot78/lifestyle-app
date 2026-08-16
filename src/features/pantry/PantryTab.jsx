import { Loader2, X } from "lucide-react";

export function PantryTab({ pantry, savePantry, fridgeInputRef, pantryInputRef, busy, error }) {
  return (
    <div style={{ padding: "24px 20px", position: "relative" }}>
      <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 24, margin: "0 0 4px", position: "relative", zIndex: 1, color: "#FFFFFF" }}>Snap your groceries</p>
      <p style={{ color: "#FFFFFF", marginTop: 0, fontSize: 16 }}>Photograph what you've got so suggestions use it.</p>
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        <button
          onClick={() => fridgeInputRef.current.click()}
          disabled={busy}
          style={{
            flex: 1,
            border: "none",
            cursor: "pointer",
            borderRadius: 16,
            padding: "16px 10px 14px",
            background: "linear-gradient(180deg, #3d3d3d 0%, #1a1a1a 100%)",
            boxShadow: "0 14px 22px rgba(0,0,0,0.55), 0 6px 10px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -3px 0 rgba(0,0,0,0.6)",
            border: "1.5px solid #00C2FF",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            color: "#fff",
            fontFamily: "Quicksand, sans-serif",
            fontWeight: 700,
          }}
        >
          <div style={{ position: "relative", width: 34, height: 44, border: "2.5px solid #00C2FF", borderRadius: 5, background: "rgba(0,194,255,0.08)" }}>
            <div style={{ position: "absolute", top: "34%", left: 0, right: 0, height: 2, background: "#00C2FF" }} />
          </div>
          {busy === "pantry" ? <Loader2 className="spin" size={16} /> : <span style={{ fontSize: 13 }}>Scan fridge</span>}
        </button>
        <button
          onClick={() => pantryInputRef.current.click()}
          disabled={busy}
          style={{
            flex: 1,
            border: "none",
            cursor: "pointer",
            borderRadius: 16,
            padding: "16px 10px 14px",
            background: "linear-gradient(180deg, #3d3d3d 0%, #1a1a1a 100%)",
            boxShadow: "0 14px 22px rgba(0,0,0,0.55), 0 6px 10px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -3px 0 rgba(0,0,0,0.6)",
            border: "1.5px solid #FF7A00",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            color: "#fff",
            fontFamily: "Quicksand, sans-serif",
            fontWeight: 700,
          }}
        >
          <div style={{ position: "relative", width: 38, height: 40, border: "2.5px solid #FF7A00", borderRadius: 4, background: "rgba(255,122,0,0.08)" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#FF7A00" }} />
            <div style={{ position: "absolute", top: "25%", left: "20%", width: 3, height: 3, borderRadius: "50%", background: "#FF7A00" }} />
            <div style={{ position: "absolute", top: "75%", left: "20%", width: 3, height: 3, borderRadius: "50%", background: "#FF7A00" }} />
          </div>
          {busy === "pantry" ? <Loader2 className="spin" size={16} /> : <span style={{ fontSize: 13 }}>Scan pantry</span>}
        </button>
      </div>
      {error && <p style={{ color: "var(--fat)" }}>{error}</p>}
      {pantry.length === 0 && <p style={{ color: "#FFFFFF", fontSize: 16 }}>No items yet. Scan your fridge to get started.</p>}
      {pantry.length > 0 && (
        <div
          style={{
            background: "radial-gradient(circle at 50% 20%, #2c2c2c 0%, #0a0a0a 75%)",
            borderRadius: 20,
            padding: "22px 16px",
            boxShadow: "0 24px 48px rgba(0,0,0,0.55), inset 0 0 30px rgba(255,122,0,0.05), inset 0 14px 26px rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
            }}
          >
            {pantry.map((item) => {
              const pantryCatColors = { protein: "#FFFFFF", carb: "#FF3B30", veg: "#34C759", fruit: "#FFD60A", dairy: "#00C2FF", other: "#FF7A00" };
              const dotColor = pantryCatColors[item.category] || pantryCatColors.other;
              return (
                <div
                  key={item.id}
                  style={{
                    position: "relative",
                    background: "radial-gradient(circle at 50% 30%, #3a3a3a 0%, #111111 75%)",
                    borderRadius: 14,
                    padding: "14px 10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 14px 22px rgba(0,0,0,0.55), 0 6px 10px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -3px 0 rgba(0,0,0,0.6)",
                    border: `1.5px solid ${dotColor}`,
                  }}
                >
                  <X
                    size={13}
                    color="#c4c4c4"
                    style={{ position: "absolute", top: 6, right: 6, cursor: "pointer" }}
                    onClick={() => savePantry(pantry.filter((p) => p.id !== item.id))}
                  />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
                  <span style={{ color: "#FFFFFF", fontFamily: "Atkinson Hyperlegible, sans-serif", fontSize: 15, fontWeight: 700, textAlign: "center", lineHeight: 1.25 }}>
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
