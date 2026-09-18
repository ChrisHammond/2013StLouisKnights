# RainbowMarks game galleries

The Photos navigation item, homepage, and Knights profile link to the RainbowMarks season collection. Three public August galleries were verified September 18, 2026. These games are outside the current league schedule, so their `gameId` values are null. The August 15 URL really contains `String`; preserve that spelling.

To add a published gallery, append its title, game date, exact public URL, and GameSheet game ID to `data/photos.json`, then update `verifiedAt`. Verify the opponent and date, plus time or home/away for doubleheaders. Multiple galleries may reference the same game. If the match is uncertain, use `gameId: null`; the gallery still appears on the Photos page.

Run `npm test` and `npm run build`, then commit and push. Validation rejects duplicate URLs and mappings to a different date or a game without the Knights. Schedule cards display explicitly matched galleries after the scheduled start; cancelled and postponed games are excluded. A published gallery is required; links are never invented.

The index is curated, not automatically discovered. Add newly published gallery URLs to the JSON to show them individually. The collection link always leads to RainbowMarks, where newer galleries can be found immediately. An approved SmugMug feed could automate discovery later. Photos remain hosted by RainbowMarks and are not copied into this project.
