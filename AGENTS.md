Objective

    Build a program that fetches freelance projects from karlancer.com, scores them with a user-defined dynamic formula, and sorts them; includes a minimal web UI and SQLite caching.

Requirements

    Retrieve project info from https://www.karlancer.com (public API /api/publics/search/projects).
    Evaluate projects with a dynamic, user-configurable formula.
    Sort results; support manual refresh to reduce HTTP requests.
    Web UI: React + Tailwind + shadcn on Bun; backend Hono; DB Drizzle/SQLite.
    Table columns sortable by clicking headers; City column (not Country); include Budget min, max, avg.
    Formula documentation listing all available variables.

Decisions

    Rewrote initial Node.js/JS version into Bun/TypeScript full-stack app.
    Backend Hono; frontend React/Tailwind/shadcn via Vite; DB SQLite via Drizzle.
    Manual refresh button (no auto cron/TTL).
    Formula evaluated via new Function over named project variables; stored in settings table.
    Cached 24 projects from a 1-page test fetch in data/karlancer.db.

Work State
Completed

    Bun/TS project scaffolded at /home/mahdi.najafzadeh/.src/karlancer-evaluator (renamed from karlancer-evaluator-ts).
    Backend API: settings, projects, refresh endpoints.
    Frontend UI: formula editor, refresh control, sortable projects table with City + budget min/max/avg columns.
    Formula docs at docs/formula.md.
    Frontend builds successfully; backend runs on port 3000.

Active

    (none)

Blocked

    (none)

Next Move

    Optionally run full fetch (maxPages: 0) to populate DB.
    Add bid counts if an authenticated API becomes available (currently 0).
    Consider adding --min-score filter or export polish.

Relevant Files

    /home/mahdi.najafzadeh/.src/karlancer-evaluator/src/index.ts: Hono server entry.
    /home/mahdi.najafzadeh/.src/karlancer-evaluator/src/lib/api.ts: karlancer paginated fetcher.
    /home/mahdi.najafzadeh/.src/karlancer-evaluator/src/lib/formula.ts: dynamic formula evaluator.
    /home/mahdi.najafzadeh/.src/karlancer-evaluator/src/db/repo.ts: Drizzle SQLite repo.
    /home/mahdi.najafzadeh/.src/karlancer-evaluator/web/src/App.tsx: React UI with sortable table.
    /home/mahdi.najafzadeh/.src/karlancer-evaluator/docs/formula.md: formula variable docs.
    /home/mahdi.najafzadeh/.src/karlancer-evaluator/config.json equivalent in DB settings.

Important Context

    Project dir renamed to karlancer-evaluator; old JS version removed.
    DB file at data/karlancer.db (24 cached projects from test).
    Public API does not expose bid counts (bids defaults to 0).


