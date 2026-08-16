import { cardStyle, secondaryBtn } from "../../styles/theme";
import { Stat } from "../../components/Stat";

export function SettingsTab({ profile, setProfile }) {
  return (
    <div style={{ padding: "24px 20px" }}>
      <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 22, margin: "0 0 16px" }}>Your targets</p>
      <div style={cardStyle}>
        <Stat label="Daily calories" val={`${profile.calories} cal`} />
        <Stat label="Protein" val={`${profile.protein} g`} />
        <Stat label="Carbs" val={`${profile.carbs} g`} />
        <Stat label="Fat" val={`${profile.fat} g`} />
      </div>
      <button style={{ ...secondaryBtn, width: "100%", marginTop: 16 }} onClick={() => setProfile(null)}>Redo my targets</button>
    </div>
  );
}
