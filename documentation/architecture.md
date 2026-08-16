# Architecture

## Tech stack

- **React 18** + **Vite 5** (`@vitejs/plugin-react`) — no meta-framework, no router.
- **No CSS framework.** Every component is styled with inline `style={{...}}` objects, plus one injected `<style>` tag (`styles/GlobalStyle.jsx`) for CSS custom properties, `@keyframes`, and the handful of rules that can't be expressed inline (media queries, `::before` pseudo-elements).
- **[lucide-react](https://lucide.dev/)** for icons.
- **Vercel serverless function** (`api/ask-claude.js`) proxies every AI call to Anthropic's API — the client never holds or sends the API key. See [ai-integration.md](./ai-integration.md).
- **No state management library.** All app state lives in `useState`/`useEffect` inside `src/App.jsx` and is threaded down as props. No Redux/Zustand/Context.
- **No router.** Navigation between the 6 sections ("tabs") is a plain `tab` string in `App.jsx` state, switched by the bottom nav bar.
- **No test suite, no linter** currently configured. Verify changes with `npm run build` and manual testing via `npm run dev`.

## Folder layout

```
src/
  main.jsx                 Vite/React entry point, mounts <App /> — rarely needs to change
  App.jsx                  Orchestrator: owns all state, effects, localStorage persistence,
                            and every handler (photo uploads, AI calls, save/update logic).
                            Renders the onboarding gate or the tab shell + nav.

  lib/                     Pure functions, no JSX, no React imports (except where noted)
    constants.js            FONT_LINK
    time.js                  date/quote helpers: todayKey, formatTime, getDailyQuote
    image.js                  client-side image resize helpers for photo uploads
    api.js                     askClaude() — the one function that talks to /api/ask-claude
    svg.js                      polar coordinate helpers used by the Gauge dial geometry
    nutrition.js                 calcTargets, computeAdaptiveTargets, getMealWarnings, lerpColor, MICRO_GOALS
    exercise.js                   getExerciseWarning, guessMuscleGroupStandalone

  styles/
    theme.js                 Shared style-object constants (cardStyle, primaryBtn, pillStyle, etc.)
    GlobalStyle.jsx            The injected <style> tag: CSS custom properties, keyframes,
                                the .app-shell responsive rules, decorative background image

  components/               Reusable, mostly-presentational UI pieces used across features.
                            Each file exports one named component. See components.md.

  features/                 One folder per app "screen". Each Tab component is a thin
                            presentational layer — it receives all data and handlers as
                            props from App.jsx and has no state of its own beyond local UI
                            toggles (e.g. which recipe is expanded).
    onboarding/               Onboarding.jsx (targets form), HealthOnboarding.jsx (health/diet form)
    today/                    TodayTab.jsx — gauges, weight/water/fasting trackers, meal log, AI suggestions
    workouts/                 WorkoutsTab.jsx — muscle map, rest timer, exercise log
    pantry/                   PantryTab.jsx — fridge/pantry photo scan + grid
    shopping/                 ShoppingTab.jsx — shopping list
    settings/                 SettingsTab.jsx — read-only target summary + "redo targets"
    trends/                   TrendsTab.jsx — weekly calorie/weight charts

api/
  ask-claude.js             Vercel serverless function, the only place ANTHROPIC_API_KEY is read
```

This is a **container/presentational split**: `App.jsx` is the only container (it owns state), everything under `components/` and `features/` is presentational and receives what it needs via props. There's deliberately no prop-drilling abstraction (no Context, no custom "app store" hook) — for an app this size, explicit props keep the data flow traceable from `App.jsx` down to each leaf component.

## Rendering flow

`App.jsx` renders one of three things depending on state:

1. **`!loaded`** — a brief spinner while the initial `useEffect` reads everything out of `localStorage` (this is synchronous in practice, but the flag avoids a flash of the onboarding screen before storage is checked).
2. **`!profile`** — the onboarding gate: `Onboarding` (targets: weight, height, age, activity, pace) followed by `HealthOnboarding` (conditions, injuries, allergies, dietary pattern). Completing both calls `saveProfile`, which persists to `localStorage` and flips the app into the main shell.
3. **Main shell** — a fixed-position bottom `<nav>` (`NavBtn` × 6) plus a scrollable content area that renders whichever `*Tab` component matches the current `tab` state.

## State management

Every piece of app data (`profile`, `log`, `pantry`, `shopping`, `weightLog`, `dayHistory`, `workoutLog`, `workoutHistory`, `exerciseLibrary`, `recipes`, plus UI state like `busy`/`error`/`suggestion`) is a `useState` in `App.jsx`. Every mutation goes through a `save*` wrapper (`saveProfile`, `saveLog`, `savePantry`, …) that updates React state **and** writes through to `localStorage` in the same call, via the shared `persist(key, value)` helper. There is no debouncing or batching — every save is immediate. See [data-model.md](./data-model.md) for the exact keys and shapes.

Tab components never touch `localStorage` directly — they call the handler passed down from `App.jsx` (e.g. `TodayTab` calls `saveLog(...)`, it doesn't import `persist` itself).

## Styling approach

Inline styles were the original design choice and the refactor preserved it rather than introducing Tailwind/CSS Modules — see [components.md](./components.md) for why. A few things worth knowing:

- **`styles/theme.js`** holds style objects reused across multiple files (`cardStyle`, `primaryBtn`, `secondaryBtn`, `pillStyle`, `inputStyle`, `labelStyle`, `iconBtn`, `checkboxStyle`, `navStyle`, `shellStyle`). Import only what you use.
- **`styles/GlobalStyle.jsx`** is rendered once near the root and injects a `<style>` tag for things inline styles can't do: `:root` CSS custom properties (`--bg`, `--ink`, `--success`, etc., used via `var(--x)` in inline styles too), the `spin` keyframe, `prefers-reduced-motion` handling, and the `.app-shell` rules.
- **Mobile-first / responsive:** the app is deliberately a centered "phone card" (`maxWidth: 480`) at every viewport width — there's no desktop reflow. What *is* responsive is fluidity within that card: `.app-shell` uses `height: 100dvh` (with a `100vh` fallback for browsers without `dvh` support) so the bottom nav doesn't get clipped by mobile browser chrome, and the `Gauge`/`GaugeGrid` dial components render their `<svg>` at `width: "100%", maxWidth: size` (CSS) while keeping the numeric `size` prop driving all internal geometry math (stroke widths, tick positions, `viewBox`) — this scales the whole dial proportionally on narrow phones without needing per-breakpoint recalculation.
