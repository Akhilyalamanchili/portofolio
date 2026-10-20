import { platforms, validUsername, mergeProfile } from './coding-data.js';

export function mountImporter(container, { getBooks, setBusy, imported, canStart }) {
  container.innerHTML = `
    <div class="miner-heading"><div><p class="eyebrow">PROFILE WEBMINER · ADMIN ONLY</p><h2>Your practice, on the page.</h2><p>Connect your coding profiles. Turn the numbers into a story of progress.</p></div><span class="miner-mark" aria-hidden="true">↙</span></div>
    <form id="miner-form">
      <div class="miner-shared"><label>Shared username<input name="shared" placeholder="Your coding handle" maxlength="60" autocomplete="off" spellcheck="false"></label><p>Use one handle across platforms, or enter different usernames below. Uncheck platforms you don’t use.</p></div>
      <div class="miner-groups"></div>
      <div class="miner-actions"><p>Fetches public data into books 01 and 02, then saves your current book drafts. Repeat imports build your progress history.</p><button class="primary" type="submit">Fetch & save books ↗</button></div>
      <p class="miner-status" role="status" aria-live="polite">Ready when you are. No passwords needed.</p>
    </form>`;
  const form = container.querySelector('form'), groups = container.querySelector('.miner-groups');
  for (const [group, name] of [['dsa', '01 / DSA'], ['cp', '02 / Competitive programming']]) {
    const fieldset = document.createElement('fieldset'), legend = document.createElement('legend');
    legend.textContent = name; fieldset.append(legend);
    for (const platform of platforms.filter(p => p.group === group)) {
      const saved = getBooks().flatMap(b => b.coding?.profiles || []).find(p => p.platform === platform.id);
      const row = document.createElement('div'); row.className = 'miner-platform';
      row.innerHTML = `<label class="checkbox-label"><input type="checkbox" name="${platform.id}-enabled" checked> ${platform.name}</label><label><span class="sr-only">${platform.name} username</span><input name="${platform.id}" maxlength="60" placeholder="Uses shared username" autocomplete="off" spellcheck="false"></label><span class="miner-result"></span>`;
      row.querySelector(`input[name="${platform.id}"]`).value = saved?.username || '';
      fieldset.append(row);
    }
    groups.append(fieldset);
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const status = form.querySelector('.miner-status'), button = form.querySelector('button');
    if (!canStart()) { status.textContent = 'Wait for the current save or import to finish.'; return; }
    const selected = platforms.filter(p => form.elements[`${p.id}-enabled`].checked).map(p => ({
      ...p, username: (form.elements[p.id].value || form.elements.shared.value).trim(),
    }));
    if (!selected.length) { status.textContent = 'Select at least one platform to import.'; return; }
    const invalid = selected.find(p => !validUsername(p.username));
    if (invalid) {
      status.textContent = `Enter a valid username for ${invalid.name} (letters, numbers, dots, underscores or hyphens), or uncheck it.`;
      form.elements[invalid.id].focus(); return;
    }
    setBusy(true);
    [...form.elements].forEach(input => { input.disabled = true; });
    button.textContent = 'Fetching profiles…';
    status.textContent = `Fetching ${selected.length} public profiles. This can take up to 30 seconds.`;
    let complete = 0;
    const results = await Promise.all(selected.map(async p => {
      const row = form.elements[p.id].closest('.miner-platform');
      row.querySelector('.miner-result').textContent = 'Fetching…';
      let result;
      try {
        const response = await fetch('/api/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(35000), body: JSON.stringify({ platform: p.id, username: p.username }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Import failed.');
        result = data;
      } catch (error) {
        result = { platform: p.id, username: p.username, status: 'error', attemptedAt: new Date().toISOString(),
          error: error.name === 'TimeoutError' ? 'Request timed out. Try again.' : error.message };
      }
      row.querySelector('.miner-result').textContent = result.status === 'ok' ? '✓ Imported' : `↻ ${result.error}`;
      row.querySelector('.miner-result').classList.toggle('failed', result.status !== 'ok');
      status.textContent = `${++complete} of ${selected.length} profiles checked…`;
      return result;
    }));
    const books = getBooks();
    for (const result of results) {
      const group = platforms.find(p => p.id === result.platform).group;
      const book = books[group === 'dsa' ? 0 : 1];
      book.coding ||= { group, profiles: [] };
      const previous = book.coding.profiles.find(p => p.platform === result.platform);
      book.coding.profiles = book.coding.profiles.filter(p => p.platform !== result.platform);
      book.coding.profiles.push(mergeProfile(previous, result));
    }
    const count = results.filter(r => r.status === 'ok').length;
    try {
      const saved = await imported();
      status.textContent = `${count} of ${selected.length} profiles imported. ${saved ? 'Books saved.' : 'Not saved — your imported data remains in the drafts. See the message above.'}${count < selected.length ? ' Unavailable profiles keep their last successful data; check the messages and retry.' : ''}`;
    } finally {
      setBusy(false);
      [...form.elements].forEach(input => { input.disabled = false; });
      button.textContent = 'Fetch & save books ↗';
    }
  });
}
