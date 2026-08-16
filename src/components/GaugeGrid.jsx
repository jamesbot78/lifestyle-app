import { useState, useEffect } from "react";
import { Gauge } from "./Gauge";

export function GaugeGrid({ calGoal, calUsed, protein, protGoal, carbs, carbGoal, fat, fatGoal, sodium, sodiumGoal, showSodium }) {
  const [expandedKey, setExpandedKey] = useState(null);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const items = [
    { key: "cal", label: "Calories", color: "#FF7A00", used: calUsed, goal: calGoal, unit: "" },
    { key: "protein", label: "Protein", color: "#FFFFFF", used: protein, goal: protGoal, unit: "g" },
    { key: "carbs", label: "Carbs", color: "#FF3B30", used: carbs, goal: carbGoal, unit: "g" },
    { key: "fat", label: "Fat", color: "#FFD60A", used: fat, goal: fatGoal, unit: "g" },
    ...(showSodium ? [{ key: "sodium", label: "Sodium", color: "#4A9CD6", used: sodium, goal: sodiumGoal, unit: "mg" }] : []),
  ];

  if (expandedKey) {
    const item = items.find((i) => i.key === expandedKey);
    const isCal = item.key === "cal";
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0" }}>
        <Gauge {...item} size={340} expanded onClick={() => setExpandedKey(null)} showMotivation={isCal} dateStr={isCal ? dateStr : null} timeStr={isCal ? timeStr : null} />
        <span style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 8 }}>Tap to go back</span>
      </div>
    );
  }

  const [featuredKey, setFeaturedKey] = useState(items[0].key);
  const featured = items.find((i) => i.key === featuredKey) || items[0];
  const isFeaturedCal = featured.key === "cal";
  const thumbs = items.filter((i) => i.key !== featuredKey);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 360,
          background: "radial-gradient(circle at 50% 35%, #3a3a3a 0%, #222222 70%)",
          borderRadius: 20,
          padding: "14px 6px 16px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.65), 0 10px 20px rgba(0,0,0,0.55), inset 0 0 30px rgba(255,122,0,0.06), inset 0 14px 26px rgba(0,0,0,0.75)",
          border: "1px solid #2a2a2a",
        }}
      >
        <Gauge {...featured} size={360} onClick={() => setExpandedKey(featured.key)} showMotivation={isFeaturedCal} dateStr={isFeaturedCal ? dateStr : null} timeStr={isFeaturedCal ? timeStr : null} noCard />
        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", gap: 20, padding: "0 10px" }}>
          {thumbs.map((item) => (
            <div key={item.key} onClick={(e) => { e.stopPropagation(); setFeaturedKey(item.key); }} style={{ cursor: "pointer", textAlign: "center", flex: "0 0 auto" }}>
              <div style={{ border: "1px solid #FF7A00", borderRadius: 16, padding: 4, display: "inline-block", background: "#0a0a0a", boxShadow: "0 22px 34px rgba(0,0,0,0.8), 0 10px 14px rgba(0,0,0,0.7), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.65)" }}>
                <Gauge {...item} size={82} mini noCard />
              </div>
              <div style={{ fontFamily: "Quicksand, sans-serif", fontWeight: 800, fontSize: 12, color: "#eeeeee", marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
