# Deploying Wordn00

The image builds the React app and serves the static files with nginx as a
non-root user on port 8080 (IPv4).

```sh
# From the repository root (the build context must be the whole project):
export SOLUTIONS_SHUFFLE_SEED=...   # same value as the GitHub repo secret
docker build -f deploy/Dockerfile --build-arg WORDS_DAY=$(date -u +%F) \
  --secret id=SOLUTIONS_SHUFFLE_SEED,env=SOLUTIONS_SHUFFLE_SEED -t wordn00 .
docker run --rm -p 8080:8080 wordn00
# then open http://localhost:8080
```

The build needs BuildKit (the default with Docker Engine 23+ or the `buildx`
plugin): the Dockerfile uses a cache mount, a build secret and
`deploy/Dockerfile.dockerignore`.

### Daily words

The build writes `/words/daily-<level>.txt` (`standard`, `standard-plus`,
`advanced`) with `scripts/shuffle_solutions.py`: the solutions each level
allows, shuffled by `SOLUTIONS_SHUFFLE_SEED` (a build secret, so it stays
out of the image), for every day up to `WORDS_DAY` (UTC). Tomorrow's word is
never published. The build fails without the seed. Use the same seed as the
GitHub Pages deploy so both serve the same daily word.

The game asks for the earlier of the player's date and the UTC date, so the
word changes at local midnight west of UTC and at 00:00 UTC east of it. The
image must therefore be **rebuilt every day just after 00:00 UTC**; until
then, players east of UTC stay on yesterday's word. A host crontab entry,
twice for a retry:

```cron
7 0,1 * * * cd /path/to/repo/deploy && WORDS_DAY=$(date -u +\%F) docker compose up -d --build wordle >> /var/log/wordn00-daily.log 2>&1
```

`WORDS_DAY` is part of the build cache key; without it a rebuild may reuse an
old list. Once the last published day passes, players stay on that day's
word until the next rebuild.

- `GET /healthz` returns `ok` for load-balancer and container health checks.
- Hashed assets under `/assets/` are cached for a year; the word lists under
  `/words/` for an hour, except the `daily-*.txt` lists, which are always revalidated; `index.html` is always revalidated, so a redeploy is
  picked up on the next page load.

## Production stack with analytics

