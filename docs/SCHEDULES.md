# Native schedule maintenance

## Verified results

`data/results.json` stores game-specific final box-score observations independently from the full schedule snapshot. This avoids claiming that all 156 schedule entries were refreshed when only one result was checked. Each observation must match the scheduled home/away teams and official box-score URL. Add a later dated observation for a correction; preserve the previous one. The latest observation per game is displayed, and finals are excluded from the next-game card. Builds validate scores, mappings, timestamps, and duplicate observations. Results are currently collected manually, not automatically.

On September 19, 2026 at 18:00 UTC, GameSheet game 2951469 showed FINAL: visiting Knights 1, home Northern Express 4; shots 21–33. The official regular-season standings were separately checked for all 13 teams and imported in their displayed order: Express first and Knights thirteenth. The Knights record was 0–1–0. Box-score source: https://gamesheetstats.com/seasons/15220/games/2951469?tab=box-score. The original schedule start remains unchanged; the box score reported an 11:27 AM start.

## Schedule snapshots

The schedule and homepage next-game card use only the latest validated GameSheet snapshot in `data/schedule.json`. Source IDs map to the verified teams. A snapshot contains the entire division, not a partial team replacement. Game IDs stay stable when times or venues change; history retains previous revisions.

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

Snapshot ages are displayed on all schedule views and the homepage; after 48 hours they show Update overdue. The GameSheet details link remains available to verify last-minute changes.

Results also support an explicitly observed in-progress score. These display the observation time and a final-pending notice, never a live-feed claim. On September 19 at about 7:07 PM CDT, game 2951488 showed Knights 4, Blues 1 (shots 37-30), still In Progress. The separately checked official standings had not yet counted this game. Add a later final observation when the source confirms it.
