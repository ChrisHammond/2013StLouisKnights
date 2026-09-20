# Native schedule maintenance

## Verified results

`data/results.json` stores game-specific final box-score observations independently from the full schedule snapshot. This avoids claiming that all 156 schedule entries were refreshed when only one result was checked. Each observation must match the scheduled home/away teams and official box-score URL. Add a later dated observation for a correction; preserve the previous one. The latest observation per game is displayed, and finals are excluded from the next-game card. Builds validate scores, mappings, timestamps, and duplicate observations. Results are currently collected manually, not automatically.

On September 19, 2026 at 18:00 UTC, GameSheet game 2951469 showed FINAL: visiting Knights 1, home Northern Express 4; shots 21–33. The official regular-season standings were separately checked for all 13 teams and imported in their displayed order: Express first and Knights thirteenth. The Knights record was 0–1–0. Box-score source: https://gamesheetstats.com/seasons/15220/games/2951469?tab=box-score. The original schedule start remains unchanged; the box score reported an 11:27 AM start.

## Schedule snapshots

The schedule combines the latest validated GameSheet snapshot in `data/schedule.json` with the Knights Crossbar supplement described below. Official source IDs map to the verified teams. A GameSheet snapshot contains the entire division, not a partial team replacement. Official game IDs stay stable when times or venues change; history retains previous revisions.

To import a verified replacement snapshot:

```sh
npm run import:schedule -- /path/to/snapshot.json
npm test
npm run build
```

Match the schema in `src/lib/schedule.ts`: season 2026-27, the exact regular-season division source URL, all 13 covered team IDs, collection timestamp, and game IDs, home/away IDs, game number, local date, UTC start time (or null for TBD), venue, kind and status. Use Central time for local dates. Do not treat a rescheduled event as a new game ID, infer scores, or include unrelated event/personal data.

The current capture has 156 games / 24 per team; this is a verified initial count, not a permanent importer constraint. Cancellations should retain their IDs with cancelled status. Invalid snapshots retain the existing games and publish a failure status. An identical snapshot retry adds no revision. A newer successful observation advances the collection time; merely running a build or skipping an unconfigured feed does not.

For automated updates, supply a supported GameSheet export/feed normalized to this JSON schema through GitHub secrets `SCHEDULE_FEED_URL` and optional `SCHEDULE_FEED_TOKEN`. The endpoint must be HTTPS and return JSON; redirects and HTML challenges are rejected. The daily refresh workflow and its manual `schedule` option already call this importer. Neither a supported feed nor credentials is configured at delivery, so unattended refresh is pending. Do not pass a raw iCalendar URL to this JSON interface; add and test a source-specific adapter first.

The homepage selects the earliest scheduled future Knights game, skips cancelled/postponed games, and updates every minute and when the page becomes visible. TBD starts remain eligible through their Central calendar date. It stops showing a game at its scheduled start, without claiming that it was played. Empty schedules get a clear empty state. Without JavaScript, the build-time next game is shown and schedule pages show the full season.

Source check times are displayed on schedule views, linked from the homepage. GameSheet snapshots show Update overdue after 48 hours. Source links remain available to verify last-minute changes.

## Crossbar supplement

Run `npm run import:crossbar` to fetch the public Knights team 244514 games page. The daily GitHub workflow runs it at 12:17 UTC, and the manual `crossbar` or `schedule` option also runs it. No credentials are needed. `data/crossbar.json` preserves revisions separately from GameSheet. Unchanged checks advance lastSuccessfulCheck without adding duplicate snapshots. Failed fetches, malformed pages, duplicate events, ambiguous matches, and large unexpected removals retain the last valid snapshot and expose a failure message.

The September 20 capture contains 35 entries: 24 matched CSDHL games and 11 additions (three August practice games, November 1 versus Sting, November 15 at Eagles BNC, and six tournament date placeholders). Crossbar labels November 1 as League, but it is absent from the saved GameSheet division schedule; it is not counted as a CSDHL game. October 17 differs by ten minutes: GameSheet 5:50 PM, Crossbar 6:00 PM. The display retains GameSheet and flags the discrepancy.

Matching uses explicit opponent aliases, Central date, and home/away, with exact start times disambiguating doubleheaders. A single date/opponent match merges despite a time difference; unresolved multiple matches fail rather than duplicate games. GameSheet IDs/details/results/media remain authoritative for matched games. Unknown opponent labels stay literal instead of inventing division membership. Review alias changes and date/home-away changes against both sources before importing; the public page supplies no stable event IDs, so supplement IDs derive from date, side and opponent. Time/venue edits retain IDs; date/opponent edits require reviewing media mappings. Only the latest complete Crossbar revision is displayed, so removed entries disappear without erasing history.

Crossbar tournament day placeholders are visibly labeled, retain TBD times, and are excluded from the homepage next-game choice. When individual tournament games appear, review the adapter to distinguish them from whole-day tournament blocks before publishing. No tournament scores or unknown opponents are inferred. August galleries and replays are explicitly mapped to the three practice games.

Tests can pass a local HTML file as the importer's first argument in an isolated temporary project. Never import fixtures into production data. Source publication time is null because Crossbar does not supply it; collection and successful-check timestamps are separate.

Results also support an explicitly observed in-progress score. These display the observation time and a final-pending notice, never a live-feed claim. On September 19 at about 7:07 PM CDT, game 2951488 showed Knights 4, Blues 1 (shots 37-30), still In Progress. The separately checked official standings had not yet counted this game. Add a later final observation when the source confirms it.

## September 20 score update

GameSheet confirmed Knights at Express, game 2951497, FINAL (OT) 1–1, shots 11–28. Official league record is 1–1–1, 3 points, third in source order; GF/GA 6/6. All 13 standing rows were refreshed. Also verified Vipers at Sting finals: September 19 0–5 (shots 10–26), September 20 2–2 after OT (shots 25–28). Knights at Blues 4–1 is now officially FINAL, replacing the owner-confirmed display while preserving that earlier observation. New observations retain their collection times in JSON; no source publication timestamps were supplied.

September 20 afternoon check: game 2951503, Chargers at Sabres, officially FINAL 3–6; shots 29–31. Refreshed all 13 official standing rows: Sabres fourth, Vipers fifth, Chargers twelfth; Knights remain third. Hawks at Winnetka remains scheduled for 5:40 PM CDT, with no score published at this check.
