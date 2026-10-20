import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { fetchAllPages, fetchProjectDetail } from "./lib/api";
import { normalize, toContext } from "./lib/normalize";
import { buildEvaluator } from "./lib/formula";
import { upsertProjects, getAllProjects, countProjects, getSetting, setSetting, getProject, toggleStar, updateDescription } from "./db/repo";

const app = new Hono();
app.use("*", cors());

const DEFAULT_FORMULA = "(maxBudget / (duration || 1)) * (rating > 0 ? rating : 1) / ((bids || 0) + 1)";

app.get("/api/projects", async (c) => {
  const formula = (await getSetting("formula")) || DEFAULT_FORMULA;
  const evalFn = buildEvaluator(formula);
  const starredOnly = c.req.query("starred") === "1";
  let rows = await getAllProjects();
  if (starredOnly) rows = rows.filter((r) => r.starred);
  const scored = rows.map((p) => ({ ...p, score: evalFn(toContext(p)) }));
  scored.sort((a, b) => b.score - a.score);
  return c.json({ formula, count: scored.length, projects: scored });
});

app.get("/api/projects/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const p = await getProject(id);
  if (!p) return c.json({ error: "not found" }, 404);
  return c.json(p);
});

app.get("/api/projects/:id/detail", async (c) => {
  const id = Number(c.req.param("id"));
  const p = await getProject(id);
  if (!p) return c.json({ error: "not found" }, 404);
  if (!p.description && p.url) {
    const desc = await fetchProjectDetail(p.url);
    if (desc) await updateDescription(id, desc);
    p.description = desc;
  }
  return c.json(p);
});

app.post("/api/projects/:id/star", async (c) => {
  const id = Number(c.req.param("id"));
  const starred = await toggleStar(id);
  return c.json({ ok: true, starred });
});

app.get("/api/settings", async (c) => {
  const formula = (await getSetting("formula")) || DEFAULT_FORMULA;
  const count = await countProjects();
  return c.json({ formula, defaultFormula: DEFAULT_FORMULA, count });
});

app.post("/api/settings/formula", async (c) => {
  const body = await c.req.json<{ formula: string }>();
  await setSetting("formula", body.formula);
  return c.json({ ok: true });
});

app.post("/api/refresh", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const maxPages = Number((body as any)?.maxPages ?? 0);
  const { projects: raw } = await fetchAllPages("newest", maxPages, 150, 4);
  const normalized = raw.map(normalize);
  await upsertProjects(normalized);
  const count = await countProjects();
  return c.json({ ok: true, fetched: raw.length, total: count });
});

// Serve built frontend (if present) else a tiny fallback
app.get("*", serveStatic({ root: "./web/dist" }));
app.get("*", async (c) => {
  // fallback index
  const file = Bun.file("./web/dist/index.html");
  if (await file.exists()) return c.html(await file.text());
  return c.text("Frontend not built. Run: bun run build:web", 404);
});

const port = Number(process.env.PORT || 3000);
console.log(`karlancer-evaluator running on http://localhost:${port}`);
export default { port, fetch: app.fetch };
