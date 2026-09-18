# GitHub and Netlify

## Deployed project

- Public site: https://2013-st-louis-knights.netlify.app/
- GitHub: https://github.com/ChrisHammond/2013StLouisKnights
- Netlify project ID: `d9eb6d9b-26a9-4453-b143-3a2bbd08ab2d`
- Branch `main`, build `npm run build`, publish `dist`.
- Continuous deployment is connected with a repository-specific read-only deploy key and push webhook. The scheduled-update build hook is stored as the `NETLIFY_BUILD_HOOK` GitHub secret.
- Created under the existing Christoc account without changing its plan or enabling paid add-ons.

## Initial deployment

The project uses a static Astro build: `npm ci`, `npm run build`, publish `dist`, Node 24. `netlify.toml` provides these settings and security headers.

Create a new GitHub repository for this project. Do not reuse or overwrite the Falcons repository. Connect that repository to a new Netlify site, with branch `main`. Existing account access is required; do not provision paid services.

CLI setup after signing in:

```sh
npx netlify-cli login
npx netlify-cli init
```

For a site already created, use `npx netlify-cli link` rather than creating another site. `npx netlify-cli deploy --dir=dist --prod --no-build` publishes a previously verified local build. For reproducible automation, pin the CLI version in any workflow that invokes it.

Canonical URLs use Netlify's `URL` environment variable with `https://2013-st-louis-knights.netlify.app` as a fallback. Set the production URL when using a different site name or domain.

## Continuous delivery

Netlify should build pushes to `main`. The GitHub validation workflow also runs tests, Astro type checks, a production build, and local-link/fixture-leak checks. Do not configure preview deployments to write source data.

Scheduled source updates run in GitHub Actions. Because a push made with `GITHUB_TOKEN` does not trigger another GitHub workflow, do not rely on a second push-triggered Actions workflow for deployment. Use Netlify's repository integration; additionally configure the optional `NETLIFY_BUILD_HOOK` secret to trigger Netlify explicitly after a data/status commit.

Create a main-branch build hook in Netlify, then store its URL as a GitHub Actions secret. Treat that URL as a credential; never paste it into documentation or commit it.

## Schedule

- Standings: daily at 12:17 UTC during the season.
- Ratings: Wednesday 20:23 UTC; Thursday 02:23 and 14:23 UTC provide bounded opportunities for a late publication.
- Season gate: August 2026 through July 2027. Disable or revise the workflow before the next season.
- Permission, schedule verification, and feed configuration gates prevent unapproved MHR requests.
- Missing configuration produces an explicit skipped import, not a false successful data check.

Scheduled Actions can be delayed; this is not a live scoring system. Public repositories with no activity can have schedules disabled by GitHub—check the Actions tab if updates stop. The official live standings embed remains available.

## Launch verification

1. Open the deployed overview, directory, one opponent profile, Knights profile, standings, ratings, and sources pages.
2. Confirm all 13 current-season team links, regular-season scope, observation time, and preseason messaging.
3. Confirm ratings remain empty until permission and actual authorized observations exist.
4. Test mobile horizontal table scrolling, team-selection controls, keyboard access, and chart values using isolated development fixtures.
5. Check GitHub Actions and Netlify deploy results. Confirm the previous Falcons portal is untouched.

## Remaining external work

Source automation requires supported feeds. MHR also requires permission and season publication timing. These dependencies do not prevent hosting the team directory, verified standings snapshot, supported live embed, and complete ratings interface with an honest pending state.