`deploy/compose.yaml` runs the game behind Caddy (automatic HTTPS) together
with self-hosted [Umami](https://umami.is) analytics and its Postgres
database. Only Caddy is published (ports 80/443); the Umami dashboard listens
on `127.0.0.1:3000` of the host.

Caddy serves three analytics routes on the game's own origin, so the
Content-Security-Policy stays `'self'`-only:

- `/stats/config.json` gives the app the Umami website id (empty = analytics
  off; the app then never loads the tracker).
- `/stats/script.js` and `/stats/api/send` are the Umami tracker and its
  collection endpoint. Every other Umami path stays private.

Umami counts visitors without cookies, so no consent banner is needed. A
"unique visitor" is unique per day; ad blockers hide some visits.

### First start

```sh
cd deploy
cp .env.example .env     # set SITE_ADDRESS, SOLUTIONS_SHUFFLE_SEED, and both
                         # Umami secrets with: openssl rand -hex 32
docker compose up -d --build
```

Point the domain's DNS at the server first; Caddy fetches the certificate on
start. For a local trial, set `SITE_ADDRESS=:80` and open <http://localhost>.

Then create the website in Umami:

1. Open the dashboard: `ssh -L 3000:127.0.0.1:3000 <server>`, then
   <http://localhost:3000>.
2. Log in as `admin` / `umami` and **change that password immediately**.
3. Settings → Websites → Add website (any name, the public domain). Copy its
   website id into `UMAMI_WEBSITE_ID` in `.env`.
4. `docker compose up -d caddy` to apply it. Visits show up in the dashboard
   within seconds.

Redeploy the game after code changes with `docker compose up -d --build
wordle`.

### What the game reports

Besides page views (visits, visitors, time on site, referrers, countries,
devices), the app sends these events:

| Event | When | Data |
|---|---|---|
| `game_start` | first valid guess of a game | `length` |
| `game_end` | win, loss, or New word (dev only) after at least one guess | `outcome` (`won`, `lost`, `skipped`), `guesses`, `length`, `maxGuesses`, `seconds`, `word` |
| `share` | Share pressed | `won`, `length` |

`seconds` is active play time: gaps between key presses count up to two
minutes each and time in a hidden tab never counts. It survives a reload.
Games abandoned by closing the tab have a `game_start` but no `game_end`.

### Queries

The dashboard's Events view breaks events down by their data. For medians and
distributions, query Postgres directly:

```sh
docker compose exec db psql -U umami umami
```

```sql
-- One row per finished game, with its data as columns.
CREATE OR REPLACE VIEW games AS
SELECT e.created_at,
       e.session_id,
       max(d.string_value) FILTER (WHERE d.data_key = 'outcome') AS outcome,
       max(d.string_value) FILTER (WHERE d.data_key = 'word')    AS word,
       max(d.number_value) FILTER (WHERE d.data_key = 'guesses') AS guesses,
       max(d.number_value) FILTER (WHERE d.data_key = 'length')  AS length,
       max(d.number_value) FILTER (WHERE d.data_key = 'seconds') AS seconds
FROM website_event e
JOIN event_data d ON d.website_event_id = e.event_id
WHERE e.event_name = 'game_end'
GROUP BY e.event_id, e.created_at, e.session_id;

-- Outcomes, and guesses and time for won games.
SELECT outcome, count(*),
       percentile_cont(0.5) WITHIN GROUP (ORDER BY guesses) AS median_guesses,
       round(avg(guesses), 2)                               AS avg_guesses,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY seconds) AS median_seconds
FROM games GROUP BY outcome;

-- Guess distribution of won games.
SELECT guesses, count(*) FROM games WHERE outcome = 'won'
GROUP BY guesses ORDER BY guesses;

-- Hardest words (at least 5 finished games).
SELECT word, count(*) AS games,
       round(avg((outcome = 'won')::int), 2) AS win_rate
FROM games GROUP BY word HAVING count(*) >= 5 ORDER BY win_rate LIMIT 20;
```

### Backups

All statistics live in the `umami-db` volume:

```sh
docker compose exec -T db pg_dump -U umami umami | gzip > umami-$(date +%F).sql.gz
```

## Security headers

`deploy/security-headers.conf` is installed as
`/etc/nginx/snippets/security-headers.conf` and included at server level and
in every location that sets its own `add_header` (nginx would otherwise drop
the server-level headers there). It sets a Content-Security-Policy,
Permissions-Policy, `X-Content-Type-Options`, `Referrer-Policy` and
`X-Frame-Options`.

The CSP allows the inline theme script in `index.html` by its SHA-256
hash. **After changing that script**, rebuild and recompute the hash from the
built page, then update `security-headers.conf`:

```sh
npm run build
python3 - <<'PY'
import base64, hashlib, re
html = open("build/index.html").read()
for script in re.findall(r"<script>(.*?)</script>", html, re.S):
    digest = hashlib.sha256(script.encode()).digest()
    print("'sha256-" + base64.b64encode(digest).decode() + "'")
PY
```

A stale hash shows up as a CSP violation in the browser console and a flash
of the light theme on load.

HSTS (`Strict-Transport-Security`) is not set here: the container speaks plain
HTTP. Set it on the TLS terminator in front of it; the Caddy front in
`compose.yaml` does.

## Base images

Both `FROM` lines pin an image by digest (`image:tag@sha256:…`), so rebuilds
are reproducible and the tag is only informative. To move to a newer patch
release or another version, resolve the tag's current multi-arch digest and
replace the whole reference:

```sh
docker buildx imagetools inspect node:20-alpine | grep '^Digest'
docker buildx imagetools inspect nginxinc/nginx-unprivileged:1.27-alpine | grep '^Digest'
```

## Dependency audit

`npm audit` (checked 2026-11-09) reports no advisories. The app is built with
Vite; the runtime image ships only the static build.
