# CA State Worker RTO Newsfeed

Static daily RTO newsfeed site.

- Front page: `site/index.html`
- Archive page: `site/archive.html`
- Daily data: `site/briefs.json` and `site/briefs-data.js`

GitHub Pages serves the mirrored `docs/` folder from the `main` branch.

Manual refresh:
- The fallback workflow is `.github/workflows/manual-refresh.yml`.
- Add an `OPENAI_API_KEY` repository secret before running the workflow.
- The workflow overwrites today's brief, mirrors `site/` to `docs/`, commits, and pushes.

One-tap refresh:
- Deploy `workers/refresh-worker.js` as a Cloudflare Worker.
- Store `GITHUB_TOKEN` as a Worker secret.
- Set `window.RTO_REFRESH_ENDPOINT` in `site/refresh-config.js` and `docs/refresh-config.js` to the Worker URL.
- The front page button will call that endpoint, which triggers the GitHub workflow without opening GitHub.
