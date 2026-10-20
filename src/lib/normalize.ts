import type { RawProject } from "./api";

export interface Project {
  id: number;
  title: string;
  url: string | null;
  shortUrl: string | null;
  status: string | null;
  country: string | null;
  categoryId: number | null;
  minBudget: number;
  maxBudget: number;
  budget: number;
  duration: number;
  rating: number;
  ratingCount: number;
  bids: number;
  urgent: number;
  fulltime: number;
  onsite: number;
  highlight: number;
  ladder: number;
  pin: number;
  multi: number;
  lowHire: number;
  expired: number;
  successRate: number;
  skills: string[];
  pastTime: string | null;
  userId: number | null;
  token: number | null;
  description: string | null;
  starred: number;
  fetchedAt: number;
  score: number;
}

export function normalize(p: RawProject): Omit<Project, "score"> {
  const ratingRaw = p.rate;
  const rating = ratingRaw === "N/A" || ratingRaw == null ? 0 : Number(ratingRaw);
  const bids = p.users_bid == null ? 0 : Number(p.users_bid);
  const duration = p.job_duration == null ? 0 : Number(p.job_duration);
  const minBudget = p.min_budget == null ? 0 : Number(p.min_budget);
  const maxBudget = p.max_budget == null ? 0 : Number(p.max_budget);
  const budget = p.determined_budget ? maxBudget : (maxBudget + minBudget) / 2;
  const successRate = p.successful_projects_percentage == null ? 0 : Number(p.successful_projects_percentage);
  return {
    id: p.id,
    title: p.title,
    url: p.url,
    shortUrl: p.shortened_url,
    status: p.status,
    country: p.country,
    categoryId: p.category_id,
    minBudget,
    maxBudget,
    budget,
    duration,
    rating,
    ratingCount: p.rate_num == null ? 0 : Number(p.rate_num),
    bids,
    urgent: p.is_urgent ? 1 : 0,
    fulltime: p.is_fulltime ? 1 : 0,
    onsite: p.is_onsite ? 1 : 0,
    highlight: p.is_highlight ? 1 : 0,
    ladder: p.is_ladder ? 1 : 0,
    pin: p.is_pin ? 1 : 0,
    multi: p.is_multi ? 1 : 0,
    lowHire: p.low_hire ? 1 : 0,
    expired: p.is_expired ? 1 : 0,
    successRate,
    skills: (p.skills || []).map((s) => s.name),
    pastTime: p.past_time,
    userId: p.user_id,
    token: p.token,
    description: null,
    starred: 0,
    fetchedAt: Math.floor(Date.now() / 1000),
  };
}

export function toContext(p: Omit<Project, "score">) {
  return {
    budget: p.budget,
    minBudget: p.minBudget,
    maxBudget: p.maxBudget,
    duration: p.duration,
    rating: p.rating,
    ratingCount: p.ratingCount,
    bids: p.bids,
    country: p.country,
    urgent: p.urgent,
    fulltime: p.fulltime,
    onsite: p.onsite,
    highlight: p.highlight,
    ladder: p.ladder,
    pin: p.pin,
    multi: p.multi,
    lowHire: p.lowHire,
    successRate: p.successRate,
  };
}
