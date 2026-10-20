import { test, expect } from '@playwright/test';
import { createServer } from 'vite';
import { mkdtemp, cp, copyFile, symlink, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { bookEditor } from '../server/book-editor.js';

let server, directory, baseURL, original, sequence = 0;
const project = resolve('.');
test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'profile-import-test-'));
  await cp(join(project, 'src'), join(directory, 'src'), { recursive: true });
  for (const file of ['index.html', 'favicon.svg']) await copyFile(join(project, file), join(directory, file));
  for (const folder of ['node_modules', 'landing_page_images']) await symlink(join(project, folder), join(directory, folder));
  const fixtures = JSON.parse(await readFile(join(directory, 'src/books.json'), 'utf8'));
  // Keep tests independent of the owner's imported profile history.
  fixtures.forEach(book => { if (book.coding) book.coding.profiles = []; });
  original = JSON.stringify(fixtures, null, 2) + '\n';
  server = await createServer({
    root: directory, configFile: false, logLevel: 'error', cacheDir: join(directory, '.vite'),
    plugins: [bookEditor({ filePath: join(directory, 'src/books.json'), mineProfile: async (platform, username) => {
      const date = new Date(Date.UTC(2026, 0, 1, 0, 0, sequence++)).toISOString();
      if (username === 'missing') return { platform, username, status: 'error', attemptedAt: date, error: 'Public profile not found.' };
      return { platform, username, status: 'ok', attemptedAt: date, fetchedAt: date,
        metrics: ['leetcode', 'hackerrank', 'geeksforgeeks'].includes(platform) ? { solved: 50 + sequence } : { rating: 1200 + sequence, bestRating: 1500, contests: 2 },
        difficulty: platform === 'leetcode' ? [{ label: 'Easy', value: 20 }, { label: 'Medium', value: 25 }, { label: 'Hard', value: 6 }] : [],
        history: ['codechef', 'codeforces', 'atcoder'].includes(platform) ? [{ date: '2025-01-01', value: 1100, label: 'First contest' }, { date: '2025-02-01', value: 1200, label: 'Second contest' }] : [] };
    } })],
    server: { host: '127.0.0.1', port: 0, fs: { allow: [directory, project] } },
  });
  await server.listen();
  baseURL = `http://127.0.0.1:${server.httpServer.address().port}`;
});
test.beforeEach(async () => { sequence = 0; await writeFile(join(directory, 'src/books.json'), original); });
test.afterAll(async () => { await server?.close(); if (directory) await rm(directory, { recursive: true, force: true }); });

