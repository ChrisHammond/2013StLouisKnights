# 2013 St. Louis Knights portal

## Scope

2026–27 CSDHL 13U. Astro, TypeScript, versioned JSON, GitHub Actions, Netlify.
Preserve the existing Falcons site. No paid resources. No invented production data.

## Progress

- [x] Confirm empty project directory and available GitHub authentication.
- [x] Identify official league standings: GameSheet season 15220 embedded by CSDHL.
- [x] Verify current Knights club page: https://www.stlknightshockey.com/team/244514.
- [x] Verify complete 13U membership and source links. Club homepage availability exception: Eagles.
- [x] Implement responsive overview, directory, standings, ratings, and 13 team pages.
- [x] Implement validated snapshots, importer safety, and source status.
- [x] Configure scheduled update workflows; source activation remains gated on external access.
- [x] Test data handling, production builds, browser interactions, keyboard chart points, and mobile layout.
- [x] Document maintenance and outstanding dependencies.
- [x] Create GitHub repository and connect Netlify using a repository-only read key and push webhook.
- [x] Store Netlify build hook as encrypted GitHub secret for scheduled snapshot commits.
- [x] Initial GitHub CI and Netlify deployment succeeded.
- [ ] Verify final deployed revision and scheduled workflow dry run.

## Known external dependencies

- MHR live collection/storage/display requires an authorized source and consent.
- GameSheet direct HTTP requests encounter Cloudflare verification. Normal browser access verified the source, but unattended snapshots require a supported feed/export. A supported live iframe is included.
- Eagles club homepage is league-listed but unavailable during verification; the site labels this rather than inventing a replacement.

## Delivery

- Repository: https://github.com/ChrisHammond/2013StLouisKnights
- Netlify: https://2013-st-louis-knights.netlify.app/
- Netlify project: `d9eb6d9b-26a9-4453-b143-3a2bbd08ab2d`, existing Christoc account; no plan upgrades or add-ons.
- 13 unit/integration tests pass; Astro check has no diagnostics; 19 production pages and 273 local links/assets verified.
- Browser checks: 390px mobile layout fits, team selectors work, fixture chart has 7 points/5 segments/8 accessible rows, keyboard focus reveals the correct weekly value and delta. Fixture route is development-only.

## Research

- Existing reference: https://hockey.chrishammond.com/
- Reference repository: https://github.com/ChrisHammond/2025-26-12UA1-Scouting
- League: https://www.csdhl.org/recruiting/standings-major-minor-2026-27/181347
- Standings iframe: https://gamesheetstats.com/seasons/15220/standings
- Official team contact directory: https://www.csdhl.org/about/major-minor-team-contacts/122504
- MHR terms: https://myhockeyrankings.com/terms.php
