import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await expect(page.locator('#room')).toHaveClass(/is-ready/);
  await expect(page.locator('#room')).not.toHaveClass(/fallback/);
}

test('renders a real 3D room and each of the twelve books opens its own chapter', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await ready(page);
  await expect(page.locator('canvas')).toBeVisible();
  const buttons = page.locator('#book-targets button');
  await expect(buttons).toHaveCount(12);
  for (let i = 0; i < 12; i++) {
    const button = buttons.nth(i);
    const name = await button.locator('span').textContent();
    await button.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#reader-title')).toHaveText(name);
    await expect(page.locator('.content-section')).toHaveCount(3);
    await page.getByRole('button', { name: 'Close book' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('hover gives the matching overview and leaves the reading view closed', async ({ page }) => {
  await ready(page);
  const button = page.getByRole('button', { name: 'Open Frontend', exact: true });
  await button.hover();
  await expect(page.locator('#book-preview')).toBeVisible();
  await expect(page.locator('#book-preview h2')).toHaveText('Frontend');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.mouse.move(40, 40);
  await expect(page.locator('#book-preview')).toBeHidden();
});

test('keyboard readers can open and close a book with focus restored', async ({ page }) => {
  await ready(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Dark mode', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Open About me', exact: true })).toBeFocused();
  await expect(page.locator('#book-preview')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Close book' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('region', { name: 'Chapter content' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close book' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open About me', exact: true })).toBeFocused();
});

test('mobile supports touch opening, scrolling the full content, and dismissal', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await ready(page);
  const lamp = page.getByRole('button', { name: 'Desk lamp', exact: true });
  await lamp.tap();
  await expect(lamp).toHaveAttribute('aria-pressed', 'false');
  await lamp.tap();
  await expect(lamp).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Open Selected work', exact: true }).tap();
  await expect(page.locator('#reader-title')).toHaveText('Selected work');
  await page.locator('.sample-note').scrollIntoViewIfNeeded();
  await expect(page.locator('.sample-note')).toBeVisible();
  await page.getByRole('button', { name: 'Close book' }).tap();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Read Say hello', exact: true }).tap();
  await expect(page.locator('#reader-title')).toHaveText('Say hello');
  await page.getByRole('button', { name: 'Close book' }).tap();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('WebGL unavailable still provides all book content', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type.includes('webgl')) return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('#room')).toHaveClass(/fallback/);
  await expect(page.getByRole('button', { name: 'Desk lamp', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Open Say hello', exact: true }).click();
  await expect(page.locator('#reader-title')).toHaveText('Say hello');
});

test('dark mode follows the system initially and remembers an explicit choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await ready(page);
  const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Open About me', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.reader-pages')).toHaveCSS('background-color', 'rgb(37, 46, 39)');
});

test('the lamp changes rendered lighting and works independently of the theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await ready(page);
  const lamp = page.getByRole('button', { name: 'Desk lamp', exact: true });
  const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
  const canvas = page.locator('.room-canvas');
  await toggle.click();
  await expect(lamp).toHaveAttribute('aria-pressed', 'true');
  const illuminated = await canvas.screenshot();
  await lamp.click();
  await expect(lamp).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => (await canvas.screenshot()).equals(illuminated), { timeout: 15_000 }).toBe(false);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await toggle.click();
  await expect(lamp).toHaveAttribute('aria-pressed', 'false');
  await lamp.focus();
  await page.keyboard.press('Space');
  await expect(lamp).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(lamp).toHaveAttribute('aria-pressed', 'false');
});
