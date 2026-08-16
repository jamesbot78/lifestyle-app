# Data model

There is no backend database; every piece of user data lives in the browser's `localStorage`, read once on mount (`App.jsx`'s first `useEffect`) and written through on every change via `persist(key, value)` (`JSON.stringify` + `localStorage.setItem`, wrapped in a try/catch so a full or disabled storage doesn't crash the app).

## localStorage keys

| Key | Shape | Set by |
|---|---|---|
| `profile` | `Profile` object (below) | `saveProfile` |
| `pantry` | `PantryItem[]` | `savePantry` |
| `shopping` | `ShoppingItem[]` | `saveShopping` |
| `log:{YYYY-MM-DD}` | `MealEntry[]` for **today only** | `saveLog` |
| `weightLog` | `WeighIn[]`, all-time | `saveWeightLog` |
| `dayHistory` | `{ [date]: DayTotals }`, all-time | `saveLog` (writes today's totals in) |
| `workout:{YYYY-MM-DD}` | `WorkoutEntry[]` for **today only** | `saveWorkoutLog` |
| `workoutHistory` | `{ [date]: { entries: WorkoutEntry[], caloriesBurned: number } }`, all-time | `saveWorkoutLog` |
| `exerciseLibrary` | `LibraryExercise[]` | `saveExerciseLibrary` |
| `recipes` | `Recipe[]` | `saveRecipes` |
| `adaptiveLastCheck` | timestamp string | the adaptive-targets `useEffect` |

Note the day-scoped keys (`log:*`, `workout:*`): only **today's** entries are kept in fast-access, per-day keys; `dayHistory`/`workoutHistory` are the append-only summaries used for the Trends tab and the muscle map's "last 7 days" view. There's no automatic pruning of old `log:*`/`workout:*` keys; they simply stop being read once the date rolls over (a new day reads a fresh, empty key).

## Shapes

### `Profile`

Built from `Onboarding` + `HealthOnboarding` (see `lib/nutrition.js`'s `calcTargets` for how the numeric fields are derived) and updatable later from Settings ("Redo my targets") or the adaptive check-in prompt.

```
{
  // physical stats, always stored in metric regardless of the unit the user picked
  weight: number, startWeight: number, goalWeight: number, height: number (cm), age: number,
  sex: "male" | "female", activity: "sedentary" | "moderate" | "active",
  pace: "relaxed" | "steady" | "aggressive",
  weightUnit: "kg" | "lb", heightUnit: "m" | "cm" | "ft",   // display-only, for re-editing

  // computed daily targets (calcTargets: Mifflin-St Jeor BMR × activity multiplier − pace deficit)
  calories: number, protein: number, carbs: number, fat: number, sodium: number, waterCups: number,

  // accessibility
  readingSupport: boolean, voiceName: string,

  // health/dietary, from HealthOnboarding (all optional, default to empty/"none")
  conditions: string[],        // e.g. "diabetes", "heart_bp", "kidney", "cholesterol", "celiac", "lactose", ...
  injuries: { key: string, date: string }[],
  allergies: string[],         // "peanuts", "tree_nuts", "shellfish", "fish", "eggs", "soy", "wheat", "dairy"
  dietPattern: "none" | "vegetarian" | "vegan" | "halal" | "kosher",
  healthNote: string, otherCondition: string, otherInjury: string,

  fastGoalHours?: number,      // defaults to 16 if absent (FastingTimer)
}
```

`conditions` drives two things: `getMealWarnings`/`getExerciseWarning` (per-item warnings) and `GaugeGrid`'s `showSodium` flag (sodium gauge only shown for diabetes/heart_bp/kidney/cholesterol).

### `MealEntry` (an item in `log:{date}`)

Produced either by `handleMealPhoto` (AI photo analysis, see [ai-integration.md](./ai-integration.md)) or `logRecipe` (from a saved recipe).

```
{
  id: number, timeValue: "HH:MM", mealType: "Breakfast" | "Lunch" | "Dinner",
  photo: string | null (data URL thumbnail), rating: "bad" | "okay" | "like" | "love" | null,
  name: string, calories: number, protein: number, carbs: number, fat: number,
  sodium: number, sugar: number, fiber: number, iron: number, vitaminC: number,
  calcium: number, potassium: number,
  isDrink: boolean, fluidCups: number,
  allergens: string[], containsMeat: boolean, containsFish: boolean, containsEggs: boolean, containsDairy: boolean,
}
```

### `DayTotals` (value in `dayHistory`, and the shape of the `totals` App.jsx computes for "today")

```
{ cal, protein, carbs, fat, sodium, fluidCups, fiber, iron, vitaminC, calcium, potassium }
```
All are running sums of that day's `MealEntry[]`. `totals` in `App.jsx` is *derived*, not stored; it's recomputed from `log` on every render via `.reduce()`.

### `WeighIn` (item in `weightLog`)

```
{ id: number, date: "YYYY-MM-DD", weight: number }
```
One entry per date; logging again on the same day replaces that day's entry rather than appending (see `logWeighIn`).

### `WorkoutEntry` (item in `workout:{date}` / `workoutHistory[date].entries`)

Produced by `addWorkoutSet` after `ExerciseEntryForm` is filled in (itself seeded by `handleWorkoutPhoto`'s AI-identified exercise name, or a quick-add from `exerciseLibrary`).

```
{
  id: number, timeValue: "HH:MM", exerciseName: string,
  weight: number, reps: number, sets: number, photo: string | null,
  caloriesBurned: number,   // estimateCaloriesBurned(): rough MET-based estimate, not from AI
}
```

### `LibraryExercise` (item in `exerciseLibrary`)

Auto-created/updated the first time an exercise name is logged; powers the "quick add" chips and the muscle map's per-muscle volume tally.

```
{ id: number, name: string, muscleGroup: string, photo: string | null, lastUsed: "YYYY-MM-DD" }
```

`muscleGroup` is assigned once, by keyword-matching the exercise name (`guessMuscleGroup` in `App.jsx`). See [components.md](./components.md) for why this is a *separate*, slightly different function from `lib/exercise.js`'s `guessMuscleGroupStandalone`.

### `PantryItem` / `ShoppingItem`

```
PantryItem:   { id: number, name: string, category: "protein" | "carb" | "veg" | "fruit" | "dairy" | "other" }
ShoppingItem: { id: number, name: string, done: boolean }
```
Shopping items are added automatically whenever an AI meal suggestion or day plan lists ingredients the pantry doesn't have (`handleSuggest`/`handlePlanDay`), as well as manually toggled/removed from the Shopping tab.

### `Recipe` (item in `recipes`)

```
{ id: number, name: string, ingredients: string[], steps: string[], calories: number, protein: number, carbs: number, fat: number }
```
Created either from a logged meal (`saveMealAsRecipe`, strips the day-specific fields like `timeValue`/`rating`) or from `handleImportRecipe` (AI-parsed from pasted text/link).

## Derived logic worth knowing about

- **`calcTargets(profile)`** (`lib/nutrition.js`): Mifflin-St Jeor BMR, activity multiplier, pace-based calorie deficit (250/500/750 kcal for relaxed/steady/aggressive), protein at 2g/kg bodyweight, fat at 27% of calories, carbs fill the remainder.
- **`computeAdaptiveTargets(profile, weightLog)`** (`lib/nutrition.js`): runs at most once every 7 days (gated by the `adaptiveLastCheck` timestamp). Compares the actual weekly weight-change rate (from the last up-to-14 weigh-ins) against what the calorie deficit implies, and if the drift is more than ~0.15 kg/week, surfaces a calorie-adjustment suggestion in the Today tab (capped at ±150 kcal/day per adjustment).
- **`getMealWarnings` / `getExerciseWarning`** (`lib/nutrition.js` / `lib/exercise.js`): pure, stateless functions that cross-reference a meal/exercise against `profile.conditions`/`allergies`/`injuries` to produce human-readable warning strings. Called at render time, not stored.
