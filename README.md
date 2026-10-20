# karlancer-evaluator

Bun + TypeScript + Hono + Drizzle (SQLite) + React/Tailwind/shadcn.

Fetches freelance projects from karlancer.com, scores them with a dynamic
formula, and sorts them. A minimal web UI lets you view projects and edit the
formula. SQLite caches projects to avoid redundant HTTP requests.

## Run

```bash
bun install
bun run build:web
bun run start        # http://localhost:3000
```

Dev:
```bash
bun run dev          # backend (watch)
bun run dev:web      # frontend dev server (proxies /api to :3000)
```

## Usage

1. Open http://localhost:3000
2. Click "Refresh" to fetch projects (choose pages; 0 = all).
3. Edit the formula textarea, "Save & rescore".
4. Projects table updates sorted by score.

## Formula variables

budget, minBudget, maxBudget, duration, rating, ratingCount, bids, country,
urgent, fulltime, onsite, highlight, ladder, pin, multi, lowHire, successRate.
EOF