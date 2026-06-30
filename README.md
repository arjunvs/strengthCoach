# StrengthCoach

A mobile-first web application for tracking the [Starting Strength](https://startingstrength.com/) novice linear progression (LP) program. Log every workout, get automatic weight recommendations, track your progress over time, and stay consistent.

---

## Features

- **Automatic A/B alternation** — workouts rotate A→B→A→B regardless of missed days, just like the program prescribes
- **Weight progression engine** — increments weight on success, holds on failure, resets to 90% after 3 consecutive failures
- **Per-set logging** — record reps completed + optional RPE for each set with large, touch-friendly controls
- **Rest timer** — configurable countdown with vibration on expiry; auto-starts after each logged set
- **Estimated 1RM** — Epley formula applied per set, tracked over time
- **Progress charts** — working weight and estimated 1RM over time (Recharts line charts)
- **History** — paginated list of past sessions with per-set detail view and delete
- **Personal records** — automatically detected and stored when a new best is set
- **Settings** — kg/lb toggle, per-exercise increments, alternate exercise (Power Clean / Barbell Row / Chin-ups), rest timer duration, dark mode
- **Data export** — download all workout data as JSON
- **PWA** — installable, works offline for cached screens

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Zustand, Recharts |
| Backend | Node.js 22, Express, TypeScript, ts-node |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | JWT (7-day), bcrypt (rounds=12) |
| Testing | Vitest — 55 engine unit tests |
| PWA | `public/manifest.json` + service worker (app-shell cache, network-first for `/api/`) |

---

## Architecture

### Pluggable Progression Engine

All progression logic lives behind a `ProgressionEngine` interface (Strategy Pattern) in `backend/src/engine/`. The Starting Strength engine is one implementation:

```
backend/src/engine/
├── engine.interface.ts          # ProgressionEngine contract
├── engine.types.ts              # shared types (ProgramState, WorkoutPlan, …)
└── starting-strength/
    ├── ss-engine.ts             # StartingStrengthEngine implements ProgressionEngine
    ├── ss-rules.ts              # exercise definitions, sets/reps, default increments
    └── ss-formulas.ts           # pure functions: Epley 1RM, roundToIncrement, reset weight
```

Adding a new program (Madcow 5×5, Texas Method, 5/3/1, Greyskull LP) means creating a new file that implements `ProgressionEngine` and registering it — no changes to routes, controllers, or the database schema.

### Weights are always stored in kg

Unit conversion (×2.20462) happens at the display boundary only — in `useUnit()` on the frontend.

---

## Starting Strength Rules

| Workout | Exercises |
|---|---|
| **A** | Squat 3×5 · Bench Press 3×5 · Deadlift 1×5 |
| **B** | Squat 3×5 · Overhead Press 3×5 · Power Clean 5×3 *(or Barbell Row / Chin-ups)* |

Workouts alternate A→B→A→B. Missed days do not reset the sequence.

**Progression:**
- All prescribed reps completed → add increment next session
- Any failure → hold weight, increment failure counter
- 3 consecutive failures → reset: `floor(weight × 0.90 / 2.5) × 2.5`, counter resets to 0

**Default increments:**

| Exercise | Increment |
|---|---|
| Squat | +2.5 kg |
| Bench Press | +2.5 kg |
| Overhead Press | +2.5 kg |
| Deadlift | +5.0 kg |
| Power Clean | +2.5 kg |

All increments are user-configurable in Settings.

---

## Prerequisites

- Node.js 22+
- PostgreSQL 16
- npm

---

## Local Setup

```bash
# 1. Clone and configure environment
git clone https://github.com/arjunvs/strengthCoach.git
cd strengthCoach
cp .env.example backend/.env
# Edit backend/.env — set DATABASE_URL and JWT_SECRET

# 2. Backend
cd backend
npm install
npm run db:migrate    # runs: prisma migrate dev
npm run db:seed       # seeds 7 default exercises
npm run dev           # starts Express on :3001

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev           # starts Vite on :5173
```

Open http://localhost:5173, register an account, and start your first workout.

---

## Running Tests

```bash
cd backend
npm test              # vitest — 55 unit tests across 5 files
```

Tests cover: Epley formula, `roundToIncrement`, reset weight calculation, A/B alternation, per-exercise increment logic, failure counting, and full reset integration.

---

## API Overview

All responses follow `{ success: boolean, data: T, error: { code, message } | null }`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in, returns JWT |
| POST | `/api/auth/logout` | Invalidate session |
| GET | `/api/workouts/next` | Preview next workout (not persisted) |
| POST | `/api/workouts/start` | Create session + pre-populated sets |
| PUT | `/api/workouts/:id/exercises/:exId/sets/:n` | Record one set |
| POST | `/api/workouts/:id/complete` | Finalize, run engine, update progression state |
| GET | `/api/workouts/history` | Paginated history |
| GET | `/api/progress/summary` | Current weights, streak, last session |
| GET | `/api/progress/:exerciseId` | Time-series for charts |
| GET/PUT | `/api/settings` | User settings |
| GET | `/api/personal-records` | All-time PRs |
| GET | `/api/export` | Full data export (JSON) |

---

## Environment Variables

See `.env.example` for the full list. Key variables:

```bash
# backend/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/strengthcoach_dev"
JWT_SECRET="<64-char random string>"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```
