import { cardStyle } from "../../styles/theme";
import { WeekChart } from "../../components/WeekChart";
import { WeightTrend } from "../../components/WeightTrend";

export function TrendsTab({ dayHistory, profile, weightLog }) {
  return (
    <div style={{ padding: "24px 20px" }}>
      <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 22, margin: "0 0 16px" }}>This week</p>
      <div style={cardStyle}>
        <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, margin: "0 0 14px", color: "#fff" }}>Calories per day</p>
        <WeekChart dayHistory={dayHistory} calGoal={profile.calories} />
      </div>
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, margin: "0 0 14px", color: "#fff" }}>Weight over time</p>
        <WeightTrend weightLog={weightLog} goalWeight={profile.goalWeight} />
      </div>
    </div>
  );
}
