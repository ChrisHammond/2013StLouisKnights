# Unlisted development reviews

The `public/review/` directories contain deliberately unlisted player development pages and supporting media. They are static content copied into `dist/` by Astro, so normal repository builds preserve them.

- Do not add these pages to navigation, sitemaps, feeds, team profiles, or public search results.
- Use an unpredictable directory name for each review. Do not publish a directory index.
- Pages include `noindex` metadata. Netlify also sends `X-Robots-Tag` for every file under `/review/`, including videos, reports and JSON.
- Do not add the exact review paths to `robots.txt`: that would advertise their locations, and blocking crawling can prevent search engines from seeing the no-index response.
- Referrer information is suppressed for this area.
- These pages have no authentication. Anyone with the URL can access them, and this public repository exposes their paths and contents. This is the owner's explicitly requested publishing model.
- Player report data remains confined to the review directory and is not imported into public team statistics or player pages.
- Practice checkmarks are saved only in the visitor's browser, with keys scoped to the review path.

The published six video excerpts come from the referenced Hudl clip ranges. Original within-clip offsets and confidence notes are retained in `film-review-evidence.json`; the excerpt videos themselves start at zero. The complete source downloads remain in the local hockey review workspace.
