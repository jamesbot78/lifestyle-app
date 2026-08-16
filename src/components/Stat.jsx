export function Stat({ label, val }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
      <span style={{ color: "#d5d5d5" }}>{label}</span>
      <span style={{ fontFamily: "Quicksand", fontWeight: 700, color: "#fff" }}>{val}</span>
    </div>
  );
}
