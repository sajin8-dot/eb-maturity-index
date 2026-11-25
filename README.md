# Employer Brand Maturity Index

Audit instrument for placing a global capability centre on the employer brand maturity curve, practice by practice, with a consulting report and cross-client benchmarking. Built on the Zinnov employer brand framework v1.0 and maturity instrument v1.0 (four GCC waves, five rungs, 40 practices).

Live at `https://ebmi.sebastianchandy.com` (password protected).

## How it works

```
browser -> Vercel (middleware gate, /api/db proxy) -> Supabase edge function ebmi-api -> Postgres (ebmi_* tables)
```

- **Per-client passwords.** Each password opens one client's workspace and nothing else. The admin password opens all of them. Passwords are stored as HMAC-SHA256 hashes (keyed with a pepper held in `ebmi_config`), never in plain text.
- **Server-side gate.** `middleware.js` checks a signed, HttpOnly session cookie on every request except `/login.html` and `/api/login`, so the framework and app code are not served to anyone who has not signed in.
- **Server-side authorisation.** The edge function re-checks the session and the access row (so revoking a password takes effect immediately) and scopes every query to the client the password belongs to.
- **Benchmarking.** The pool is the latest saved snapshot per cohort. Only scores with an artefact behind them count (unless provisional is chosen), every practice has equal weight, and positions are mid-rank percentiles. Clients see their own percentile, rank, and the pool's median and spread, never other clients' names or values. The admin sees the named league table.
- **Comparability.** Cohorts choose different scopes, so the overall index is indicative; pillar and practice positions are like for like. A practice position needs at least three cohorts that scored it.

## Layout

| Path | What it is |
|---|---|
| `public/index.html` | The app (framework, audit, report, benchmark, clients) |
| `public/login.html` | Sign-in page |
| `middleware.js` | Session gate (Vercel Routing Middleware) |
| `api/login.js`, `api/logout.js`, `api/db.js` | Cookie issue/clear and authenticated proxy |
| `supabase/functions/ebmi-api/index.ts` | API, scoring and benchmark maths |
| `supabase/migrations/001_ebmi_schema.sql` | Tables (server-only, RLS on) |

## Configuration

Vercel environment variables:

- `FN_URL`: `https://<project-ref>.supabase.co/functions/v1/ebmi-api`
- `SESSION_SECRET`: must equal `sign_key` in the `ebmi_config` table

Database: run the migration, then seed `ebmi_config` (`sign_key`, `pepper`) and one admin row in `ebmi_access`. See the comment at the bottom of the migration.

## Operating notes

- Add a client and issue passwords from the **Clients** tab. A password is shown once; a lost one is replaced, not recovered.
- Rotating `sign_key` (in the table and in `SESSION_SECRET`) signs everyone out.
- Sign-in attempts are throttled per IP (8 failures in 10 minutes).
- Clients' saved snapshots join an anonymised benchmark pool. Make sure engagement terms say so.
- The framework text and wave expectations are advisory reasoning, not measured benchmarks. No centre had been scored with the instrument when this was built.
