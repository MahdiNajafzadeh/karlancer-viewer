# Formula guide

The score is a JavaScript expression evaluated per project. Higher score = more worthwhile.

## Available variables

| Variable | Type | Description |
|---|---|---|
| `budget` | number | Effective budget (max_budget, or average of min/max if not determined) |
| `minBudget` | number | Minimum budget (Toman) |
| `maxBudget` | number | Maximum budget (Toman) |
| `duration` | number | Suggested duration in days |
| `rating` | number | Employer rating (0 if N/A) |
| `ratingCount` | number | Number of employer ratings |
| `bids` | number | Number of bids (0 if unavailable publicly) |
| `country` | string | Employer city/province |
| `urgent` | 0/1 | Urgent project flag |
| `fulltime` | 0/1 | Full-time project flag |
| `onsite` | 0/1 | On-site project flag |
| `highlight` | 0/1 | Highlighted project flag |
| `ladder` | 0/1 | Ladder/promoted project flag |
| `pin` | 0/1 | Pinned project flag |
| `multi` | 0/1 | Multi-freelancer project flag |
| `lowHire` | 0/1 | Low-hire employer flag |
| `successRate` | number | Employer successful-projects percentage (0-100) |

## Examples

Budget per day:
```
maxBudget / (duration || 1)
```

Budget per day weighted by employer rating:
```
(maxBudget / (duration || 1)) * (rating > 0 ? rating : 1)
```

Budget per day per (bids+1) to favor low competition:
```
(maxBudget / (duration || 1)) / ((bids || 0) + 1)
```

Favor urgent + high budget + good employer:
```
(maxBudget / (duration || 1)) * (urgent ? 1.5 : 1) * (rating > 0 ? rating : 1) * (successRate / 100 + 1)
```

Only projects in Tehran:
```
country === "تهران" ? (maxBudget / (duration || 1)) : 0
```

## Tips

- Use `|| 1` to avoid division by zero.
- Return 0 to exclude a project.
- Formula is plain JavaScript; Math functions available (Math.max, Math.min, etc.).
