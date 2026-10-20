import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formula, setFormula] = useState("");
  const [defaultFormula, setDefaultFormula] = useState("");
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [maxPages, setMaxPages] = useState("1");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [view, setView] = useState<"all" | "starred">("all");
  const [selected, setSelected] = useState<Project | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
        body: JSON.stringify({ maxPages: Number(maxPages) || 0 }),
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

  const sorted = useMemo(() => {
    const arr = [...projects];
    arr.sort((a, b) => {
      const va = (a as any)[sortKey];
      const vb = (b as any)[sortKey];
      let cmp = 0;
      if (typeof va === "string" && typeof vb === "string") cmp = va.localeCompare(vb);
      else cmp = (va ?? 0) - (vb ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [projects, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const money = (n: number) => Number(n || 0).toLocaleString("en-US");
  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "");

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
            <CardDescription>Manual fetch to reduce unnecessary HTTP requests.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 items-center">
            <Input type="number" value={maxPages} onChange={(e) => setMaxPages(e.target.value)} className="w-24" />
            <span className="text-sm text-muted-foreground">pages (0 = all)</span>
            <Button onClick={refresh} disabled={refreshing}>{refreshing ? "Fetching..." : "Refresh"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Projects (click row for details, header to sort)</CardTitle>
              <div className="flex gap-2">
                <Button variant={view === "all" ? "default" : "outline"} size="sm" onClick={() => setView("all")}>All</Button>
                <Button variant={view === "starred" ? "default" : "outline"} size="sm" onClick={() => setView("starred")}>Starred</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
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
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-2xl">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle>{selected.title}</DialogTitle>
                  <DialogDescription>
                    {selected.country} · {selected.duration} days · {selected.rating || "N/A"} rating
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
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
                    <span className="font-semibold">Skills:</span>{" "}
                    {selected.skills.join(", ") || "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Description:</span>
                    <div className="mt-1 whitespace-pre-wrap text-muted-foreground max-h-60 overflow-auto">
                      {detailLoading ? "Loading..." : (selected.description || "No description cached.")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => toggleStar(selected)}>
                      {selected.starred ? "★ Unstar" : "☆ Star"}
                    </Button>
                    {selected.url && (
                      <a href={`https://www.karlancer.com/projects/${selected.url}`} target="_blank" rel="noreferrer">
                        <Button variant="outline">Open on karlancer</Button>
                      </a>
                    )}
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
