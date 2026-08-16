import { useState, useEffect } from "react";

export function DateTimeHeader() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div style={{ marginBottom: 4 }}>
      <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 20, color: "var(--ink)", margin: 0 }}>{dateStr}</p>
      <p style={{ fontFamily: "Atkinson Hyperlegible", fontSize: 15, color: "var(--ink-soft)", margin: "2px 0 0" }}>{timeStr}</p>
    </div>
  );
}
