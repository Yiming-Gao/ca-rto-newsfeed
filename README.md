# CA State Worker RTO Newsfeed

Static daily RTO newsfeed site.

- Front page: `site/index.html`
- Archive page: `site/archive.html`
- Daily data: `site/briefs.json` and `site/briefs-data.js`

GitHub Pages serves the mirrored `docs/` folder from the `main` branch.

Manual refresh:
- The front page button opens `.github/workflows/manual-refresh.yml`.
- Add an `OPENAI_API_KEY` repository secret before running the workflow.
- The workflow overwrites today's brief, mirrors `site/` to `docs/`, commits, and pushes.
