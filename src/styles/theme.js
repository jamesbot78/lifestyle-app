export const shellStyle = { display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", background: "var(--bg)", color: "var(--ink)", position: "relative" };
export const secondaryBtn = { background: "#fff", color: "var(--ink)", border: "2px solid var(--border)", borderRadius: 16, padding: "14px 20px", fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, cursor: "pointer" };
export const cardStyle = {
  background: "radial-gradient(circle at 50% 25%, #2c2c2c 0%, #0a0a0a 75%)",
  borderRadius: 16,
  padding: "14px 16px",
  marginTop: 10,
  boxShadow: "0 14px 22px rgba(0,0,0,0.5), 0 6px 10px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -3px 0 rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.07)",
  color: "#fff",
};
export const tagStyle = { background: "#fff", border: "2px solid var(--border)", borderRadius: 999, padding: "8px 14px", fontSize: 14 };
export const iconBtn = { background: "none", border: "none", cursor: "pointer", padding: 6 };
export const checkboxStyle = { width: 22, height: 22, borderRadius: 6, border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
export const navStyle = { position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid var(--border)", display: "flex", padding: "6px 8px", maxWidth: 480, margin: "0 auto", zIndex: 1 };

export const labelStyle = { display: "block", fontFamily: "Quicksand", fontWeight: 600, fontSize: 14, color: "#eeeeee", marginBottom: 6, marginTop: 4 };
export const inputStyle = { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.2)", fontSize: 16, fontFamily: "Atkinson Hyperlegible", marginBottom: 14, background: "#1a1a1a", color: "#fff" };
export const primaryBtn = { background: "#FF7A00", color: "#fff", border: "none", borderRadius: 16, padding: "14px 20px", fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 10px 18px rgba(255,122,0,0.35)" };
export const pillStyle = (active) => ({
  padding: "10px 16px",
  borderRadius: 999,
  border: active ? "2px solid #FF7A00" : "1.5px solid rgba(255,255,255,0.2)",
  background: active ? "rgba(255,122,0,0.18)" : "#1a1a1a",
  color: active ? "#FF7A00" : "#eeeeee",
  fontFamily: "Atkinson Hyperlegible",
  fontWeight: active ? 700 : 400,
  fontSize: 14,
  cursor: "pointer",
});
