import { test, expect } from '@playwright/test';
import { createServer } from 'vite';
import { mkdtemp, cp, copyFile, symlink, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { bookEditor } from '../server/book-editor.js';

let server, directory, baseURL, original;
const project = resolve('.');

test.beforeAll(async () => {
  // Exercise real disk saves in an isolated copy; never modify the user's books.
  directory = await mkdtemp(join(tmpdir(), 'books-admin-test-'));
  await cp(join(project, 'src'), join(directory, 'src'), { recursive: true });
  await copyFile(join(project, 'index.html'), join(directory, 'index.html'));
  await copyFile(join(project, 'favicon.svg'), join(directory, 'favicon.svg'));
  await symlink(join(project, 'node_modules'), join(directory, 'node_modules'));
  await symlink(join(project, 'landing_page_images'), join(directory, 'landing_page_images'));
  original = await readFile(join(directory, 'src/books.json'), 'utf8');
  server = await createServer({
    root: directory, configFile: false, logLevel: 'error',
    cacheDir: join(directory, '.vite'),
    plugins: [bookEditor({ filePath: join(directory, 'src/books.json') })],
    server: { host: '127.0.0.1', port: 0, fs: { allow: [directory, project] } },
  });
  await server.listen();
  baseURL = `http://127.0.0.1:${server.httpServer.address().port}`;
});
test.beforeEach(async () => { await writeFile(join(directory, 'src/books.json'), original); });
test.afterAll(async () => {
  await server?.close();
  if (directory) await rm(directory, { recursive: true, force: true });
});

test('admin edits survive reload and reach the shelf and reader', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${baseURL}/admin`);
  await expect(page.getByRole('button', { name: /^Edit / })).toHaveCount(12);
  await page.screenshot({ path: testInfo.outputPath('admin-desktop.png'), fullPage: true });
  const shelf = await page.context().newPage();
  shelf.on('pageerror', error => errors.push(error.message));
  // Keep this content integration test independent of GPU availability.
  await shelf.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes('webgl') ? null : getContext.call(this, type, ...args);
    };
  });
  await shelf.goto(baseURL);
  await expect(shelf.getByRole('button', { name: `Open ${JSON.parse(original)[0].title}`, exact: true })).toBeVisible();
  await page.getByLabel('Book name', { exact: true }).fill('My story');
  await page.getByLabel('Cover color').fill('#386149');
  await page.getByLabel('Chapter heading').fill('Hello from my edited book');
  await page.getByLabel('Introduction', { exact: true }).fill('First line\n\nA second paragraph.');
  await page.getByLabel('Closing note').fill('');
  await page.getByRole('button', { name: 'Add a section' }).click();
  await page.getByLabel('Section title', { exact: true }).last().fill('An earlier chapter');
  await page.getByRole('button', { name: 'Add a section' }).click();
  await page.getByLabel('Section title', { exact: true }).last().fill('A new chapter');
  await page.getByLabel('Content', { exact: true }).last().fill('New matter with <script>literal text</script>.\nAnother line.');
  await page.getByLabel('Supporting detail (optional)').last().fill('Written today');
  await page.getByRole('button', { name: 'Move up section 2' }).click();
  await expect(page.getByLabel('Section title', { exact: true }).first()).toHaveValue('A new chapter');
  await page.getByRole('button', { name: 'Edit Competitive Programming', exact: true }).click();
  await page.getByLabel('Book name', { exact: true }).fill('My frontend craft');
  await page.getByRole('button', { name: 'Edit My story', exact: true }).click();
  await expect(page.getByLabel('Book name', { exact: true })).toHaveValue('My story');
  await page.getByRole('button', { name: 'Save all changes' }).click();
  await expect(page.locator('#save-state')).toHaveText('All changes saved');
  await page.reload();
  await expect(page.getByLabel('Book name', { exact: true })).toHaveValue('My story');
  const stored = JSON.parse(await readFile(join(directory, 'src/books.json'), 'utf8'));
  expect(stored[0].spine).toBe('My story');
  expect(stored[0].color).toBe('#386149');
  expect(stored[0].pages[0].sections).toHaveLength(2);
  expect(stored[1].title).toBe('My frontend craft');
  expect(await readFile(join(directory, '.book-editor/books.previous.json'), 'utf8')).toBe(original);
  // The already-open shelf must update automatically after saving.
  await shelf.getByRole('button', { name: 'Open My story', exact: true }).click();
  await expect(shelf.locator('#reader-title')).toHaveText('My story');
  await expect(shelf.locator('.content-heading')).toHaveText('Hello from my edited book');
  await expect(shelf.locator('.content-lead')).toHaveCSS('white-space', 'pre-wrap');
  await expect(shelf.locator('.content-section')).toHaveCount(2);
  await expect(shelf.locator('.content-section').first()).toContainText('<script>literal text</script>');
  await expect(shelf.locator('.sample-note')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('renaming a book repaints its actual 3D spine in an already-open shelf', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.printedSpineText = [];
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      if (this.fillStyle === '#fff5df') window.printedSpineText.push({ text, font: this.font });
      return fillText.call(this, text, ...args);
    };
  });
  await page.goto(baseURL);
  await expect(page.locator('#room')).toHaveClass(/is-ready/);
  await expect(page.locator('#room')).not.toHaveClass(/fallback/);
  const initialTitle = JSON.parse(original)[0].title;
  await expect.poll(() => page.evaluate(() => window.printedSpineText.map(line => line.text).join(' '))).toContain(initialTitle);
  const editor = await page.context().newPage();
  await editor.goto(`${baseURL}/admin`);
  await editor.getByLabel('Book name', { exact: true }).fill('My coding profiles');
  const shelfReloaded = page.waitForEvent('load');
  await editor.getByRole('button', { name: 'Save all changes' }).click();
  await expect(editor.locator('#save-state')).toHaveText('All changes saved');
  await shelfReloaded;
  await expect(page.locator('#room')).toHaveClass(/is-ready/);
  await expect.poll(() => page.evaluate(() => window.printedSpineText?.map(line => line.text).join(' '))).toContain('My coding profiles');
  await expect(page.locator('#room')).not.toHaveClass(/fallback/);
  await expect(page.getByRole('button', { name: 'Open My coding profiles', exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.printedSpineText.every(line => parseInt(line.font.match(/(\d+)px/)[1]) >= 64))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('renamed-spines.png'), fullPage: true });
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await page.screenshot({ path: testInfo.outputPath('renamed-spines-dark.png'), fullPage: true });
  await editor.close();
});

test('mobile editor supports removal, discard, search, and exports without overflowing', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/admin/`);
  await expect(page.getByLabel('Book name', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('admin-mobile.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Edit Backend', exact: true }).click();
  await page.getByRole('button', { name: 'Remove section 1', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Remove section', exact: true }).click();
  await expect(page.getByLabel('Section title', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Discard book changes' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Discard changes' }).click();
  await expect(page.getByLabel('Section title', { exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Save all changes' })).toBeDisabled();
  await page.getByLabel('Find a book').fill('backend');
  await expect(page.getByRole('button', { name: /^Edit / })).toHaveCount(1);
  await page.getByRole('button', { name: 'Edit Backend', exact: true }).click();
  await expect(page.getByLabel('Book name', { exact: true })).toHaveValue('Backend');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export draft as JSON' }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('books.json');
});

test('save errors keep the draft and stale revisions cannot overwrite newer work', async ({ page, request }) => {
  await page.goto(`${baseURL}/admin`);
  await page.getByLabel('Book name', { exact: true }).fill('An unsaved draft');
  const initial = await (await request.get(`${baseURL}/api/books`)).json();
  initial.books[0].title = 'Saved from another editor';
  const save = await request.put(`${baseURL}/api/books`, { data: initial });
  expect(save.status()).toBe(200);
  await page.getByRole('button', { name: 'Save all changes' }).click();
  await expect(page.locator('#notice')).toContainText('changed in another editor');
  await expect(page.getByLabel('Book name', { exact: true })).toHaveValue('An unsaved draft');
  await expect(page.locator('#save-state')).toContainText('unsaved changes');
  expect((await (await request.get(`${baseURL}/api/books`)).json()).books[0].title).toBe('Saved from another editor');
});

test('API rejects cross-origin writes and invalid book data', async ({ request }) => {
  const data = await (await request.get(`${baseURL}/api/books`)).json();
  const foreign = await request.put(`${baseURL}/api/books`, { headers: { Origin: 'https://example.com' }, data });
  expect(foreign.status()).toBe(403);
  data.books[0].color = 'invalid';
  const invalid = await request.put(`${baseURL}/api/books`, { data });
  expect(invalid.status()).toBe(400);
  expect(await readFile(join(directory, 'src/books.json'), 'utf8')).toBe(original);
});

test('new books and their pages save, reorder, reopen, and appear on the next 3D shelf', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${baseURL}/admin`);
  await expect(page.getByRole('button', { name: 'Add page', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Remove page', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Add book', exact: true }).click();
  await page.getByLabel('Book name', { exact: true }).fill('Research journal');
  await page.getByLabel('Page title', { exact: true }).fill('Experiments');
  await page.getByRole('button', { name: 'Add a section' }).click();
  await page.getByLabel('Section title', { exact: true }).fill('First experiment');
  await page.getByLabel('Content', { exact: true }).fill('Original findings.');
  await page.getByRole('button', { name: 'Add page', exact: true }).click();
  await page.getByLabel('Page title', { exact: true }).fill('Observations');
  await page.getByRole('button', { name: 'Add a section' }).click();
  await page.getByLabel('Section title', { exact: true }).fill('Second experiment');
  await page.getByLabel('Content', { exact: true }).fill('Next findings.');
  await page.getByRole('button', { name: 'Move page up', exact: true }).click();
  await expect(page.locator('#reading-preview .book-page-status')).toHaveText('Page 1 of 2');
  await page.getByRole('button', { name: 'Save all changes' }).click();
  await expect(page.locator('#save-state')).toHaveText('All changes saved');
  let stored = JSON.parse(await readFile(join(directory, 'src/books.json'), 'utf8'));
  expect(stored).toHaveLength(13);
  expect(stored[12].pages.map(p => p.title)).toEqual(['Observations', 'Experiments']);
  expect(stored.slice(0, 12)).toEqual(JSON.parse(original));
  await page.reload();
  await page.getByRole('button', { name: 'Edit Research journal', exact: true }).click();
  await expect(page.getByLabel('Page title', { exact: true })).toHaveValue('Observations');
  await page.getByRole('button', { name: 'Page 2: Experiments', exact: true }).click();
  await expect(page.getByLabel('Content', { exact: true })).toHaveValue('Original findings.');
  await page.screenshot({ path: testInfo.outputPath('pages-admin.png'), fullPage: true });

  await page.goto(baseURL);
  await expect(page.locator('#room')).toHaveClass(/is-ready/);
  await expect(page.locator('#room')).not.toHaveClass(/fallback/);
  await page.getByRole('button', { name: 'Next shelf', exact: true }).click();
  await expect(page.locator('#shelf-status')).toHaveText('Shelf 2 of 2 · Books 13–13');
  await expect(page.locator('#book-targets button:visible')).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('new-book-on-shelf.png'), animations: 'disabled', fullPage: true });
  await page.getByRole('button', { name: 'Open Research journal', exact: true }).click();
  await expect(page.locator('.book-page-status')).toHaveText('Page 1 of 2');
  await expect(page.locator('.content-section')).toContainText('Next findings.');
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.locator('.content-section')).toContainText('Original findings.');
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.getByRole('combobox', { name: 'Go to page' }).selectOption('0');
  await expect(page.locator('.content-section')).toContainText('Next findings.');
  await page.getByRole('button', { name: 'Close book' }).click();
  await page.getByRole('button', { name: 'Previous shelf', exact: true }).click();
  await expect(page.locator('#book-targets button:visible')).toHaveCount(12);
  await page.getByRole('button', { name: 'Open DSA', exact: true }).click();
  for (const [i, platform] of ['leetcode', 'hackerrank', 'geeksforgeeks'].entries()) {
    await expect(page.locator('.coding-card')).toHaveCount(1);
    await expect(page.locator('.coding-card')).toHaveAttribute('data-platform', platform);
    await expect(page.locator('.book-page-status')).toHaveText(`Page ${i + 1} of 3`);
    if (i < 2) await page.getByRole('button', { name: 'Next page', exact: true }).click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('combobox', { name: 'Go to page' }).selectOption('0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('profile-page-mobile.png'), animations: 'disabled', fullPage: true });
  expect(errors).toEqual([]);
});

test('page removal is saved, discard restores pages, and unsaved books can be discarded', async ({ page }) => {
  await page.goto(`${baseURL}/admin`);
  await page.getByRole('button', { name: 'Edit Backend', exact: true }).click();
  await page.getByRole('button', { name: /^Page 2:/ }).click();
  await page.getByRole('button', { name: 'Remove page', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Remove page', exact: true }).click();
  await expect(page.locator('#page-list button')).toHaveCount(2);
  await page.getByRole('button', { name: 'Discard book changes' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(page.locator('#page-list button')).toHaveCount(3);
  await page.getByRole('button', { name: 'Remove page', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Remove page', exact: true }).click();
  await page.getByRole('button', { name: 'Save all changes' }).click();
  await expect(page.locator('#save-state')).toHaveText('All changes saved');
  expect(JSON.parse(await readFile(join(directory, 'src/books.json'), 'utf8'))[2].pages).toHaveLength(2);
  await page.getByRole('button', { name: 'Add book', exact: true }).click();
  await page.getByRole('button', { name: 'Discard book changes' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(page.locator('#book-list button')).toHaveCount(12);
  await expect(page.getByRole('button', { name: 'Save all changes' })).toBeDisabled();
});
