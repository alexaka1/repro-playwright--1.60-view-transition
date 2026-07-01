import { test, expect, type Page } from '@playwright/test';

async function navigateWithViewTransition(page: Page) {
  await page.goto('/login.html');
  const navigation = page.waitForURL('**/home.html');
  await page.locator('a[href="/home.html"]').evaluate((link: HTMLAnchorElement) => link.click());
  await navigation;
}

test.describe('MPA view-transition click hang', () => {
  test('locator.click hangs after MPA navigation (PW 1.61 / Chromium 149)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));

    await navigateWithViewTransition(page);

    const vt = await page.evaluate(() => ({
      hasActiveVt: !!document.activeViewTransition,
      url: location.href,
      readyState: document.readyState,
    }));
    console.log('after nav:', JSON.stringify(vt));

    const t0 = Date.now();
    await page.getByRole('button', { name: 'New appointment' }).click({ timeout: 15_000 });
    console.log('locator.click ms:', Date.now() - t0);

    await expect(page.locator('#result')).toHaveText('clicked');
    console.log('pageErrors:', pageErrors);
  });

  test('native element.click() works on same page state', async ({ page }) => {
    await navigateWithViewTransition(page);

    const t0 = Date.now();
    await page.evaluate(() => document.getElementById('action')!.click());
    await expect(page.locator('#result')).toHaveText('clicked', { timeout: 5_000 });
    console.log('DOM click ms:', Date.now() - t0);
  });

  test('diagnostic: bounding box samples while activeViewTransition may be set', async ({ page }) => {
    await navigateWithViewTransition(page);

    const samples = await page.evaluate(async () => {
      const btn = document.getElementById('action')!;
      const out: object[] = [];
      for (let i = 0; i < 20; i++) {
        const r = btn.getBoundingClientRect();
        out.push({
          i,
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          hasVT: !!document.activeViewTransition,
        });
        await new Promise((f) => requestAnimationFrame(() => requestAnimationFrame(f)));
      }
      return out;
    });
    console.log(JSON.stringify(samples, null, 2));
  });
});
