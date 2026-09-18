# Source verification

Verified September 17–18, 2026. Data files retain exact UTC observation times; the UI displays Central time.

## League and membership

- CSDHL official 2026–27 page: https://www.csdhl.org/recruiting/standings-major-minor-2026-27/181347
- Embedded GameSheet season: **15220**, Central States Developmental Hockey League, 2026–2027.
- Selected division: **Bantam Minor / 81589** (13U, 2013 birth year).
- Regular-season standings: https://gamesheetstats.com/seasons/15220/standings?filter%5Bdivision%5D=81589&filter%5Btype%5D=regular_season
- Official club directory: https://www.csdhl.org/about/members/39951

The normal browser completed its own initial security check without interaction. The source division contained 13 teams, all with GP/W/L/T/OTW/OTL/PTS/GF/GA equal to zero. These facts were captured as a dated browser observation. Source publication time is not supplied and remains null. Official row order is retained but labeled as preseason source order, not competitive rank.

| GameSheet team | Portal team           | GameSheet ID | MHR ID |
| -------------- | --------------------- | ------------ | ------ |
| Blues          | Chicago Blues         | 528177       | 2031   |
| Eagles         | St. Louis Eagles      | 528178       | 27569  |
| Express        | Northern Express      | 528179       | 2146   |
| Hawks          | Chicago Hawks         | 528180       | 2011   |
| Falcons        | Highland Park Falcons | 528181       | 2012   |
| Knights        | St. Louis Knights     | 528182       | 2035   |
| Chargers       | Northwest Chargers    | 528183       | 22799  |
| Ice Dogs       | Vernon Hills Ice Dogs | 528184       | 18862  |
| Sting          | St. Louis Sting       | 528185       | 22800  |
| Sabres         | Naperville Sabres     | 528186       | 2013   |
| Vipers         | Lake County Vipers    | 528187       | 2788   |
| Winnetka       | Winnetka Warriors     | 528188       | 17210  |
| Wilmette       | Wilmette Jr. Trevians | 528189       | 3579   |

GameSheet documents embedding on any website: https://help.gamesheet.app/article/10-scores-schedule-standings-stats-embed-tool . The live embed is supported independently of the snapshot importer. No public supported automation API has been established. Direct HTTP requests returned 403; there is no challenge-bypass implementation.

To enable daily snapshots, arrange a supported feed/export with CSDHL/GameSheet, map it to the strict snapshot schema, and configure `STANDINGS_FEED_URL`. The current generic JSON adapter is complete; provider-specific transport is pending.

## Team links and branding

Club links were matched to the official CSDHL member directory. Homepage links are explicitly labeled **Club site**. Where a current 2013/Bantam Minor/13U link appeared in the club's navigation, that team page was used instead.

- Knights: https://www.stlknightshockey.com/team/244514 (current site navigation; the older `/team/140503` belongs to 2025).
- Official crest: https://crossbar.s3.amazonaws.com/images/stl_knights_logo.png
- Eagles homepage is linked by CSDHL but the first direct HTTP check failed; retain the authoritative club link and recheck availability, rather than inventing a replacement.

## MyHockeyRankings

- Current division: https://www.myhockeyrankings.com/division-info?d=202&y=2026
- Each of the 13 team links was verified in the current division page; season query is `y=2026`.
- Only links and identity mappings were recorded. No MHR ratings or overall records were copied into production data.
- Terms: https://myhockeyrankings.com/terms.php (sections 6b/6c restrict scraping and redisplaying content without written consent).
- Contact: https://myhockeyrankings.com/contact-us

Required before activation: written consent or licensing that covers collection, storage, historical retention, and public display of these 13 teams' weekly numeric ratings and any ranks; an approved feed or export; the ranking category; and the 2026–27 release schedule. No outreach was sent on the user's behalf.

MHR describes a usual Wednesday release cadence, but the specific season timing is not yet verified. Three bounded weekly workflow opportunities are configured provisionally. They remain inactive until both permission and schedule verification are recorded in `data/sources.json`.

No backfill is assumed. Historic weeks can only be added from a verified authorized historical source.

## Native schedules

On September 18, 2026, the embedded schedules were replaced with native game cards using a browser observation of GameSheet season 15220, division 81589, regular-season games. All 156 published games were collected from the visible public schedule, yielding exactly 24 per team. The original row values and venue dictionary are retained in `data/schedule-observations/2026-09-18.json`. The normalized, validated snapshot is in `data/schedule.json`.

Team views now filter the snapshot by explicit home/away team IDs. Times were observed in Central time and normalized to UTC using America/Chicago with daylight saving. No club/Crossbar schedule data is used. No scores are inferred from elapsed dates. The initial next game is Knights at Express, September 19 at 11:20 AM CDT, Oakton Sports Complex, GameSheet ID 2951469.

Automated collection remains unconnected. GameSheet HTTP access is challenged, and no supported feed credentials were supplied. A daily workflow can import a supported normalized JSON feed once configured; without it, it skips without advancing freshness. GameSheet documents team-staff calendar subscriptions through Crossbar's official help: https://help.crossbar.org/en/articles/8652540-importing-from-gamesheet-powered-leagues. Arrange a supported feed/export before enabling unattended collection; do not bypass access controls. The UI states that this is a dated snapshot.
