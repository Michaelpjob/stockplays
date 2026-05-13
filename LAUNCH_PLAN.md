# Plays — Launch Plan v1

**Last updated:** 2026-05-13
**Status:** Active execution
**Source-of-truth strategy doc:** `PLAYS_SPEED_RUN_TO_DEMO.md` (handover doc — superseded for "live not demo" posture)

## Decisions locked

| Decision | Choice |
|---|---|
| Performance numbers | **Wire real** via Polygon.io Starter ($29/mo) — adjusted closes, nightly batch, time-weighted return computation. |
| Curator attribution | **Editorial** — keep 6 plays, attribute 5 to "Plays Editorial" pseudo-profile. Michael Job stays attributed to AI Compute Stack. |
| Domain | Keep `michaelpjob.github.io/stockplays/` for v1. Revisit post-launch. |
| Legal pages | Claude drafts generic v1 (ToS, Privacy, Disclaimer), user reviews + edits. Not legal advice. |
| Timeline | **Aggressive 2 weeks**. Phase 1 + 2 ship together, Phase 3 cut to 2 days testing. |
| Services | Resend (email), Sentry (errors), Plausible (analytics), Cloudflare Turnstile (captcha). All free tier or near-free at launch volume. |

## Phase 1 — Hard blockers (Week 1)

### 1.1 Editorial attribution
- Migration `0005_editorial_attribution.sql`: insert `editorial` pseudo-profile; reparent 5 fake-curator plays; soft-delete persona profiles
- Frontend: "by X" reads "Curated by Plays Editorial" when author handle is `editorial`
- `/u/editorial` profile is a special page (collected editorial plays, no individual bio)

### 1.2 Real performance (the heaviest piece)
- Polygon.io API integration. User provides API key as `POLYGON_API_KEY` GH secret.
- New schema:
  - `stock_prices(ticker, date, adjusted_close)` — daily bar history
  - `play_returns(play_id, date, return_pct, vs_benchmark_pct)` — computed nightly
- Nightly GH Actions cron at 06:00 UTC:
  - Find unique tickers across all `play_holdings` + benchmark tickers (SPY, SMH, XLE, HACK, XBI, ITA, XLI)
  - Fetch daily aggregates from Polygon's `/v2/aggs/ticker/{T}/range/1/day/...` endpoint
  - Upsert into `stock_prices`
- Computation step (same job):
  - For each play, multiply weights × close-to-close returns geometrically linked
  - Compute vs benchmark (subtract benchmark return for the same window)
  - Persist into `play_returns`
- Frontend reads `play_returns` not seed `performance` jsonb
- Window selector: 1M / 3M / YTD / 1Y / Inception (filters play_returns by date range)
- Personal inception return: same formula starting from user's `subscriptions.inception_date`

### 1.3 Legal pages
- `/terms` — Terms of Service. Acceptance required at signup (checkbox blocks form).
- `/privacy` — Privacy Policy. GDPR / CCPA basic.
- `/disclaimer` — Investment Disclaimer. "Not investment advice."
- Persistent footer with all three links.
- "Past performance does not predict future results" near every return number.
- Curator disclosure field on plays (optional text — "Michael holds NVDA personally").

### 1.4 Moderation v0
- Report button on every comment + dissertation.
- `reports` row inserted with `target_type=comment|play|user, target_id, reason, note`.
- Resend webhook: email user@michaelpjob.com when a new report lands.
- `/admin/reports` queue, RLS-gated to `profiles.role='admin'`. Actions: Dismiss / Hide / Strike.
- Auto-suspend at 3 substantiated strikes (schema already supports this).

### 1.5 Email confirmation + abuse prevention
- Email confirmation **back ON** in Supabase Auth.
- Resend wired as Supabase SMTP — branded `From: hello@plays.<domain>`.
- Cloudflare Turnstile on signup form.
- Re-enable Google OAuth (user does Google Cloud Console setup, pastes Client ID + Secret).

## Phase 2 — Soft blockers (Week 2)

| Task | Notes |
|---|---|
| Discussion compose box wired | Posts to `discussion_items`. Markdown render with `marked` + DOMPurify sanitization. |
| Profile page from Supabase | Currently uses local state for own profile; needs DB fetch for other users. |
| `/me/subscriptions` + `/me/watchlist` from DB | Currently empty for real users. |
| Seeded discussion IDs become UUIDs | Vote inserts fail today because `'d1'` / `'c1'` aren't valid UUIDs. |
| Per-play OG images | Generated server-side (we don't have Vercel — use a small image service or static per-play OGs as a build step). |
| Dynamic page titles | `<title>{play.name} — Plays</title>` per route. |
| Plausible analytics | Drop-in script + custom events for signup, subscribe, kudos. |
| Sentry error tracking | React error boundary + automatic capture. |

## Phase 3 — Polish & launch (final 2 days)

- Cross-browser smoke test (Chrome, Safari, Firefox).
- Mobile spot-fix below 800px. Not a redesign.
- Soft launch: 5-10 trusted reviewers via LinkedIn DMs.
- Iterate based on feedback.
- Public launch + LinkedIn announcement post.

## What I need from the user — service signups

The 5 external services. Sign up, paste the keys here, I'll set them as GH secrets + wire them.

| Service | What I need | Cost | Signup URL |
|---|---|---|---|
| Polygon.io | API key | $29/mo | https://polygon.io/dashboard/signup |
| Resend | API key + verified sender domain | Free tier 3K/mo | https://resend.com/signup |
| Sentry | DSN (Data Source Name) for React | Free tier 5K errors/mo | https://sentry.io/signup |
| Plausible | Domain configured + script ID | $9/mo | https://plausible.io/register |
| Cloudflare Turnstile | Site key + secret key | Free | https://dash.cloudflare.com → Turnstile |
| Google OAuth | Client ID + Client Secret | Free | https://console.cloud.google.com |

Order of priority (which keys to grab first based on what unblocks the most):
1. Polygon — unblocks Phase 1.2 (the heaviest piece)
2. Resend — unblocks moderation email + auth emails
3. Turnstile — unblocks production signup
4. Sentry — wire any time
5. Plausible — wire any time
6. Google OAuth — last; everything else works without it
