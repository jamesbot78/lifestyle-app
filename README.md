# lifestyle-app

A nutritional tracking lifestyle fitness app with AI integrations for calorie counting.

## Prerequisites

- Node.js (18 or later recommended)
- npm

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and fill in your key:

   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and set `ANTHROPIC_API_KEY`.

3. Start the dev server:

   ```bash
   npm run dev
   ```

## Environment variables

| Variable            | Required | Used by                  | Notes                                              |
| -------------------|:--------:|---------------------------|-----------------------------------------------------|
| `ANTHROPIC_API_KEY` | Yes      | `api/ask-claude.js`       | Server-side only, never exposed to the client.      |

`.env.local` is git-ignored, so your key never gets committed.

## Deployment

This app is deployed on Vercel. `api/ask-claude.js` runs as a Vercel serverless function.

For deployments to work, `ANTHROPIC_API_KEY` must also be set in the Vercel project's Environment Variables settings (under Project Settings, Environment Variables), for whichever environments you use: Production, Preview, and/or Development. A key set only in `.env.local` is local to your machine and has no effect on the deployed app.

## Project structure

```
api/ask-claude.js    Vercel serverless function, proxies to the Anthropic API server-side
src/main.jsx          App entry point
src/App.jsx            Orchestrator: state, effects, localStorage persistence, handlers
src/lib/                 Pure helper functions (time, image, API, nutrition, exercise, svg)
src/styles/               Shared style constants + the injected global stylesheet
src/components/            Reusable UI components (gauges, cards, timers, forms, ...)
src/features/                One folder per screen (onboarding, today, workouts, pantry, shopping, settings, trends)
index.html                    Vite HTML entry
vite.config.js                  Vite/React build config
```

See [`documentation/`](./documentation) for a deeper look at the architecture, data model, and AI integration.

## Available scripts

| Command           | Description                              |
|--------------------|-------------------------------------------|
| `npm run dev`      | Start the local dev server with hot reload |
| `npm run build`    | Build a production bundle into `dist/`     |
| `npm run preview`  | Preview the production build locally       |

## Contributing

1. Fork or clone the repo and follow the Local setup steps above.
2. Create a branch for your change: `git checkout -b your-branch-name`.
3. Make your changes and confirm `npm run build` completes without errors.
4. Never commit `.env`, `.env.local`, or any file containing a real API key. `.gitignore` already excludes these, but double-check `git status` before committing.
5. Open a pull request describing what changed and why.

There is currently no linter or test suite configured, so please keep changes focused and manually verify the app in the browser (`npm run dev`) before opening a pull request.
