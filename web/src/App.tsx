import { useEffect, useMemo, useState } from "react";
import { encode } from "@toon-format/toon";
import { Button } from "@/components/ui/button";
import { COPY_FORMATS, CopyMenu, type CopyFormat } from "@/components/copy-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster, toast } from "sonner";

type Project = {
  id: number;
  title: string;
  score: number;
  minBudget: number;
  maxBudget: number;
  budget: number;
  duration: number;
  rating: number;
  ratingCount: number;
  bids: number;
  country: string | null;
  skills: string[];
  url: string | null;
  description: string | null;
  starred: number;
  successRate: number;
  urgent: number;
};

type SortKey = "score" | "title" | "minBudget" | "maxBudget" | "budget" | "duration" | "rating" | "bids" | "country";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey | "skills" | "starred" | "urgent" | "successRate"; label: string; type: "number" | "string" | "boolean" }[] = [
  { key: "score", label: "Score", type: "number" },
  { key: "title", label: "Title", type: "string" },
  { key: "minBudget", label: "Budget min", type: "number" },
  { key: "maxBudget", label: "Budget max", type: "number" },
  { key: "budget", label: "Budget avg", type: "number" },
  { key: "duration", label: "Dur (d)", type: "number" },
  { key: "rating", label: "Rating", type: "number" },
  { key: "bids", label: "Bids", type: "number" },
  { key: "country", label: "City", type: "string" },
  { key: "skills", label: "Skills", type: "string" },
  { key: "starred", label: "Starred", type: "boolean" },
  { key: "urgent", label: "Urgent", type: "boolean" },
  { key: "successRate", label: "Success rate", type: "number" },
];

type Filter = { id: number; col: string; op: string; val: string };

