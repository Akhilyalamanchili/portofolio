import './admin.css';
import { validateBooks } from './book-schema.js';
import { mountBookPages } from './book-page-view.js';
import { getBookPages, createPage, createBook, MAX_BOOKS, MAX_PAGES } from './book-pages.js';
import { mountImporter } from './profile-importer.js';

document.title = 'Book editor — Akhil';
document.documentElement.dataset.theme = 'light';
document.body.innerHTML = `
  <header class="admin-header">
    <a class="brand" href="/" aria-label="Back to bookshelf"><span class="brand-mark">a.</span><span>AKHIL<span class="brand-sub">THE BOOK EDITOR</span></span></a>
    <div class="header-tools"><a class="back-link" href="/" target="_blank" rel="noopener">View bookshelf ↗</a><span class="local-badge"><i></i> Local workspace</span></div>
  </header>
  <main class="admin-main">
    <div class="page-intro"><div><p class="eyebrow">BEHIND THE BOOKSHELF</p><h1>A little room to <em>write.</em></h1><p>Shape your stories, one chapter at a time.</p></div><div class="save-tools"><span id="save-state" role="status">Opening collection…</span><button class="primary" id="save-all" disabled>Save all changes <span aria-hidden="true">↗</span></button></div></div>
    <div id="notice" role="status" hidden></div>
    <section id="profile-miner" class="profile-miner" aria-label="Coding profile webminer" hidden></section>
    <div class="editor-layout" id="editor-layout" hidden>
      <aside class="collection-panel"><div class="panel-heading"><h2>Your collection</h2><span id="collection-count"></span></div><button id="add-book" aria-label="Add book" class="add-section">＋ Add book</button><label class="search-label"><span class="sr-only">Find a book</span><input id="book-search" type="search" placeholder="Find a book…"></label><nav id="book-list" aria-label="Choose a book to edit"></nav><div class="collection-footer"><p>Saved to your project.<br>Ready for your next build.</p><button id="export" class="text-button">↓ Export draft as JSON</button></div></aside>
      <div class="writing-area">
        <form id="book-form"><div class="editor-heading"><div><p class="eyebrow" id="editing-volume"></p><h2 id="editing-title"></h2></div><button type="button" id="discard" class="text-button" disabled>Discard book changes</button></div>
          <fieldset><legend>01 <span>The cover</span></legend><p class="field-hint">The first impression, on the shelf and in the reader.</p><div class="field-grid">
            <label class="full">Book name<input name="title" required maxlength="20000" aria-describedby="book-name-hint"></label><p class="field-hint full" id="book-name-hint">Printed on the 3D book spine and shown in the reader.</p>
            <label>Category<input name="category" maxlength="20000"></label><div class="field-grid compact"><label>Volume<input name="number" maxlength="20000"></label><label>Cover color<input name="color" type="color"></label></div>
            <label class="full">Short summary<textarea name="summary" rows="3" maxlength="20000"></textarea><span class="field-hint">Shown when someone hovers over this book.</span></label>
          </div></fieldset>
          <fieldset><legend>02 <span>The opening</span></legend><div class="field-grid"><label class="full">Chapter heading<input name="heading" maxlength="20000"></label><label class="full">Introduction<textarea name="lead" rows="3" maxlength="20000"></textarea></label></div></fieldset>
          <fieldset><legend>03 <span>The pages</span></legend><p class="field-hint" id="pages-hint"></p>
            <nav id="page-list" aria-label="Choose a page to edit"></nav>
            <div class="page-editor-actions"><button type="button" id="add-page" aria-label="Add page">＋ Add page</button><button type="button" id="page-up" aria-label="Move page up">↑</button><button type="button" id="page-down" aria-label="Move page down">↓</button><button type="button" id="remove-page">Remove page</button></div>
            <label class="page-title-label">Page title<input name="page-title" maxlength="500"></label>
            <p class="field-hint">Sections below belong to the selected page. Line breaks are preserved.</p><div id="sections"></div><button type="button" class="add-section" id="add-section">＋ Add a section</button></fieldset>
          <fieldset><legend>04 <span>Finishing touches</span></legend><div class="field-grid"><label class="full">Tags<input name="tags" placeholder="Design, JavaScript, Learning"><span class="field-hint">Separate tags with commas.</span></label><label class="full">Closing note<textarea name="note" rows="3" maxlength="20000"></textarea><span class="field-hint">Clear this to remove the temporary-content note.</span></label><label class="checkbox-label full"><input name="showReference" type="checkbox"> Include the original room inspiration image</label></div></fieldset>
        </form>
      </div>
      <aside class="preview-panel"><div class="panel-heading"><h2>Reader preview</h2><span>LIVE</span></div><div id="cover-preview" class="cover-preview"><span>THE PERSONAL COLLECTION</span><span class="cover-star" aria-hidden="true">✳</span><p id="preview-category"></p><h3 id="preview-title"></h3><span id="preview-volume"></span></div><div id="reading-preview" class="reading-preview"></div><p class="preview-caption">Your words, as they’ll appear inside the book.</p></aside>
    </div>
    <footer class="admin-footer"><span>A PERSONAL COLLECTION · MADE WITH CARE</span><span>Every chapter starts with curiosity.</span></footer>
  </main>
  <dialog id="confirm-dialog" aria-labelledby="confirm-title"><h2 id="confirm-title"></h2><p id="confirm-description"></p><div class="dialog-actions"><button id="confirm-cancel">Keep editing</button><button id="confirm-accept" class="primary">Confirm</button></div></dialog>`;

