# Plays

A platform where curators publish thematic stock bundles — a thesis plus a basket of tickers — and members can subscribe, kudos, comment, and track performance vs benchmarks.

- **Stack**: Vite + React + TypeScript, Supabase (auth + Postgres + RLS), deployed to GitHub Pages.
- **Design**: dark theme with chartreuse accent, Fraunces serif headlines, Inter body, JetBrains Mono for tickers. Faithful to the `Plays v2.html` prototype.
- **State of the app**: v0 — Discover, Play Detail, Builder, My Plays, Watchlist, Profile, Settings, plus Subscribe modal, Auth modal, and Stock Detail slide-in.

The app runs in two modes:

| Mode | When | What works |
|---|---|---|
| **Demo** | `VITE_SUPABASE_URL` is empty | Everything client-side. Auth signs you in instantly, subscriptions/kudos/votes persist to `localStorage`. Six seeded plays. |
| **Supabase** | `VITE_SUPABASE_URL` is set | Real Supabase auth, plays/subs/votes round-trip to Postgres, RLS enforces permissions. |

## Quick start

Requires Node 20+. (If you don't have Node installed, grab it from [nodejs.org](https://nodejs.org) — pick the LTS Windows installer.)

```bash
npm install
npm run dev
```

Open the URL it prints. You're in demo mode by default. Click **Sign in** and put anything in — you're now signed in as `@demo`. Try Discover → click any play → Subscribe → see it persist in My Plays.

## Project layout

```
src/
├── main.tsx              entry, wires router + state provider
├── App.tsx               route definitions
├── components/           Layout, AuthModal, SubscribeModal, StockPanel, PlayCard, Sparkline
├── pages/                Discover, PlayDetail, Builder, MyPlays, Watchlist, Profile, Settings, NotFound
├── state/AppState.tsx    single-store context for plays, subs, engagement, modals
├── lib/
│   ├── types.ts          Play / Holding / Profile / DiscussionItem / Stock
│   ├── supabase.ts       client, exports isDemoMode
│   ├── format.ts         %, $, dates, normalizeWeights
│   └── categories.ts     category dot colors + default benchmarks
├── data/
│   ├── seedPlays.ts      six sample plays across categories
│   └── stockUniverse.ts  ~30 tickers with price/marketCap/etc
└── styles/globals.css    every token + every component style

supabase/migrations/
├── 0001_init.sql         tables (profiles, plays, holdings, subs, kudos, follows, saves, discussion, stocks, notifications, reports), enums, triggers
├── 0002_rls.sql          Row-Level Security policies — default deny, explicit grants per surface
└── 0003_seed.sql         stock universe seed

.github/workflows/deploy.yml   builds on push to main, deploys dist/ to GitHub Pages
```

## Enabling Supabase (real backend)

Demo mode is great for screenshots and clickthroughs. For real users you need a Supabase project.

1. **Create a Supabase project** at [supabase.com/dashboard](https://supabase.com/dashboard). Free tier is fine for v0.

2. **Run the migrations.** Either:
   - Install the Supabase CLI: `npm i -g supabase`, then `supabase link --project-ref <ref>` and `supabase db push`, OR
   - Paste the contents of `supabase/migrations/0001_init.sql`, `0002_rls.sql`, `0003_seed.sql` (in order) into Supabase Studio → SQL editor → Run.

3. **Configure auth providers.** Supabase Studio → Authentication → Providers → enable Email and (optional) Google. For Google add an OAuth client ID/secret from Google Cloud Console; add your Pages URL to the authorized redirect URIs.

4. **Set env vars locally** in `.env.local`:
   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key from Settings → API>
   ```

5. **Restart `npm run dev`**. The "demo mode" banner disappears; auth and writes now talk to Supabase.

> The current page components read from local `seedPlays` / `STOCK_UNIVERSE`. Replace those reads with Supabase queries (`supabase.from('plays').select(...)`) when you're ready. The data shapes line up 1:1 with the SQL tables — see `src/lib/types.ts`.

## Deploying to GitHub Pages

The workflow at `.github/workflows/deploy.yml` builds the site and publishes `dist/` to Pages on every push to `main`.

1. **Push this repo to GitHub** (the included workflow handles the rest).

2. **Enable Pages**: repo → Settings → Pages → Source: **GitHub Actions**.

3. **Add secrets** (repo → Settings → Secrets and variables → Actions → New repository secret):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   If you don't add these, the deployed site runs in demo mode — still fully clickable, just no real auth.

4. **Visit** `https://<your-handle>.github.io/<repo-name>/`. First deploy takes 1-2 minutes.

The workflow copies `index.html` → `404.html` so deep links like `/plays/ai-compute-stack` work on Pages (which would otherwise 404 for SPA routes).

## What v0 doesn't include (yet)

These are explicit roadmap items, not bugs:

- **Real performance computation.** Numbers are mock. Wire a stock data feed (Polygon, Tiingo, IEX Cloud) into a nightly job that writes to `plays.performance` and a `play_returns` table.
- **Admin review queue.** Tables exist (`plays.status`, `reports`); admin pages are not built. Quickest path: a `/admin/review` route gated on `profiles.role = 'reviewer'`.
- **Notifications fan-out.** Tables exist; trigger functions to insert notification rows on subscribe / new update / approval are not yet wired.
- **Email sending.** Use Supabase's built-in transactional email for auth, plus Resend or Postmark for digests.
- **Stock detail data.** Currently from a static dict. Replace `getStock(ticker)` with a Supabase query against `stocks`.
- **Search.** Not in v0 per spec.

## Design system

If you extend the UI, the rules from the prototype are load-bearing:

- **Chartreuse `#D4FF3A` is brand only.** It belongs on the one primary action per surface, the active filter, the logo dot, and select active states. If two neon things compete on a screen, demote one.
- **Green for gains, red for losses.** Never tint financial numbers with neon — it breaks the semantic mapping.
- **No Fraunces serif on numbers.** Tabular alignment matters in finance UI; serif numerals fight the data tables.
- **All primary actions are pill-shaped (`border-radius: 999px`).** Consistent across the app.
- **Dark only.** The light theme in the prototype was an earlier iteration — don't reintroduce it.

## License

Private. All rights reserved.
