---
name: wayloft-qa-sweep
description: Runtime QA sweep for Wayloft. Checks Supabase health, Vercel deploy status, and live site smoke. Writes findings to wiki/wayloft/findings/ and alerts on urgent issues via Telegram. Runtime-only — does not read source code.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# Wayloft QA Sweep

Overnight runtime health check for Wayloft. Writes findings into the Wayloft operational brain and alerts only if something is bleeding.

**This skill does not read source code.** It only observes the running system — Supabase, Vercel, and the live site. Code-level audits (voice drift, TODO scans) are a separate future skill that requires a repo clone.

## Inputs

Environment variables needed (load from `apps/web/.env.local` on the laptop, `/opt/wayloft/.env` on the VPS):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_TOKEN` (optional — skip the Vercel check if missing, log a warning finding)
- `WAYLOFT_LIVE_URL` (default: `https://wayloft.app`)
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` (for urgent alerts — reuse Annie bot)

**Never print these values.** Read them into the environment of subprocess calls only.

## Steps

### 1. Read last-sweep state

```
cat ~/Documents/Codex/wiki/wayloft/state/last-sweep.json
```

If the file doesn't exist (first run), treat all baselines as "unknown" and this sweep becomes the new baseline.

### 2. Run the three checks

**Check A — Supabase smoke.** Confirm the DB is reachable and core tables respond.

- Hit `{SUPABASE_URL}/rest/v1/upcoming_flights?select=*&limit=1` with `apikey` and `Authorization: Bearer` headers using the service role key.
- Expected: HTTP 200 with a JSON array (may be empty).
- Any other response → **urgent**.
- Record: HTTP status, response time in ms, row count if present.

**Check B — Vercel deploy status.** Confirm the last production deploy is healthy.

- If `VERCEL_TOKEN` is set: `curl -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v6/deployments?limit=1&target=production&state=READY,ERROR,BUILDING`
- Parse the most recent deployment's `state`.
- `READY` → info. `ERROR` → urgent. `BUILDING` → info, but note it.
- If `VERCEL_TOKEN` missing: skip the check, emit a warning finding suggesting the user set `VERCEL_TOKEN`. Don't block the sweep.

**Check C — Live site smoke.** Confirm the landing page responds.

- `curl -sS -o /tmp/wayloft-smoke.html -w "%{http_code}|%{time_total}" $WAYLOFT_LIVE_URL`
- HTTP 200 AND response body contains the string "Wayloft" → ok.
- Non-200 OR missing marker string → **urgent**.
- Record: status code, response time, body size.

### 3. Determine severity

- **urgent** if any check returned urgent. Anything live-site-breaking or Supabase-unreachable triggers this.
- **warning** if any check returned a soft problem (e.g., missing `VERCEL_TOKEN`, response time >3s).
- **info** otherwise.

### 4. Write the findings file

Path: `~/Documents/Codex/wiki/wayloft/findings/YYYY-MM-DD-HHMM-qa-sweep.md`

Use the timestamp of when the sweep *started*, UTC. Format:

```markdown
---
type: qa-sweep
ran_at: 2026-04-11T15:40:00Z
runner: wayloft-qa-sweep
severity: info | warning | urgent
alerted: true | false
---

# Wayloft QA Sweep — 2026-04-11 15:40 UTC

## Summary
One-sentence read. "All checks green." or "Vercel deploy failed, live site down."

## Checks

### Supabase
- Status: ok | warning | urgent
- HTTP: 200
- Response time: 142ms
- Notes: (any anomalies vs baseline)

### Vercel
- Status: ok | warning | urgent | skipped
- Last deploy: READY | ERROR | BUILDING
- Deploy ID: dpl_abc123
- Notes: (any anomalies)

### Live site
- Status: ok | warning | urgent
- HTTP: 200
- Response time: 412ms
- Body size: 48kb
- Marker found: yes
- Notes: (any anomalies)

## Diff vs last sweep
- (One-liner per check showing change vs prior baseline. "Supabase error count: 0 → 0 (unchanged)")

## Action needed
- None | (specific next steps if severity=urgent)
```

### 5. Alert if urgent

If `severity: urgent`, send a Telegram message via the Annie bot:

```
curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=🚨 Wayloft QA sweep URGENT — <one-line summary>. See wiki/wayloft/findings/<filename>."
```

Set `alerted: true` in the finding's frontmatter. If the alert send itself fails, log it in the finding's notes but don't fail the whole sweep.

For **info** and **warning**, do nothing — silent by default.

### 6. Update state

Overwrite `~/Documents/Codex/wiki/wayloft/state/last-sweep.json`:

```json
{
  "last_ran_at": "2026-04-11T15:40:00Z",
  "supabase_status": "ok",
  "supabase_response_ms": 142,
  "vercel_last_deploy_status": "READY",
  "vercel_last_deploy_id": "dpl_abc123",
  "live_site_status": "ok",
  "live_site_response_ms": 412,
  "last_severity": "info",
  "last_alerted": false
}
```

### 7. Sync the wiki repo

Commit the new finding and updated state, push to GitHub so the laptop's `obsidian-git` plugin picks it up:

```
cd ~/Documents/Codex/wiki
git add wayloft/findings/<new-file>.md wayloft/state/last-sweep.json
git commit -m "wayloft-qa-sweep: <severity> @ <timestamp>"
git push
```

If the git push fails (network, auth), log it in the finding and continue — don't retry in a loop.

## Manual invocation

From the laptop, the first run goes:

```
cd ~/Documents/Codex/MO
# Ensure env vars are loaded from apps/web/.env.local or passed explicitly
Codex -p "run the wayloft-qa-sweep skill"
```

## Failure modes

- **Env var missing** (Supabase key, Telegram token): write a `severity: warning` finding naming the missing var, skip the affected check, do not alert.
- **Supabase unreachable** (DNS, auth): `severity: urgent`, alert.
- **Vercel API rate limited**: `severity: warning`, skip, retry next sweep.
- **Live site 5xx**: `severity: urgent`, alert.
- **git push fails**: log in finding body, don't alert on this alone — the finding still landed locally and Obsidian will see it once the push succeeds.

## What this skill does NOT do (yet)

- Read Wayloft source code (needs clone, deferred to v2)
- Audit Ellis Church voice drift (needs clone + recent commits diff)
- Track Supabase *error log* deltas (needs log query infrastructure, this v1 just smokes the DB)
- Page load performance over time (needs a longer baseline dataset)
- Check cash-vs-points comparison feature health (needs the feature shipped first)

Add these as separate sweep types later. Each becomes its own finding type in `wiki/wayloft/findings/`.