const OPS: Record<string, string[]> = {
  number: ["min", "max", "equal", "not-equal"],
  string: ["equal", "not-equal", "contains"],
  boolean: ["equal", "not-equal"],
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formula, setFormula] = useState("");
  const [defaultFormula, setDefaultFormula] = useState("");
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fromPage, setFromPage] = useState("1");
  const [toPage, setToPage] = useState("1");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [view, setView] = useState<"all" | "starred">("all");
  const [selected, setSelected] = useState<Project | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [nextFilterId, setNextFilterId] = useState(1);

  const money = (n: number) => Number(n || 0).toLocaleString("en-US");

  async function loadSettings() {
    const r = await fetch("/api/settings");
    const d = await r.json();
    setFormula(d.formula);
    setDefaultFormula(d.defaultFormula);
    setCount(d.count);
  }

  async function loadProjects() {
    setLoading(true);
    try {
      const url = view === "starred" ? "/api/projects?starred=1" : "/api/projects";
      const r = await fetch(url);
      const d = await r.json();
      setProjects(d.projects);
      setFormula(d.formula);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings().then(loadProjects);
  }, [view]);

  async function saveFormula() {
    await fetch("/api/settings/formula", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formula }),
    });
    toast.success("Formula saved");
    loadProjects();
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const r = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromPage: Number(fromPage) || 0, toPage: Number(toPage) || 0 }),
      });
      const d = await r.json();
      toast.success(`Fetched ${d.fetched} projects (total ${d.total})`);
      await loadSettings();
      await loadProjects();
    } catch {
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function toggleStar(p: Project, e?: React.MouseEvent) {
    e?.stopPropagation();
    const r = await fetch(`/api/projects/${p.id}/star`, { method: "POST" });
    const d = await r.json();
    setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, starred: d.starred ? 1 : 0 } : x)));
    if (selected?.id === p.id) setSelected({ ...selected, starred: d.starred ? 1 : 0 });
    toast.success(d.starred ? "Starred" : "Unstarred");
  }

  async function openDetail(p: Project) {
    setSelected(p);
    if (!p.description && p.url) {
      setDetailLoading(true);
      try {
        const r = await fetch(`/api/projects/${p.id}/detail`);
        const d = await r.json();
        setSelected((prev) => (prev && prev.id === p.id ? { ...prev, description: d.description } : prev));
        setProjects((prev) => prev.map((x) => (x.id === p.id ? { ...x, description: d.description } : x)));
      } finally {
        setDetailLoading(false);
      }
    }
  }

  async function copyToClipboard(text: string, successMsg: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMsg);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success(successMsg);
    }
  }

  function projectMarkdown(p: Project) {
    return [
      `# ${p.title}`,
      ``,
      `- **Score:** ${Math.round(p.score * 100) / 100}`,
      `- **Budget min:** ${money(p.minBudget)}`,
      `- **Budget max:** ${money(p.maxBudget)}`,
      `- **Budget avg:** ${money(p.budget)}`,
      `- **Duration:** ${p.duration} days`,
      `- **Rating:** ${p.rating || "N/A"} (${p.ratingCount} ratings)`,
      `- **Bids:** ${p.bids}`,
      `- **City:** ${p.country || "—"}`,
      `- **Success rate:** ${p.successRate}%`,
      `- **Urgent:** ${p.urgent ? "Yes" : "No"}`,
      `- **Skills:** ${p.skills.join(", ") || "—"}`,
      p.url ? `- **URL:** https://www.karlancer.com/projects/${p.url}` : "",
      ``,
      `## Description`,
      ``,
      p.description || "No description.",
    ].filter((l) => l !== undefined).join("\n");
  }

  function projectPayload(p: Project) {
    return {
      id: p.id,
      title: p.title,
      score: Math.round(p.score * 100) / 100,
      budgetMin: p.minBudget,
      budgetMax: p.maxBudget,
      budgetAvg: p.budget,
      durationDays: p.duration,
      rating: p.rating || null,
      ratingCount: p.ratingCount,
      bids: p.bids,
      city: p.country,
      successRate: p.successRate,
      urgent: Boolean(p.urgent),
      starred: Boolean(p.starred),
      skills: p.skills,
      url: p.url ? `https://www.karlancer.com/projects/${p.url}` : null,
      description: p.description || null,
    };
  }

  async function copyProject(p: Project, format: CopyFormat) {
    const label = COPY_FORMATS.find((f) => f.id === format)?.label ?? format;
    let text: string;
    if (format === "markdown") text = projectMarkdown(p);
    else if (format === "json") text = JSON.stringify(projectPayload(p), null, 2);
    else text = encode(projectPayload(p));
    await copyToClipboard(text, `Copied as ${label}`);
  }

  function applyFilters(list: Project[]) {
    return list.filter((p) => {
      return filters.every((f) => {
        const col = COLUMNS.find((c) => c.key === f.col);
        if (!col) return true;
        const raw = (p as any)[f.col];
        const type = col.type;
        if (type === "number") {
          const v = Number(f.val);
          if (isNaN(v)) return true;
          if (f.op === "min") return Number(raw) >= v;
          if (f.op === "max") return Number(raw) <= v;
          if (f.op === "equal") return Number(raw) === v;
          if (f.op === "not-equal") return Number(raw) !== v;
        }
        if (type === "string") {
          const s = String(raw ?? "").toLowerCase();
          const v = f.val.toLowerCase();
          if (f.op === "equal") return s === v;
          if (f.op === "not-equal") return s !== v;
          if (f.op === "contains") return s.includes(v);
        }
        if (type === "boolean") {
          const b = f.val === "true" || f.val === "1";
          if (f.op === "equal") return Boolean(raw) === b;
          if (f.op === "not-equal") return Boolean(raw) !== b;
        }
        return true;
      });
    });
  }

  const sorted = useMemo(() => {
    let arr = [...projects];
    arr = applyFilters(arr);
    arr.sort((a, b) => {
      const va = (a as any)[sortKey];
      const vb = (b as any)[sortKey];
      let cmp = 0;
      if (typeof va === "string" && typeof vb === "string") cmp = va.localeCompare(vb);
      else cmp = (va ?? 0) - (vb ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [projects, sortKey, sortDir, filters]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

  function addFilter() {
    setFilters((prev) => [...prev, { id: nextFilterId, col: "score", op: "min", val: "" }]);
    setNextFilterId((n) => n + 1);
  }

  function updateFilter(id: number, patch: Partial<Filter>) {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeFilter(id: number) {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <Toaster />
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Karlancer Evaluator</h1>
          <Badge variant="secondary">{count} cached projects</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scoring formula</CardTitle>
            <CardDescription>JavaScript expression. See docs/formula.md for all variables.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={formula} onChange={(e) => setFormula(e.target.value)} rows={3} className="font-mono text-sm" />
            <div className="flex gap-2 items-center">
              <Button onClick={saveFormula}>Save &amp; rescore</Button>
              <Button variant="outline" onClick={() => setFormula(defaultFormula)}>Reset to default</Button>
              <span className="text-xs text-muted-foreground ml-auto truncate">default: {defaultFormula}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refresh from karlancer.com</CardTitle>
            <CardDescription>Manual fetch to reduce unnecessary HTTP requests. Enter page range (0 = all).</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 items-center flex-wrap">
            <span className="text-sm text-muted-foreground">From page</span>
            <Input type="number" value={fromPage} onChange={(e) => setFromPage(e.target.value)} className="w-20" />
            <span className="text-sm text-muted-foreground">To page</span>
            <Input type="number" value={toPage} onChange={(e) => setToPage(e.target.value)} className="w-20" />
            <Button onClick={refresh} disabled={refreshing}>{refreshing ? "Fetching..." : "Refresh"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Projects (click row for details, header to sort)</CardTitle>
              <div className="flex gap-2">
                <Button variant={view === "all" ? "default" : "outline"} size="sm" onClick={() => setView("all")}>All</Button>
                <Button variant={view === "starred" ? "default" : "outline"} size="sm" onClick={() => setView("starred")}>Starred</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Column filters</span>
                <Button size="sm" variant="outline" onClick={addFilter}>+ Add filter</Button>
              </div>
              {filters.map((f) => {
                const col = COLUMNS.find((c) => c.key === f.col);
                const type = col?.type || "string";
                return (
                  <div key={f.id} className="flex gap-2 items-center flex-wrap">
                    <Select value={f.col} onValueChange={(v) => updateFilter(f.id, { col: v ?? f.col, op: OPS[COLUMNS.find((c) => c.key === (v ?? f.col))?.type || "string"][0] })}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COLUMNS.map((c) => (<SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <Select value={f.op} onValueChange={(v) => updateFilter(f.id, { op: v ?? f.op })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OPS[type].map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    {type === "boolean" ? (
                      <Select value={f.val} onValueChange={(v) => updateFilter(f.id, { val: v ?? f.val })}>
                        <SelectTrigger className="w-24"><SelectValue placeholder="value" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">true</SelectItem>
                          <SelectItem value="false">false</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={f.val} onChange={(e) => updateFilter(f.id, { val: e.target.value })} placeholder="value" className="w-40" />
                    )}
                    <Button size="sm" variant="ghost" onClick={() => removeFilter(f.id)}>✕</Button>
                  </div>
                );
              })}
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("score")}>Score{arrow("score")}</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("title")}>Title{arrow("title")}</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("minBudget")}>Budget min{arrow("minBudget")}</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("maxBudget")}>Budget max{arrow("maxBudget")}</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("budget")}>Budget avg{arrow("budget")}</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("duration")}>Dur (d){arrow("duration")}</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("rating")}>Rating{arrow("rating")}</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("bids")}>Bids{arrow("bids")}</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("country")}>City{arrow("country")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((p, i) => (
                      <TableRow key={p.id} className="cursor-pointer" onClick={() => openDetail(p)}>
                        <TableCell onClick={(e) => toggleStar(p, e)}>
                          <span className={p.starred ? "text-yellow-500" : "text-muted-foreground"}>{p.starred ? "★" : "☆"}</span>
                        </TableCell>
                        <TableCell className="font-bold">{i + 1}. {Math.round(p.score * 100) / 100}</TableCell>
                        <TableCell className="max-w-xs truncate">{p.title}</TableCell>
                        <TableCell>{money(p.minBudget)}</TableCell>
                        <TableCell>{money(p.maxBudget)}</TableCell>
                        <TableCell>{money(p.budget)}</TableCell>
                        <TableCell>{p.duration}</TableCell>
                        <TableCell>{p.rating || "N/A"}</TableCell>
                        <TableCell>{p.bids}</TableCell>
                        <TableCell>{p.country}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle className="break-words">{selected.title}</DialogTitle>
                  <DialogDescription>
                    {selected.country} · {selected.duration} days · {selected.rating || "N/A"} rating
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><span className="font-semibold">Budget min:</span> {money(selected.minBudget)}</div>
                    <div><span className="font-semibold">Budget max:</span> {money(selected.maxBudget)}</div>
                    <div><span className="font-semibold">Budget avg:</span> {money(selected.budget)}</div>
                    <div><span className="font-semibold">Score:</span> {Math.round(selected.score * 100) / 100}</div>
                    <div><span className="font-semibold">Rating count:</span> {selected.ratingCount}</div>
                    <div><span className="font-semibold">Bids:</span> {selected.bids}</div>
                    <div><span className="font-semibold">Success rate:</span> {selected.successRate}%</div>
                    <div><span className="font-semibold">Urgent:</span> {selected.urgent ? "Yes" : "No"}</div>
                  </div>
                  <div>
                    <span className="font-semibold">Skills:</span>
                    {selected.skills.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {selected.skills.map((skill, i) => (
                          <Badge key={`${skill}-${i}`} variant="secondary" className="font-normal">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground"> —</span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold">Description:</span>
                    <div className="mt-1 whitespace-pre-wrap text-muted-foreground max-h-48 overflow-auto break-words">
                      {detailLoading ? "Loading..." : (selected.description || "No description cached.")}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => toggleStar(selected)}>
                      {selected.starred ? "★ Unstar" : "☆ Star"}
                    </Button>
                    {selected.url && (
                      <a href={`https://www.karlancer.com/projects/${selected.url}`} target="_blank" rel="noreferrer">
                        <Button variant="outline">Open on karlancer</Button>
                      </a>
                    )}
                    <CopyMenu onCopy={(format) => copyProject(selected, format)} />
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
