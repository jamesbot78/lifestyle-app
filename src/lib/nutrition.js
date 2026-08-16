export function getMealWarnings(meal, profile) {
  if (!profile) return [];
  const warnings = [];
  const allergies = profile.allergies || [];
  const mealAllergens = meal.allergens || [];
  const allergenLabels = { peanuts: "peanuts", tree_nuts: "tree nuts", shellfish: "shellfish", fish: "fish", eggs: "eggs", soy: "soy", wheat: "wheat", dairy: "dairy" };
  mealAllergens.forEach((a) => {
    if (allergies.includes(a)) warnings.push(`Contains ${allergenLabels[a] || a}: you flagged this as an allergy`);
  });

  const pattern = profile.dietPattern;
  if (pattern === "vegan") {
    if (meal.containsMeat) warnings.push("Contains meat: not vegan");
    if (meal.containsFish) warnings.push("Contains fish: not vegan");
    if (meal.containsEggs) warnings.push("Contains eggs: not vegan");
    if (meal.containsDairy) warnings.push("Contains dairy: not vegan");
  } else if (pattern === "vegetarian") {
    if (meal.containsMeat) warnings.push("Contains meat: not vegetarian");
    if (meal.containsFish) warnings.push("Contains fish: not vegetarian");
  }

  const conditions = profile.conditions || [];
  if (conditions.includes("diabetes") && (meal.sugar || 0) > 20) {
    warnings.push("High in sugar: worth watching with diabetes");
  }
  if ((conditions.includes("heart_bp") || conditions.includes("kidney") || conditions.includes("cholesterol")) && (meal.sodium || 0) > 700) {
    warnings.push("High in sodium");
  }
  if (conditions.includes("celiac") && mealAllergens.includes("wheat")) {
    warnings.push("Contains gluten: flagged for celiac / gluten sensitivity");
  }
  if (conditions.includes("lactose") && mealAllergens.includes("dairy")) {
    warnings.push("Contains dairy: flagged for lactose intolerance");
  }
  return warnings;
}

export function calcTargets(p) {
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

export function computeAdaptiveTargets(profile, weightLog) {
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

export function lerpColor(pct) {
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

export const MICRO_GOALS = {
  fiber: { label: "Fiber", goal: 30, unit: "g" },
  iron: { label: "Iron", goal: 18, unit: "mg" },
  vitaminC: { label: "Vitamin C", goal: 90, unit: "mg" },
  calcium: { label: "Calcium", goal: 1000, unit: "mg" },
  potassium: { label: "Potassium", goal: 3500, unit: "mg" },
};
