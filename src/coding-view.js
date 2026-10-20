import './coding.css';
import { platforms, metricLabels, profileUrl } from './coding-data.js';

const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const format = number => number.toLocaleString('en-US', { maximumFractionDigits: 1 });
const date = value => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function chart(history, title) {
  const block = el('div', undefined, 'coding-chart');
  block.append(el('h5', title));
  const values = history.map(h => h.value), low = Math.min(...values), high = Math.max(...values);
  const dates = history.map(h => Date.parse(h.date)), start = Math.min(...dates), end = Math.max(...dates);
  const coords = history.map((h, i) => `${15 + (dates[i] - start) / (end - start || 1) * 370},${88 - (h.value - low) / (high - low || 1) * 65}`);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 400 108');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${title}: ${format(values[0])} on ${date(history[0].date)} to ${format(values.at(-1))} on ${date(history.at(-1).date)}. Range ${format(low)} to ${format(high)}.`);
  const path = document.createElementNS(svg.namespaceURI, 'polyline');
  path.setAttribute('points', coords.join(' '));
  path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '2.5');
  svg.append(path);
  history.forEach((h, i) => {
    const dot = document.createElementNS(svg.namespaceURI, 'circle'), [x, y] = coords[i].split(',');
    dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', history.length > 50 ? '1.5' : '3');
    dot.setAttribute('fill', 'currentColor');
    const tooltip = document.createElementNS(svg.namespaceURI, 'title');
    tooltip.textContent = `${h.label || date(h.date)} · ${date(h.date)} · ${format(h.value)}`;
    dot.append(tooltip); svg.append(dot);
  });
  block.append(svg);
  const axis = el('div', undefined, 'coding-axis');
  axis.append(el('span', `${date(history[0].date)} · ${format(values[0])}`), el('span', `${date(history.at(-1).date)} · ${format(values.at(-1))}`));
  block.append(axis, el('p', `Range ${format(low)}–${format(high)} · ${history.length} observations`, 'coding-caption'));
  const details = el('details'), summary = el('summary', 'View recent values');
  const list = el('ol');
  history.slice(-10).reverse().forEach(h => list.append(el('li', `${date(h.date)} · ${h.label || 'Import'} · ${format(h.value)}`)));
  details.append(summary, list); block.append(details);
  return block;
}

export function renderCoding(coding, platformId) {
  const root = el('div', undefined, 'coding-dashboard');
  const available = coding.profiles.filter(p => p.fetchedAt);
  const summary = el('div', undefined, 'coding-overview');
  summary.append(el('span', coding.group === 'dsa' ? 'THE PRACTICE JOURNAL' : 'THE CONTEST JOURNAL', 'coding-kicker'),
    el('h4', coding.group === 'dsa' ? 'Small steps. Stronger foundations.' : 'Every contest tells a story.'),
    el('p', `${available.length} of 3 profiles connected · ${coding.group === 'dsa' ? 'Practice, difficulty & growth' : 'Ratings, contests & personal bests'}`));
  root.append(summary);
  for (const platform of platforms.filter(p => p.group === coding.group && (!platformId || p.id === platformId))) {
    const profile = coding.profiles.find(p => p.platform === platform.id);
    const card = el('article', undefined, 'coding-card');
    card.dataset.platform = platform.id;
    const header = el('div', undefined, 'coding-card-header');
    const heading = el('div');
    heading.append(el('span', platform.id.slice(0, 2).toUpperCase(), 'coding-icon'), el('h4', platform.name));
    header.append(heading, el('span', !profile ? 'Not connected' : profile.status === 'ok' ? 'Imported' : profile.fetchedAt ? 'Last saved data' : 'Unavailable', `coding-status ${profile?.status || ''}`));
    card.append(header);
    if (!profile) {
      card.append(el('p', 'No public profile has been added yet.', 'coding-caption'));
      root.append(card); continue;
    }
    const link = el('a', `@${profile.username} ↗`, 'coding-profile-link');
    link.href = profileUrl(profile); link.target = '_blank'; link.rel = 'noopener noreferrer';
    card.append(link);
    if (profile.error) card.append(el('p', profile.error, 'coding-error'));
    if (profile.fetchedAt) {
      const metrics = el('dl', undefined, 'coding-metrics');
      for (const [key, value] of Object.entries(profile.metrics)) {
        const cell = el('div');
        cell.append(el('dt', metricLabels[key]), el('dd', format(value)));
        metrics.append(cell);
      }
      card.append(metrics);
      if (profile.detail) card.append(el('p', profile.detail, 'coding-caption'));
      if (profile.difficulty?.length) {
        const total = profile.difficulty.reduce((sum, d) => sum + d.value, 0);
        const bars = el('div', undefined, 'coding-difficulty');
        profile.difficulty.forEach(d => {
          const row = el('div');
          row.append(el('span', d.label), el('strong', format(d.value)));
          const track = el('div', undefined, 'coding-bar'), fill = el('i');
          fill.style.width = `${total ? d.value / total * 100 : 0}%`;
          fill.dataset.level = d.label;
          track.append(fill); row.append(track); bars.append(row);
        });
        card.append(bars, el('p', 'Share of solved problems by difficulty', 'coding-caption'));
      }
      if (profile.history?.length) card.append(chart(profile.history, 'Contest rating over time'));
      const key = profile.metrics.solved !== undefined ? 'solved' : profile.metrics.rating !== undefined ? 'rating' : 'points';
      const snapshots = profile.snapshots.filter(s => s.metrics[key] !== undefined).map(s => ({ date: s.date, value: s.metrics[key], label: 'Import' }));
      if (snapshots.length > 1) {
        const delta = snapshots.at(-1).value - snapshots[0].value;
        card.append(el('p', `${delta > 0 ? '+' : ''}${format(delta)} ${metricLabels[key].toLowerCase()} since ${date(snapshots[0].date)}`, 'coding-growth'),
          chart(snapshots, `${metricLabels[key]} across imports`));
      } else if (!profile.history?.length) card.append(el('p', 'First snapshot saved. Future imports will reveal progress over time.', 'coding-caption'));
      card.append(el('p', `Last successful import · ${new Date(profile.fetchedAt).toLocaleString()}`, 'coding-timestamp'));
    }
    root.append(card);
  }
  root.append(el('p', 'Each platform uses its own scoring system. Ratings are shown separately; missing metrics are not counted as zero.', 'coding-caption'));
  return root;
}
