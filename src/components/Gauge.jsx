import { useId } from "react";
import { lerpColor } from "../lib/nutrition";
import { polarToXY, describeArc } from "../lib/svg";

/* Gauge sweeps from -120deg to +120deg (240 degree arc) */
export function Gauge({ label, color, used, goal, unit, size = 150, onClick, expanded, showMotivation, dateStr, timeStr, mini, noCard }) {
  const gaugeId = useId();
  const rawPct = Math.min(1, used / (goal || 1));
  // faster-rising fill: eased so it ramps up quicker at lower values
  const pct = Math.min(1, Math.pow(rawPct, 0.7) * 1.15);
  const motivColor = lerpColor(rawPct);
  const over = used > goal;
  // once over goal, ramp the fill color from green towards red the further past goal we go, fully red by double the goal
  const overPct = over ? Math.min(1, (used - goal) / (goal || 1)) : 0;
  const overColor = over ? lerpColor(1 - overPct) : null;
  const startAngle = -120;
  const endAngle = 120;
  const needleAngle = startAngle + Math.min(1, pct) * (endAngle - startAngle);
  const r = size / 2 - 20;
  const cx = size / 2;
  const cy = size / 2;
  const needleTip = polarToXY(cx, cy, r - 6, needleAngle);
  const trackPath = describeArc(cx, cy, r, startAngle, endAngle);
  const fillPath = describeArc(cx, cy, r, startAngle, needleAngle);
  const strokeW = expanded ? 52 : size < 130 ? 28 : 40;
  const fillColor = over ? overColor : color;
  const outerBorderPath = describeArc(cx, cy, r + strokeW / 2, startAngle, endAngle);
  const innerBorderPath = describeArc(cx, cy, r - strokeW / 2, startAngle, endAngle);
  const endCapStartPath = `M ${polarToXY(cx, cy, r - strokeW / 2, startAngle).x} ${polarToXY(cx, cy, r - strokeW / 2, startAngle).y} L ${polarToXY(cx, cy, r + strokeW / 2, startAngle).x} ${polarToXY(cx, cy, r + strokeW / 2, startAngle).y}`;
  const endCapEndPath = `M ${polarToXY(cx, cy, r - strokeW / 2, endAngle).x} ${polarToXY(cx, cy, r - strokeW / 2, endAngle).y} L ${polarToXY(cx, cy, r + strokeW / 2, endAngle).x} ${polarToXY(cx, cy, r + strokeW / 2, endAngle).y}`;
  const motivRadius = r - strokeW / 2 - (expanded ? 40 : 22);
  const motivSpan = expanded ? 55 : 40;
  const motivPath = describeArc(cx, cy, motivRadius, -motivSpan, motivSpan);

  const rawStep = goal > 800 ? 250 : goal > 150 ? 50 : 20;
  // keep tick count sane (aim for ~6-9 ticks) no matter what the goal value is
  let step = rawStep;
  let tickCount = Math.max(1, Math.round(goal / step));
  while (tickCount > 9) {
    step *= 2;
    tickCount = Math.max(1, Math.round(goal / step));
  }
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const value = i * step;
    const tPct = Math.min(1, value / (goal || 1));
    const angle = startAngle + tPct * (endAngle - startAngle);
    const innerTick = polarToXY(cx, cy, r - strokeW / 2, angle);
    const outerTick = polarToXY(cx, cy, r + strokeW / 2, angle);
    const labelPos = polarToXY(cx, cy, r + strokeW / 2 + (expanded ? 32 : 26), angle);
    return { value, innerTick, outerTick, labelPos };
  });

  const cardStyle = noCard
    ? { display: "flex", flexDirection: "column", alignItems: "center", cursor: onClick ? "pointer" : "default", width: "100%", maxWidth: size }
    : {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: onClick ? "pointer" : "default",
        width: "100%",
        maxWidth: size,
        background: "radial-gradient(circle at 50% 35%, #1a1a1a 0%, #000000 70%)",
        borderRadius: 20,
        padding: "14px 6px 10px",
        boxShadow: "0 4px 18px rgba(0,0,0,0.55), inset 0 0 30px rgba(255,122,0,0.06)",
        border: "1px solid #2a2a2a",
      };

  return (
    <div
      onClick={onClick}
      style={cardStyle}
    >
      <svg width={size} height={size * 0.88} viewBox={`0 -18 ${size} ${size + 18}`} overflow="visible" style={{ width: "100%", maxWidth: size, height: "auto", filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.55)) drop-shadow(0 3px 5px rgba(0,0,0,0.4))" }}>
        <path d={outerBorderPath} fill="none" stroke={fillColor} strokeWidth={2.5} strokeLinecap="butt" strokeOpacity={0.9} />
        <path d={innerBorderPath} fill="none" stroke={fillColor} strokeWidth={2.5} strokeLinecap="butt" strokeOpacity={0.9} />
        <path d={endCapStartPath} fill="none" stroke={fillColor} strokeWidth={2.5} strokeOpacity={0.9} />
        <path d={endCapEndPath} fill="none" stroke={fillColor} strokeWidth={2.5} strokeOpacity={0.9} />
        <path d={trackPath} fill="none" stroke="#C0C4C9" strokeWidth={strokeW} strokeLinecap="butt" strokeOpacity={0.55} />
        <path
          d={fillPath}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeW}
          strokeLinecap="butt"
          style={{ filter: `drop-shadow(0 0 10px ${fillColor}) drop-shadow(0 0 18px ${fillColor}66)` }}
        />
        {!mini && ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.innerTick.x}
              y1={t.innerTick.y}
              x2={t.outerTick.x}
              y2={t.outerTick.y}
              stroke="#FFFFFF"
              strokeOpacity={0.9}
              strokeWidth={2}
            />
            <text
              x={t.labelPos.x}
              y={t.labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={expanded ? 20 : 14}
              fontWeight={900}
              fontFamily="Quicksand, sans-serif"
              fill="#FFFFFF"
            >
              {t.value}
            </text>
          </g>
        ))}
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="#000000" strokeWidth={6.5} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke={fillColor} strokeWidth={4} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${fillColor})` }} />
        <circle cx={cx} cy={cy} r={8} fill="#000000" />
        <circle cx={cx} cy={cy} r={7} fill={fillColor} style={{ filter: `drop-shadow(0 0 6px ${fillColor})` }} />
        <circle cx={cx} cy={cy} r={3} fill="#FFFFFF" />
        {expanded && showMotivation && (
          <text
            x={cx}
            y={cy - 46 - 62}
            textAnchor="middle"
            fontFamily="Quicksand, sans-serif"
            fontWeight={700}
            fontSize={20}
            fill="#e0e0e0"
          >
            Calories consumed
          </text>
        )}
        <text
          x={cx}
          y={cy - (expanded ? 46 : mini ? 8 : 26)}
          textAnchor="middle"
          fontFamily="Quicksand, sans-serif"
          fontWeight={800}
          fontSize={expanded ? 88 : mini ? 22 : 56}
          fill={over ? "#FF3B30" : "#FFFFFF"}
        >
          {used}
        </text>

        {!mini && (
          <>
            <defs>
              <path id={`motivArc-${gaugeId}`} d={motivPath} fill="none" />
            </defs>
            <text
              fontSize={expanded ? 34 : 22}
              fontWeight={900}
              fontFamily="Quicksand, sans-serif"
              fill="#FFFFFF"
              letterSpacing={1.5}
            >
              <textPath href={`#motivArc-${gaugeId}`} startOffset="50%" textAnchor="middle">
                {label.toUpperCase()}
              </textPath>
            </text>
          </>
        )}
      </svg>
      {expanded && showMotivation && (
        <div style={{ textAlign: "center", margin: "8px 0 2px" }}>
          <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 20, color: "#e0e0e0", margin: 0 }}>Goal calories</p>
          <p style={{ fontFamily: "Quicksand", fontWeight: 800, fontSize: 34, color: "#FFFFFF", margin: "2px 0 0" }}>{goal}{unit}</p>
        </div>
      )}
      {expanded && !showMotivation && (
        <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 34, color: "#e0e0e0", margin: "6px 0 2px", textAlign: "center" }}>/ {goal}{unit}</p>
      )}
      {!mini && !expanded && (
        <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 15, color: "#e0e0e0", margin: "2px 0 0", textAlign: "center" }}>/ {goal}{unit}</p>
      )}
      {dateStr && (
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <p style={{ fontFamily: "Quicksand", fontWeight: 800, fontSize: expanded ? 30 : 13, color: "#FF7A00", margin: 0 }}>{dateStr}</p>
          <p style={{ fontFamily: "Quicksand", fontWeight: 800, fontSize: expanded ? 26 : 12, color: "#FF7A00", margin: "4px 0 0" }}>{timeStr}</p>
        </div>
      )}
    </div>
  );
}
