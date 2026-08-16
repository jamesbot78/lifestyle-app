import { useState, useEffect, useRef, useCallback, useId } from "react";
import { Camera, Utensils, ShoppingBasket, ListChecks, Settings, Plus, X, Loader2, Trash2, ChefHat, Check, TrendingUp, Dumbbell, Pencil, AlertTriangle, ChevronDown, ChevronUp, CalendarRange, Timer, Play, Pause, RotateCcw, Volume2 } from "lucide-react";

/* ---------- design tokens ----------
bg #F1F4ED | surface #FFFFFF | ink #24352A | ink-soft #5B6B5C
protein #C97A2B | carbs #4A7A8C | fat #8B4A6B | gold #E3A038 | success #5B8C5A
border #DDE4D6
display font: Quicksand | body font: Atkinson Hyperlegible
------------------------------------- */

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Quicksand:wght@500;600;700&display=swap";

function formatTime(timeValue) {
  if (!timeValue) return "";
  const [h, m] = timeValue.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

const MOTIVATIONAL_QUOTES = [
  "Small steps every day add up to big change.",
  "You don't have to be perfect, just consistent.",
  "Progress, not perfection.",
  "Every meal logged is a step toward knowing yourself better.",
  "Strong today, stronger tomorrow.",
  "Discipline is choosing what you want most over what you want now.",
  "One good habit beats ten good intentions.",
  "Your only competition is who you were yesterday.",
  "Showing up is half the battle.",
  "Fuel your body like you respect it.",
  "Consistency beats intensity.",
  "Rest is part of the plan, not a break from it.",
  "You're building something that lasts.",
  "Today's effort is tomorrow's strength.",
  "Keep going, you're doing better than you think.",
  "Focus on the next right choice, not the whole journey.",
  "Every gauge you fill is proof you showed up.",
  "Momentum starts with one small win.",
  "Take care of your body, it's the only place you have to live.",
  "Trust the process.",
];

function getDailyQuote() {
  const d = new Date();
  const dayNum = Math.floor(d.getTime() / 86400000);
  return MOTIVATIONAL_QUOTES[dayNum % MOTIVATIONAL_QUOTES.length];
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fileToResizedBase64(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToThumbDataUrl(file, maxDim = 120, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function askClaude({ text, imageBase64, maxTokens = 1000 }) {
  const content = [];
  if (imageBase64) {
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } });
  }
  content.push({ type: "text", text });

  const response = await fetch("/api/ask-claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, maxTokens }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Server error reaching AI");
  }
  const textOut = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const cleaned = textOut.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

function getMealWarnings(meal, profile) {
  if (!profile) return [];
  const warnings = [];
  const allergies = profile.allergies || [];
  const mealAllergens = meal.allergens || [];
  const allergenLabels = { peanuts: "peanuts", tree_nuts: "tree nuts", shellfish: "shellfish", fish: "fish", eggs: "eggs", soy: "soy", wheat: "wheat", dairy: "dairy" };
  mealAllergens.forEach((a) => {
    if (allergies.includes(a)) warnings.push(`Contains ${allergenLabels[a] || a} — you flagged this as an allergy`);
  });

  const pattern = profile.dietPattern;
  if (pattern === "vegan") {
    if (meal.containsMeat) warnings.push("Contains meat — not vegan");
    if (meal.containsFish) warnings.push("Contains fish — not vegan");
    if (meal.containsEggs) warnings.push("Contains eggs — not vegan");
    if (meal.containsDairy) warnings.push("Contains dairy — not vegan");
  } else if (pattern === "vegetarian") {
    if (meal.containsMeat) warnings.push("Contains meat — not vegetarian");
    if (meal.containsFish) warnings.push("Contains fish — not vegetarian");
  }

  const conditions = profile.conditions || [];
  if (conditions.includes("diabetes") && (meal.sugar || 0) > 20) {
    warnings.push("High in sugar — worth watching with diabetes");
  }
  if ((conditions.includes("heart_bp") || conditions.includes("kidney") || conditions.includes("cholesterol")) && (meal.sodium || 0) > 700) {
    warnings.push("High in sodium");
  }
  if (conditions.includes("celiac") && mealAllergens.includes("wheat")) {
    warnings.push("Contains gluten — flagged for celiac / gluten sensitivity");
  }
  if (conditions.includes("lactose") && mealAllergens.includes("dairy")) {
    warnings.push("Contains dairy — flagged for lactose intolerance");
  }
  return warnings;
}

function getExerciseWarning(exerciseName, profile) {
  if (!profile) return null;
  const rawInjuries = profile.injuries || [];
  if (!rawInjuries.length) return null;
  // ease off the warning for injuries recorded more than a year ago, since they're likely healed by then
  const injuries = rawInjuries
    .filter((i) => {
      if (!i.date) return true;
      const monthsAgo = (Date.now() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo < 12;
    })
    .map((i) => i.key);
  if (!injuries.length) return null;
  const n = (exerciseName || "").toLowerCase();
  const isLegMove = /leg|squat|calf|lunge|quad|hamstring|deadlift/.test(n);
  const isKneeMove = /leg|squat|lunge|quad|calf/.test(n);
  const isHipMove = /squat|lunge|hip|deadlift/.test(n);
  const isShoulderMove = /shoulder|delt|overhead|military|bench|press|pulldown|pull.?up/.test(n);
  const isBackMove = /row|deadlift|back|pull.?up|good.?morning/.test(n);
  const isWristElbowMove = /curl|bicep|tricep|dip|press|bench/.test(n);
  const isAnkleMove = /calf|lunge|jump|run/.test(n);

  const checks = [
    { keys: ["knee_replacement", "acl", "meniscus", "general_joint"], test: isKneeMove, label: "your knee" },
    { keys: ["hip_replacement", "hip_impingement"], test: isHipMove, label: "your hip" },
    { keys: ["shoulder_replacement", "rotator_cuff", "frozen_shoulder"], test: isShoulderMove, label: "your shoulder" },
    { keys: ["back_surgery", "herniated_disc", "sciatica", "neck_injury"], test: isBackMove, label: "your back" },
    { keys: ["wrist_injury", "tendonitis"], test: isWristElbowMove, label: "your wrist or elbow" },
    { keys: ["ankle_sprain", "plantar_fasciitis"], test: isAnkleMove, label: "your ankle or foot" },
    { keys: ["broken_bone"], test: isLegMove || isShoulderMove, label: "your healing bone" },
    { keys: ["hernia_surgery"], test: /crunch|core|plank|sit.?up|deadlift|squat/.test(n), label: "your hernia recovery" },
  ];

  for (const c of checks) {
    if (c.test && injuries.some((i) => c.keys.includes(i))) {
      return `This may stress ${c.label} — you flagged a related injury or surgery. Check with your doctor or go easy.`;
    }
  }
  return null;
}

function calcTargets(p) {
  const w = Number(p.weight), h = Number(p.height), a = Number(p.age);
  let bmr = p.sex === "female" ? 10 * w + 6.25 * h - 5 * a - 161 : 10 * w + 6.25 * h - 5 * a + 5;
  const actMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  let tdee = bmr * (actMap[p.activity] || 1.375);
  const deficitMap = { relaxed: 250, steady: 500, aggressive: 750 };
  const target = Math.round(tdee - (deficitMap[p.pace] || 500));
  const protein = Math.round(w * 2.0);
  const fat = Math.round((target * 0.27) / 9);
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));
  const sodium = 2000;
  const waterCups = p.sex === "female" ? 9 : 13;
  return { calories: target, protein, carbs, fat, sodium, waterCups };
}

function computeAdaptiveTargets(profile, weightLog) {
  // Looks at the last 14 days of weigh-ins vs. the expected weekly change implied by
  // the calorie target, and nudges calories up or down to keep progress on track.
  if (!profile || !weightLog || weightLog.length < 4) return null;
  const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-14);
  if (recent.length < 4) return null;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const daysSpan = Math.max(1, (new Date(last.date) - new Date(first.date)) / 86400000);
  const actualWeeklyChangeKg = ((last.weight - first.weight) / daysSpan) * 7;

  const deficitMap = { relaxed: 250, steady: 500, aggressive: 750 };
  const dailyDeficit = deficitMap[profile.pace] || 500;
  // losing weight is negative, ~7700 kcal per kg of fat
  const expectedWeeklyChangeKg = -(dailyDeficit * 7) / 7700;

  const diff = actualWeeklyChangeKg - expectedWeeklyChangeKg; // positive = losing slower than expected
  // Only adjust if the gap is meaningfully off track (more than ~0.15kg/week drift)
  if (Math.abs(diff) < 0.15) return null;

  const kcalAdjust = Math.round((diff * 7700) / 7);
  const clampedAdjust = Math.max(-150, Math.min(150, kcalAdjust));
  const newCalories = Math.max(1200, profile.calories - clampedAdjust);
  if (Math.abs(newCalories - profile.calories) < 30) return null;

  return {
    newCalories,
    delta: newCalories - profile.calories,
    actualWeeklyChangeKg: Math.round(actualWeeklyChangeKg * 100) / 100,
    expectedWeeklyChangeKg: Math.round(expectedWeeklyChangeKg * 100) / 100,
  };
}

function lerpColor(pct) {
  const stops = [
    { p: 0, c: [255, 59, 48] },
    { p: 0.5, c: [255, 149, 0] },
    { p: 1, c: [76, 217, 100] },
  ];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (pct >= stops[i].p && pct <= stops[i + 1].p) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b.p - a.p || 1;
  const t = (pct - a.p) / span;
  const rC = Math.round(a.c[0] + (b.c[0] - a.c[0]) * t);
  const gC = Math.round(a.c[1] + (b.c[1] - a.c[1]) * t);
  const bC = Math.round(a.c[2] + (b.c[2] - a.c[2]) * t);
  return `rgb(${rC}, ${gC}, ${bC})`;
}

function polarToXY(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToXY(cx, cy, r, startAngle);
  const end = polarToXY(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/* Gauge sweeps from -120deg to +120deg (240 degree arc) */
function Gauge({ label, color, used, goal, unit, size = 150, onClick, expanded, showMotivation, dateStr, timeStr, mini, noCard }) {
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
    ? { display: "flex", flexDirection: "column", alignItems: "center", cursor: onClick ? "pointer" : "default", width: size }
    : {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: onClick ? "pointer" : "default",
        width: size,
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
      <svg width={size} height={size * 0.88} viewBox={`0 -18 ${size} ${size + 18}`} overflow="visible" style={{ filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.55)) drop-shadow(0 3px 5px rgba(0,0,0,0.4))" }}>
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

function GaugeGrid({ calGoal, calUsed, protein, protGoal, carbs, carbGoal, fat, fatGoal, sodium, sodiumGoal, showSodium }) {
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
          width: 360,
          background: "radial-gradient(circle at 50% 35%, #3a3a3a 0%, #222222 70%)",
          borderRadius: 20,
          padding: "14px 6px 16px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.65), 0 10px 20px rgba(0,0,0,0.55), inset 0 0 30px rgba(255,122,0,0.06), inset 0 14px 26px rgba(0,0,0,0.75)",
          border: "1px solid #2a2a2a",
        }}
      >
        <Gauge {...featured} size={360} onClick={() => setExpandedKey(featured.key)} showMotivation={isFeaturedCal} dateStr={isFeaturedCal ? dateStr : null} timeStr={isFeaturedCal ? timeStr : null} noCard />
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 20, padding: "0 10px" }}>
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



function WeightBar({ startWeight, currentWeight, goalWeight }) {
  const totalToLose = startWeight - goalWeight;
  const lostSoFar = startWeight - currentWeight;
  const pct = totalToLose > 0 ? Math.max(0, Math.min(100, Math.round((lostSoFar / totalToLose) * 100))) : 0;
  const remaining = Math.round(Math.max(0, currentWeight - goalWeight) * 10) / 10;
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Goal progress</span>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>
          {currentWeight}kg<span style={{ color: "#c4c4c4", fontWeight: 400 }}> / {goalWeight}kg goal</span>
        </span>
      </div>
      <div style={{ height: 16, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#FF7A00", boxShadow: "0 0 10px rgba(255,122,0,0.6)", borderRadius: 999, transition: "width 0.6s ease" }} />
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 14, color: "#c4c4c4" }}>
        {remaining > 0 ? `${remaining}kg to go` : "Goal reached!"}
      </p>
    </div>
  );
}

