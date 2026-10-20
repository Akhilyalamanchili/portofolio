import { platforms, validUsername } from '../src/coding-data.js';

const number = value => value === null || value === undefined || value === '' ? undefined : Number(String(value).replaceAll(',', ''));
const cleanMetrics = data => Object.fromEntries(Object.entries(data).filter(([, v]) => Number.isFinite(v) && v >= 0));
const unavailable = () => new Error('Public profile data was not found or its format changed. Check the username and try again.');
const points = rows => rows.filter(p => Number.isFinite(p.value) && Number.isFinite(Date.parse(p.date)))
  .sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).slice(-500);

export function createProfileMiner({ fetchImpl = fetch, timeout = 25000, cfInterval = 2100 } = {}) {
  const cache = new Map(), pending = new Map();
  let cfQueue = Promise.resolve(), lastCfCall = 0;
  async function codeforcesRequest(get, url) {
    const work = cfQueue.then(async () => {
      const delay = Math.max(0, cfInterval - (Date.now() - lastCfCall));
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      lastCfCall = Date.now();
      const result = await get(url);
      if (result.status !== 'OK') throw unavailable();
      return result.result;
    });
    cfQueue = work.catch(() => {});
    return work;
  }
  async function collect(platform, username) {
    const signal = AbortSignal.timeout(timeout);
    async function get(url, options = {}, html = false) {
      let target = new URL(url), response;
      for (let redirects = 0; redirects <= 3; redirects++) {
        response = await fetchImpl(target.href, { ...options, signal, redirect: 'manual',
          headers: { 'User-Agent': 'PortfolioProfileImporter/1.0', Accept: html ? 'text/html' : 'application/json', ...options.headers } });
        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        await response.body?.cancel();
        const location = response.headers.get('location');
        if (!location || redirects === 3) throw unavailable();
        const next = new URL(location, target);
        // Profiles can redirect after a username change. Stay on the original
        // platform and upgrade legacy HTTP redirects, without becoming a proxy.
        if (next.hostname !== new URL(url).hostname || next.username || next.password || next.port ||
          !['http:', 'https:'].includes(next.protocol)) throw unavailable();
        next.protocol = 'https:';
        target = next;
      }
      if (!response.ok) {
        if ([403, 429].includes(response.status)) throw new Error('The platform blocked or rate-limited this request. Try again later.');
        if (response.status === 404) throw new Error('Public profile not found. Check the username.');
        throw new Error(`The platform returned HTTP ${response.status}. Try again later.`);
      }
      // Bound even streamed/chunked upstream responses.
      const reader = response.body.getReader();
      const chunks = []; let bytes = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value.length;
          if (bytes > 4_000_000) throw new Error('Profile response was too large.');
          chunks.push(Buffer.from(value));
        }
      } finally { await reader.cancel(); }
      const text = Buffer.concat(chunks).toString('utf8');
      if (html) return text;
      try { return JSON.parse(text); } catch { throw unavailable(); }
    }
    const u = encodeURIComponent(username);
    if (platform === 'leetcode') {
      const response = await get('https://leetcode.com/graphql/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'query Profile($username: String!) { matchedUser(username: $username) { submitStatsGlobal { acSubmissionNum { difficulty count } } profile { ranking } } }', variables: { username } }),
      });
      const user = response.data?.matchedUser;
      if (!user || response.errors || !Array.isArray(user.submitStatsGlobal?.acSubmissionNum)) throw unavailable();
      const stats = user.submitStatsGlobal.acSubmissionNum;
      const solved = number(stats.find(s => s.difficulty === 'All')?.count);
      if (!Number.isFinite(solved)) throw unavailable();
      return { metrics: cleanMetrics({ solved, rank: number(user.profile?.ranking) }),
        difficulty: stats.filter(s => ['Easy', 'Medium', 'Hard'].includes(s.difficulty)).map(s => ({ label: s.difficulty, value: number(s.count) })) };
    }
    if (platform === 'codeforces') {
      const users = await codeforcesRequest(get, `https://codeforces.com/api/user.info?handles=${u}`);
      if (!users?.[0]) throw unavailable();
      const history = await codeforcesRequest(get, `https://codeforces.com/api/user.rating?handle=${u}`);
      if (!Array.isArray(history)) throw unavailable();
      return { metrics: cleanMetrics({ rating: users[0].rating, bestRating: users[0].maxRating, contests: history.length }),
        history: points(history.map(h => ({ date: new Date(h.ratingUpdateTimeSeconds * 1000).toISOString(), value: h.newRating, label: h.contestName.slice(0, 300) }))) };
    }
    if (platform === 'atcoder') {
      const html = await get(`https://atcoder.jp/users/${u}`, {}, true);
      if (!html.includes('user-rating') && !html.includes('Rank</th>')) throw unavailable();
      const rows = await get(`https://atcoder.jp/users/${u}/history/json`);
      if (!Array.isArray(rows)) throw unavailable();
      const history = points(rows.filter(h => h.IsRated).map(h => ({ date: h.EndTime, value: h.NewRating, label: String(h.ContestName).slice(0, 300) })));
      return { metrics: cleanMetrics({ contests: rows.filter(h => h.IsRated).length, rating: history.at(-1)?.value,
        bestRating: history.length ? Math.max(...rows.filter(h => h.IsRated).map(h => h.NewRating)) : undefined }), history };
    }
    if (platform === 'codechef') {
      const html = await get(`https://www.codechef.com/users/${u}`, {}, true);
      const rating = number(html.match(/class=["']rating-number["'][^>]*>\s*(\d+)/)?.[1]);
      const solved = number(html.match(/Total Problems Solved:\s*([\d,]+)/)?.[1]);
      if (rating === undefined && solved === undefined) throw unavailable();
      const raw = html.match(/var\s+all_rating\s*=\s*(\[[\s\S]*?\]);/)?.[1];
      const rows = raw ? JSON.parse(raw) : [];
      return { metrics: cleanMetrics({ rating, solved, bestRating: number(html.match(/Highest Rating\s+(\d+)/)?.[1]), contests: raw ? rows.length : undefined }),
        history: points(rows.map(h => ({ date: `${h.getyear}-${String(h.getmonth).padStart(2, '0')}-${String(h.getday).padStart(2, '0')}T00:00:00Z`, value: number(h.rating), label: String(h.name).slice(0, 300) }))) };
    }
    if (platform === 'geeksforgeeks') {
      const html = await get(`https://www.geeksforgeeks.org/profile/${u}?tab=activity`, {}, true);
      // Read embedded Next.js data, including escaped React flight payloads.
      const text = html.replaceAll('\\"', '"');
      const value = key => number(text.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`))?.[1]);
      const solved = value('total_problems_solved');
      if (solved === undefined) throw unavailable();
      return { metrics: cleanMetrics({ solved, score: value('score'), streak: value('pod_solved_current_streak') }) };
    }
    if (platform === 'hackerrank') {
      const user = await get(`https://www.hackerrank.com/rest/contests/master/hackers/${u}/profile`);
      if (!user.model?.username || user.model.deleted) throw unavailable();
      const badges = await get(`https://www.hackerrank.com/rest/hackers/${u}/badges`);
      if (!Array.isArray(badges.models) || badges.status !== true) throw unavailable();
      const dsa = badges.models.find(b => b.badge_type === 'problem-solving');
      // Language badges overlap with other tracks; never sum them into a solved total.
      return { metrics: dsa ? cleanMetrics({ solved: number(dsa.solved), stars: number(dsa.stars), points: number(dsa.current_points) }) : {},
        detail: dsa ? 'Problem Solving track only.' : 'Public profile found; no Problem Solving badge data is available.' };
    }
    throw unavailable();
  }
  return async function mine(platform, username) {
    if (!platforms.some(p => p.id === platform) || !validUsername(username)) throw new Error('Choose a supported platform and a valid username (letters, numbers, dots, underscores or hyphens).');
    const key = `${platform}:${username}`;
    if (cache.has(key) && Date.now() - cache.get(key).time < 60_000) return cache.get(key).result;
    if (pending.has(key)) return pending.get(key);
    if (pending.size >= 6) throw new Error('An import is already running. Try again shortly.');
    const work = (async () => {
      const attemptedAt = new Date().toISOString();
      try {
        const data = await collect(platform, username);
        const result = { platform, username, status: 'ok', attemptedAt, fetchedAt: new Date().toISOString(), ...data };
        if (cache.size >= 120) cache.delete(cache.keys().next().value);
        cache.set(key, { time: Date.now(), result });
        return result;
      } catch (error) {
        const message = signalError(error) ? 'The platform timed out. Try again later.' :
          error.message === 'fetch failed' ? 'Could not reach the platform. Check your connection and try again.' : error.message;
        return { platform, username, status: 'error', attemptedAt, error: message.slice(0, 500) };
      } finally { pending.delete(key); }
    })();
    pending.set(key, work);
    return work;
  };
}
const signalError = error => ['TimeoutError', 'AbortError'].includes(error.name);