test('one-click imports persist, group correctly, and accumulate progress without erasing failed profiles', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${baseURL}/admin`);
  await page.getByLabel('Shared username', { exact: true }).fill('alice');
  await page.getByLabel('Codeforces username', { exact: true }).fill('bob');
  await page.getByRole('button', { name: 'Fetch & save books' }).click();
  await expect(page.locator('.miner-status')).toContainText('6 of 6 profiles imported. Books saved.');
  let stored = JSON.parse(await readFile(join(directory, 'src/books.json'), 'utf8'));
  expect(stored[0].coding.profiles.map(p => p.platform)).toEqual(['leetcode', 'hackerrank', 'geeksforgeeks']);
  expect(stored[1].coding.profiles.map(p => p.platform)).toEqual(['codechef', 'codeforces', 'atcoder']);
  expect(stored[1].coding.profiles[1].username).toBe('bob');
  expect(stored.slice(2)).toEqual(JSON.parse(original).slice(2));
  await page.reload();
  await expect(page.getByLabel('Codeforces username', { exact: true })).toHaveValue('bob');
  await page.getByRole('button', { name: 'Fetch & save books' }).click();
  await expect(page.locator('.miner-status')).toContainText('6 of 6 profiles imported. Books saved.');
  stored = JSON.parse(await readFile(join(directory, 'src/books.json'), 'utf8'));
  expect(stored[0].coding.profiles[0].snapshots).toHaveLength(2);
  await page.getByLabel('LeetCode username', { exact: true }).fill('missing');
  await page.getByRole('button', { name: 'Fetch & save books' }).click();
  await expect(page.locator('.miner-status')).toContainText('5 of 6 profiles imported. Books saved.');
  const latest = JSON.parse(await readFile(join(directory, 'src/books.json'), 'utf8'));
  expect(latest[0].coding.profiles[0].username).toBe('alice');
  expect(latest[0].coding.profiles[0].metrics).toEqual(stored[0].coding.profiles[0].metrics);
  expect(latest[0].coding.profiles[0].status).toBe('stale');
  await page.screenshot({ path: testInfo.outputPath('webminer-desktop.png'), fullPage: true });

  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.includes('webgl') ? null : getContext.call(this, type, ...args); };
  });
  await page.goto(baseURL);
  await expect(page.locator('#profile-miner')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open DSA', exact: true }).click();
  await expect(page.locator('.coding-card')).toHaveCount(1);
  await expect(page.locator('.coding-card[data-platform="leetcode"]')).toContainText('Last saved data');
  await expect(page.locator('.coding-card[data-platform="leetcode"] svg')).toHaveAttribute('role', 'img');
  await expect(page.getByRole('link', { name: '@alice ↗' })).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('dsa-reader.png'), animations: 'disabled', fullPage: true });
  await page.getByRole('button', { name: 'Close book' }).click();
  await page.getByRole('button', { name: 'Open Competitive Programming', exact: true }).click();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(page.locator('[data-platform="codeforces"]')).toContainText('Contest rating over time');
  await expect(page.locator('[data-platform="codeforces"]')).toContainText('1,500');
  await page.screenshot({ path: testInfo.outputPath('cp-reader.png'), animations: 'disabled', fullPage: true });
  await page.locator('[data-platform="codeforces"] .coding-chart').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('cp-chart.png'), animations: 'disabled', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('#reader-content').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('cp-reader-mobile.png'), animations: 'disabled', fullPage: true });
  expect(errors).toEqual([]);
});

test('mobile importer validates handles, supports platform selection, and preserves drafts on save conflict', async ({ page, request }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseURL}/admin`);
  await page.getByRole('button', { name: 'Fetch & save books' }).click();
  await expect(page.locator('.miner-status')).toContainText('Enter a valid username for LeetCode');
  for (const name of ['HackerRank', 'GeeksforGeeks', 'CodeChef', 'Codeforces', 'AtCoder']) await page.getByRole('checkbox', { name, exact: true }).uncheck();
  await page.getByLabel('Shared username', { exact: true }).fill('alice');
  const initial = await (await request.get(`${baseURL}/api/books`)).json();
  initial.books[2].note = 'Saved elsewhere';
  expect((await request.put(`${baseURL}/api/books`, { data: initial })).status()).toBe(200);
  await page.getByRole('button', { name: 'Fetch & save books' }).click();
  await expect(page.locator('.miner-status')).toContainText('Not saved');
  await expect(page.locator('#notice')).toContainText('changed in another editor');
  await expect(page.locator('#reading-preview [data-platform="leetcode"]')).toContainText('@alice');
  expect(JSON.parse(await readFile(join(directory, 'src/books.json'), 'utf8'))[0].coding.profiles).toHaveLength(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('webminer-mobile.png'), fullPage: true });
});

test('profile API enforces local access and validated platform input', async ({ request }) => {
  const url = `${baseURL}/api/profiles`;
  expect((await request.get(url)).status()).toBe(405);
  expect((await request.post(url, { data: { platform: 'leetcode', username: 'https://127.0.0.1' } })).status()).toBe(400);
  expect((await request.post(url, { data: { platform: 'custom', username: 'alice' } })).status()).toBe(400);
  expect((await request.post(url, { headers: { Origin: 'https://other.example' }, data: { platform: 'leetcode', username: 'alice' } })).status()).toBe(403);
  const data = await (await request.get(`${baseURL}/api/books`)).json();
  data.books[0].coding = { group: 'cp', profiles: [] };
  expect((await request.put(`${baseURL}/api/books`, { data })).status()).toBe(400);
});
