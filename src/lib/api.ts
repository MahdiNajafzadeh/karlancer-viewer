const BASE = "https://www.karlancer.com";

function buildUrl(page: number, order: string) {
  const u = new URL("/api/publics/search/projects", BASE);
  u.searchParams.set("page", String(page));
  u.searchParams.set("order", order);
  return u.toString();
}

export interface RawProject {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  status: string;
  job_duration: number | null;
  min_budget: number | null;
  max_budget: number | null;
  files: unknown[];
  country: string;
  category_id: number;
  rate: string | number | null;
  rate_num: number | null;
  is_highlight: boolean;
  is_urgent: boolean;
  is_fulltime: boolean;
  is_onsite: boolean;
  is_pin: boolean;
  is_multi: boolean;
  is_ladder: boolean;
  is_expired: boolean;
  ladder_at: string;
  is_invisible: boolean;
  past_time: string;
  url: string;
  users_bid: number | null;
  skills: { id: number; name: string }[];
  determined_budget: boolean;
  shortened_url: string;
  token: number;
  successful_projects_percentage: number | null;
  low_hire: boolean;
}

export interface PageData {
  current_page: number;
  data: RawProject[];
  last_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
  order: string;
}

async function fetchPage(url: string, attempt = 0): Promise<PageData> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "karlancer-evaluator/2.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { status: string; data: PageData; error?: string };
  if (json.status !== "success" || !json.data) throw new Error(json.error || "bad response");
  return json.data;
}

export async function fetchAllPages(order = "newest", fromPage = 0, toPage = 0, delayMs = 150, concurrency = 4, onProgress?: (p: number, total: number, count: number) => void) {
  const first = await fetchPage(buildUrl(1, order), 0);
  const lastTotal = first.last_page || 1;
  const start = fromPage > 0 ? fromPage : 1;
  const end = toPage > 0 ? Math.min(toPage, lastTotal) : lastTotal;
  const targetStart = Math.max(1, start);
  const targetEnd = Math.max(targetStart, end);

  const pages: number[] = [];
  for (let p = targetStart; p <= targetEnd; p++) pages.push(p);

  const all: RawProject[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < pages.length) {
      const idx = cursor++;
      const p = pages[idx];
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
      const data = await fetchPage(buildUrl(p, order));
      all.push(...(data.data || []));
      onProgress?.(p, targetEnd, all.length);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  // dedupe
  const seen = new Set<number>();
  const deduped = all.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  return { projects: deduped, totalPages: targetEnd - targetStart + 1, totalReported: first.total };
}

export async function fetchProjectDetail(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.karlancer.com/api/publics/projects/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json", "User-Agent": "karlancer-evaluator/2.0" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { status: string; data: { description?: string } };
    if (json.status !== "success" || !json.data) return null;
    return json.data.description ?? null;
  } catch {
    return null;
  }
}
