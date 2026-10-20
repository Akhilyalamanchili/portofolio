export const platforms = [
  { id: 'leetcode', name: 'LeetCode', group: 'dsa', url: 'https://leetcode.com/u/' },
  { id: 'hackerrank', name: 'HackerRank', group: 'dsa', url: 'https://www.hackerrank.com/profile/' },
  { id: 'geeksforgeeks', name: 'GeeksforGeeks', group: 'dsa', url: 'https://www.geeksforgeeks.org/profile/' },
  { id: 'codechef', name: 'CodeChef', group: 'cp', url: 'https://www.codechef.com/users/' },
  { id: 'codeforces', name: 'Codeforces', group: 'cp', url: 'https://codeforces.com/profile/' },
  { id: 'atcoder', name: 'AtCoder', group: 'cp', url: 'https://atcoder.jp/users/' },
];
export const metricLabels = {
  solved: 'Problems solved', rating: 'Rating', bestRating: 'Best rating',
  contests: 'Rated contests', score: 'Coding score', stars: 'Problem solving stars',
  points: 'Problem solving points', rank: 'Global rank', streak: 'Current streak',
};
export const validUsername = value => typeof value === 'string' && /^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,59}$/.test(value);
export const profileUrl = profile => platforms.find(p => p.id === profile.platform)?.url + encodeURIComponent(profile.username);

// Failed refreshes never erase a successful import, even when a new handle was tried.
export function mergeProfile(previous, result) {
  if (result.status !== 'ok') {
    if (!previous?.fetchedAt) return { ...result, snapshots: [] };
    return { ...previous, status: 'stale', attemptedAt: result.attemptedAt,
      error: `Refresh for @${result.username} failed: ${result.error}` };
  }
  const snapshots = previous?.username === result.username ? [...(previous.snapshots || [])] : [];
  // Reusing a cached response must not manufacture another progress point.
  if (snapshots.at(-1)?.date !== result.fetchedAt) snapshots.push({ date: result.fetchedAt, metrics: result.metrics });
  return { ...result, snapshots: snapshots.slice(-120) };
}

export function validateCoding(coding) {
  if (!coding || !['dsa', 'cp'].includes(coding.group) || !Array.isArray(coding.profiles) || coding.profiles.length > 3) return 'Invalid coding book.';
  const seen = new Set();
  const date = value => typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
  const metrics = value => value && typeof value === 'object' && !Array.isArray(value) &&
    Object.entries(value).every(([key, n]) => Object.hasOwn(metricLabels, key) && Number.isFinite(n) && n >= 0 && n <= 1e10);
  for (const p of coding.profiles) {
    const platform = platforms.find(item => item.id === p?.platform);
    if (!platform || platform.group !== coding.group || seen.has(p.platform) || !validUsername(p.username)) return 'Invalid coding profile or book grouping.';
    seen.add(p.platform);
    if (!['ok', 'error', 'stale'].includes(p.status) || !date(p.attemptedAt) || (p.fetchedAt && !date(p.fetchedAt))) return 'Invalid profile status or date.';
    if (p.error !== undefined && (typeof p.error !== 'string' || p.error.length > 1000)) return 'Invalid profile error.';
    if (p.detail !== undefined && (typeof p.detail !== 'string' || p.detail.length > 1000)) return 'Invalid profile detail.';
    if (p.fetchedAt && !metrics(p.metrics)) return 'Invalid coding metrics.';
    if (p.status !== 'error' && !p.fetchedAt) return 'Missing successful profile data.';
    if (p.difficulty && (!Array.isArray(p.difficulty) || p.difficulty.length > 6 || p.difficulty.some(d => !['Easy', 'Medium', 'Hard', 'Basic', 'School'].includes(d.label) || !Number.isInteger(d.value) || d.value < 0))) return 'Invalid difficulty counts.';
    if (p.history && (!Array.isArray(p.history) || p.history.length > 500 || p.history.some(h => !date(h.date) || !Number.isFinite(h.value) || Math.abs(h.value) > 1e10 || typeof h.label !== 'string' || h.label.length > 300))) return 'Invalid contest history.';
    if (!Array.isArray(p.snapshots) || p.snapshots.length > 120 || p.snapshots.some(s => !date(s.date) || !metrics(s.metrics))) return 'Invalid progress snapshots.';
  }
  return null;
}
