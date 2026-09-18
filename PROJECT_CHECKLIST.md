# 2013 St. Louis Knights portal

## Scope
2026–27 CSDHL 13U. Astro, TypeScript, versioned JSON, GitHub Actions, Netlify.
Preserve the existing Falcons site. No paid resources. No invented production data.

## Progress
- [x] Confirm empty project directory and available GitHub authentication.
- [x] Identify official league standings: GameSheet season 15220 embedded by CSDHL.
- [x] Verify current Knights club page: https://www.stlknightshockey.com/team/244514.
- [ ] Verify complete 13U membership and source links.
- [ ] Implement responsive overview, directory, standings, ratings, and team pages.
- [ ] Implement validated snapshots, importer safety, and source status.
- [ ] Configure scheduled updates and deployment.
- [ ] Test data handling, builds, browser interactions, and mobile layout.
- [ ] Document maintenance and outstanding dependencies.
- [ ] Create GitHub repository and deploy to Netlify if access allows.

## Known external dependencies
- MHR live collection/storage/display requires an authorized source and consent.
- GameSheet direct HTTP requests currently encounter Cloudflare verification; inspect normal browser access and supported source options without bypassing controls.

## Research
- Existing reference: https://hockey.chrishammond.com/
- Reference repository: https://github.com/ChrisHammond/2025-26-12UA1-Scouting
- League: https://www.csdhl.org/recruiting/standings-major-minor-2026-27/181347
- Standings iframe: https://gamesheetstats.com/seasons/15220/standings
- Official team contact directory: https://www.csdhl.org/about/major-minor-team-contacts/122504
- MHR terms: https://myhockeyrankings.com/terms.php
