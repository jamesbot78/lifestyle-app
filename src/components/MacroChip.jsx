export function MacroChip({ color, label, val, goal }) {
  const pct = Math.min(1, (val || 0) / (goal || 1));
  const size = 34;
  const stroke = 4;
  const r = size / 2 - stroke / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} style={{ margin: "0 auto 4px", display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <p style={{ margin: 0, fontFamily: "Quicksand", fontWeight: 700, fontSize: 15 }}>{val}<span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>/{goal}g</span></p>
      <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)" }}>{label}</p>
    </div>
  );
}
