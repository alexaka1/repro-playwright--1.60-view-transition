# Upstream issue draft

**Title:**
[Bug]: locator.click() hangs in stability check after MPA @view-transition { navigation: auto } on Chromium 149

**Body:**

````markdown
### Version

- @playwright/test: 1.61.1 (also 1.61.0)
- Chromium: 149.0.7827.55 (bundled)
- Works on: 1.60.0 / Chromium 148.0.7778.96

### Minimal repro

https://github.com/alexaka1/repro-playwright--1.60-view-transition

```bash
git clone https://github.com/alexaka1/repro-playwright--1.60-view-transition
cd repro-playwright--1.60-view-transition
npm install && npx playwright install chromium
npx playwright test   # fails on 1.61
```

Two static HTML pages. Only CSS:

```css
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }
}
```

Flow: login.html -> home.html (MPA link navigation), then click a button on the destination page.

### Expected

`locator.click()` succeeds once the element is visible (as on 1.60).

### Actual (1.61 + Chromium 149)

`locator.click()` times out on:

```text
waiting for element to be visible, enabled and stable
```

No sub-checks (`element is visible`, `element is not stable`, `retrying click action`) for the full timeout.

Trace often includes:

```text
pageError: AbortError: Transition was skipped
```

`document.activeViewTransition` is truthy after navigation on both 1.60 and 1.61.

### Critical: app/DOM is NOT broken

On the same page state after navigation, native DOM click works:

```ts
await page.evaluate(() => document.getElementById('action').click());
```

This succeeds in ~50 ms on 1.61 and the button handler runs.

So this is not a user-facing Chrome bug -- it is Playwright's `_checkElementIsStable` rAF loop failing to complete when a cross-document view transition is active on Chromium 149.

### Not a duplicate of #41468

#41468 reports broken rendering (blank/invisible UI) in headed/Docker/X11 environments. This repro: UI renders, DOM is interactive, only Playwright actionability hangs.

### Code note

`packages/injected/src/injectedScript.ts` -> `_checkElementIsStable` is unchanged between v1.60.0 and v1.61.1. Regression appears to be interaction of unchanged stability polling (`getBoundingClientRect` + `requestAnimationFrame`) with Chromium 149 MPA view-transition lifecycle.

### Environment

OS:
Node:
@playwright/test: 1.61.1

### Attachment

Trace zip from failing `locator.click` test on 1.61.1 attached.
````

**Suggested labels:** `browser-chromium`, regression

## Do NOT include as fixes in the repro

These are workarounds, not what this issue is about:

- `reducedMotion: 'reduce'`
- `force: true`
- `PLAYWRIGHT_SKIP_NAVIGATION_CHECK`
- Removing or changing `@view-transition` CSS

## Pre-flight checklist

- [ ] `npm test` **fails** on `@playwright/test@1.61.1` with silent stability hang (no retry logs)
- [ ] `npm run test:1.60` **passes** on `@playwright/test@1.60.0`
- [ ] `native element.click()` test **passes** on 1.61.1
- [ ] README documents both version commands
- [ ] No secrets, no private app references
- [ ] Attach one trace zip from the failing 1.61 run to the GitHub issue
- [ ] Replace `<YOUR_ORG>` in issue body with actual repo URL

## Background (for issue author context)

Empirical findings from a production app (ZaWinWeb) that led to this minimal repro:

1. CI failed on Playwright 1.61.1 bump: 13/27 a11y tests and 36+ E2E tests timed out on `locator.click()` / `.check()` after login navigation.
2. All failures: exactly ~30 s on `waiting for element to be visible, enabled and stable` with **no** sub-checks or retries.
3. Traces: `pageError: AbortError: Transition was skipped` during the hang.
4. Tests that only scan static pages (no post-login click) passed.
5. On a live app stack, Chrome 148 and Playwright 1.60: `locator.click()` works.
6. On Playwright 1.61 / Chromium 149: `locator.click()` hangs, but `element.click()` works in ~50 ms -- app is fine for real users.
7. Playwright repo search: **zero** issues mention `activeViewTransition` or `@view-transition`. Closest cousin [#41468](https://github.com/microsoft/playwright/issues/41468) is a different symptom (rendering broken), closed without fix.
8. `injectedScript._checkElementIsStable` unchanged 1.60 -> 1.61; Chromium roll 148 -> 149 is the variable.
