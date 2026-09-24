# Player statistics pilot

Daniel Hammond's profile is available at `/players/daniel-hammond/`, linked from Players and the homepage. The profile uses `data/players/daniel-hammond.json`. Only imported games contribute to its totals. No Hudl credentials, playlist tokens, birthdates, or original workbooks are committed.

## Update from Hudl

1. Sign into Daniel's Hudl profile, choose Games → Current season → Game total, and export using the XLS button. The tested download is actually `.xlsx`; legacy binary `.xls` is not supported.
2. Keep the original filename and verify it belongs to Daniel. The workbook itself contains no player identifier or season year. This importer is deliberately limited to Daniel and 2026–27; its filename check prevents accidental mixups, not identity spoofing.
3. Run from the repository root:

```powershell
npx tsx scripts/import-hudl.ts --file "C:/Users/chris/Downloads/Games - Daniel Hammond, 24-Sep-2026.xlsx" --player daniel-hammond --season 2026-27 --as-of 2026-09-24
```

Use the export date for `--as-of`. Dates in the worksheet are day/month with no year; the explicitly selected season supplies the year (July–December 2026, January–June 2027). Rows dated after the export date are rejected. The parser maps full column names, not positions, and accepts additional columns without publishing them.

4. Review the JSON diff and run `npm test`, `npm run check`, `npm run build`, and `node scripts/check-built-site.mjs` before publishing.

Repeated files are a no-op. Newer game rows replace matching date/opponent/home-away entries, preserving other imported games. A duplicate opponent on the same date in one export is rejected for manual review. If an opponent name or date changes in a correction, manually reconcile the old entry; no stable match ID exists in this export. Older exports cannot overwrite newer records.

## Source interpretation

The first export contains two games from September 19, 2026, with 20 per-game statistics. Summary rows are excluded: the initial workbook's Average per game row contains incorrect special-teams shot averages. Site totals and ice-time averages are calculated from individual game rows. A source dash is null, not zero. Rates are derived from aggregate numerators and denominators, not averages of percentages.

Scores are from Daniel's team perspective, cross-checked against Hudl's overview for the initial games. The @ marker means away; unmarked opponents are treated as home. Hudl labels are retained: `Blocked shots` and `Shots blocking` are distinct fields and must not be silently combined. Video links go to the normal signed-in player page; token-bearing playlists are not published.

This is a static public-page implementation, not a private portal. No automatic syncing, parent upload service, or team-wide data access is configured. Future players need their own verified exports and parent authorization before adding public profiles.
