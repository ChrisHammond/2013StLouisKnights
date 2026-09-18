# Import contract and operations

## Files

- `teams.json`: stable portal IDs and independently verified source mappings.
- `sources.json`: season/division metadata and source access state.
- `standings.json`, `ratings.json`: append-only arrays of source observations.
- `status.json`: latest attempt and successful check times, with a public-safe message.

Snapshot files use `{ "snapshots": [...] }`. Input to a single import is **one snapshot**, not an entire store. Schemas are authoritative in `src/lib/schema.ts`.

## Common snapshot fields

`season` = `2026-27`, `division` = `csdhl-13u`, a public attribution `sourceUrl`, ISO UTC `observedAt` and `collectedAt`, and `sourcePublishedAt` (nullable only for standings). The collector must stamp collection time when it actually retrieves the data; do not rewrite a source observation time to make it appear fresh. Never include a private feed URL/token in attribution.

Every snapshot must include **all 13 known team IDs exactly once**. Missing ratings use null; missing standings invalidate the entire snapshot. Unknown fields are rejected, including accidental fixture/demo flags.

### Standings

Additional fields: `source: "gamesheet"`, `method: "browser-observation" | "official-export" | "approved-feed"`, `rows`.

Each row: `teamId`, `position`, `gp`, `w`, `l`, `t`, `otw`, `otl`, `points`, `gf`, `ga`. All numbers are nonnegative integers; position begins at 1. W/L exclude overtime results. `gp = w + l + t + otw + otl`. Order must be the official source order, not a locally recalculated sort. See the initial observed snapshot for a complete real example.

### Ratings

Additional fields: `source: "myhockeyrankings"`, `method: "authorized-export" | "approved-feed"`, `releaseDate: "YYYY-MM-DD"`, `category`, and `rows`.

Each row: `teamId`, `rating` (positive number or null), `rank` (positive integer or null). Zero preseason placeholders are **not** valid ratings. Null rating requires null rank. `category` describes the population used for the included ranks. The release date comes from the source; never infer it just from the collection day.

## Enable approved sources

1. Arrange supported access with the provider. For MHR, keep written permission privately and put a non-secret reference in `sources.ratings.authorizationReference`. Set `access` to `approved` only after permission covers collection, retention, and display.
2. Verify the season's release cadence and set `publicationScheduleVerified` to true. Adjust `.github/workflows/refresh.yml` if Wednesday is no longer correct.
3. Implement the provider-specific mapping if its export differs from the schema. The existing HTTPS JSON adapter expects the normalized snapshot contract, not arbitrary provider HTML.
4. Configure GitHub secrets `STANDINGS_FEED_URL` / optional `STANDINGS_FEED_TOKEN`, or `MHR_FEED_URL` / optional `MHR_FEED_TOKEN`.
5. Run a manual workflow dispatch; verify snapshot dates, rows, chart values, and source state before leaving the schedule active.

Tokens are bearer credentials, redirects are refused, each request times out after 20 seconds, and transient HTTP failures retry at most three times. HTTP 401/403 and non-JSON responses fail immediately. No bypass, proxy rotation, cookies, or undocumented endpoint scanning is used.

## File imports

```sh
npm run import:standings -- path/to/approved-standings.json
npm run import:ratings -- path/to/authorized-ratings.json
npm run validate
npm test
npm run build
```

The MHR permission gate applies to file imports too. File paths are local CLI arguments, never public web upload endpoints. An authorized CSV export must be deliberately mapped to this JSON contract; the portal does not guess CSV columns.

For local feeds, load environment variables in your shell (the CLI does not automatically load `.env`). Keep real secrets outside version control.

## Corrections, failures, and retries

Identical retries for a weekly release do not create a new observation. A changed release retains the original and appends a revision; the latest revision appears in the chart. A later revision that reverts to an earlier value is also retained. Same-day unchanged standings imports are idempotent. Backfilled older releases never replace the newest displayed release.

Validation happens before writing data; JSON replacement is atomic. Import errors preserve the last valid data and its timestamps. The workflow commits public-safe failure status, triggers the deployment hook if configured, and ends with a failure to make the source problem visible in Actions. GitHub workflow concurrency prevents overlapping writers. Run local imports one at a time.

Weekly deltas require consecutive releases exactly seven days apart and the same category. Missing values and missed weeks break chart lines; no interpolation is performed. Date-only release dates render in UTC so Central time does not shift them backward one day.

Git is the backup and audit trail. Review changes before reverting; prefer a corrected import over deleting history. Copy `data/` before a deliberate season migration.
