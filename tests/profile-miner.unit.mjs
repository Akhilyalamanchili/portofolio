import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProfileMiner } from '../server/profile-miner.js';
import { mergeProfile, validateCoding } from '../src/coding-data.js';

const json = data => new Response(JSON.stringify(data));
const fixtureFetch = async url => {
  if (url.includes('leetcode')) return json({ data: { matchedUser: { profile: { ranking: 250 }, submitStatsGlobal: { acSubmissionNum: [{ difficulty: 'All', count: 42 }, { difficulty: 'Easy', count: 42 }] } } } });
  if (url.includes('codeforces') && url.includes('user.info')) return json({ status: 'OK', result: [{ rating: 1500, maxRating: 1600 }] });
  if (url.includes('codeforces')) return json({ status: 'OK', result: [{ ratingUpdateTimeSeconds: 1700000000, newRating: 1500, contestName: 'Round 1' }] });
  if (url.includes('atcoder') && url.endsWith('/json')) return json([{ IsRated: false, NewRating: 9000 }, { IsRated: true, NewRating: 800, EndTime: '2025-01-01T00:00:00Z', ContestName: 'ABC' }]);
  if (url.includes('atcoder')) return new Response('<span class="user-rating">800</span>');
  if (url.includes('codechef')) return new Response('<div class="rating-number">1300</div><small>Highest Rating 1400</small><h3>Total Problems Solved: 100</h3><script>var all_rating = [{"rating":"1300","getyear":"2025","getmonth":"1","getday":"2","name":"Starters"}];</script>');
  if (url.includes('geeksforgeeks')) return new Response('<script>self.__next_f.push([1,"{\\"score\\":42,\\"total_problems_solved\\":20,\\"pod_solved_current_streak\\":3}"])</script>');
  if (url.includes('hackerrank') && url.endsWith('/profile')) return json({ model: { username: 'test' } });
  return json({ status: true, models: [{ badge_type: 'problem-solving', stars: 3, solved: 20, current_points: 100 }, { badge_type: 'python', solved: 30 }] });
};

test('all six adapters normalize platform-specific public data', async () => {
  const mine = createProfileMiner({ fetchImpl: fixtureFetch, cfInterval: 0 });
  for (const platform of ['leetcode', 'codeforces', 'atcoder', 'codechef', 'geeksforgeeks', 'hackerrank']) {
    const result = await mine(platform, 'test');
    assert.equal(result.status, 'ok', JSON.stringify(result));
    assert.equal(validateCoding({ group: ['leetcode', 'geeksforgeeks', 'hackerrank'].includes(platform) ? 'dsa' : 'cp', profiles: [mergeProfile(null, result)] }), null);
    if (platform === 'hackerrank') assert.equal(result.metrics.solved, 20);
    if (platform === 'atcoder') { assert.equal(result.metrics.contests, 1); assert.equal(result.metrics.bestRating, 800); }
    if (platform === 'geeksforgeeks') assert.equal(result.metrics.score, 42);
  }
});
test('unknown users, changed markup, blocks and timeouts are not zero progress', async () => {
  for (const [platform, fetchImpl] of [
    ['leetcode', async () => json({ data: { matchedUser: null } })],
    ['codechef', async () => new Response('<html>Sign in</html>')],
    ['geeksforgeeks', async () => new Response('Forbidden', { status: 403 })],
    ['atcoder', async () => { throw new DOMException('Timeout', 'TimeoutError'); }],
    ['hackerrank', async () => json({ error: 'Not Found' })],
  ]) {
    const result = await createProfileMiner({ fetchImpl })(platform, 'missing');
    assert.equal(result.status, 'error');
    assert.equal(result.metrics, undefined);
    assert.ok(result.error);
  }
});
test('restricted inputs, bounded responses, and cache avoid unsafe or repeated fetches', async () => {
  let calls = 0;
  const mine = createProfileMiner({ fetchImpl: async (...args) => { calls++; return fixtureFetch(...args); } });
  await assert.rejects(() => mine('custom', 'test'));
  await assert.rejects(() => mine('leetcode', 'https://localhost/'));
  assert.equal(calls, 0);
  const [one, two] = await Promise.all([mine('leetcode', 'test'), mine('leetcode', 'test')]);
  assert.deepEqual(one, two); assert.equal(calls, 1);
  await mine('leetcode', 'test'); assert.equal(calls, 1);
  const big = await createProfileMiner({ fetchImpl: async () => new Response('x'.repeat(4_000_001)) })('codechef', 'test');
  assert.equal(big.status, 'error');
});
test('history survives failures, cached imports deduplicate, and changed handles reset snapshots', () => {
  const result = { platform: 'leetcode', username: 'alice', status: 'ok', attemptedAt: '2025-01-01', fetchedAt: '2025-01-01', metrics: { solved: 10 } };
  const first = mergeProfile(null, result);
  assert.equal(mergeProfile(first, result).snapshots.length, 1);
  const second = mergeProfile(first, { ...result, fetchedAt: '2025-01-02', metrics: { solved: 15 } });
  assert.equal(second.snapshots.length, 2);
  const failed = mergeProfile(second, { ...result, username: 'bob', status: 'error', error: 'Blocked' });
  assert.equal(failed.username, 'alice'); assert.equal(failed.metrics.solved, 15); assert.equal(failed.status, 'stale');
  assert.equal(mergeProfile(second, { ...result, username: 'bob' }).snapshots.length, 1);
  assert.ok(validateCoding({ group: 'cp', profiles: [first] }));
  assert.ok(validateCoding({ group: 'dsa', profiles: [{ ...first, metrics: { solved: -1 } }] }));
});
test('username redirects are upgraded to HTTPS and cannot leave the platform', async () => {
  const urls = [];
  const mine = createProfileMiner({ fetchImpl: async url => {
    urls.push(url);
    if (url.endsWith('/old-name')) return new Response(null, { status: 301, headers: { location: 'http://www.codechef.com/users/new-name' } });
    return fixtureFetch(url);
  } });
  assert.equal((await mine('codechef', 'old-name')).status, 'ok');
  assert.equal(urls[1], 'https://www.codechef.com/users/new-name');
  let calls = 0;
  const unsafe = createProfileMiner({ fetchImpl: async () => {
    calls++; return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } });
  } });
  assert.equal((await unsafe('codechef', 'test')).status, 'error');
  assert.equal(calls, 1);
});
