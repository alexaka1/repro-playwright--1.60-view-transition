# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **minimal Playwright bug reproduction**, not a conventional app. It
serves two static HTML pages (`public/login.html`, `public/home.html`) with `serve` and
runs a Playwright suite (`tests/repro.spec.ts`) demonstrating a Chromium 149 / Playwright
1.61 MPA `@view-transition` `locator.click()` hang. See `README.md` and `UPSTREAM_ISSUE.md`
for background.

Key non-obvious points:

- **`npm test` is EXPECTED to have failing tests.** Reproducing the hang is the entire
  purpose of this repo. On Playwright 1.61 / Chromium 149, the two view-transition tests
  (`locator.click hangs ...` and the `diagnostic: bounding box samples ...` rAF loop) time
  out, while the `native element.click() works ...` test passes. A "failed" `npm test` run
  with that pattern means the environment is working correctly, not broken. Do NOT try to
  "fix" these failures unless explicitly asked.
- The `test:1.60` / `test:1.61` npm scripts reinstall a specific `@playwright/test` version
  (mutating `package.json` / `package-lock.json`) and reinstall Chromium before running.
  `test:1.60` is the control run where all tests pass. Avoid running them unless needed,
  since they change the pinned dependency.
- **No lint step and no build step exist.** Playwright transpiles the TS test on the fly.
- The dev "app" is just static files: `npx serve public -l 3456`. Playwright's `webServer`
  config starts this automatically for `npm test`. `serve` uses clean URLs, so
  `/login.html` 301-redirects to `/login` (and `/home.html` -> `/home`); request the clean
  path or follow redirects.
- Chromium is installed into `~/.cache/ms-playwright` (persisted). If a run reports a
  missing browser, re-run `npx playwright install chromium`.
