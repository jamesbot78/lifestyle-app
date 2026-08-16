import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Utensils, Dumbbell, ShoppingBasket, ListChecks, Settings, TrendingUp, UserCog } from "lucide-react";

import { todayKey } from "./lib/time";
import { fileToResizedBase64, fileToThumbDataUrl } from "./lib/image";
import { askClaude } from "./lib/api";
import { computeAdaptiveTargets } from "./lib/nutrition";

import { shellStyle, navStyle } from "./styles/theme";
import { GlobalStyle } from "./styles/GlobalStyle";
import { NavBtn } from "./components/NavBtn";

import { Onboarding } from "./features/onboarding/Onboarding";
import { HealthOnboarding } from "./features/onboarding/HealthOnboarding";
import { TodayTab } from "./features/today/TodayTab";
import { WorkoutsTab } from "./features/workouts/WorkoutsTab";
import { PantryTab } from "./features/pantry/PantryTab";
import { ShoppingTab } from "./features/shopping/ShoppingTab";
import { SettingsTab } from "./features/settings/SettingsTab";
import { TrendsTab } from "./features/trends/TrendsTab";
import { ProfileTab } from "./features/profile/ProfileTab";

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
  const [aiSettings, setAiSettings] = useState({ provider: "anthropic", apiKey: "" });
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
      const ai = localStorage.getItem("aiSettings");
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
      if (ai) setAiSettings(JSON.parse(ai));
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

  const saveAiSettings = (s) => { setAiSettings(s); persist("aiSettings", s); };

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
      const result = await askClaude({ text: prompt, maxTokens: 1200, apiKey: aiSettings.apiKey || undefined, provider: aiSettings.provider });
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
        apiKey: aiSettings.apiKey || undefined,
        provider: aiSettings.provider,
      });
      setPendingExercise({ exerciseName: result.exerciseName || "Exercise", photo: thumb });
    } catch (err) {
      setError("Couldn't read that photo. Try again with better lighting.");
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
        ? `Haven't hit ${stalest.toLowerCase()} in ${days} days, maybe ${pick}?`
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
        apiKey: aiSettings.apiKey || undefined,
        provider: aiSettings.provider,
        text: "You are a nutrition estimator. Look at this photo of food or a drink and estimate it. If it is a drink, estimate fluid volume in cups (1 cup = 240ml) as fluidCups, and set isDrink to true. Also identify any of these allergens present: peanuts, tree_nuts, shellfish, fish, eggs, soy, wheat, dairy. Return as an array of matching keys in allergens. Also estimate sugar in grams as sugar, and rough estimates for fiber (grams), iron (milligrams), vitaminC (milligrams), calcium (milligrams), and potassium (milligrams). Also set containsMeat, containsFish, containsEggs, containsDairy as booleans for dietary pattern checks. Respond with ONLY raw JSON, no markdown, no commentary, matching exactly: {\"name\": string (short meal or drink name), \"calories\": number, \"protein\": number (grams), \"carbs\": number (grams), \"fat\": number (grams), \"sodium\": number (milligrams), \"sugar\": number (grams), \"fiber\": number (grams), \"iron\": number (milligrams), \"vitaminC\": number (milligrams), \"calcium\": number (milligrams), \"potassium\": number (milligrams), \"isDrink\": boolean, \"fluidCups\": number, \"allergens\": array of strings, \"containsMeat\": boolean, \"containsFish\": boolean, \"containsEggs\": boolean, \"containsDairy\": boolean}",
      });
      const now = new Date();
      const hour = now.getHours();
      const defaultType = hour < 11 ? "Breakfast" : hour < 16 ? "Lunch" : "Dinner";
      const timeValue = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const entry = { id: Date.now(), timeValue, mealType: defaultType, photo: thumb, rating: null, ...result };
      saveLog([...log, entry]);
    } catch (err) {
      setError("Couldn't read that photo. Try again with better lighting.");
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
        apiKey: aiSettings.apiKey || undefined,
        provider: aiSettings.provider,
        text: "Look at this photo of a fridge, pantry, or cupboard. List the distinct food items you can identify. Respond with ONLY raw JSON, no markdown: {\"items\": [{\"name\": string, \"category\": string (one of protein, carb, veg, fruit, dairy, other)}]}",
      });
      const existingNames = new Set(pantry.map((p) => p.name.toLowerCase()));
      const fresh = (result.items || []).filter((i) => !existingNames.has(i.name.toLowerCase()));
      savePantry([...pantry, ...fresh.map((i) => ({ ...i, id: Date.now() + Math.random() }))]);
    } catch (err) {
      setError("Couldn't read that photo. Try again with better lighting.");
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
        ? ` Important health constraints: my remaining sodium budget today is ${remaining.sodium}mg. ${allergies.length ? `I am allergic to or must avoid: ${allergies.join(", ")}. Never suggest a meal containing these.` : ""} ${profile.dietPattern && profile.dietPattern !== "none" ? `My dietary pattern is ${profile.dietPattern}. Only suggest meals that fit this.` : ""} ${conditions.includes("diabetes") ? "I am diabetic, so prefer lower-sugar options." : ""} ${conditions.includes("celiac") ? "I have celiac disease or gluten sensitivity, so avoid gluten." : ""} ${conditions.includes("lactose") ? "I am lactose intolerant, so avoid dairy." : ""}`
        : "";
      const result = await askClaude({
        text: `I need one meal suggestion to help hit my remaining daily targets: ${remaining.calories} calories, ${remaining.protein}g protein, ${remaining.carbs}g carbs, ${remaining.fat}g fat remaining today. My pantry/fridge currently has: ${pantry.length ? pantry.map((p) => p.name).join(", ") : "nothing logged yet"}. Suggest ONE realistic meal using mostly what I already have.${preferenceLine}${healthLine} Respond with ONLY raw JSON, no markdown: {"meal": string (name), "why": string (1 short sentence on how it fits my remaining macros), "ingredients": [string] (every ingredient needed for this exact meal WITH specific quantities so I know how much to actually make, e.g. "150g chicken breast", "1 cup cooked rice", "100g Greek yogurt", quantities should be sized so the meal totals the stated calories), "uses": [string] (pantry items it uses), "missing": [string] (up to 4 ingredients I'd need to buy, empty array if none)}`,
        apiKey: aiSettings.apiKey || undefined,
        provider: aiSettings.provider,
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
      setError("Couldn't come up with a suggestion. Give it another try.");
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
        ? ` Important health constraints: my remaining sodium budget today is ${remaining.sodium}mg. ${allergies.length ? `I am allergic to or must avoid: ${allergies.join(", ")}. Never suggest a meal containing these.` : ""} ${profile.dietPattern && profile.dietPattern !== "none" ? `My dietary pattern is ${profile.dietPattern}. Only suggest meals that fit this.` : ""} ${conditions.includes("diabetes") ? "I am diabetic, so prefer lower-sugar options." : ""} ${conditions.includes("celiac") ? "I have celiac disease or gluten sensitivity, so avoid gluten." : ""} ${conditions.includes("lactose") ? "I am lactose intolerant, so avoid dairy." : ""}`
        : "";
      const result = await askClaude({
        text: `I need a plan of meals to fill the REST of today, so that combined they roughly hit my remaining daily targets: ${remaining.calories} calories, ${remaining.protein}g protein, ${remaining.carbs}g carbs, ${remaining.fat}g fat remaining today. My pantry/fridge currently has: ${pantry.length ? pantry.map((p) => p.name).join(", ") : "nothing logged yet"}. Suggest 2 to 4 realistic remaining meals or snacks (fewer if it's late in the day) using mostly what I already have, that together add up close to my remaining targets without going over.${preferenceLine}${healthLine} Respond with ONLY raw JSON, no markdown: {"meals": [{"name": string, "why": string (1 short sentence), "calories": number, "ingredients": [string] (every ingredient needed for this exact meal WITH specific quantities, e.g. "2 eggs", "1 slice wholegrain toast", "1 banana", sized so the meal totals the stated calories), "uses": [string], "missing": [string] (ingredients to buy, empty array if none)}]}`,
        apiKey: aiSettings.apiKey || undefined,
        provider: aiSettings.provider,
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
      setError("Couldn't plan the rest of your day. Give it another try.");
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
          <TodayTab
            profile={profile} totals={totals} log={log} saveLog={saveLog} error={error}
            microOpen={microOpen} setMicroOpen={setMicroOpen} lastMealAt={lastMealAt}
            adaptiveSuggestion={adaptiveSuggestion} setAdaptiveSuggestion={setAdaptiveSuggestion} saveProfile={saveProfile}
            mealInputRef={mealInputRef} busy={busy} handleSuggest={handleSuggest} suggestion={suggestion} setSuggestion={setSuggestion}
            shopping={shopping} saveShopping={saveShopping} ingredientColor={ingredientColor}
            handlePlanDay={handlePlanDay} dayPlan={dayPlan} setDayPlan={setDayPlan}
            recipes={recipes} recipesOpen={recipesOpen} setRecipesOpen={setRecipesOpen} logRecipe={logRecipe} deleteRecipe={deleteRecipe}
            importText={importText} setImportText={setImportText} importOpen={importOpen} setImportOpen={setImportOpen}
            handleImportRecipe={handleImportRecipe} pantry={pantry}
            logWeighIn={logWeighIn} updateMealType={updateMealType} updateMealTime={updateMealTime}
            updateMealRating={updateMealRating} saveMealAsRecipe={saveMealAsRecipe}
          />
        )}

        {tab === "workouts" && (
          <WorkoutsTab
            workoutLog={workoutLog} workoutCaloriesToday={workoutCaloriesToday} workoutHistory={workoutHistory}
            profile={profile} exerciseLibrary={exerciseLibrary} quickAddFromLibrary={quickAddFromLibrary}
            workoutInputRef={workoutInputRef} handleWorkoutPhoto={handleWorkoutPhoto} busy={busy} error={error}
            muscleNudge={muscleNudge} pendingExercise={pendingExercise} setPendingExercise={setPendingExercise}
            addWorkoutSet={addWorkoutSet} deleteWorkoutEntry={deleteWorkoutEntry}
          />
        )}

        {tab === "pantry" && (
          <PantryTab
            pantry={pantry} savePantry={savePantry}
            fridgeInputRef={fridgeInputRef} pantryInputRef={pantryInputRef}
            busy={busy} error={error}
          />
        )}

        {tab === "shopping" && (
          <ShoppingTab shopping={shopping} saveShopping={saveShopping} />
        )}

        {tab === "settings" && (
          <SettingsTab profile={profile} setProfile={setProfile} />
        )}

        {tab === "trends" && (
          <TrendsTab dayHistory={dayHistory} profile={profile} weightLog={weightLog} />
        )}

        {tab === "profile" && (
          <ProfileTab aiSettings={aiSettings} saveAiSettings={saveAiSettings} />
        )}
      </div>

      <nav style={navStyle}>
        <NavBtn icon={Utensils} label="Today" active={tab === "today"} onClick={() => setTab("today")} />
        <NavBtn icon={Dumbbell} label="Workouts" active={tab === "workouts"} onClick={() => setTab("workouts")} />
        <NavBtn icon={ShoppingBasket} label="Groceries" active={tab === "pantry"} onClick={() => setTab("pantry")} />
        <NavBtn icon={ListChecks} label="Shopping list" active={tab === "shopping"} onClick={() => setTab("shopping")} />
        <NavBtn icon={Settings} label="Goals" active={tab === "settings"} onClick={() => setTab("settings")} />
        <NavBtn icon={TrendingUp} label="Trends" active={tab === "trends"} onClick={() => setTab("trends")} />
        <NavBtn icon={UserCog} label="Profile" active={tab === "profile"} onClick={() => setTab("profile")} />
      </nav>
    </div>
  );
}
