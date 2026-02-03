# Daily Quotes API
Static JSON API for quotes, hosted on GitHub Pages. It ships pagination, tag browsing, and a lightweight client-side search index. Build artifacts are generated daily via GitHub Actions and deployed automatically.

## Features
- Static JSON endpoints (fast, free, and cache-friendly).
- Daily deterministic quote (same quote for everyone each day).
- Pagination with stable page sizing.
- Tags with per-tag JSON endpoints.
- Search index for fast client-side filtering.
- Clean docs site generated on build.

## Endpoints
- `GET /api/quotes.json` - full dataset
- `GET /api/quotes/index.json` - pages index
- `GET /api/quotes/page-1.json` - paginated quotes
- `GET /api/daily.json` - deterministic daily quote
- `GET /api/tags.json` - tags list
- `GET /api/tags/{tag}.json` - quotes by tag
- `GET /api/search-index.json` - token search index
- `GET /api/health.json` - build health info

## Local build
```bash
npm install
npm run build
```
Build output goes to `docs/`. Open `docs/index.html` or serve it with any static server.

## Mini app example
```js
const base = "https://<user>.github.io/<repo>";

const daily = await fetch(`${base}/api/daily.json`).then(r => r.json());
console.log(daily.quote);

const all = await fetch(`${base}/api/quotes.json`).then(r => r.json());
const results = all.quotes.filter(q => q.quote.toLowerCase().includes("focus"));
console.log(results.slice(0, 5));
```

## Deploy on GitHub Pages
1. Push this repo to GitHub.
2. In repo settings, go to **Pages** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` builds and deploys on every push and daily schedule.

## Data format
Quotes live in `data/quotes.json`:
```json
{
  "id": "q-001",
  "quote": "Small steps, done daily, create big change.",
  "author": "Unknown",
  "tags": ["consistency", "growth"]
}
```

## License
MIT (add if needed).
