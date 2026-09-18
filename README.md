# 2013 St. Louis Knights · 2026–27

An independent CSDHL 13U season portal built with Astro and TypeScript. Static Netlify hosting, versioned JSON observations, and GitHub Actions. No database, login, analytics, or player information is required.

## Run locally

Use Node 24 (minimum supported: 22.12).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4321/. `npm run build` generates `dist/`.

```sh
npm test
npm run check
npm run build
node scripts/check-built-site.mjs
```

## Features and current source status

- 13 verified 2026–27 Bantam Minor teams, with CSDHL/GameSheet, club/team, and season-specific MHR links.
- Official regular-season standings captured from the normal GameSheet browser page, preserving order. The initial source showed zero games for every team; this is real preseason source data, not demonstration data.
- A supported live GameSheet embed on `/standings/` supplements the dated local snapshot.
- Interactive weekly numeric-rating chart, team selection, keyboard-focusable points, weekly changes, and accessible values table.
- MHR ratings are **not connected**. Production has no rating values. Permission and an approved feed are external dependencies, not completed integrations.
- Automatic standings snapshot updates are **not connected**. GameSheet returned HTTP 403 for direct page/API access. The workflow accepts an approved JSON feed; it does not bypass browser verification or scrape undocumented endpoints.

See [source research](docs/SOURCES.md), [data imports](docs/DATA.md), [deployment](docs/DEPLOYMENT.md), and [project checklist](PROJECT_CHECKLIST.md).

## Structure

```text
data/                       Verified identities, source settings, observations, status
src/components/             Standings, chart, team marks and source links
src/lib/                    Schemas, history/correction logic, chart geometry
src/pages/                  Overview, teams, standings, ratings, source details
scripts/import.ts           Approved file/feed import entry point
scripts/lib/importer.ts     Atomic persistence and bounded feed requests
tests/fixtures/             Synthetic test-only data, never production observations
.github/workflows/          Build verification and scheduled refresh
```

## Maintenance

- Edit identity/source mappings in `data/teams.json`; preserve internal IDs. Verify new memberships against the actual season division before changing the roster. Snapshot imports fail if any team is missing, duplicated, or unknown.
- Keep historical observations. Correct a release by importing a new observation for the same release date; the display chooses the latest revision without deleting the original.
- Use JSON imports from an authorized source. Never put secrets, provider credentials, personal contact details, or player rosters in committed data.
- Check failed GitHub Actions runs. Invalid updates leave the last good snapshot intact and publish a failure state. Public freshness is based on the original observation date, not the deployment date.
- Standings use regulation W/L and separate OTW/OTL fields. The overview record combines regulation and overtime outcomes and labels this explicitly. Official points and ordering are retained rather than recalculated.
- Before the next season, create a season archive and explicitly verify new memberships and source IDs. Do not just change the year in existing source URLs.

## Branding and reference

The Knights crest is sourced from the official club website and remains the club's property. This is an independent fan/team-following portal. The existing Falcons portal at https://hockey.chrishammond.com/ was inspected as a reference and is unchanged.
