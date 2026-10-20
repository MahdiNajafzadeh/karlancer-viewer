import { eq, sql } from "drizzle-orm";
import { db } from "./client";
import { projects, settings } from "./schema";
import type { Project } from "../lib/normalize";

export async function upsertProjects(items: Omit<Project, "score">[]) {
  for (const p of items) {
    await db
      .insert(projects)
      .values({
        id: p.id,
        title: p.title,
        url: p.url,
        shortUrl: p.shortUrl,
        status: p.status,
        country: p.country,
        categoryId: p.categoryId,
        minBudget: p.minBudget,
        maxBudget: p.maxBudget,
        budget: p.budget,
        duration: p.duration,
        rating: p.rating,
        ratingCount: p.ratingCount,
        bids: p.bids,
        urgent: p.urgent,
        fulltime: p.fulltime,
        onsite: p.onsite,
        highlight: p.highlight,
        ladder: p.ladder,
        pin: p.pin,
        multi: p.multi,
        lowHire: p.lowHire,
        expired: p.expired,
        successRate: p.successRate,
        skills: JSON.stringify(p.skills),
        pastTime: p.pastTime,
        userId: p.userId,
        token: p.token,
        description: p.description,
        starred: p.starred ?? 0,
        fetchedAt: new Date(p.fetchedAt * 1000),
      })
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          title: p.title,
          url: p.url,
          shortUrl: p.shortUrl,
          status: p.status,
          country: p.country,
          categoryId: p.categoryId,
          minBudget: p.minBudget,
          maxBudget: p.maxBudget,
          budget: p.budget,
          duration: p.duration,
          rating: p.rating,
          ratingCount: p.ratingCount,
          bids: p.bids,
          urgent: p.urgent,
          fulltime: p.fulltime,
          onsite: p.onsite,
          highlight: p.highlight,
          ladder: p.ladder,
          pin: p.pin,
          multi: p.multi,
          lowHire: p.lowHire,
          expired: p.expired,
          successRate: p.successRate,
          skills: JSON.stringify(p.skills),
          pastTime: p.pastTime,
          description: p.description ?? sql`description`,
          fetchedAt: new Date(p.fetchedAt * 1000),
        },
      });
  }
}

export async function getAllProjects(): Promise<Project[]> {
  const rows = await db.select().from(projects);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    shortUrl: r.shortUrl,
    status: r.status,
    country: r.country,
    categoryId: r.categoryId,
    minBudget: r.minBudget ?? 0,
    maxBudget: r.maxBudget ?? 0,
    budget: r.budget ?? 0,
    duration: r.duration ?? 0,
    rating: r.rating ?? 0,
    ratingCount: r.ratingCount ?? 0,
    bids: r.bids ?? 0,
    urgent: r.urgent ?? 0,
    fulltime: r.fulltime ?? 0,
    onsite: r.onsite ?? 0,
    highlight: r.highlight ?? 0,
    ladder: r.ladder ?? 0,
    pin: r.pin ?? 0,
    multi: r.multi ?? 0,
    lowHire: r.lowHire ?? 0,
    expired: r.expired ?? 0,
    successRate: r.successRate ?? 0,
    skills: r.skills ? JSON.parse(r.skills) : [],
    pastTime: r.pastTime,
    userId: r.userId,
    token: r.token,
    description: r.description,
    starred: r.starred ?? 0,
    fetchedAt: r.fetchedAt ? Math.floor(new Date(r.fetchedAt).getTime() / 1000) : 0,
    score: 0,
  }));
}

export async function getProject(id: number): Promise<Project | null> {
  const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    url: r.url,
    shortUrl: r.shortUrl,
    status: r.status,
    country: r.country,
    categoryId: r.categoryId,
    minBudget: r.minBudget ?? 0,
    maxBudget: r.maxBudget ?? 0,
    budget: r.budget ?? 0,
    duration: r.duration ?? 0,
    rating: r.rating ?? 0,
    ratingCount: r.ratingCount ?? 0,
    bids: r.bids ?? 0,
    urgent: r.urgent ?? 0,
    fulltime: r.fulltime ?? 0,
    onsite: r.onsite ?? 0,
    highlight: r.highlight ?? 0,
    ladder: r.ladder ?? 0,
    pin: r.pin ?? 0,
    multi: r.multi ?? 0,
    lowHire: r.lowHire ?? 0,
    expired: r.expired ?? 0,
    successRate: r.successRate ?? 0,
    skills: r.skills ? JSON.parse(r.skills) : [],
    pastTime: r.pastTime,
    userId: r.userId,
    token: r.token,
    description: r.description,
    starred: r.starred ?? 0,
    fetchedAt: r.fetchedAt ? Math.floor(new Date(r.fetchedAt).getTime() / 1000) : 0,
    score: 0,
  };
}

export async function toggleStar(id: number): Promise<boolean> {
  const p = await getProject(id);
  if (!p) return false;
  const next = p.starred ? 0 : 1;
  await db.update(projects).set({ starred: next }).where(eq(projects.id, id));
  return next === 1;
}

export async function updateDescription(id: number, description: string) {
  await db.update(projects).set({ description }).where(eq(projects.id, id));
}

export async function countProjects() {
  const r = await db.select({ c: sql<number>`count(*)` }).from(projects);
  return r[0]?.c ?? 0;
}

export async function getSetting(key: string): Promise<string | null> {
  const r = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return r[0]?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const now = new Date();
  await db
    .insert(settings)
    .values({ key, value, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: now } });
}