const $ = selector => document.querySelector(selector);
const form = $('#book-form');
let books = [], saved = [], revision, selected = 0, selectedPage = 0, saving = false, importing = false;
const current = () => books[selected];
const pages = () => {
  if (!current().pages) {
    current().pages = structuredClone(getBookPages(current()));
    current().sections = [];
  }
  return current().pages;
};
const currentPage = () => pages()[selectedPage];
const isDirty = () => JSON.stringify(books) !== JSON.stringify(saved);
const bookDirty = index => JSON.stringify(books[index]) !== JSON.stringify(saved[index]);
const node = (tag, text, className) => {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
};
function notify(message, error = false) {
  $('#notice').textContent = message;
  $('#notice').className = error ? 'error' : 'success';
  $('#notice').hidden = !message;
}
function updateState() {
  const count = books.filter((_, index) => bookDirty(index)).length;
  $('#save-state').textContent = saving ? 'Saving to project…' : count ? `${count} book${count === 1 ? '' : 's'} with unsaved changes` : 'All changes saved';
  $('#save-all').disabled = saving || importing || !count;
  $('#discard').disabled = saving || !bookDirty(selected);
}
function renderList() {
  $('#collection-count').textContent = `${books.length} books`;
  $('#add-book').disabled = books.length >= MAX_BOOKS || saving;
  $('#add-book').title = `${books.length} of ${MAX_BOOKS} books`;
  const query = $('#book-search').value.toLowerCase().trim();
  const list = $('#book-list');
  list.replaceChildren();
  books.forEach((book, index) => {
    if (!`${book.title} ${book.category}`.toLowerCase().includes(query)) return;
    const button = node('button', undefined, 'book-choice');
    button.type = 'button';
    button.setAttribute('aria-current', String(index === selected));
    button.setAttribute('aria-label', `Edit ${book.title || 'Untitled book'}`);
    const swatch = node('span', book.number, 'book-swatch');
    swatch.style.backgroundColor = book.color;
    const copy = node('span', undefined, 'book-choice-copy');
    copy.append(node('strong', book.title || 'Untitled book'), node('span', book.category));
    button.append(swatch, copy);
    if (bookDirty(index)) button.append(node('span', '•', 'dirty-dot'));
    button.addEventListener('click', () => { selected = index; selectedPage = 0; renderForm(); });
    list.append(button);
  });
  if (!list.childElementCount) list.append(node('p', 'No books match your search.', 'empty-search'));
}
function renderPreview() {
  const book = current();
  $('#editing-title').textContent = book.title || 'Untitled book';
  $('#editing-volume').textContent = `EDITING VOLUME ${book.number}`;
  $('#cover-preview').style.backgroundColor = book.color;
  $('#preview-category').textContent = book.category;
  $('#preview-title').textContent = book.title;
  $('#preview-volume').textContent = `AKHIL / VOLUME ${book.number}`;
  const preview = $('#reading-preview');
  mountBookPages(preview, book, { initialPage: selectedPage, onChange: index => {
    if (selectedPage !== index) { selectedPage = index; renderPageList(); renderSections(); }
  } });
}
function changed() {
  notify('');
  updateState(); renderList(); renderPreview();
}
function sectionField(section, index, key, title, multiline = false) {
  const label = node('label', title);
  const input = node(multiline ? 'textarea' : 'input');
  input.value = section[key] || '';
  input.name = `section-${index}-${key}`;
  input.maxLength = key === 'text' ? 50000 : key === 'title' ? 500 : 2000;
  if (multiline) input.rows = 6;
  input.addEventListener('input', () => { section[key] = input.value; changed(); });
  label.append(input);
  return label;
}
async function confirmAction(title, description, action) {
  const dialog = $('#confirm-dialog');
  $('#confirm-title').textContent = title;
  $('#confirm-description').textContent = description;
  $('#confirm-accept').textContent = action;
  return new Promise(resolve => {
    $('#confirm-cancel').onclick = () => dialog.close('cancel');
    $('#confirm-accept').onclick = () => dialog.close('accept');
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'accept'), { once: true });
    dialog.returnValue = '';
    dialog.showModal();
    $('#confirm-cancel').focus();
  });
}
function renderSections() {
  const container = $('#sections');
  container.replaceChildren();
  currentPage().sections.forEach((section, index) => {
    const card = node('div', undefined, 'section-card');
    const header = node('div', undefined, 'section-toolbar');
    header.append(node('h3', `Section ${String(index + 1).padStart(2, '0')}`));
    const controls = node('div');
    for (const [label, symbol, offset] of [['Move up', '↑', -1], ['Move down', '↓', 1]]) {
      const button = node('button', symbol);
      button.type = 'button'; button.setAttribute('aria-label', `${label} section ${index + 1}`);
      button.disabled = index + offset < 0 || index + offset >= currentPage().sections.length;
      button.addEventListener('click', () => {
        const sections = currentPage().sections;
        [sections[index], sections[index + offset]] = [sections[index + offset], sections[index]];
        renderSections(); changed();
        container.children[index + offset].querySelector('input').focus();
      });
      controls.append(button);
    }
    const remove = node('button', 'Remove', 'remove-section');
    remove.type = 'button'; remove.setAttribute('aria-label', `Remove section ${index + 1}`);
    remove.addEventListener('click', async () => {
      if (!await confirmAction('Remove this section?', `“${section.title || 'Untitled section'}” will be removed from this draft. Save to apply the change.`, 'Remove section')) return;
      currentPage().sections.splice(index, 1); renderSections(); changed();
      $('#add-section').focus();
    });
    controls.append(remove); header.append(controls);
    card.append(header, sectionField(section, index, 'title', 'Section title'), sectionField(section, index, 'text', 'Content', true), sectionField(section, index, 'detail', 'Supporting detail (optional)'));
    container.append(card);
  });
  if (!currentPage().sections.length) container.append(node('p', currentPage().platform ? 'Profile statistics appear automatically on this page. Add your own notes below.' : 'A blank page. Add your first section below.', 'field-hint'));
  $('#add-section').disabled = currentPage().sections.length >= 100;
}
function renderPageList() {
  const list = $('#page-list');
  list.replaceChildren();
  pages().forEach((page, index) => {
    const button = node('button', `${String(index + 1).padStart(2, '0')} · ${page.title || 'Untitled page'}`, 'page-choice');
    button.type = 'button';
    button.setAttribute('aria-label', `Page ${index + 1}: ${page.title || 'Untitled page'}`);
    button.setAttribute('aria-current', String(index === selectedPage));
    button.onclick = () => { selectedPage = index; renderPageList(); renderSections(); renderPreview(); };
    list.append(button);
  });
  form.elements['page-title'].value = currentPage().title;
  $('#pages-hint').textContent = current().coding ? 'Three pages, one coding profile per page. Select a page to add notes or change its position.' : `${pages().length} of ${MAX_PAGES} pages. Add, reorder, and fill each page with its own sections.`;
  $('#add-page').disabled = Boolean(current().coding) || pages().length >= MAX_PAGES;
  $('#remove-page').disabled = Boolean(current().coding) || pages().length === 1;
  $('#page-up').disabled = selectedPage === 0;
  $('#page-down').disabled = selectedPage === pages().length - 1;
}
function renderForm() {
  const book = current();
  selectedPage = Math.min(selectedPage, pages().length - 1);
  for (const key of ['title', 'category', 'number', 'color', 'summary', 'heading', 'lead', 'note']) form.elements[key].value = book[key];
  form.elements.tags.value = book.tags.join(', ');
  form.elements.showReference.checked = book.showReference;
  renderPageList(); renderSections(); renderPreview(); renderList(); updateState();
}
form.addEventListener('submit', event => event.preventDefault());
form.addEventListener('input', event => {
  const { name, value, checked } = event.target;
  if (name.startsWith('section-')) return;
  if (name === 'page-title') {
    currentPage().title = value;
    // Avoid replacing the focused text field while editing its title.
    const button = $('#page-list').children[selectedPage];
    button.textContent = `${String(selectedPage + 1).padStart(2, '0')} · ${value || 'Untitled page'}`;
    button.setAttribute('aria-label', `Page ${selectedPage + 1}: ${value || 'Untitled page'}`);
    changed(); return;
  }
  if (name === 'tags') current().tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
  else if (name === 'showReference') current().showReference = checked;
  else if (Object.hasOwn(current(), name)) current()[name] = value;
  // Keep the legacy export field in sync; the shelf uses the canonical title.
  if (name === 'title') current().spine = value;
  changed();
});
$('#book-search').addEventListener('input', renderList);
$('#add-section').addEventListener('click', () => {
  currentPage().sections.push({ title: '', text: '', detail: '' });
  renderSections(); changed();
  $('#sections').lastElementChild.querySelector('input').focus();
});
$('#add-page').addEventListener('click', () => {
  if (current().coding || pages().length >= MAX_PAGES) return;
  pages().push(createPage(`Page ${pages().length + 1}`));
  selectedPage = pages().length - 1;
  renderForm(); changed(); form.elements['page-title'].focus();
});
for (const [id, offset] of [['page-up', -1], ['page-down', 1]]) {
  $(`#${id}`).addEventListener('click', () => {
    const target = selectedPage + offset, collection = pages();
    if (target < 0 || target >= collection.length) return;
    [collection[selectedPage], collection[target]] = [collection[target], collection[selectedPage]];
    selectedPage = target; renderForm(); changed();
    $('#page-list').children[selectedPage].focus();
  });
}
$('#remove-page').addEventListener('click', async () => {
  if (current().coding || pages().length < 2) return;
  if (!await confirmAction('Remove this page?', `“${currentPage().title || 'Untitled page'}” and its sections will be removed from this draft.`, 'Remove page')) return;
  pages().splice(selectedPage, 1); selectedPage = Math.max(0, selectedPage - 1);
  renderForm(); changed(); $('#add-page').focus();
});
$('#add-book').addEventListener('click', () => {
  if (books.length >= MAX_BOOKS || saving) return;
  books.push(createBook(books.length)); selected = books.length - 1; selectedPage = 0;
  $('#book-search').value = '';
  renderForm(); notify('New book added to your draft. Add pages and save to place it on the shelf.');
  form.elements.title.focus();
});
$('#discard').addEventListener('click', async () => {
  if (await confirmAction('Discard this book’s changes?', 'The last saved version of this book will be restored. Drafts in other books will be kept.', 'Discard changes')) {
    if (saved[selected]) books[selected] = structuredClone(saved[selected]);
    else books.splice(selected, 1);
    selected = Math.min(selected, books.length - 1); selectedPage = 0;
    renderForm(); notify('Discarded this book’s unsaved changes.');
  }
});
$('#export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(books, null, 2) + '\n'], { type: 'application/json' }));
  const anchor = node('a'); anchor.href = url; anchor.download = 'books.json'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
async function save(fromImport = false) {
  if (saving || (importing && fromImport !== true) || !books.length) return false;
  if (!isDirty()) return true;
  const error = validateBooks(books, saved.map(book => book.id));
  if (error) { notify(error, true); return false; }
  const snapshot = structuredClone(books);
  saving = true; updateState();
  try {
    const response = await fetch('/api/books', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ books: snapshot, revision }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not save the collection.');
    revision = result.revision; saved = snapshot;
    notify('Saved to your project. The bookshelf and your next build will use these changes.');
    return true;
  } catch (error) { notify(error.message || 'Could not save. Your draft is still here.', true); return false; }
  finally { saving = false; updateState(); renderList(); }
}
$('#save-all').addEventListener('click', save);
window.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); save(); }
});
window.addEventListener('beforeunload', event => { if (isDirty() || importing) { event.preventDefault(); event.returnValue = ''; } });
try {
  const response = await fetch('/api/books');
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('The book editor runs locally. Start npm run dev and open /admin on localhost to edit this project.');
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  const error = validateBooks(result.books, result.books.map(book => book.id));
  if (error) throw new Error(error);
  books = result.books; saved = structuredClone(books); revision = result.revision;
  $('#editor-layout').hidden = false;
  $('#profile-miner').hidden = false;
  mountImporter($('#profile-miner'), {
    getBooks: () => books,
    canStart: () => !saving && !importing,
    setBusy: busy => { importing = busy; $('#editor-layout').inert = busy; updateState(); },
    imported: async () => { renderForm(); return save(true); },
  });
  renderForm();
} catch (error) {
  $('#save-state').textContent = 'Editor unavailable';
  notify(error.message || 'Could not load your books. Reload to try again.', true);
}
