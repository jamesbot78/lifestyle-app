import { Check, Trash2 } from "lucide-react";
import { cardStyle, iconBtn, checkboxStyle } from "../../styles/theme";

export function ShoppingTab({ shopping, saveShopping }) {
  return (
    <div style={{ padding: "24px 20px", position: "relative" }}>
      <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 24, margin: "0 0 4px", position: "relative", zIndex: 1, color: "#FFFFFF" }}>Shopping list</p>
      <p style={{ color: "#FFFFFF", marginTop: 0, fontSize: 16 }}>Filled in automatically from meal suggestions.</p>
      {shopping.length === 0 && <p style={{ color: "#FFFFFF", fontSize: 16 }}>Nothing on your list yet.</p>}
      {shopping.map((s) => (
        <div key={s.id} style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{ ...checkboxStyle, borderColor: "#FF7A00", background: s.done ? "#34C759" : "transparent" }} onClick={() => saveShopping(shopping.map((x) => x.id === s.id ? { ...x, done: !x.done } : x))}>
              {s.done && <Check size={14} color="#fff" />}
            </button>
            <span style={{ textDecoration: s.done ? "line-through" : "none", color: s.done ? "#c4c4c4" : "#FFFFFF", fontSize: 19, fontWeight: 600 }}>{s.name}</span>
          </div>
          <button style={iconBtn} onClick={() => saveShopping(shopping.filter((x) => x.id !== s.id))}><Trash2 size={18} color="#C9932E" /></button>
        </div>
      ))}
    </div>
  );
}
