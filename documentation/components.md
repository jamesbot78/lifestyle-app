# Component & module reference

This is a directory-by-directory map of `src/`. See [architecture.md](./architecture.md) for how these fit together, and [data-model.md](./data-model.md) for the shape of the data most of them receive as props.

## `lib/` — pure functions, no JSX

| File | Exports | Notes |
|---|---|---|
| `constants.js` | `FONT_LINK` | Google Fonts URL, used by `GlobalStyle` |
| `time.js` | `formatTime`, `todayKey`, `getDailyQuote`, `MOTIVATIONAL_QUOTES` | `todayKey()` (`YYYY-MM-DD`) is the basis for every day-scoped `localStorage` key |
| `image.js` | `fileToResizedBase64`, `fileToThumbDataUrl` | Canvas-based client-side resize before AI photo uploads |
| `api.js` | `askClaude` | The one function that calls `/api/ask-claude` — see [ai-integration.md](./ai-integration.md) |
| `svg.js` | `polarToXY`, `describeArc` | Polar-to-cartesian helpers for the `Gauge` dial's arc paths |
| `nutrition.js` | `calcTargets`, `computeAdaptiveTargets`, `getMealWarnings`, `lerpColor`, `MICRO_GOALS` | Target calculation, adaptive check-in, per-meal warning generation, red→amber→green color interpolation |
| `exercise.js` | `getExerciseWarning`, `guessMuscleGroupStandalone` | Injury-aware exercise warnings; keyword-based muscle group guesser |

## `styles/`

| File | Exports | Notes |
|---|---|---|
| `theme.js` | `shellStyle`, `navStyle`, `cardStyle`, `secondaryBtn`, `primaryBtn`, `pillStyle(active)`, `inputStyle`, `labelStyle`, `iconBtn`, `checkboxStyle`, `tagStyle` | Shared inline-style objects. `tagStyle` currently has no callers — kept for parity with the pre-refactor file, safe to use or remove |
| `GlobalStyle.jsx` | `GlobalStyle` | Rendered once at the root of each top-level screen (loading/onboarding/main shell all mount it). Injects CSS custom properties, keyframes, and the `.app-shell` rules |

## `components/` — reusable, mostly presentational

| Component | Used by | Purpose |
|---|---|---|
| `NavBtn` | `App.jsx` | One bottom-nav tab button (icon + label) |
| `Stat` | `SettingsTab` | Label/value row |
| `ColorLegendBanner` | `TodayTab`, `RecipesCard` | "Green = have it / Red = need it" ingredient legend |
| `ReadAloudButton` | `Onboarding`, `HealthOnboarding` | Text-to-speech playback with word-by-word highlighting (accessibility feature, opt-in during onboarding) |
| `Gauge` | `GaugeGrid` | Single circular dial (calories/protein/carbs/fat/sodium). Geometry driven entirely by the numeric `size` prop; see the responsive-scaling note in architecture.md |
| `GaugeGrid` | `TodayTab` | Featured dial + tappable thumbnail row; owns which macro is "featured"/"expanded" |
| `MacroChip` | *(none currently)* | Small ring-progress macro readout. Not wired into any screen — kept from the original file in case it's needed later |
| `WeightBar` | `TodayTab` | Progress bar toward goal weight |
| `WeekChart` | `TrendsTab` | Last-7-days calorie bar chart, reads from `dayHistory` |
| `WeightTrend` | `TrendsTab` | Last-7-weigh-ins bar chart, reads from `weightLog` |
| `DateTimeHeader` | *(none currently)* | Live-updating date/time header. Not wired into any screen — same as `MacroChip` |
| `WeighInInput` | `TodayTab` | Quick weight-log text input |
| `WaterTracker` | `TodayTab` | Fluid intake progress bar |
| `MicronutrientCard` | `TodayTab` | Collapsible fiber/iron/vitamin C/calcium/potassium progress bars |
| `FastingTimer` | `TodayTab` | Time since last logged meal vs. fasting goal |
| `MuscleMapView` | `WorkoutsTab` | Front/back SVG body diagram, colored by 7-day training volume per muscle; tapping a muscle shows saved exercises + suggestions |
| `RestTimer` | `WorkoutsTab` | Standalone work/rest interval timer with audio beeps |
| `RecipesCard` | `TodayTab` | Saved recipes list + "import from text/link" flow |
| `ExerciseEntryForm` | `WorkoutsTab` | Weight/reps/sets entry after a workout photo is identified, shows injury warnings |

## `features/` — one folder per screen

Every `*Tab` component (and `Onboarding`/`HealthOnboarding`) is presentational: it takes data and handler functions as props from `App.jsx` and renders them, with only incidental local UI state (e.g. `RecipesCard`'s "which recipe is expanded"). None of them read or write `localStorage` directly.

| Folder | Component | Renders |
|---|---|---|
| `onboarding/` | `Onboarding` | Targets form (weight/height/age/activity/pace) → computes initial `Profile` via `calcTargets` |
| `onboarding/` | `HealthOnboarding` | Conditions/injuries/allergies/diet pattern form, shown right after `Onboarding` |
| `today/` | `TodayTab` | Gauges, weight/water/micronutrient/fasting trackers, AI meal suggestion + day plan, recipes, meal log |
| `workouts/` | `WorkoutsTab` | Muscle map, rest timer, quick-add chips, exercise entry form, today's logged sets |
| `pantry/` | `PantryTab` | Fridge/pantry photo scan buttons + item grid |
| `shopping/` | `ShoppingTab` | Shopping list with check-off/delete |
| `settings/` | `SettingsTab` | Read-only target summary + "Redo my targets" (resets `profile` to `null`, re-triggering onboarding) |
| `trends/` | `TrendsTab` | Weekly calorie and weight charts |

## Things worth knowing before you refactor further

- **Two similar-but-different muscle-group guessers exist on purpose.** `lib/exercise.js`'s `guessMuscleGroupStandalone` (used for display/read-only purposes in `MuscleMapView`) and `App.jsx`'s local `guessMuscleGroup` (used only when saving a *new* exercise to `exerciseLibrary`) have slightly different fallback regexes. They were kept separate during the file-splitting refactor specifically to avoid changing behavior — if you need to touch muscle-group inference, check both.
- **`MacroChip` and `DateTimeHeader` are currently dead code**, carried over unused from before the refactor. They're fully self-contained if you want to wire one in, or safe to delete if you'd rather not carry unused components.
- **Props, not Context.** Tab components take a lot of individual props rather than one bundled object — this was a deliberate choice to keep each prop's origin traceable by reading the component's signature, at the cost of some verbosity at the call site in `App.jsx`. If a Tab's prop list grows much further, grouping related props into a single object (e.g. a `today` bundle) would be a reasonable follow-up.
