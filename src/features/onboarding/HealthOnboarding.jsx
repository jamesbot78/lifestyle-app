import { useState } from "react";
import { ChefHat, ChevronDown, ChevronUp } from "lucide-react";
import { labelStyle, inputStyle, primaryBtn, pillStyle } from "../../styles/theme";
import { ReadAloudButton } from "../../components/ReadAloudButton";

export function HealthOnboarding({ onDone, onBack, readingSupport, voiceName }) {
  const [conditions, setConditions] = useState([]);
  const [injuries, setInjuries] = useState([]); // array of { key, date }
  const [allergies, setAllergies] = useState([]);
  const [pattern, setPattern] = useState("none");
  const [otherNote, setOtherNote] = useState("");
  const [otherInjury, setOtherInjury] = useState("");
  const [otherCondition, setOtherCondition] = useState("");
  const [openSection, setOpenSection] = useState(null);
  const toggleSection = (key) => setOpenSection(openSection === key ? null : key);

  const toggle = (list, setList, v) => {
    setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  const toggleInjury = (v) => {
    setInjuries(
      injuries.some((i) => i.key === v)
        ? injuries.filter((i) => i.key !== v)
        : [...injuries, { key: v, date: "" }]
    );
  };
  const setInjuryDate = (v, date) => {
    setInjuries(injuries.map((i) => (i.key === v ? { ...i, date } : i)));
  };

  const conditionOptions = [
    ["diabetes", "Diabetes"],
    ["heart_bp", "Heart condition / high blood pressure"],
    ["kidney", "Kidney condition"],
    ["cholesterol", "High cholesterol"],
    ["celiac", "Celiac disease / gluten sensitivity"],
    ["lactose", "Lactose intolerance"],
    ["pregnancy", "Pregnant or breastfeeding"],
    ["eating_history", "History with eating or body image concerns"],
  ];

  const injuryOptions = [
    ["knee_replacement", "Knee replacement"],
    ["hip_replacement", "Hip replacement"],
    ["shoulder_replacement", "Shoulder replacement"],
    ["acl", "ACL tear or repair"],
    ["meniscus", "Meniscus injury"],
    ["rotator_cuff", "Rotator cuff injury or repair"],
    ["back_surgery", "Back or spinal surgery"],
    ["herniated_disc", "Herniated disc"],
    ["broken_bone", "Broken bone, healing"],
    ["ankle_sprain", "Ankle sprain or injury"],
    ["wrist_injury", "Wrist or elbow injury"],
    ["hernia_surgery", "Hernia surgery"],
    ["arthritis", "Arthritis"],
    ["tendonitis", "Tendonitis"],
    ["sciatica", "Sciatica"],
    ["frozen_shoulder", "Frozen shoulder"],
    ["plantar_fasciitis", "Plantar fasciitis"],
    ["neck_injury", "Neck injury"],
    ["hip_impingement", "Hip impingement"],
    ["general_joint", "General joint pain, unspecified"],
  ];

  const allergyOptions = [
    ["peanuts", "Peanuts"],
    ["tree_nuts", "Tree nuts"],
    ["shellfish", "Shellfish"],
    ["fish", "Fish"],
    ["eggs", "Eggs"],
    ["soy", "Soy"],
    ["wheat", "Wheat"],
    ["dairy", "Dairy"],
  ];

  const patternOptions = [
    ["none", "No specific pattern"],
    ["vegetarian", "Vegetarian"],
    ["vegan", "Vegan"],
    ["halal", "Halal"],
    ["kosher", "Kosher"],
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "radial-gradient(circle at 50% 20%, #2c2c2c 0%, #0a0a0a 75%)",
          borderRadius: 20,
          padding: "24px 20px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.55), inset 0 0 30px rgba(255,122,0,0.05), inset 0 14px 26px rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
      <ChefHat size={40} color="#FF7A00" />
      <h1 style={{ fontFamily: "Quicksand", fontSize: 26, margin: "12px 0 4px", color: "#fff" }}>Health and dietary needs</h1>
      <p style={{ color: "#d5d5d5", marginBottom: 8 }}>Optional, but this helps me flag foods and workouts that might not be right for you. You can change this anytime in Goals.</p>
      {readingSupport && <ReadAloudButton text="Optional, but this helps me flag foods and workouts that might not be right for you. You can change this anytime in Goals." voiceName={voiceName} />}
      <div style={{ marginBottom: 12 }} />

      {(() => {
        const sectionHeaderStyle = {
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.08)",
        };
        const countBadge = (n) => n > 0 ? (
          <span style={{ background: "#FF7A00", color: "#000", borderRadius: 999, fontSize: 12, fontWeight: 800, padding: "2px 8px", marginLeft: 8 }}>{n}</span>
        ) : null;
        return (
          <>
            <button style={sectionHeaderStyle} onClick={() => toggleSection("conditions")}>
              <span style={{ display: "flex", alignItems: "center", fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>
                Medical conditions{countBadge(conditions.length)}
              </span>
              {openSection === "conditions" ? <ChevronUp size={20} color="#c4c4c4" /> : <ChevronDown size={20} color="#c4c4c4" />}
            </button>
            {openSection === "conditions" && (
              <div style={{ padding: "12px 0 4px" }}>
                {readingSupport && <ReadAloudButton text={conditionOptions.map(([, l]) => l).join(". ")} label="Read options aloud" voiceName={voiceName} />}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                  {conditionOptions.map(([v, l]) => (
                    <button key={v} onClick={() => toggle(conditions, setConditions, v)} style={{ ...pillStyle(conditions.includes(v)), flex: "1 1 auto", textAlign: "center" }}>{l}</button>
                  ))}
                </div>
                <input style={inputStyle} type="text" value={otherCondition} onChange={(e) => setOtherCondition(e.target.value)} placeholder="Other medical condition not listed" />
              </div>
            )}

            <button style={sectionHeaderStyle} onClick={() => toggleSection("injuries")}>
              <span style={{ display: "flex", alignItems: "center", fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>
                Joint issues, injuries, or recent surgery{countBadge(injuries.length)}
              </span>
              {openSection === "injuries" ? <ChevronUp size={20} color="#c4c4c4" /> : <ChevronDown size={20} color="#c4c4c4" />}
            </button>
            {openSection === "injuries" && (
              <div style={{ padding: "12px 0 4px" }}>
                <p style={{ color: "#c4c4c4", fontSize: 13, marginTop: -4, marginBottom: 10 }}>Recovering from something? This helps me avoid suggesting exercises that could aggravate it.</p>
                {readingSupport && <ReadAloudButton text={injuryOptions.map(([, l]) => l).join(". ")} label="Read options aloud" voiceName={voiceName} />}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                  {injuryOptions.map(([v, l]) => (
                    <button key={v} onClick={() => toggleInjury(v)} style={{ ...pillStyle(injuries.some((i) => i.key === v)), flex: "1 1 auto", textAlign: "center" }}>{l}</button>
                  ))}
                </div>

                {injuries.map((i) => {
                  const label = injuryOptions.find(([v]) => v === i.key)?.[1] || i.key;
                  return (
                    <div key={i.key} style={{ marginBottom: 10 }}>
                      <label style={{ ...labelStyle, marginBottom: 4 }}>When did {label.toLowerCase()} happen? (roughly is fine)</label>
                      <input
                        style={{ ...inputStyle, minWidth: 0, maxWidth: "100%" }}
                        type="date"
                        value={i.date}
                        onChange={(e) => setInjuryDate(i.key, e.target.value)}
                      />
                    </div>
                  );
                })}

                <input style={inputStyle} type="text" value={otherInjury} onChange={(e) => setOtherInjury(e.target.value)} placeholder="Other joint issue or injury not listed" />
              </div>
            )}

            <button style={sectionHeaderStyle} onClick={() => toggleSection("allergies")}>
              <span style={{ display: "flex", alignItems: "center", fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>
                Food allergies or intolerances{countBadge(allergies.length)}
              </span>
              {openSection === "allergies" ? <ChevronUp size={20} color="#c4c4c4" /> : <ChevronDown size={20} color="#c4c4c4" />}
            </button>
            {openSection === "allergies" && (
              <div style={{ padding: "12px 0 4px" }}>
                {readingSupport && <ReadAloudButton text={allergyOptions.map(([, l]) => l).join(". ")} label="Read options aloud" voiceName={voiceName} />}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
                  {allergyOptions.map(([v, l]) => (
                    <button key={v} onClick={() => toggle(allergies, setAllergies, v)} style={{ ...pillStyle(allergies.includes(v)), flex: "1 1 auto", textAlign: "center" }}>{l}</button>
                  ))}
                </div>
              </div>
            )}

            <button style={sectionHeaderStyle} onClick={() => toggleSection("pattern")}>
              <span style={{ display: "flex", alignItems: "center", fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>
                Dietary pattern{pattern !== "none" ? countBadge(1) : null}
              </span>
              {openSection === "pattern" ? <ChevronUp size={20} color="#c4c4c4" /> : <ChevronDown size={20} color="#c4c4c4" />}
            </button>
            {openSection === "pattern" && (
              <div style={{ padding: "12px 0 4px", marginBottom: 6 }}>
                {readingSupport && <ReadAloudButton text={patternOptions.map(([, l]) => l).join(". ")} label="Read options aloud" voiceName={voiceName} />}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {patternOptions.map(([v, l]) => (
                    <button key={v} onClick={() => setPattern(v)} style={{ ...pillStyle(pattern === v), flex: "1 1 auto", textAlign: "center" }}>{l}</button>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      <label style={labelStyle}>Anything else you want me to know (optional)</label>
      <input style={inputStyle} type="text" value={otherNote} onChange={(e) => setOtherNote(e.target.value)} placeholder="e.g. other allergy, other note" />

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onBack} style={{ ...pillStyle(false), flex: "0 0 auto", padding: "14px 20px" }}>Back</button>
        <button
          onClick={() => onDone({ conditions, injuries, allergies, dietPattern: pattern, healthNote: otherNote, otherCondition, otherInjury })}
          style={{ ...primaryBtn, flex: 1 }}
        >
          Finish setup
        </button>
      </div>
      </div>
    </div>
  );
}