function WeekChart({ dayHistory, calGoal }) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = d.toLocaleDateString([], { weekday: "short" }).slice(0, 3);
    const cal = dayHistory[key]?.cal ?? 0;
    days.push({ key, label, cal });
  }
  const maxVal = Math.max(calGoal, ...days.map((d) => d.cal), 1);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 160 }}>
      {days.map((d) => {
        const pct = Math.min(100, Math.round((d.cal / maxVal) * 100));
        const over = d.cal > calGoal;
        return (
          <div key={d.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 34 }}>
            <div style={{ height: 110, width: 20, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
              <div style={{ width: "100%", height: `${pct}%`, background: over ? "#FF3B30" : "#FF7A00", boxShadow: over ? "0 0 8px rgba(255,59,48,0.6)" : "0 0 8px rgba(255,122,0,0.6)", borderRadius: 999, transition: "height 0.6s ease" }} />
            </div>
            <span style={{ fontSize: 11, color: "#c4c4c4", marginTop: 6 }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function WeightTrend({ weightLog, goalWeight }) {
  if (!weightLog || weightLog.length === 0) {
    return <p style={{ color: "#c4c4c4", fontSize: 14, margin: 0 }}>Log your weight to see progress here.</p>;
  }
  const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const weights = recent.map((w) => w.weight).concat([goalWeight]);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = Math.max(maxW - minW, 1);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 160 }}>
      {recent.map((w) => {
        const pct = Math.round(((w.weight - minW) / range) * 100);
        return (
          <div key={w.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 34 }}>
            <span style={{ fontSize: 11, fontFamily: "Quicksand", fontWeight: 700, color: "#fff", marginBottom: 6 }}>{w.weight}</span>
            <div style={{ height: 90, width: 20, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
              <div style={{ width: "100%", height: `${Math.max(6, pct)}%`, background: "#FF7A00", boxShadow: "0 0 8px rgba(255,122,0,0.6)", borderRadius: 999, transition: "height 0.6s ease" }} />
            </div>
            <span style={{ fontSize: 11, color: "#c4c4c4", marginTop: 6 }}>{w.date.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

function DateTimeHeader() {
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

function WeighInInput({ onLog, currentWeight }) {
  const [val, setVal] = useState("");
  const submit = () => {
    if (!val) return;
    onLog(val);
    setVal("");
  };
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      <input
        type="number"
        inputMode="decimal"
        placeholder={`Today's weight, e.g. ${currentWeight}`}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
      />
      <button onClick={submit} style={{ ...secondaryBtn, padding: "0 18px" }}>Log</button>
    </div>
  );
}

function WaterTracker({ cups, goalCups }) {
  const pct = Math.min(1, (cups || 0) / (goalCups || 1));
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Fluids</span>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>
          {cups}<span style={{ color: "#c4c4c4", fontWeight: 400 }}> / {goalCups} cups</span>
        </span>
      </div>
      <div style={{ height: 16, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: "#4A9CD6", boxShadow: "0 0 10px rgba(74,156,214,0.6)", borderRadius: 999, transition: "width 0.4s ease" }} />
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>Logged automatically from your meal and drink photos.</p>
    </div>
  );
}

const MICRO_GOALS = {
  fiber: { label: "Fiber", goal: 30, unit: "g" },
  iron: { label: "Iron", goal: 18, unit: "mg" },
  vitaminC: { label: "Vitamin C", goal: 90, unit: "mg" },
  calcium: { label: "Calcium", goal: 1000, unit: "mg" },
  potassium: { label: "Potassium", goal: 3500, unit: "mg" },
};

function guessMuscleGroupStandalone(name) {
  const n = (name || "").toLowerCase();
  if (/calf|calve/.test(n)) return "Calves";
  if (/quad|leg press|leg extension|squat|lunge|front squat/.test(n)) return "Quads";
  if (/hamstring|leg curl|deadlift|rdl|romanian/.test(n)) return "Hamstrings";
  if (/glute|hip thrust|kickback/.test(n)) return "Glutes";
  if (/bench|chest|press.*chest|pec|fly|dip(?!.*tricep)/.test(n)) return "Chest";
  if (/lat|pulldown|pull.?up|row/.test(n)) return "Lats";
  if (/lower back|back extension|good morning/.test(n)) return "Lower back";
  if (/upper back|shrug|trap|face pull|rear delt/.test(n)) return "Upper back";
  if (/shoulder press|overhead|military|delt|arnold/.test(n)) return "Shoulders";
  if (/bicep|curl(?!.*leg)/.test(n)) return "Biceps";
  if (/tricep|skullcrusher|pushdown|dip/.test(n)) return "Triceps";
  if (/forearm|wrist|grip/.test(n)) return "Forearms";
  if (/oblique|side bend|russian twist|woodchop/.test(n)) return "Obliques";
  if (/ab|core|plank|crunch|sit.?up/.test(n)) return "Abs";
  return "Other";
}

function MuscleMapView({ workoutLog, workoutHistory, sex, exerciseLibrary, onQuickAdd, onSnapNew, busy }) {
  const [view, setView] = useState("front"); // 'front' | 'back'
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const isFemale = sex === "female";

  // tally volume (sets) per muscle over the last 7 days, including today
  const volumeByMuscle = {};
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const allEntries = [
    ...(workoutLog || []),
    ...Object.values(workoutHistory || {}).flat(),
  ];
  allEntries.forEach((e) => {
    if (!e || !e.exerciseName) return;
    const ts = e.id || 0;
    if (ts && ts < cutoff) return;
    const muscle = e.muscleGroup || guessMuscleGroupStandalone(e.exerciseName);
    volumeByMuscle[muscle] = (volumeByMuscle[muscle] || 0) + (e.sets || 1);
  });
  const maxVol = Math.max(1, ...Object.values(volumeByMuscle));

  const colorFor = (muscle) => {
    const v = volumeByMuscle[muscle] || 0;
    if (v === 0) return "#7a7a7a";
    const t = Math.min(1, v / maxVol);
    const from = [140, 95, 50]; // lighter orange-brown, matches brightened body
    const to = [255, 122, 0]; // brand orange
    const rC = Math.round(from[0] + (to[0] - from[0]) * t);
    const gC = Math.round(from[1] + (to[1] - from[1]) * t);
    const bC = Math.round(from[2] + (to[2] - from[2]) * t);
    return `rgb(${rC}, ${gC}, ${bC})`;
  };

  // silhouette: soft body outline drawn behind the zones, sized a few px
  // larger on every edge so it peeks out past the muscle shapes
  const SILHOUETTE = (
    <g fill="#4d4d4d" opacity={0.5}>
      <circle cx="150" cy="30" r="20" />
      <path d="M138,46 L162,46 L160,60 L140,60 Z" />
      <path d="M92,54 Q150,44 208,54 L200,150 Q150,160 100,150 Z" />
      <rect x="82" y="60" width="34" height="104" rx="15" />
      <rect x="184" y="60" width="34" height="104" rx="15" />
      <rect x="98" y="140" width="104" height="52" rx="20" />
      <rect x="108" y="146" width="42" height="172" rx="18" />
      <rect x="150" y="146" width="42" height="172" rx="18" />
    </g>
  );

  // zone definitions: muscle name -> SVG path/shape per view.
  // Arms hang alongside the torso (not outstretched) so every edge below
  // lines up with its neighbor by exact coordinate, not by eye.
  const frontZones = [
    { muscle: "Shoulders", d: "M94,60 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 M182,60 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0" },
    { muscle: "Chest", d: "M120,58 Q150,50 180,58 Q184,81 177,104 Q150,98 123,104 Q116,81 120,58 Z" },
    { muscle: "Biceps", d: "M96,66 L122,66 Q126,90 118,114 L92,114 Q84,90 96,66 Z M204,66 L178,66 Q174,90 182,114 L208,114 Q216,90 204,66 Z" },
    { muscle: "Forearms", d: "M92,114 L118,114 Q120,137 114,160 L88,160 Q82,137 92,114 Z M208,114 L182,114 Q180,137 186,160 L212,160 Q218,137 208,114 Z" },
    { muscle: "Abs", d: "M130,104 L170,104 Q172,125 166,146 L134,146 Q128,125 130,104 Z" },
    { muscle: "Obliques", d: "M123,104 L130,104 L126,146 L119,146 Q116,125 123,104 Z M177,104 L170,104 L174,146 L181,146 Q184,125 177,104 Z" },
    { muscle: "Quads", d: "M120,150 L146,150 Q150,188 142,226 L116,226 Q108,188 120,150 Z M180,150 L154,150 Q150,188 158,226 L184,226 Q192,188 180,150 Z" },
    { muscle: "Calves", d: "M118,226 L142,226 Q146,253 138,280 L114,280 Q106,253 118,226 Z M182,226 L158,226 Q154,253 162,280 L186,280 Q194,253 182,226 Z" },
  ];
  const backZones = [
    { muscle: "Shoulders", d: "M94,60 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 M182,60 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0" },
    { muscle: "Upper back", d: "M120,58 Q150,50 180,58 Q184,74 178,90 Q150,96 122,90 Q116,74 120,58 Z" },
    { muscle: "Lats", d: "M118,90 L142,90 Q146,110 138,130 L114,130 Q108,110 118,90 Z M182,90 L158,90 Q154,110 162,130 L186,130 Q192,110 182,90 Z" },
    { muscle: "Triceps", d: "M96,66 L122,66 Q126,90 118,114 L92,114 Q84,90 96,66 Z M204,66 L178,66 Q174,90 182,114 L208,114 Q216,90 204,66 Z" },
    { muscle: "Forearms", d: "M92,114 L118,114 Q120,137 114,160 L88,160 Q82,137 92,114 Z M208,114 L182,114 Q180,137 186,160 L212,160 Q218,137 208,114 Z" },
    { muscle: "Lower back", d: "M126,130 L174,130 Q178,146 170,162 L130,162 Q122,146 126,130 Z" },
    { muscle: "Glutes", d: "M112,162 L188,162 Q194,179 184,196 L116,196 Q106,179 112,162 Z" },
    { muscle: "Hamstrings", d: "M120,196 L146,196 Q150,227 142,258 L116,258 Q108,227 120,196 Z M180,196 L154,196 Q150,227 158,258 L184,258 Q192,227 180,196 Z" },
    { muscle: "Calves", d: "M118,258 L142,258 Q146,284 138,310 L114,310 Q106,284 118,258 Z M182,258 L158,258 Q154,284 162,310 L186,310 Q194,284 182,258 Z" },
  ];
  const zones = view === "front" ? frontZones : backZones;

  const MUSCLE_INFO = {
    "Shoulders": { desc: "Deltoids \u2014 cap the shoulder joint and lift/rotate the arm.", suggest: ["Overhead press", "Lateral raise", "Arnold press"] },
    "Chest": { desc: "Pectorals \u2014 push muscles across the front of the chest.", suggest: ["Bench press", "Push ups", "Chest fly"] },
    "Biceps": { desc: "Front of the upper arm \u2014 bends the elbow.", suggest: ["Bicep curl", "Hammer curl", "Chin ups"] },
    "Triceps": { desc: "Back of the upper arm \u2014 straightens the elbow.", suggest: ["Tricep pushdown", "Skullcrusher", "Dips"] },
    "Forearms": { desc: "Controls grip strength and wrist movement.", suggest: ["Wrist curl", "Farmer's carry", "Dead hang"] },
    "Abs": { desc: "Rectus abdominis \u2014 flexes the spine, front core.", suggest: ["Crunch", "Plank", "Leg raise"] },
    "Obliques": { desc: "Sides of the core \u2014 twisting and side-bending.", suggest: ["Russian twist", "Side plank", "Woodchop"] },
    "Quads": { desc: "Front of the thigh \u2014 straightens the knee.", suggest: ["Squat", "Leg press", "Lunge"] },
    "Hamstrings": { desc: "Back of the thigh \u2014 bends the knee, extends the hip.", suggest: ["Romanian deadlift", "Leg curl", "Good morning"] },
    "Glutes": { desc: "Buttocks \u2014 drives hip extension and power.", suggest: ["Hip thrust", "Squat", "Glute kickback"] },
    "Calves": { desc: "Back of the lower leg \u2014 points the foot/toe.", suggest: ["Calf raise", "Jump rope", "Seated calf raise"] },
    "Lats": { desc: "Latissimus dorsi \u2014 wide back muscles, pulling motion.", suggest: ["Pulldown", "Pull ups", "Lat row"] },
    "Upper back": { desc: "Traps and rhomboids \u2014 shoulder blade control.", suggest: ["Shrug", "Face pull", "Rear delt fly"] },
    "Lower back": { desc: "Erector spinae \u2014 supports and extends the spine.", suggest: ["Back extension", "Good morning", "Deadlift"] },
  };

  const muscleExercises = (exerciseLibrary || []).filter((ex) => {
    const g = ex.muscleGroup || guessMuscleGroupStandalone(ex.name);
    return g === selectedMuscle;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setView("front")}
          style={{ fontSize: 14, padding: "8px 16px", borderRadius: 999, border: view === "front" ? "1.5px solid #FF7A00" : "1.5px solid rgba(255,255,255,0.25)", background: view === "front" ? "rgba(255,122,0,0.15)" : "#1a1a1a", color: view === "front" ? "#FF7A00" : "#e0e0e0", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer" }}
        >
          Front
        </button>
        <button
          onClick={() => setView("back")}
          style={{ fontSize: 14, padding: "8px 16px", borderRadius: 999, border: view === "back" ? "1.5px solid #FF7A00" : "1.5px solid rgba(255,255,255,0.25)", background: view === "back" ? "rgba(255,122,0,0.15)" : "#1a1a1a", color: view === "back" ? "#FF7A00" : "#e0e0e0", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer" }}
        >
          Back
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width="100%" height="auto" style={{ maxWidth: 260, display: "block" }} viewBox="0 0 300 320" preserveAspectRatio="xMidYMid meet">
          {SILHOUETTE}
          {zones.map((z, i) => (
            <path
              key={i}
              d={z.d}
              fill={colorFor(z.muscle)}
              opacity={selectedMuscle && selectedMuscle !== z.muscle ? 0.4 : 0.9}
              stroke={selectedMuscle === z.muscle ? "#FF7A00" : "none"}
              strokeWidth={1.5}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedMuscle(selectedMuscle === z.muscle ? null : z.muscle)}
            />
          ))}
        </svg>
      </div>

      <div style={{ marginTop: 20 }}>
        {Object.keys(volumeByMuscle).length === 0 && (
          <p style={{ textAlign: "center", color: "#e0e0e0", fontSize: 14, fontWeight: 600 }}>No workouts logged in the last 7 days yet.</p>
        )}
        {[...new Set(zones.map((z) => z.muscle))].map((muscle) => (
          <div
            key={muscle}
            onClick={() => setSelectedMuscle(selectedMuscle === muscle ? null : muscle)}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, cursor: "pointer", padding: "4px 6px", borderRadius: 8, background: selectedMuscle === muscle ? "rgba(255,122,0,0.1)" : "transparent" }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 4, background: colorFor(muscle), flexShrink: 0 }} />
            <span style={{ fontSize: 15, color: "#fff", fontWeight: 700, flex: 1 }}>{muscle}</span>
            <span style={{ fontSize: 14, color: "#eee", fontWeight: 600 }}>{volumeByMuscle[muscle] || 0} sets</span>
          </div>
        ))}
      </div>

      {selectedMuscle && (
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <p style={{ margin: 0, fontFamily: "Quicksand", fontWeight: 700, fontSize: 18, color: "#fff" }}>{selectedMuscle}</p>
            <button onClick={() => setSelectedMuscle(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={20} color="#c4c4c4" />
            </button>
          </div>
          {MUSCLE_INFO[selectedMuscle]?.desc && (
            <p style={{ margin: "6px 0 14px", fontSize: 15, color: "#fff", fontWeight: 500, lineHeight: 1.5 }}>{MUSCLE_INFO[selectedMuscle].desc}</p>
          )}

          {muscleExercises.length > 0 ? (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#FF7A00" }}>Your saved exercises</p>
              {muscleExercises.map((ex) => (
                <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  {ex.photo ? (
                    <img src={ex.photo} alt={ex.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1.5px solid #FF7A00" }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 10, background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Dumbbell size={20} color="#666" />
                    </div>
                  )}
                  <span style={{ flex: 1, fontSize: 16, color: "#fff", fontFamily: "Quicksand", fontWeight: 700 }}>{ex.name}</span>
                  <button
                    onClick={() => onQuickAdd && onQuickAdd(ex)}
                    style={{ fontSize: 13, padding: "6px 12px", borderRadius: 999, border: "1.5px solid rgba(52,199,89,0.5)", background: "rgba(52,199,89,0.12)", color: "#34C759", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer" }}
                  >
                    Log a set
                  </button>
                </div>
              ))}
            </>
          ) : (
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "#e0e0e0", fontWeight: 600 }}>No saved exercises for this muscle yet.</p>
          )}

          {MUSCLE_INFO[selectedMuscle]?.suggest?.length > 0 && (
            <>
              <p style={{ margin: "14px 0 6px", fontSize: 13, fontWeight: 700, color: "#FF7A00" }}>Ideas to try</p>
              <p style={{ margin: 0, fontSize: 15, color: "#fff", fontWeight: 500, lineHeight: 1.6 }}>{MUSCLE_INFO[selectedMuscle].suggest.join(", ")}</p>
            </>
          )}

          {onSnapNew && (
            <button
              onClick={onSnapNew}
              disabled={busy === "workout"}
              style={{ ...primaryBtn, marginTop: 16, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: busy === "workout" ? 0.6 : 1 }}
            >
              <Camera size={18} /> {busy === "workout" ? "Reading photo..." : "Snap this exercise"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function RestTimer() {
  const [workSec, setWorkSec] = useState(60);
  const [restSec, setRestSec] = useState(30);
  const [phase, setPhase] = useState("idle"); // 'idle' | 'work' | 'rest'
  const [secLeft, setSecLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const audioCtxRef = useRef(null);

  const beep = useCallback((freq = 880, duration = 150) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch (e) { /* audio not available */ }
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecLeft((s) => {
        if (s <= 1) {
          let nextPhase;
          setPhase((p) => {
            nextPhase = p === "work" ? "rest" : "work";
            return nextPhase;
          });
          beep(nextPhase === "work" ? 1050 : 700, 200);
          return nextPhase === "work" ? workSec : restSec;
        }
        if (s <= 4) beep(600, 80);
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, workSec, restSec, beep]);

  const start = () => {
    if (phase === "idle") {
      setPhase("work");
      setSecLeft(workSec);
      beep(1050, 200);
    }
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setPhase("idle");
    setSecLeft(workSec);
  };

  const minutes = Math.floor(secLeft / 60);
  const seconds = secLeft % 60;
  const label = phase === "idle" ? "Ready" : phase === "work" ? "Work" : "Rest";
  const color = phase === "rest" ? "#FFD60A" : "#34C759";

  return (
    <div style={{ ...cardStyle, marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Timer size={20} color="#FF7A00" />
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Interval Training Timer</span>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color, letterSpacing: 1 }}>{label.toUpperCase()}</p>
        <p style={{ margin: "4px 0 0", fontFamily: "Quicksand", fontWeight: 700, fontSize: 48, color: "#fff" }}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, color: "#c4c4c4" }}>Work (seconds)</label>
          <input
            type="number"
            min={5}
            max={600}
            value={workSec}
            disabled={running}
            onChange={(e) => {
              const v = Math.max(5, parseInt(e.target.value) || 5);
              setWorkSec(v);
              if (phase === "idle") setSecLeft(v);
            }}
            style={{ width: "100%", marginTop: 4, fontSize: 16, padding: "8px 10px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", background: "#1a1a1a", color: "#fff", fontFamily: "Atkinson Hyperlegible" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, color: "#c4c4c4" }}>Rest (seconds)</label>
          <input
            type="number"
            min={5}
            max={600}
            value={restSec}
            disabled={running}
            onChange={(e) => setRestSec(Math.max(5, parseInt(e.target.value) || 5))}
            style={{ width: "100%", marginTop: 4, fontSize: 16, padding: "8px 10px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", background: "#1a1a1a", color: "#fff", fontFamily: "Atkinson Hyperlegible" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {!running ? (
          <button onClick={start} style={{ ...primaryBtn, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Play size={18} /> {phase === "idle" ? "Start" : "Resume"}
          </button>
        ) : (
          <button onClick={pause} style={{ ...primaryBtn, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Pause size={18} /> Pause
          </button>
        )}
        <button onClick={reset} style={{ ...secondaryBtn, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px" }}>
          <RotateCcw size={18} /> Reset
        </button>
      </div>
    </div>
  );
}

function RecipesCard({ recipes, open, onToggle, onLog, onDelete, importText, setImportText, importOpen, setImportOpen, onImport, busy, pantry }) {
  const [expandedId, setExpandedId] = useState(null);
  return (
    <div style={{ ...cardStyle, marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={onToggle}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>My recipes{recipes.length ? ` (${recipes.length})` : ""}</span>
        {open ? <ChevronUp size={20} color="#c4c4c4" /> : <ChevronDown size={20} color="#c4c4c4" />}
      </div>
      {open && (
        <div style={{ marginTop: 14 }}>
          {recipes.length === 0 && (
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink-soft)" }}>Save a logged meal as a recipe, or import one below, to see it here.</p>
          )}
          {recipes.map((r) => (
            <div key={r.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, cursor: (r.ingredients?.length || r.steps?.length) ? "pointer" : "default" }} onClick={() => (r.ingredients?.length || r.steps?.length) && setExpandedId(expandedId === r.id ? null : r.id)}>
                  <p style={{ margin: 0, fontFamily: "Quicksand", fontWeight: 700, fontSize: 15, color: "#fff" }}>{r.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "#c4c4c4" }}>{r.calories} cal \u00b7 P{r.protein}g \u00b7 C{r.carbs}g \u00b7 F{r.fat}g</p>
                </div>
                <button
                  onClick={() => onLog(r)}
                  style={{ fontSize: 13, padding: "6px 10px", borderRadius: 999, border: "1.5px solid rgba(52,199,89,0.5)", background: "rgba(52,199,89,0.12)", color: "#34C759", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer" }}
                >
                  Log it
                </button>
                <button
                  onClick={() => onDelete(r.id)}
                  style={{ ...iconBtn, background: "rgba(255,59,48,0.15)", borderRadius: 999 }}
                  aria-label={`Delete recipe ${r.name}`}
                >
                  <Trash2 size={16} color="#FF3B30" />
                </button>
              </div>
              {expandedId === r.id && (
                <div style={{ marginTop: 10, paddingLeft: 4 }}>
                  {r.ingredients?.length > 0 && (
                    <>
                      <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#FF7A00" }}>Ingredients</p>
                      <ColorLegendBanner />
                      {r.ingredients.map((ing, i) => {
                        const lower = ing.toLowerCase();
                        const haveIt = (pantry || []).some((p) => lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower.replace(/^[\d.\/]+\s*(g|kg|ml|l|cup|cups|tsp|tbsp|oz|lb|slice|slices|clove|cloves)?\s*/i, "").trim()));
                        return <p key={i} style={{ margin: "0 0 2px", fontSize: 14, color: haveIt ? "#34C759" : "#FF6B5E" }}>\u2022 {ing}</p>;
                      })}
                    </>
                  )}
                  {r.steps?.length > 0 && (
                    <>
                      <p style={{ margin: "10px 0 4px", fontSize: 13, fontWeight: 700, color: "#FF7A00" }}>Method</p>
                      {r.steps.map((s, i) => (
                        <p key={i} style={{ margin: "0 0 4px", fontSize: 14, color: "#eeeeee", lineHeight: 1.4 }}>{i + 1}. {s}</p>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setImportOpen(!importOpen)}
              style={{ fontSize: 14, padding: "8px 12px", borderRadius: 10, border: "1.5px solid rgba(255,122,0,0.4)", background: "rgba(255,122,0,0.08)", color: "#FF7A00", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer" }}
            >
              {importOpen ? "Cancel import" : "Add recipe from text or link"}
            </button>
            {importOpen && (
              <div style={{ marginTop: 10 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "#c4c4c4", lineHeight: 1.5 }}>
                  Paste a recipe link, or the caption/ingredient text copied from Instagram or a website. It'll pull out the ingredient list with quantities, the method steps, and an estimated calorie and macro breakdown.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste a recipe link, or paste the caption/ingredient text from Instagram or a website"
                  style={{ width: "100%", minHeight: 90, fontSize: 15, padding: 10, borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", background: "#1a1a1a", color: "#fff", fontFamily: "Atkinson Hyperlegible", resize: "vertical" }}
                />
                <button
                  onClick={onImport}
                  disabled={busy === "import" || !importText.trim()}
                  style={{ ...primaryBtn, marginTop: 8, width: "100%", opacity: busy === "import" || !importText.trim() ? 0.6 : 1 }}
                >
                  {busy === "import" ? "Reading recipe..." : "Import recipe"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MicronutrientCard({ totals, open, onToggle }) {
  return (
    <div style={{ ...cardStyle, marginTop: 12, cursor: "pointer" }} onClick={onToggle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Micronutrients</span>
        {open ? <ChevronUp size={20} color="#c4c4c4" /> : <ChevronDown size={20} color="#c4c4c4" />}
      </div>
      {open && (
        <div style={{ marginTop: 14 }} onClick={(e) => e.stopPropagation()}>
          {Object.entries(MICRO_GOALS).map(([key, cfg]) => {
            const value = Math.round((totals[key] || 0) * 10) / 10;
            const pct = Math.min(1, value / cfg.goal);
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: "#e0e0e0" }}>{cfg.label}</span>
                  <span style={{ fontSize: 13, color: "#c4c4c4" }}>{value}{cfg.unit} / {cfg.goal}{cfg.unit}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct * 100}%`, background: lerpColor(pct), borderRadius: 999, transition: "width 0.4s ease" }} />
                </div>
              </div>
            );
          })}
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>Estimated from your meal photos \u2014 rough guide only, not a substitute for lab testing.</p>
        </div>
      )}
    </div>
  );
}

function FastingTimer({ lastMealAt, fastGoalHours = 16 }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!lastMealAt) {
    return (
      <div style={{ ...cardStyle, marginTop: 12 }}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Fasting timer</span>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ink-soft)" }}>Log a meal to start tracking your fasting window.</p>
      </div>
    );
  }

  const hoursSince = (now - lastMealAt) / 3600000;
  const pct = Math.min(1, hoursSince / fastGoalHours);
  const isFasting = hoursSince >= 1;
  const hrs = Math.floor(hoursSince);
  const mins = Math.round((hoursSince - hrs) * 60);

  return (
    <div style={{ ...cardStyle, marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>Fasting timer</span>
        <span style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>
          {hrs}h {mins}m<span style={{ color: "#c4c4c4", fontWeight: 400 }}> / {fastGoalHours}h goal</span>
        </span>
      </div>
      <div style={{ height: 16, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: lerpColor(pct), borderRadius: 999, transition: "width 0.4s ease" }} />
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>
        {hoursSince >= fastGoalHours ? "Fasting goal reached \u2014 nice work." : `Since your last logged meal or drink.`}
      </p>
    </div>
  );
}

function Onboarding({ onDone }) {
  const [f, setF] = useState({ weight: "98.9", goalWeight: "70", height: "1.73", age: "48", sex: "male", activity: "moderate", pace: "aggressive" });
  const [weightUnit, setWeightUnit] = useState("kg");
  const [heightUnit, setHeightUnit] = useState("m");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [readingSupport, setReadingSupport] = useState(null); // null | true | false
  const [voiceName, setVoiceName] = useState("");
  const [availableVoices, setAvailableVoices] = useState([]);
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en")));
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const weightKg = f.weight ? (weightUnit === "kg" ? Number(f.weight) : Number(f.weight) * 0.453592) : "";
  const goalWeightKg = f.goalWeight ? (weightUnit === "kg" ? Number(f.goalWeight) : Number(f.goalWeight) * 0.453592) : "";
  let heightCm = "";
  if (heightUnit === "cm") heightCm = f.height ? Number(f.height) : "";
  else if (heightUnit === "m") heightCm = f.height ? Number(f.height) * 100 : "";
  else if (heightUnit === "ft") heightCm = (heightFt || heightIn) ? (Number(heightFt || 0) * 30.48 + Number(heightIn || 0) * 2.54) : "";

  const canSubmit = f.weight && f.goalWeight && f.age && (heightUnit === "ft" ? (heightFt || heightIn) : f.height);

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
      <h1 style={{ fontFamily: "Quicksand", fontSize: 26, margin: "12px 0 4px", color: "#fff" }}>Let's set your targets</h1>
      <p style={{ color: "#d5d5d5", marginBottom: 20 }}>A few numbers so I can work out your daily calories and macros.</p>

      <label style={labelStyle}>Would reading support help you</label>
      <p style={{ color: "#c4c4c4", fontSize: 13, marginTop: -2, marginBottom: 10 }}>Adds a "read aloud" button to sections with more text, so you can hear them read out with each word highlighted. Totally optional, off by default.</p>
      <div style={{ display: "flex", gap: 10, marginBottom: readingSupport ? 16 : 24 }}>
        {[[true, "Yes, turn it on"], [false, "No thanks"]].map(([v, l]) => (
          <button key={String(v)} onClick={() => setReadingSupport(v)} style={{ ...pillStyle(readingSupport === v), flex: "1 1 auto", textAlign: "center" }}>{l}</button>
        ))}
      </div>

      {readingSupport && availableVoices.length > 0 && (
        <>
          <label style={labelStyle}>Choose a voice</label>
          <select
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            style={{ ...inputStyle, marginBottom: 12 }}
          >
            <option value="">Default voice</option>
            {availableVoices.map((v) => (
              <option key={v.name} value={v.name}>{v.name}</option>
            ))}
          </select>
          <ReadAloudButton text="This is a sample of how this voice sounds." label="Preview voice" voiceName={voiceName} />
          <div style={{ marginBottom: 12 }} />
        </>
      )}

      <label style={labelStyle}>Weight unit</label>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[["kg", "Kilograms"], ["lb", "Pounds"]].map(([v, l]) => (
          <button key={v} onClick={() => setWeightUnit(v)} style={pillStyle(weightUnit === v)}>{l}</button>
        ))}
      </div>

      <label style={labelStyle}>Weight ({weightUnit})</label>
      <input style={inputStyle} type="number" inputMode="decimal" value={f.weight} onChange={set("weight")} placeholder={weightUnit === "kg" ? "e.g. 85" : "e.g. 187"} />

      <label style={labelStyle}>Goal weight ({weightUnit})</label>
      <input style={inputStyle} type="number" inputMode="decimal" value={f.goalWeight} onChange={set("goalWeight")} placeholder={weightUnit === "kg" ? "e.g. 75" : "e.g. 165"} />

      <label style={labelStyle}>Height unit</label>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[["m", "Meters"], ["cm", "Centimeters"], ["ft", "Feet and inches"]].map(([v, l]) => (
          <button key={v} onClick={() => setHeightUnit(v)} style={pillStyle(heightUnit === v)}>{l}</button>
        ))}
      </div>

      {heightUnit === "ft" ? (
        <>
          <label style={labelStyle}>Height (feet and inches)</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} type="number" inputMode="numeric" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="feet e.g. 5" />
            <input style={{ ...inputStyle, flex: 1 }} type="number" inputMode="numeric" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="inches e.g. 10" />
          </div>
        </>
      ) : (
        <>
          <label style={labelStyle}>Height ({heightUnit})</label>
          <input style={inputStyle} type="number" inputMode="decimal" value={f.height} onChange={set("height")} placeholder={heightUnit === "m" ? "e.g. 1.78" : "e.g. 178"} />
        </>
      )}

      <label style={labelStyle}>Age</label>
      <input style={inputStyle} type="number" inputMode="numeric" value={f.age} onChange={set("age")} placeholder="e.g. 30" />

      <label style={labelStyle}>Sex</label>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {["male", "female"].map((v) => (
          <button key={v} onClick={() => setF({ ...f, sex: v })} style={pillStyle(f.sex === v)}>{v}</button>
        ))}
      </div>

      <label style={labelStyle}>Activity level</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {[["sedentary", "Desk job (1,000\u20135,000 steps/day)"], ["moderate", "Moderate (5,000\u201310,000 steps/day)"], ["active", "Very active (10,000\u201330,000 steps/day)"]].map(([v, l]) => (
          <button key={v} onClick={() => setF({ ...f, activity: v })} style={pillStyle(f.activity === v)}>{l}</button>
        ))}
      </div>

      <label style={labelStyle}>How fast do you want to lose weight?</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
        {[["relaxed", "Gradual (~0.25kg/week)"], ["steady", "Standard (~0.5kg/week)"], ["aggressive", "High impact (~0.75kg/week)"]].map(([v, l]) => (
          <button key={v} onClick={() => setF({ ...f, pace: v })} style={{ ...pillStyle(f.pace === v), flex: "1 1 auto", textAlign: "center" }}>{l}</button>
        ))}
      </div>

      <button
        disabled={!canSubmit}
        onClick={() => {
          const metricProfile = { ...f, weight: weightKg, goalWeight: goalWeightKg, height: heightCm };
          onDone({
            ...metricProfile,
            startWeight: Number(weightKg),
            goalWeight: Number(goalWeightKg),
            weightUnit,
            heightUnit,
            readingSupport: !!readingSupport,
            voiceName: voiceName || "",
            ...calcTargets(metricProfile),
          });
        }}
        style={{ ...primaryBtn, opacity: canSubmit ? 1 : 0.5, width: "100%" }}
      >
        Continue
      </button>
      </div>
    </div>
  );
}

function ColorLegendBanner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ flex: 1, fontSize: 13, color: "#e0e0e0", lineHeight: 1.5 }}>
        <span style={{ color: "#34C759", fontWeight: 700 }}>Green</span> means you already have it.{" "}
        <span style={{ color: "#FF6B5E", fontWeight: 700 }}>Red</span> means you need to buy it.
      </div>
    </div>
  );
}

function ReadAloudButton({ text, label, voiceName }) {
  const [speaking, setSpeaking] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const words = (text || "").split(/\s+/).filter(Boolean);
  const fallbackTimer = useRef(null);
  const boundaryFired = useRef(false);

  const stop = () => {
    window.speechSynthesis?.cancel();
    if (fallbackTimer.current) { clearInterval(fallbackTimer.current); fallbackTimer.current = null; }
    setSpeaking(false);
    setHighlightIdx(-1);
  };

  const speak = () => {
    if (!window.speechSynthesis) return;
    if (speaking) { stop(); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    if (voiceName) {
      const match = window.speechSynthesis.getVoices().find((v) => v.name === voiceName);
      if (match) utter.voice = match;
    }
    boundaryFired.current = false;
    utter.onboundary = (e) => {
      boundaryFired.current = true;
      const charIndex = e.charIndex || 0;
      const upTo = text.slice(0, charIndex);
      const idx = upTo.split(/\s+/).filter(Boolean).length;
      setHighlightIdx(idx);
    };
    utter.onstart = () => {
      // Fallback for browsers (notably iOS Safari) that don't reliably fire onboundary:
      // step through words on an estimated timer based on speech rate, so the
      // highlight still moves even without real word-boundary events.
      setTimeout(() => {
        if (boundaryFired.current) return;
        const wordsPerMinute = 150 * utter.rate;
        const msPerWord = Math.max(150, 60000 / wordsPerMinute);
        let i = 0;
        fallbackTimer.current = setInterval(() => {
          if (i >= words.length) { clearInterval(fallbackTimer.current); return; }
          setHighlightIdx(i);
          i++;
        }, msPerWord);
      }, 300);
    };
    utter.onend = () => { stop(); };
    utter.onerror = () => { stop(); };
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={speak}
        style={{
          display: "flex", alignItems: "center", gap: 8, background: speaking ? "rgba(255,122,0,0.18)" : "rgba(255,255,255,0.06)",
          border: speaking ? "1.5px solid #FF7A00" : "1.5px solid rgba(255,255,255,0.15)",
          borderRadius: 999, padding: "6px 14px", cursor: "pointer", color: speaking ? "#FF7A00" : "#e0e0e0",
          fontFamily: "Atkinson Hyperlegible", fontWeight: 700, fontSize: 13,
        }}
      >
        <Volume2 size={16} /> {speaking ? "Stop" : (label || "Read aloud")}
      </button>
      {speaking && (
        <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: "#e0e0e0" }}>
          {words.map((w, i) => (
            <span key={i} style={i === highlightIdx ? { background: "#FF7A00", color: "#000", borderRadius: 4, padding: "0 2px" } : {}}>
              {w}{" "}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function HealthOnboarding({ onDone, onBack, readingSupport, voiceName }) {
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

const labelStyle = { display: "block", fontFamily: "Quicksand", fontWeight: 600, fontSize: 14, color: "#eeeeee", marginBottom: 6, marginTop: 4 };
const inputStyle = { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.2)", fontSize: 16, fontFamily: "Atkinson Hyperlegible", marginBottom: 14, background: "#1a1a1a", color: "#fff" };
const primaryBtn = { background: "#FF7A00", color: "#fff", border: "none", borderRadius: 16, padding: "14px 20px", fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 10px 18px rgba(255,122,0,0.35)" };
const pillStyle = (active) => ({
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

export default function App() {
  const [profile, setProfile] = useState(null);
  const [log, setLog] = useState([]);
  const [pantry, setPantry] = useState([]);
  const [shopping, setShopping] = useState([]);
  const [weightLog, setWeightLog] = useState([]);
  const [dayHistory, setDayHistory] = useState({});
  const [workoutLog, setWorkoutLog] = useState([]);
  const [workoutHistory, setWorkoutHistory] = useState({});
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [tab, setTab] = useState("today");
  const [busy, setBusy] = useState(null); // 'meal' | 'pantry' | 'suggest' | 'workout'
  const [suggestion, setSuggestion] = useState(null);
  const [dayPlan, setDayPlan] = useState(null);
  const [adaptiveSuggestion, setAdaptiveSuggestion] = useState(null);
  const [microOpen, setMicroOpen] = useState(false);
  const [recipesOpen, setRecipesOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [pendingExercise, setPendingExercise] = useState(null);
  const mealInputRef = useRef(null);
  const pantryInputRef = useRef(null);
  const fridgeInputRef = useRef(null);
  const workoutInputRef = useRef(null);

  useEffect(() => {
    try {
      const p = localStorage.getItem("profile");
      const pa = localStorage.getItem("pantry");
      const sh = localStorage.getItem("shopping");
      const lg = localStorage.getItem(`log:${todayKey()}`);
      const wl = localStorage.getItem("weightLog");
      const dh = localStorage.getItem("dayHistory");
      const wo = localStorage.getItem(`workout:${todayKey()}`);
      const woh = localStorage.getItem("workoutHistory");
      const el = localStorage.getItem("exerciseLibrary");
      const rc = localStorage.getItem("recipes");
      if (p) setProfile(JSON.parse(p));
      if (pa) setPantry(JSON.parse(pa));
      if (sh) setShopping(JSON.parse(sh));
      if (lg) setLog(JSON.parse(lg));
      if (wl) setWeightLog(JSON.parse(wl));
      if (dh) setDayHistory(JSON.parse(dh));
      if (wo) setWorkoutLog(JSON.parse(wo));
      if (woh) setWorkoutHistory(JSON.parse(woh));
      if (el) setExerciseLibrary(JSON.parse(el));
      if (rc) setRecipes(JSON.parse(rc));
    } catch (e) { /* first run, nothing stored yet */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !profile || !weightLog || weightLog.length < 4) return;
    let lastCheck = null;
    try { lastCheck = localStorage.getItem("adaptiveLastCheck"); } catch (e) {}
    const daysSinceCheck = lastCheck ? (Date.now() - Number(lastCheck)) / 86400000 : Infinity;
    if (daysSinceCheck < 7) return;
    const result = computeAdaptiveTargets(profile, weightLog);
    if (result) setAdaptiveSuggestion(result);
    try { localStorage.setItem("adaptiveLastCheck", String(Date.now())); } catch (e) {}
  }, [loaded, profile, weightLog]);

  const persist = useCallback((key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error(e); }
  }, []);

  const saveProfile = (p) => { setProfile(p); persist("profile", p); };
  const [pendingProfile, setPendingProfile] = useState(null);
  const saveLog = (l) => {
    setLog(l);
    persist(`log:${todayKey()}`, l);
    const dayTotals = l.reduce((a, m) => ({
      cal: a.cal + m.calories, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat,
      sodium: a.sodium + (m.sodium || 0), fluidCups: a.fluidCups + (m.fluidCups || 0),
      fiber: a.fiber + (m.fiber || 0), iron: a.iron + (m.iron || 0), vitaminC: a.vitaminC + (m.vitaminC || 0),
      calcium: a.calcium + (m.calcium || 0), potassium: a.potassium + (m.potassium || 0),
    }), { cal: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fluidCups: 0, fiber: 0, iron: 0, vitaminC: 0, calcium: 0, potassium: 0 });
    const updatedHistory = { ...dayHistory, [todayKey()]: dayTotals };
    setDayHistory(updatedHistory);
    persist("dayHistory", updatedHistory);
  };
  const updateMealType = (id, mealType) => saveLog(log.map((m) => (m.id === id ? { ...m, mealType } : m)));
  const updateMealTime = (id, timeValue) => saveLog(log.map((m) => (m.id === id ? { ...m, timeValue } : m)));
  const updateMealRating = (id, rating) => saveLog(log.map((m) => (m.id === id ? { ...m, rating: m.rating === rating ? null : rating } : m)));
  const savePantry = (p) => { setPantry(p); persist("pantry", p); };
  const saveShopping = (s) => { setShopping(s); persist("shopping", s); };
  const saveWeightLog = (w) => { setWeightLog(w); persist("weightLog", w); };
  const logWeighIn = (kg) => {
    const entry = { id: Date.now(), date: todayKey(), weight: Number(kg) };
    const withoutToday = weightLog.filter((w) => w.date !== todayKey());
    const updated = [...withoutToday, entry].sort((a, b) => a.date.localeCompare(b.date));
    saveWeightLog(updated);
    saveProfile({ ...profile, weight: Number(kg) });
  };

  const saveWorkoutLog = (w) => {
    setWorkoutLog(w);
    persist(`workout:${todayKey()}`, w);
    const dayTotal = w.reduce((a, x) => a + (x.caloriesBurned || 0), 0);
    const updatedHistory = { ...workoutHistory, [todayKey()]: { entries: w, caloriesBurned: dayTotal } };
    setWorkoutHistory(updatedHistory);
    persist("workoutHistory", updatedHistory);
  };

  function estimateCaloriesBurned(exerciseName, weightKg, reps, sets, bodyWeightKg) {
    // rough MET-based estimate for resistance training w/ rest between sets
    const met = 5.0;
    const secondsPerRep = 3.5;
    const restSecondsPerSet = 60;
    const activeMinutes = (reps * sets * secondsPerRep) / 60;
    const restMinutes = ((sets - 1) * restSecondsPerSet) / 60;
    const totalMinutes = activeMinutes + restMinutes * 0.5; // resting still burns something
    const kcal = met * 3.5 * (bodyWeightKg || 75) / 200 * totalMinutes;
    return Math.max(5, Math.round(kcal));
  }

  const saveExerciseLibrary = (lib) => { setExerciseLibrary(lib); persist("exerciseLibrary", lib); };

  const saveRecipes = (r) => { setRecipes(r); persist("recipes", r); };

  const saveMealAsRecipe = (meal) => {
    const exists = recipes.some((r) => r.name.toLowerCase() === meal.name.toLowerCase());
    if (exists) return;
    const { id, timeValue, mealType, rating, ...nutrition } = meal;
    const recipe = { id: Date.now() + Math.random(), ...nutrition };
    saveRecipes([...recipes, recipe]);
  };

  const logRecipe = (recipe) => {
    const now = new Date();
    const hour = now.getHours();
    const defaultType = hour < 11 ? "Breakfast" : hour < 16 ? "Lunch" : "Dinner";
    const timeValue = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const { id, ...nutrition } = recipe;
    const entry = { id: Date.now(), timeValue, mealType: defaultType, rating: null, ...nutrition };
    saveLog([...log, entry]);
  };

  const deleteRecipe = (id) => saveRecipes(recipes.filter((r) => r.id !== id));

  const [importText, setImportText] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  async function handleImportRecipe() {
    if (!importText.trim()) return;
    setBusy("import");
    setError(null);
    try {
      const prompt = `Here is a recipe, either as a link or as text/caption copied from a website or social media post:\n\n"""${importText.trim()}"""\n\nRead it and return ONLY strict JSON, no markdown, in this shape:\n{"name": "recipe name", "ingredients": ["2 eggs", "2 tsp sugar", "1 cup flour"], "steps": ["step 1", "step 2"], "calories": number, "protein": number, "carbs": number, "fat": number}\nEstimate calories/protein/carbs/fat per serving as best you can from the ingredients. If it's a link you can't fetch, use your general knowledge of that kind of recipe if the name/description gives enough to go on, otherwise make a reasonable best-guess estimate and note assumptions are approximate.`;
      const result = await askClaude({ text: prompt, maxTokens: 1200 });
      const recipe = {
        id: Date.now() + Math.random(),
        name: result.name || "Imported recipe",
        ingredients: result.ingredients || [],
        steps: result.steps || [],
        calories: Math.round(result.calories || 0),
        protein: Math.round(result.protein || 0),
        carbs: Math.round(result.carbs || 0),
        fat: Math.round(result.fat || 0),
      };
      saveRecipes([...recipes, recipe]);
      setImportText("");
      setImportOpen(false);
    } catch (e) {
      setError("Couldn't read that recipe. Try pasting more of the text, like the full caption or ingredient list.");
    } finally {
      setBusy(null);
    }
  }

  function guessMuscleGroup(name) {
    const n = name.toLowerCase();
    if (/calf|calve/.test(n)) return "Calves";
    if (/quad|leg press|leg extension|squat|lunge|front squat/.test(n)) return "Quads";
    if (/hamstring|leg curl|deadlift|rdl|romanian/.test(n)) return "Hamstrings";
    if (/glute|hip thrust|kickback/.test(n)) return "Glutes";
    if (/bench|chest|press.*chest|pec|fly|dip(?!.*tricep)/.test(n)) return "Chest";
    if (/lat|pulldown|pull.?up|row/.test(n)) return "Lats";
    if (/lower back|back extension|good morning/.test(n)) return "Lower back";
    if (/upper back|shrug|trap|face pull|rear delt/.test(n)) return "Upper back";
    if (/shoulder press|overhead|military|delt|arnold/.test(n)) return "Shoulders";
    if (/bicep|curl(?!.*leg)/.test(n)) return "Biceps";
    if (/tricep|skullcrusher|pushdown|dip/.test(n)) return "Triceps";
    if (/forearm|wrist|grip/.test(n)) return "Forearms";
    if (/oblique|side bend|russian twist|woodchop/.test(n)) return "Obliques";
    if (/ab|core|plank|crunch|sit.?up/.test(n)) return "Abs";
    if (/leg|squat|calf|lunge|quad|hamstring/.test(n)) return "Quads";
    if (/back|pull.?up/.test(n)) return "Lats";
    if (/curl|bicep|tricep|arm/.test(n)) return "Biceps";
    return "Other";
  }

  const addWorkoutSet = (setData) => {
    const entry = {
      id: Date.now(),
      timeValue: `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`,
      ...setData,
      caloriesBurned: estimateCaloriesBurned(setData.exerciseName, setData.weight, setData.reps, setData.sets, profile?.weight),
    };
    saveWorkoutLog([...workoutLog, entry]);

    const existing = exerciseLibrary.find((x) => x.name.toLowerCase() === setData.exerciseName.toLowerCase());
    if (existing) {
      const updatedLib = exerciseLibrary.map((x) => x.id === existing.id ? { ...x, lastUsed: todayKey() } : x);
      saveExerciseLibrary(updatedLib);
    } else {
      const newExercise = {
        id: Date.now() + Math.random(),
        name: setData.exerciseName,
        muscleGroup: guessMuscleGroup(setData.exerciseName),
        photo: entry.photo || null,
        lastUsed: todayKey(),
      };
      saveExerciseLibrary([...exerciseLibrary, newExercise]);
    }
  };

  const deleteWorkoutEntry = (id) => saveWorkoutLog(workoutLog.filter((w) => w.id !== id));

  const quickAddFromLibrary = (exercise) => {
    setPendingExercise({ exerciseName: exercise.name, photo: exercise.photo, fromLibrary: true });
  };

  async function handleWorkoutPhoto(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy("workout"); setError(null);
    try {
      const [b64, thumb] = await Promise.all([
        fileToResizedBase64(file),
        fileToThumbDataUrl(file),
      ]);
      const result = await askClaude({
        imageBase64: b64,
        text: "Look at this photo of gym equipment or a workout machine. Identify what exercise/machine it is. Respond with ONLY raw JSON, no markdown: {\"exerciseName\": string (short common name, e.g. \"Leg Press\", \"Bench Press\", \"Lat Pulldown\")}",
      });
      setPendingExercise({ exerciseName: result.exerciseName || "Exercise", photo: thumb });
    } catch (err) {
      setError("Couldn't read that photo — try again with better lighting.");
      setPendingExercise({ exerciseName: "Exercise", photo: null });
    }
    setBusy(null);
  }

  const workoutCaloriesToday = workoutLog.reduce((a, w) => a + (w.caloriesBurned || 0), 0);

  const muscleNudge = (() => {
    const groups = ["Legs", "Chest", "Back", "Shoulders", "Arms", "Core"];
    if (exerciseLibrary.length === 0) return null;
    const today = new Date();
    const daysSince = (dateKey) => {
      if (!dateKey) return 999;
      const then = new Date(dateKey);
      return Math.round((today - then) / (1000 * 60 * 60 * 24));
    };
    const lastHitByGroup = {};
    exerciseLibrary.forEach((ex) => {
      const d = daysSince(ex.lastUsed);
      if (lastHitByGroup[ex.muscleGroup] === undefined || d < lastHitByGroup[ex.muscleGroup]) {
        lastHitByGroup[ex.muscleGroup] = d;
      }
    });
    const trained = groups.filter((g) => lastHitByGroup[g] !== undefined);
    if (trained.length === 0) return null;
    const stalest = trained.reduce((worst, g) =>
      lastHitByGroup[g] > lastHitByGroup[worst] ? g : worst, trained[0]);
    const days = lastHitByGroup[stalest];
    if (days < 4) return null;
    const suggestions = exerciseLibrary.filter((ex) => ex.muscleGroup === stalest);
    const pick = suggestions[0]?.name;
    return {
      group: stalest,
      days,
      text: pick
        ? `Haven't hit ${stalest.toLowerCase()} in ${days} days — maybe ${pick}?`
        : `Haven't hit ${stalest.toLowerCase()} in ${days} days.`,
    };
  })();

  const totals = log.reduce((a, m) => ({
    cal: a.cal + m.calories, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat,
    sodium: a.sodium + (m.sodium || 0), fluidCups: a.fluidCups + (m.fluidCups || 0),
    fiber: a.fiber + (m.fiber || 0), iron: a.iron + (m.iron || 0), vitaminC: a.vitaminC + (m.vitaminC || 0),
    calcium: a.calcium + (m.calcium || 0), potassium: a.potassium + (m.potassium || 0),
  }), { cal: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, fluidCups: 0, fiber: 0, iron: 0, vitaminC: 0, calcium: 0, potassium: 0 });

  const lastMealAt = (() => {
    if (!log.length) return null;
    let latest = null;
    for (const m of log) {
      if (!m.timeValue) continue;
      const [h, mnt] = m.timeValue.split(":").map(Number);
      const d = new Date();
      d.setHours(h, mnt, 0, 0);
      if (!latest || d > latest) latest = d;
    }
    return latest;
  })();

  async function handleMealPhoto(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy("meal"); setError(null);
    try {
      const [b64, thumb] = await Promise.all([
        fileToResizedBase64(file),
        fileToThumbDataUrl(file),
      ]);
      const result = await askClaude({
        imageBase64: b64,
        text: "You are a nutrition estimator. Look at this photo of food or a drink and estimate it. If it is a drink, estimate fluid volume in cups (1 cup = 240ml) as fluidCups, and set isDrink to true. Also identify any of these allergens present: peanuts, tree_nuts, shellfish, fish, eggs, soy, wheat, dairy — return as an array of matching keys in allergens. Also estimate sugar in grams as sugar, and rough estimates for fiber (grams), iron (milligrams), vitaminC (milligrams), calcium (milligrams), and potassium (milligrams). Also set containsMeat, containsFish, containsEggs, containsDairy as booleans for dietary pattern checks. Respond with ONLY raw JSON, no markdown, no commentary, matching exactly: {\"name\": string (short meal or drink name), \"calories\": number, \"protein\": number (grams), \"carbs\": number (grams), \"fat\": number (grams), \"sodium\": number (milligrams), \"sugar\": number (grams), \"fiber\": number (grams), \"iron\": number (milligrams), \"vitaminC\": number (milligrams), \"calcium\": number (milligrams), \"potassium\": number (milligrams), \"isDrink\": boolean, \"fluidCups\": number, \"allergens\": array of strings, \"containsMeat\": boolean, \"containsFish\": boolean, \"containsEggs\": boolean, \"containsDairy\": boolean}",
      });
      const now = new Date();
      const hour = now.getHours();
      const defaultType = hour < 11 ? "Breakfast" : hour < 16 ? "Lunch" : "Dinner";
      const timeValue = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const entry = { id: Date.now(), timeValue, mealType: defaultType, photo: thumb, rating: null, ...result };
      saveLog([...log, entry]);
    } catch (err) {
      setError("Couldn't read that photo — try again with better lighting.");
    }
    setBusy(null);
  }

  async function handlePantryPhoto(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy("pantry"); setError(null);
    try {
      const b64 = await fileToResizedBase64(file);
      const result = await askClaude({
        imageBase64: b64,
        text: "Look at this photo of a fridge, pantry, or cupboard. List the distinct food items you can identify. Respond with ONLY raw JSON, no markdown: {\"items\": [{\"name\": string, \"category\": string (one of protein, carb, veg, fruit, dairy, other)}]}",
      });
      const existingNames = new Set(pantry.map((p) => p.name.toLowerCase()));
      const fresh = (result.items || []).filter((i) => !existingNames.has(i.name.toLowerCase()));
      savePantry([...pantry, ...fresh.map((i) => ({ ...i, id: Date.now() + Math.random() }))]);
    } catch (err) {
      setError("Couldn't read that photo — try again with better lighting.");
    }
    setBusy(null);
  }

  const ingredientColor = (ingredientLine, missingList) => {
    const lower = ingredientLine.toLowerCase();
    const isMissing = (missingList || []).some((m) => {
      const mLower = m.toLowerCase();
      return lower.includes(mLower) || mLower.includes(lower.replace(/^[\d.\/]+\s*(g|kg|ml|l|cup|cups|tsp|tbsp|oz|lb|slice|slices|clove|cloves)?\s*/i, "").trim());
    });
    return isMissing ? "#FF6B5E" : "#34C759";
  };

  async function handleSuggest() {
    setBusy("suggest"); setError(null); setSuggestion(null);
    try {
      const remaining = {
        calories: Math.max(0, profile.calories - totals.cal),
        protein: Math.max(0, profile.protein - totals.protein),
        carbs: Math.max(0, profile.carbs - totals.carbs),
        fat: Math.max(0, profile.fat - totals.fat),
        sodium: Math.max(0, (profile.sodium || 2000) - totals.sodium),
      };
      const loved = [...new Set(log.filter((m) => m.rating === "love").map((m) => m.name))];
      const liked = [...new Set(log.filter((m) => m.rating === "like").map((m) => m.name))];
      const disliked = [...new Set(log.filter((m) => m.rating === "bad").map((m) => m.name))];
      const preferenceLine = (loved.length || liked.length || disliked.length)
        ? ` Based on past meals I've rated: I loved ${loved.length ? loved.join(", ") : "none yet"}; I liked ${liked.length ? liked.join(", ") : "none yet"}; I disliked ${disliked.length ? disliked.join(", ") : "none yet"}. Favor meals similar in style or ingredients to the loved and liked ones, and avoid anything close to the disliked ones.`
        : "";
      const conditions = profile.conditions || [];
      const allergies = profile.allergies || [];
      const healthLine = (conditions.length || allergies.length || (profile.dietPattern && profile.dietPattern !== "none"))
        ? ` Important health constraints: my remaining sodium budget today is ${remaining.sodium}mg. ${allergies.length ? `I am allergic to or must avoid: ${allergies.join(", ")} — never suggest a meal containing these.` : ""} ${profile.dietPattern && profile.dietPattern !== "none" ? `My dietary pattern is ${profile.dietPattern} — only suggest meals that fit this.` : ""} ${conditions.includes("diabetes") ? "I am diabetic, so prefer lower-sugar options." : ""} ${conditions.includes("celiac") ? "I have celiac disease or gluten sensitivity, so avoid gluten." : ""} ${conditions.includes("lactose") ? "I am lactose intolerant, so avoid dairy." : ""}`
        : "";
      const result = await askClaude({
        text: `I need one meal suggestion to help hit my remaining daily targets: ${remaining.calories} calories, ${remaining.protein}g protein, ${remaining.carbs}g carbs, ${remaining.fat}g fat remaining today. My pantry/fridge currently has: ${pantry.length ? pantry.map((p) => p.name).join(", ") : "nothing logged yet"}. Suggest ONE realistic meal using mostly what I already have.${preferenceLine}${healthLine} Respond with ONLY raw JSON, no markdown: {"meal": string (name), "why": string (1 short sentence on how it fits my remaining macros), "ingredients": [string] (every ingredient needed for this exact meal WITH specific quantities so I know how much to actually make, e.g. "150g chicken breast", "1 cup cooked rice", "100g Greek yogurt" — quantities should be sized so the meal totals the stated calories), "uses": [string] (pantry items it uses), "missing": [string] (up to 4 ingredients I'd need to buy, empty array if none)}`,
      });
      let addedIds = [];
      if (result.missing && result.missing.length) {
        const existing = new Set(shopping.map((s) => s.name.toLowerCase()));
        const additions = result.missing.filter((m) => !existing.has(m.toLowerCase())).map((m) => ({ id: Date.now() + Math.random(), name: m, done: false }));
        if (additions.length) {
          saveShopping([...shopping, ...additions]);
          addedIds = additions.map((a) => a.id);
        }
      }
      setSuggestion({ ...result, addedShoppingIds: addedIds });
    } catch (err) {
      setError("Couldn't come up with a suggestion \u2014 give it another try.");
    }
    setBusy(null);
  }

  async function handlePlanDay() {
    setBusy("planday"); setError(null); setDayPlan(null);
    try {
      const remaining = {
        calories: Math.max(0, profile.calories - totals.cal),
        protein: Math.max(0, profile.protein - totals.protein),
        carbs: Math.max(0, profile.carbs - totals.carbs),
        fat: Math.max(0, profile.fat - totals.fat),
        sodium: Math.max(0, (profile.sodium || 2000) - totals.sodium),
      };
      const loved = [...new Set(log.filter((m) => m.rating === "love").map((m) => m.name))];
      const liked = [...new Set(log.filter((m) => m.rating === "like").map((m) => m.name))];
      const disliked = [...new Set(log.filter((m) => m.rating === "bad").map((m) => m.name))];
      const preferenceLine = (loved.length || liked.length || disliked.length)
        ? ` Based on past meals I've rated: I loved ${loved.length ? loved.join(", ") : "none yet"}; I liked ${liked.length ? liked.join(", ") : "none yet"}; I disliked ${disliked.length ? disliked.join(", ") : "none yet"}. Favor meals similar in style or ingredients to the loved and liked ones, and avoid anything close to the disliked ones.`
        : "";
      const conditions = profile.conditions || [];
      const allergies = profile.allergies || [];
      const healthLine = (conditions.length || allergies.length || (profile.dietPattern && profile.dietPattern !== "none"))
        ? ` Important health constraints: my remaining sodium budget today is ${remaining.sodium}mg. ${allergies.length ? `I am allergic to or must avoid: ${allergies.join(", ")} \u2014 never suggest a meal containing these.` : ""} ${profile.dietPattern && profile.dietPattern !== "none" ? `My dietary pattern is ${profile.dietPattern} \u2014 only suggest meals that fit this.` : ""} ${conditions.includes("diabetes") ? "I am diabetic, so prefer lower-sugar options." : ""} ${conditions.includes("celiac") ? "I have celiac disease or gluten sensitivity, so avoid gluten." : ""} ${conditions.includes("lactose") ? "I am lactose intolerant, so avoid dairy." : ""}`
        : "";
      const result = await askClaude({
        text: `I need a plan of meals to fill the REST of today, so that combined they roughly hit my remaining daily targets: ${remaining.calories} calories, ${remaining.protein}g protein, ${remaining.carbs}g carbs, ${remaining.fat}g fat remaining today. My pantry/fridge currently has: ${pantry.length ? pantry.map((p) => p.name).join(", ") : "nothing logged yet"}. Suggest 2 to 4 realistic remaining meals or snacks (fewer if it's late in the day) using mostly what I already have, that together add up close to my remaining targets without going over.${preferenceLine}${healthLine} Respond with ONLY raw JSON, no markdown: {"meals": [{"name": string, "why": string (1 short sentence), "calories": number, "ingredients": [string] (every ingredient needed for this exact meal WITH specific quantities, e.g. "2 eggs", "1 slice wholegrain toast", "1 banana" — sized so the meal totals the stated calories), "uses": [string], "missing": [string] (ingredients to buy, empty array if none)}]}`,
      });
      const meals = result.meals || [];
      let addedIds = [];
      const allMissing = [...new Set(meals.flatMap((m) => m.missing || []))];
      if (allMissing.length) {
        const existing = new Set(shopping.map((s) => s.name.toLowerCase()));
        const additions = allMissing.filter((m) => !existing.has(m.toLowerCase())).map((m) => ({ id: Date.now() + Math.random(), name: m, done: false }));
        if (additions.length) {
          saveShopping([...shopping, ...additions]);
          addedIds = additions.map((a) => a.id);
        }
      }
      setDayPlan({ meals, addedShoppingIds: addedIds });
    } catch (err) {
      setError("Couldn't plan the rest of your day \u2014 give it another try.");
    }
    setBusy(null);
  }

  if (!loaded) {
    return (
      <div className="app-shell" style={{ ...shellStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="spin" size={28} color="var(--success)" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="app-shell" style={shellStyle}>
        <GlobalStyle />
        <div style={{ position: "relative", zIndex: 1 }}>
          {!pendingProfile ? (
            <Onboarding onDone={setPendingProfile} />
          ) : (
            <HealthOnboarding
              onBack={() => setPendingProfile(null)}
              onDone={(health) => saveProfile({ ...pendingProfile, ...health })}
              readingSupport={pendingProfile.readingSupport}
              voiceName={pendingProfile.voiceName}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" style={shellStyle}>
      <GlobalStyle />
      <input ref={mealInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleMealPhoto} />
      <input ref={pantryInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePantryPhoto} />
      <input ref={fridgeInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePantryPhoto} />

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90, position: "relative", zIndex: 1 }}>
        {tab === "today" && (
          <div style={{ padding: "24px 20px" }}>
            <h1 style={{ margin: "0 0 16px", fontFamily: "Quicksand", fontWeight: 800, fontSize: 24, color: "#fff" }}>Today</h1>
            <div style={{
              margin: "0 0 16px", padding: "14px 16px", borderRadius: 14,
              background: "radial-gradient(circle at 50% 30%, #1a1a1a 0%, #000000 70%)",
              border: "1px solid #2a2a2a", boxShadow: "0 8px 18px rgba(0,0,0,0.5)",
            }}>
              <p style={{
                margin: 0, fontFamily: "Quicksand", fontWeight: 600, fontSize: 15,
                color: "#FFFFFF", textAlign: "center", fontStyle: "italic",
              }}>
                {getDailyQuote()}
              </p>
            </div>
            <div style={{ margin: "16px 0 24px" }}>
              <GaugeGrid
                calGoal={profile.calories} calUsed={totals.cal}
                protein={totals.protein} protGoal={profile.protein}
                carbs={totals.carbs} carbGoal={profile.carbs}
                fat={totals.fat} fatGoal={profile.fat}
                sodium={totals.sodium} sodiumGoal={profile.sodium || 2000}
                showSodium={(profile.conditions || []).some((c) => ["diabetes", "heart_bp", "kidney", "cholesterol"].includes(c))}
              />
              <div style={{ ...cardStyle, marginTop: 4 }}>
                <WeightBar startWeight={profile.startWeight ?? profile.weight} currentWeight={profile.weight} goalWeight={profile.goalWeight} />
                <WeighInInput onLog={logWeighIn} currentWeight={profile.weight} />
                <WaterTracker cups={Math.round((totals.fluidCups || 0) * 10) / 10} goalCups={profile.waterCups || 13} />
              </div>

              <MicronutrientCard totals={totals} open={microOpen} onToggle={() => setMicroOpen(!microOpen)} />

              <FastingTimer lastMealAt={lastMealAt} fastGoalHours={profile.fastGoalHours || 16} />
            </div>

            {adaptiveSuggestion && (
              <div style={{ ...cardStyle, position: "relative", paddingRight: 44, border: "1px solid rgba(255,122,0,0.35)" }}>
                <button
                  style={{ ...iconBtn, position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.12)", borderRadius: 999 }}
                  onClick={() => setAdaptiveSuggestion(null)}
                  aria-label="Dismiss this suggestion"
                >
                  <X size={18} color="#e0e0e0" />
                </button>
                <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 18, margin: "0 0 8px", color: "#FF7A00" }}>Target check-in</p>
                <p style={{ margin: "0 0 12px", color: "#e0e0e0", fontSize: 15, lineHeight: 1.5 }}>
                  Your weight's been trending at {adaptiveSuggestion.actualWeeklyChangeKg} kilos a week, versus a planned {adaptiveSuggestion.expectedWeeklyChangeKg}. I'd suggest {adaptiveSuggestion.delta > 0 ? "raising" : "lowering"} your daily calories to {adaptiveSuggestion.newCalories} to keep things on track.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    style={{ ...primaryBtn, flex: 1 }}
                    onClick={() => {
                      saveProfile({ ...profile, calories: adaptiveSuggestion.newCalories });
                      setAdaptiveSuggestion(null);
                    }}
                  >
                    Update my target
                  </button>
                  <button style={{ ...secondaryBtn, flex: 1 }} onClick={() => setAdaptiveSuggestion(null)}>
                    Keep as is
                  </button>
                </div>
              </div>
            )}

            <button style={{ ...primaryBtn, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={() => mealInputRef.current.click()} disabled={busy}>
              {busy === "meal" ? <Loader2 className="spin" size={22} /> : <Camera size={22} />}
              {busy === "meal" ? "Reading your photo…" : "Snap a meal or drink"}
            </button>

            <button style={{ ...secondaryBtn, width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={handleSuggest} disabled={busy}>
              {busy === "suggest" ? <Loader2 className="spin" size={22} /> : <ChefHat size={22} />}
              {busy === "suggest" ? "Thinking…" : "Suggest my next meal"}
            </button>

            {error && <p style={{ color: "var(--fat)", fontFamily: "Atkinson Hyperlegible", marginTop: 12, fontSize: 16 }}>{error}</p>}

            {suggestion && (
              <div style={{ ...cardStyle, position: "relative", paddingRight: 44 }}>
                <button
                  style={{ ...iconBtn, position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.12)", borderRadius: 999 }}
                  onClick={() => {
                    if (suggestion.addedShoppingIds?.length) saveShopping(shopping.filter((s) => !suggestion.addedShoppingIds.includes(s.id)));
                    setSuggestion(null);
                  }}
                  aria-label="Remove this suggestion"
                >
                  <X size={18} color="#e0e0e0" />
                </button>
                <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 19, margin: "0 0 8px", color: "#FF7A00" }}>{suggestion.meal}</p>
                <p style={{ margin: "0 0 12px", color: "#e0e0e0", fontSize: 16, lineHeight: 1.5 }}>{suggestion.why}</p>
                {suggestion.ingredients?.length > 0 && (
                  <div style={{ margin: "0 0 10px" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#FF7A00" }}>Ingredients and amounts</p>
                    <ColorLegendBanner />
                    {suggestion.ingredients.map((ing, i) => (
                      <p key={i} style={{ margin: "0 0 2px", fontSize: 15, color: ingredientColor(ing, suggestion.missing) }}>• {ing}</p>
                    ))}
                  </div>
                )}
                {suggestion.uses?.length > 0 && <p style={{ margin: "0 0 6px", fontSize: 15, lineHeight: 1.5, color: "#fff" }}><b>From your pantry:</b> {suggestion.uses.join(", ")}</p>}
                {suggestion.missing?.length > 0 && <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "#fff" }}><b>Added to shopping list:</b> {suggestion.missing.join(", ")}</p>}
              </div>
            )}

            <button style={{ ...secondaryBtn, width: "100%", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }} onClick={handlePlanDay} disabled={busy}>
              {busy === "planday" ? <Loader2 className="spin" size={22} /> : <CalendarRange size={22} />}
              {busy === "planday" ? "Planning\u2026" : "Plan the rest of my day"}
            </button>

            {dayPlan && (
              <div style={{ ...cardStyle, position: "relative", paddingRight: 44 }}>
                <button
                  style={{ ...iconBtn, position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.12)", borderRadius: 999 }}
                  onClick={() => {
                    if (dayPlan.addedShoppingIds?.length) saveShopping(shopping.filter((s) => !dayPlan.addedShoppingIds.includes(s.id)));
                    setDayPlan(null);
                  }}
                  aria-label="Remove this plan"
                >
                  <X size={18} color="#e0e0e0" />
                </button>
                <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 19, margin: "0 0 10px", color: "#FF7A00" }}>Rest of today</p>
                {(dayPlan.meals || []).map((m, i) => (
                  <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < dayPlan.meals.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
                    <p style={{ margin: "0 0 4px", fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#fff" }}>{m.name} <span style={{ color: "#c4c4c4", fontWeight: 400 }}>{m.calories ? `\u00b7 ${m.calories} cal` : ""}</span></p>
                    <p style={{ margin: "0 0 4px", color: "#e0e0e0", fontSize: 15, lineHeight: 1.4 }}>{m.why}</p>
                    {m.ingredients?.length > 0 && (
                      <div style={{ margin: "4px 0 6px" }}>
                        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#FF7A00" }}>Ingredients and amounts</p>
                        {i === 0 && <ColorLegendBanner />}
                        {m.ingredients.map((ing, j) => (
                          <p key={j} style={{ margin: "0 0 1px", fontSize: 14, color: ingredientColor(ing, m.missing) }}>• {ing}</p>
                        ))}
                      </div>
                    )}
                    {m.uses?.length > 0 && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: "#fff" }}><b>Uses:</b> {m.uses.join(", ")}</p>}
                    {m.missing?.length > 0 && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: "#fff" }}><b>Need to buy:</b> {m.missing.join(", ")}</p>}
                  </div>
                ))}
              </div>
            )}

            <RecipesCard
              recipes={recipes}
              open={recipesOpen}
              onToggle={() => setRecipesOpen(!recipesOpen)}
              onLog={logRecipe}
              onDelete={deleteRecipe}
              importText={importText}
              setImportText={setImportText}
              importOpen={importOpen}
              setImportOpen={setImportOpen}
              onImport={handleImportRecipe}
              busy={busy}
              pantry={pantry}
            />

            <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 19, marginTop: 32, marginBottom: 4, color: "var(--ink)" }}>Logged today</p>
            {log.length === 0 && <p style={{ color: "var(--ink-soft)", fontSize: 16 }}>Nothing logged yet — snap your first meal above.</p>}
            {["Breakfast", "Lunch", "Dinner"].map((section) => {
              const meals = log.filter((m) => (m.mealType || "Lunch") === section);
              const sectionCal = meals.reduce((s, m) => s + m.calories, 0);
              if (meals.length === 0) return null;
              return (
                <div key={section} style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, margin: 0, color: "var(--success)" }}>{section}</p>
                    <p style={{ fontSize: 14, margin: 0, color: "var(--ink-soft)" }}>{sectionCal} cal</p>
                  </div>
                  {meals.map((m) => (
                    <div key={m.id} style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      {m.photo && (
                        <img
                          src={m.photo}
                          alt={m.name}
                          style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0, border: "2px solid #FF7A00" }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontFamily: "Quicksand", fontWeight: 700, fontSize: 17, color: "#fff" }}>{m.name}</p>
                        <p style={{ margin: "4px 0 8px", fontSize: 15, color: "#FF7A00", fontWeight: 700, lineHeight: 1.5 }}>{formatTime(m.timeValue)} · {m.calories} cal</p>
                        <p style={{ margin: 0, fontSize: 14, color: "#e0e0e0" }}>
                          <span style={{ color: "#fff" }}>Protein {m.protein}g</span> · <span style={{ color: "#FF3B30" }}>Carbs {m.carbs}g</span> · <span style={{ color: "#FFD60A" }}>Fat {m.fat}g</span>
                        </p>
                        {getMealWarnings(m, profile).map((w, wi) => (
                          <p key={wi} style={{ margin: "6px 0 0", fontSize: 13, color: "#FF3B30", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                            <AlertTriangle size={14} color="#FF3B30" /> {w}
                          </p>
                        ))}
                        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                          <select
                            value={m.mealType || "Lunch"}
                            onChange={(e) => updateMealType(m.id, e.target.value)}
                            style={{ fontSize: 14, padding: "6px 10px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", background: "#1a1a1a", color: "#fff", fontFamily: "Atkinson Hyperlegible" }}
                          >
                            <option>Breakfast</option>
                            <option>Lunch</option>
                            <option>Dinner</option>
                          </select>
                          <input
                            type="time"
                            value={m.timeValue || "12:00"}
                            onChange={(e) => updateMealTime(m.id, e.target.value)}
                            style={{ fontSize: 14, padding: "6px 10px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)", background: "#1a1a1a", color: "#fff", fontFamily: "Atkinson Hyperlegible" }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          {[
                            { key: "bad", label: "Bad", emoji: "\u{1F61E}" },
                            { key: "okay", label: "Okay", emoji: "\u{1F610}" },
                            { key: "like", label: "Like it", emoji: "\u{1F60A}" },
                            { key: "love", label: "Love it", emoji: "\u{1F60D}" },
                          ].map((r) => (
                            <button
                              key={r.key}
                              onClick={() => updateMealRating(m.id, r.key)}
                              style={{
                                fontSize: 13,
                                padding: "6px 10px",
                                borderRadius: 999,
                                border: m.rating === r.key ? "2px solid #34C759" : "1.5px solid rgba(255,255,255,0.25)",
                                background: m.rating === r.key ? "rgba(52,199,89,0.15)" : "#1a1a1a",
                                color: "#fff",
                                fontFamily: "Atkinson Hyperlegible",
                                fontWeight: m.rating === r.key ? 700 : 400,
                                cursor: "pointer",
                              }}
                            >
                              {r.emoji} {r.label}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => saveMealAsRecipe(m)}
                          disabled={recipes.some((r) => r.name.toLowerCase() === m.name.toLowerCase())}
                          style={{
                            marginTop: 8, fontSize: 13, padding: "6px 10px", borderRadius: 999,
                            border: "1.5px solid rgba(255,122,0,0.5)", background: "rgba(255,122,0,0.1)",
                            color: "#FF7A00", fontFamily: "Atkinson Hyperlegible", fontWeight: 700, cursor: "pointer",
                            opacity: recipes.some((r) => r.name.toLowerCase() === m.name.toLowerCase()) ? 0.5 : 1,
                          }}
                        >
                          {recipes.some((r) => r.name.toLowerCase() === m.name.toLowerCase()) ? "Saved as recipe" : "Save as recipe"}
                        </button>
                      </div>
                      <button
                        style={{ ...iconBtn, background: "rgba(255,59,48,0.15)", borderRadius: 999, marginLeft: 10 }}
                        onClick={() => saveLog(log.filter((x) => x.id !== m.id))}
                        aria-label={`Remove ${m.name}`}
                      >
                        <Trash2 size={20} color="#FF3B30" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {tab === "workouts" && (
          <div style={{ padding: "24px 20px" }}>
            <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 24, margin: "0 0 4px", color: "#FFFFFF" }}>Today's workout</p>
            <p style={{ color: "#FFFFFF", fontSize: 16, margin: "0 0 18px" }}>
              {workoutLog.length > 0 ? `${workoutCaloriesToday} kcal burned so far` : "Snap a machine to log a set"}
            </p>

            <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 18, margin: "0 0 4px", color: "#fff" }}>Muscle map</p>
            <p style={{ color: "#e0e0e0", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>How much you've trained each muscle in the last 7 days</p>
            <MuscleMapView
              workoutLog={workoutLog}
              workoutHistory={workoutHistory}
              sex={profile?.sex}
              exerciseLibrary={exerciseLibrary}
              onQuickAdd={quickAddFromLibrary}
              onSnapNew={() => workoutInputRef.current?.click()}
              busy={busy}
            />

            <RestTimer />

            {muscleNudge && !pendingExercise && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "radial-gradient(circle at 30% 20%, #1a1200, #0a0a0a)",
                  border: "1px solid #FF7A00", borderRadius: 14,
                  padding: "12px 14px", marginBottom: 16,
                }}
              >
                <Dumbbell size={18} color="#FF7A00" style={{ flexShrink: 0 }} />
                <p style={{ color: "#F5D9B0", fontSize: 14, margin: 0, fontFamily: "Quicksand", fontWeight: 600 }}>
                  {muscleNudge.text}
                </p>
              </div>
            )}

            {exerciseLibrary.length > 0 && !pendingExercise && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {exerciseLibrary.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => quickAddFromLibrary(ex)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "#0a0a0a", border: "1px solid #FF7A00", borderRadius: 999,
                      padding: "8px 14px", color: "#FFFFFF", fontFamily: "Quicksand", fontWeight: 700,
                      fontSize: 13, cursor: "pointer",
                    }}
                  >
                    <Dumbbell size={14} color="#FF7A00" />
                    {ex.name}
                  </button>
                ))}
              </div>
            )}

            <input ref={workoutInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleWorkoutPhoto} />
            <button
              onClick={() => workoutInputRef.current?.click()}
              disabled={busy === "workout"}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                background: "linear-gradient(180deg, #FF7A00, #E3690A)", color: "#fff", border: "none", borderRadius: 16,
                padding: "16px 0", fontFamily: "Quicksand", fontWeight: 700, fontSize: 17, cursor: "pointer",
                boxShadow: "0 10px 20px rgba(255,122,0,0.35)", marginBottom: 20,
              }}
            >
              {busy === "workout" ? <Loader2 size={20} className="spin" /> : <Camera size={20} />}
              {busy === "workout" ? "Reading machine..." : "Snap a new machine"}
            </button>

            {error && <p style={{ color: "#FF3B30", fontSize: 14, marginBottom: 14 }}>{error}</p>}

            {pendingExercise && (
              <ExerciseEntryForm
                pending={pendingExercise}
                onCancel={() => setPendingExercise(null)}
                onSave={(setData) => { addWorkoutSet(setData); setPendingExercise(null); }}
                profile={profile}
              />
            )}

            {workoutLog.length === 0 && !pendingExercise && (
              <p style={{ color: "#c4c4c4", fontSize: 15, textAlign: "center", marginTop: 30 }}>No sets logged yet today.</p>
            )}

            {workoutLog.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {workoutLog.map((w) => (
                  <div key={w.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "radial-gradient(circle at 50% 30%, #1a1a1a 0%, #000000 70%)",
                    borderRadius: 16, padding: "12px 14px", border: "1px solid #2a2a2a",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.5)",
                  }}>
                    {w.photo ? (
                      <img src={w.photo} alt={w.exerciseName} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: "#222", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Dumbbell size={22} color="#FF7A00" />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, color: "#FFFFFF" }}>{w.exerciseName}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 13, color: "#c4c4c4" }}>
                        {w.weight}kg  ·  {w.sets} sets  ·  {w.reps} reps  ·  {w.caloriesBurned} kcal
                      </p>
                    </div>
                    <button
                      style={{ background: "rgba(255,59,48,0.15)", border: "none", borderRadius: 999, padding: 8, cursor: "pointer" }}
                      onClick={() => deleteWorkoutEntry(w.id)}
                      aria-label={`Remove ${w.exerciseName}`}
                    >
                      <Trash2 size={18} color="#FF3B30" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "pantry" && (
          <div style={{ padding: "24px 20px", position: "relative" }}>
            <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 24, margin: "0 0 4px", position: "relative", zIndex: 1, color: "#FFFFFF" }}>Snap your groceries</p>
            <p style={{ color: "#FFFFFF", marginTop: 0, fontSize: 16 }}>Photograph what you've got so suggestions use it.</p>
            <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
              <button
                onClick={() => fridgeInputRef.current.click()}
                disabled={busy}
                style={{
                  flex: 1,
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 16,
                  padding: "16px 10px 14px",
                  background: "linear-gradient(180deg, #3d3d3d 0%, #1a1a1a 100%)",
                  boxShadow: "0 14px 22px rgba(0,0,0,0.55), 0 6px 10px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -3px 0 rgba(0,0,0,0.6)",
                  border: "1.5px solid #00C2FF",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  color: "#fff",
                  fontFamily: "Quicksand, sans-serif",
                  fontWeight: 700,
                }}
              >
                <div style={{ position: "relative", width: 34, height: 44, border: "2.5px solid #00C2FF", borderRadius: 5, background: "rgba(0,194,255,0.08)" }}>
                  <div style={{ position: "absolute", top: "34%", left: 0, right: 0, height: 2, background: "#00C2FF" }} />
                </div>
                {busy === "pantry" ? <Loader2 className="spin" size={16} /> : <span style={{ fontSize: 13 }}>Scan fridge</span>}
              </button>
              <button
                onClick={() => pantryInputRef.current.click()}
                disabled={busy}
                style={{
                  flex: 1,
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 16,
                  padding: "16px 10px 14px",
                  background: "linear-gradient(180deg, #3d3d3d 0%, #1a1a1a 100%)",
                  boxShadow: "0 14px 22px rgba(0,0,0,0.55), 0 6px 10px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -3px 0 rgba(0,0,0,0.6)",
                  border: "1.5px solid #FF7A00",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  color: "#fff",
                  fontFamily: "Quicksand, sans-serif",
                  fontWeight: 700,
                }}
              >
                <div style={{ position: "relative", width: 38, height: 40, border: "2.5px solid #FF7A00", borderRadius: 4, background: "rgba(255,122,0,0.08)" }}>
                  <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#FF7A00" }} />
                  <div style={{ position: "absolute", top: "25%", left: "20%", width: 3, height: 3, borderRadius: "50%", background: "#FF7A00" }} />
                  <div style={{ position: "absolute", top: "75%", left: "20%", width: 3, height: 3, borderRadius: "50%", background: "#FF7A00" }} />
                </div>
                {busy === "pantry" ? <Loader2 className="spin" size={16} /> : <span style={{ fontSize: 13 }}>Scan pantry</span>}
              </button>
            </div>
            {error && <p style={{ color: "var(--fat)" }}>{error}</p>}
            {pantry.length === 0 && <p style={{ color: "#FFFFFF", fontSize: 16 }}>No items yet — scan your fridge to get started.</p>}
            <div
              style={{
                background: "radial-gradient(circle at 50% 20%, #2c2c2c 0%, #0a0a0a 75%)",
                borderRadius: 20,
                padding: "22px 16px",
                boxShadow: "0 24px 48px rgba(0,0,0,0.55), inset 0 0 30px rgba(255,122,0,0.05), inset 0 14px 26px rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 14,
                }}
              >
                {pantry.map((item) => {
                  const pantryCatColors = { protein: "#FFFFFF", carb: "#FF3B30", veg: "#34C759", fruit: "#FFD60A", dairy: "#00C2FF", other: "#FF7A00" };
                  const dotColor = pantryCatColors[item.category] || pantryCatColors.other;
                  return (
                    <div
                      key={item.id}
                      style={{
                        position: "relative",
                        background: "radial-gradient(circle at 50% 30%, #3a3a3a 0%, #111111 75%)",
                        borderRadius: 14,
                        padding: "14px 10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 14px 22px rgba(0,0,0,0.55), 0 6px 10px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -3px 0 rgba(0,0,0,0.6)",
                        border: `1.5px solid ${dotColor}`,
                      }}
                    >
                      <X
                        size={13}
                        color="#c4c4c4"
                        style={{ position: "absolute", top: 6, right: 6, cursor: "pointer" }}
                        onClick={() => savePantry(pantry.filter((p) => p.id !== item.id))}
                      />
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
                      <span style={{ color: "#FFFFFF", fontFamily: "Atkinson Hyperlegible, sans-serif", fontSize: 15, fontWeight: 700, textAlign: "center", lineHeight: 1.25 }}>
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "shopping" && (
          <div style={{ padding: "24px 20px", position: "relative" }}>
            <p style={{ fontFamily: "Quicksand", fontWeight: 700, fontSize: 24, margin: "0 0 4px", position: "relative", zIndex: 1, color: "#FFFFFF" }}>Shopping list</p>
            <p style={{ color: "#FFFFFF", marginTop: 0, fontSize: 16 }}>Filled in automatically from meal suggestions.</p>
            {shopping.length === 0 && <p style={{ color: "#FFFFFF", fontSize: 16 }}>Nothing on your list yet.</p>}
            {shopping.map((s) => (
              <div key={s.id} style={{ ...cardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button style={{ ...checkboxStyle, borderColor: "#FF7A00", background: s.done ? "#34C759" : "transparent" }} onClick={() => saveShopping(shopping.map((x) => x.id === s.id ? { ...x, done: !x.done } : x))}>
                    {s.done && <Check size={14} color="#fff" />}
                  </button>
                  <span style={{ textDecoration: s.done ? "line-through" : "none", color: s.done ? "#c4c4c4" : "#FFFFFF", fontSize: 19, fontWeight: 600 }}>{s.name}</span>
                </div>
                <button style={iconBtn} onClick={() => saveShopping(shopping.filter((x) => x.id !== s.id))}><Trash2 size={18} color="#C9932E" /></button>
              </div>
            ))}
          </div>
        )}

        {tab === "settings" && (
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
        )}

        {tab === "trends" && (
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
        )}

      </div>

      <nav style={navStyle}>
        <NavBtn icon={Utensils} label="Today" active={tab === "today"} onClick={() => setTab("today")} />
        <NavBtn icon={Dumbbell} label="Workouts" active={tab === "workouts"} onClick={() => setTab("workouts")} />
        <NavBtn icon={ShoppingBasket} label="Groceries" active={tab === "pantry"} onClick={() => setTab("pantry")} />
        <NavBtn icon={ListChecks} label="Shopping list" active={tab === "shopping"} onClick={() => setTab("shopping")} />
        <NavBtn icon={Settings} label="Goals" active={tab === "settings"} onClick={() => setTab("settings")} />
        <NavBtn icon={TrendingUp} label="Trends" active={tab === "trends"} onClick={() => setTab("trends")} />
      </nav>
    </div>
  );
}

function MacroChip({ color, label, val, goal }) {
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

function Stat({ label, val }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
      <span style={{ color: "#d5d5d5" }}>{label}</span>
      <span style={{ fontFamily: "Quicksand", fontWeight: 700, color: "#fff" }}>{val}</span>
    </div>
  );
}

function ExerciseEntryForm({ pending, onCancel, onSave, profile }) {
  const [name, setName] = useState(pending.exerciseName);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("");

  const canSave = name.trim() && reps && sets;
  const injuryWarning = getExerciseWarning(name, profile);

  const inputStyle = {
    width: "100%", background: "#0a0a0a", border: "1px solid #333", borderRadius: 10,
    padding: "10px 12px", color: "#fff", fontFamily: "Atkinson Hyperlegible", fontSize: 16, marginTop: 4,
  };
  const labelStyle = { fontSize: 13, color: "#c4c4c4", fontFamily: "Quicksand", fontWeight: 700 };

  return (
    <div style={{
      background: "radial-gradient(circle at 50% 30%, #1a1a1a 0%, #000000 70%)",
      borderRadius: 18, padding: 16, border: "1px solid #2a2a2a", marginBottom: 18,
      boxShadow: "0 10px 22px rgba(0,0,0,0.55)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        {pending.photo && <img src={pending.photo} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} />}
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Exercise</label>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, marginTop: 2 }} />
            <Pencil size={16} color="#666" />
          </div>
        </div>
      </div>

      {injuryWarning && (
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#FF3B30", fontWeight: 700, display: "flex", alignItems: "flex-start", gap: 6 }}>
          <AlertTriangle size={16} color="#FF3B30" style={{ flexShrink: 0, marginTop: 1 }} /> {injuryWarning}
        </p>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Weight (kg)</label>
          <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} placeholder="0" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Reps</label>
          <input type="number" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} style={inputStyle} placeholder="0" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Sets</label>
          <input type="number" inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} style={inputStyle} placeholder="0" />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onCancel}
          style={{ flex: 1, background: "rgba(255,255,255,0.08)", color: "#e0e0e0", border: "none", borderRadius: 12, padding: "12px 0", fontFamily: "Quicksand", fontWeight: 700, cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          disabled={!canSave}
          onClick={() => onSave({ exerciseName: name.trim(), weight: Number(weight) || 0, reps: Number(reps), sets: Number(sets), photo: pending.photo || null })}
          style={{
            flex: 2, background: canSave ? "linear-gradient(180deg, #FF7A00, #E3690A)" : "#333",
            color: "#fff", border: "none", borderRadius: 12, padding: "12px 0",
            fontFamily: "Quicksand", fontWeight: 700, cursor: canSave ? "pointer" : "default",
          }}
        >
          Save set
        </button>
      </div>
    </div>
  );
}

function NavBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", padding: 8, flex: 1 }}>
      <Icon size={22} color={active ? "var(--success)" : "var(--ink-soft)"} />
      <span style={{ fontSize: 11, fontFamily: "Atkinson Hyperlegible", color: active ? "var(--success)" : "var(--ink-soft)", fontWeight: active ? 700 : 400 }}>{label}</span>
    </button>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      @import url('${FONT_LINK}');
      :root {
        --bg: #F1F4ED; --surface: #FFFFFF; --ink: #24352A; --ink-soft: #5B6B5C;
        --protein: #C97A2B; --carbs: #4A7A8C; --fat: #8B4A6B; --success: #4A6E49; --border: #DDE4D6; --gold: #C9932E;
      }
      * { font-family: 'Atkinson Hyperlegible', sans-serif; box-sizing: border-box; }
      body, p, span, div, button, select { font-size: 16px; line-height: 1.5; }
      button:focus-visible, input:focus-visible { outline: 3px solid var(--success); outline-offset: 2px; }
      .spin { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }

      .app-shell::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background-image:
          linear-gradient(180deg, rgba(36,53,42,0.90) 0%, rgba(36,53,42,0.82) 45%, rgba(201,147,46,0.32) 100%),
          url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27800%27%20height%3D%271000%27%20viewBox%3D%270%200%20800%201000%27%3E%3Crect%20width%3D%27800%27%20height%3D%271000%27%20fill%3D%27%25232B2118%27/%3E%3Cg%20opacity%3D%270.35%27%20stroke%3D%27%2523140F0A%27%20stroke-width%3D%272%27%3E%3Cline%20x1%3D%270%27%20y1%3D%2760%27%20x2%3D%27800%27%20y2%3D%2760%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27190%27%20x2%3D%27800%27%20y2%3D%27190%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27320%27%20x2%3D%27800%27%20y2%3D%27320%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27450%27%20x2%3D%27800%27%20y2%3D%27450%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27580%27%20x2%3D%27800%27%20y2%3D%27580%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27710%27%20x2%3D%27800%27%20y2%3D%27710%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27840%27%20x2%3D%27800%27%20y2%3D%27840%27/%3E%3Cline%20x1%3D%270%27%20y1%3D%27970%27%20x2%3D%27800%27%20y2%3D%27970%27/%3E%3C/g%3E%3Ccircle%20cx%3D%27150%27%20cy%3D%27170%27%20r%3D%2755%27%20fill%3D%27%2523C9432E%27/%3E%3Cpath%20d%3D%27M150%20118c6-14%2022-16%2030-8%27%20stroke%3D%27%25234A6E49%27%20stroke-width%3D%276%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27/%3E%3Cg%20fill%3D%27%2523D98A2E%27%3E%3Crect%20x%3D%27330%27%20y%3D%27430%27%20width%3D%2716%27%20height%3D%27120%27%20rx%3D%278%27%20transform%3D%27rotate%288%20338%20490%29%27/%3E%3Cpath%20d%3D%27M330%20430l-18-30%2026%2010%204-28%2014%2024%2020-16-6%2028%2026-2-18%2020z%27%20/%3E%3C/g%3E%3Cg%20fill%3D%27%25234A6E49%27%3E%3Cellipse%20cx%3D%27560%27%20cy%3D%27250%27%20rx%3D%2770%27%20ry%3D%2734%27%20transform%3D%27rotate%28-18%20560%20250%29%27/%3E%3Cellipse%20cx%3D%27610%27%20cy%3D%27230%27%20rx%3D%2730%27%20ry%3D%2714%27%20transform%3D%27rotate%2810%20610%20230%29%27/%3E%3C/g%3E%3Cg%20fill%3D%27%2523C9932E%27%20opacity%3D%270.9%27%3E%3Ccircle%20cx%3D%27240%27%20cy%3D%27680%27%20r%3D%2710%27/%3E%3Ccircle%20cx%3D%27270%27%20cy%3D%27700%27%20r%3D%2710%27/%3E%3Ccircle%20cx%3D%27210%27%20cy%3D%27705%27%20r%3D%2710%27/%3E%3Ccircle%20cx%3D%27250%27%20cy%3D%27725%27%20r%3D%2710%27/%3E%3C/g%3E%3Cpath%20d%3D%27M600%20620c40-20%2090-10%20100%2030s-30%2070-70%2060-70-60-30-90z%27%20fill%3D%27%25237A3B2E%27/%3E%3Cpath%20d%3D%27M600%20780q90-40%20170%2010%27%20stroke%3D%27%25233A2B20%27%20stroke-width%3D%2710%27%20fill%3D%27none%27%20stroke-linecap%3D%27round%27%20opacity%3D%270.5%27/%3E%3C/svg%3E");
        background-size: cover;
        background-position: center top;
        opacity: 1;
      }
    `}</style>
  );
}

const shellStyle = { display: "flex", flexDirection: "column", height: "100vh", maxWidth: 480, margin: "0 auto", background: "var(--bg)", color: "var(--ink)", position: "relative" };
const secondaryBtn = { background: "#fff", color: "var(--ink)", border: "2px solid var(--border)", borderRadius: 16, padding: "14px 20px", fontFamily: "Quicksand", fontWeight: 700, fontSize: 16, cursor: "pointer" };
const cardStyle = {
  background: "radial-gradient(circle at 50% 25%, #2c2c2c 0%, #0a0a0a 75%)",
  borderRadius: 16,
  padding: "14px 16px",
  marginTop: 10,
  boxShadow: "0 14px 22px rgba(0,0,0,0.5), 0 6px 10px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -3px 0 rgba(0,0,0,0.55)",
  border: "1px solid rgba(255,255,255,0.07)",
  color: "#fff",
};
const tagStyle = { background: "#fff", border: "2px solid var(--border)", borderRadius: 999, padding: "8px 14px", fontSize: 14 };
const iconBtn = { background: "none", border: "none", cursor: "pointer", padding: 6 };
const checkboxStyle = { width: 22, height: 22, borderRadius: 6, border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const navStyle = { position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid var(--border)", display: "flex", padding: "6px 8px", maxWidth: 480, margin: "0 auto", zIndex: 1 };
