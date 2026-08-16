# AI integration

## The proxy pattern

The browser never talks to Anthropic directly. `lib/api.js`'s `askClaude({ text, imageBase64, maxTokens })` builds a content array (optionally with a base64 JPEG image block) and `POST`s it to the app's own `/api/ask-claude` endpoint:

```
Browser  →  POST /api/ask-claude  { content, maxTokens }
Vercel fn (api/ask-claude.js)  →  POST https://api.anthropic.com/v1/messages   (attaches x-api-key server-side)
                                ←  Claude's response
Browser  ←  raw Anthropic response JSON
```

`api/ask-claude.js` is a Vercel serverless function — it's the **only** place `ANTHROPIC_API_KEY` is read (`process.env.ANTHROPIC_API_KEY`), and it must be set in the Vercel project's environment variables for deployments to work (see the top-level README). Model is hardcoded there: `claude-sonnet-4-5-20250929`.

`askClaude()` then post-processes the response on the client: it concatenates all `text` content blocks, strips ```` ```json ```` / ```` ``` ```` fences if present, and `JSON.parse`s the result. **Every prompt below explicitly asks for "ONLY raw JSON, no markdown"** — this parsing step is why. If Claude ever wraps the reply in prose, `JSON.parse` throws and the caller's `catch` block shows a generic "couldn't read that" error to the user.

## Call sites

All six live in `App.jsx` (the handlers are passed down to the relevant Tab as props).

| Handler | Triggered from | Input | Expected JSON shape |
|---|---|---|---|
| `handleMealPhoto` | Today tab → "Snap a meal or drink" | Photo of food/drink | `{ name, calories, protein, carbs, fat, sodium, sugar, fiber, iron, vitaminC, calcium, potassium, isDrink, fluidCups, allergens[], containsMeat, containsFish, containsEggs, containsDairy }` |
| `handlePantryPhoto` | Groceries tab → "Scan fridge" / "Scan pantry" | Photo of fridge/pantry/cupboard | `{ items: [{ name, category }] }` — category is one of `protein, carb, veg, fruit, dairy, other` |
| `handleWorkoutPhoto` | Workouts tab → "Snap a new machine" | Photo of gym equipment | `{ exerciseName }` — short common name, e.g. "Leg Press" |
| `handleSuggest` | Today tab → "Suggest my next meal" | Text only: remaining macros for the day, pantry contents, past meal ratings, health constraints | `{ meal, why, ingredients[], uses[], missing[] }` |
| `handlePlanDay` | Today tab → "Plan the rest of my day" | Same context as above, asks for 2–4 meals | `{ meals: [{ name, why, calories, ingredients[], uses[], missing[] }] }` |
| `handleImportRecipe` | Today tab → Recipes card → "Add recipe from text or link" | Pasted recipe text/caption/link | `{ name, ingredients[], steps[], calories, protein, carbs, fat }` |

For the two photo-analysis meal/pantry calls, the image is resized client-side before upload — `lib/image.js`'s `fileToResizedBase64` (max 900px, JPEG quality 0.72) keeps the request small; a separate `fileToThumbDataUrl` (max 120px, quality 0.6) generates the tiny thumbnail that gets stored alongside the log entry so the UI doesn't have to keep the full-size photo around.

## Preference and health context injected into prompts

`handleSuggest` and `handlePlanDay` build two optional context strings before calling `askClaude`:

- **`preferenceLine`** — pulls meals the user rated `love`/`like`/`bad` out of today's `log`, and asks the model to favor similar meals and avoid disliked ones.
- **`healthLine`** — only included if the profile has `conditions`, `allergies`, or a non-`"none"` `dietPattern` set. States the remaining sodium budget, lists allergies to avoid entirely, states the dietary pattern to honor, and adds specific asks for diabetes (lower sugar), celiac (avoid gluten), lactose intolerance (avoid dairy).

Both strings are plain string interpolation into the prompt text — there's no structured tool-use/function-calling here, just a single free-text prompt per call with a JSON-shape instruction at the end.

## Error handling

Every handler follows the same pattern: `setBusy("<tag>")` → `try { await askClaude(...); ...update state... } catch { setError("user-facing message") } finally { setBusy(null) }`. `busy` gates the relevant button (shows a spinner, disables re-entry) and `error` is rendered inline on the Today/Workouts tab. There's no retry logic — the user just taps the button again.
