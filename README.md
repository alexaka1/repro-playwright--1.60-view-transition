# Playwright MPA view-transition click hang repro

Minimal repro for a Playwright 1.61 / Chromium 149 regression: after multi-page
navigation with `@view-transition { navigation: auto }`, `locator.click()` hangs
on the actionability stability check, while native `element.click()` works.

## Setup

```bash
npm install
npx playwright install chromium
```

## Run (fails on 1.61)

```bash
npm test
```

## Run (passes on 1.60)

```bash
npm run test:1.60
```

## Not the same as playwright#41468

[#41468](https://github.com/microsoft/playwright/issues/41468) reports broken
rendering (blank/invisible UI) in some headed/Docker/X11 setups. This repro
shows the DOM is interactive -- only Playwright `locator.click()` actionability
hangs.

## Upstream issue

Filed at:
