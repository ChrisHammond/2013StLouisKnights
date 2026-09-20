# Game video links

`data/videos.json` contains verified public Heinen Sports Network video IDs. The September 19 Blues upload was verified on the channel's Videos tab; the Express replay and August practice games were verified on its Live tab. The generic scheduled SportCam stream was not mapped because it does not identify a game.

Match each new video by opponent and game date, then set its exact GameSheet `gameId`. For doubleheaders, also verify the time. Use null for preseason games outside the league snapshot. Multiple video parts may share one game ID; give each a distinct title. Do not infer a game from upload date alone. Update `verifiedAt`, run `npm run build`, and commit/push. Schema validation rejects duplicate video IDs, malformed IDs, and wrong game dates or participants. Links appear on the Videos page and matching schedule/homepage cards. The collection is curated; automatic channel discovery is not configured.
