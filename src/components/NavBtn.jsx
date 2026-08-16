export function NavBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", padding: 8, flex: 1, minWidth: 0 }}>
      <Icon size={22} color={active ? "var(--success)" : "var(--ink-soft)"} />
      <span style={{ fontSize: 11, fontFamily: "Atkinson Hyperlegible", color: active ? "var(--success)" : "var(--ink-soft)", fontWeight: active ? 700 : 400, textAlign: "center", overflowWrap: "break-word" }}>{label}</span>
    </button>
  );
}
