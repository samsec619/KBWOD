# KB WOD

A kettlebell & bodyweight workout-of-the-day app that runs in any browser and installs on iPhone as a home-screen app (PWA). No build step, no backend — all data stays on the device.

## Features

- **Timers:** AMRAP, EMOM (any interval, e.g. E2MOM), For Time (with optional cap and rounds), Intervals (work/rest), Tabata
  - 10 s get-ready countdown, 3-2-1 beeps, voice announcements of the current/next exercise
  - Round counter for AMRAP / For Time, pause/resume, keeps the screen awake
  - Movements rotate each round in EMOM / Interval / Tabata workouts
- **Exercise library:** 40+ kettlebell and bodyweight movements with coaching cues, searchable by name or muscle
- **Combos:** built-in combos (e.g. 2 swings + 4 goblet squats = 1 rep) and a builder for your own
- **WODs:** 7 featured workouts, your own WOD builder (reps, reps/side, seconds, bell weight), random WOD generator (format, length, focus, equipment)
- **Log:** save results (rounds + reps, time, notes) after each workout; export/import backups as JSON

## Run locally

```sh
npm start        # serves on http://localhost:8080 (or: python3 -m http.server 8080)
npm test         # unit tests for the timer engine, library and generator
```

ES modules and the service worker need the files to be served over http(s), not opened via `file://`.

## Publish & install on iPhone

1. In the GitHub repo go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Merge to `main` — `.github/workflows/pages.yml` runs the tests and deploys the site.
3. On the iPhone, open the Pages URL in **Safari → Share → Add to Home Screen**. It then launches full-screen and works offline.

Any static host (Netlify, Vercel, Cloudflare Pages) also works — just upload the repo root.

When shipping changes, bump `CACHE` in `sw.js` so installed copies fetch the new files.

## Project layout

| Path | What |
| --- | --- |
| `index.html`, `css/styles.css` | App shell and styles (dark, iPhone safe-area aware) |
| `js/app.js` | Views, routing, workout session |
| `js/timer.js` | Timer engine (segments, state, pausable clock) |
| `js/exercises.js` | Exercise & combo library |
| `js/presets.js` | Featured WODs |
| `js/generator.js` | Random WOD generator |
| `js/store.js` | localStorage persistence, backup export/import |
| `js/audio.js` | Beeps, speech, screen wake lock |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA / offline / home-screen install |
