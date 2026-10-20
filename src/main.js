import './styles.css';
import { books } from './content.js';
import { createRoom } from './scene.js';
import { mountBookPages } from './book-page-view.js';
import { BOOKS_PER_SHELF } from './book-pages.js';

const room = document.getElementById('room');
const targets = document.getElementById('book-targets');
const preview = document.getElementById('book-preview');
const reader = document.getElementById('reader');
const content = document.getElementById('reader-content');
const closeButton = document.querySelector('.close-reader');
let scene, activeButton;
const canHover = window.matchMedia('(hover: hover)');
const themeToggle = document.getElementById('theme-toggle');
const lampToggle = document.getElementById('lamp-toggle');
const curtainToggle = document.getElementById('curtain-toggle');
let theme = document.documentElement.dataset.theme;
let lampOn = true;
let curtainsClosed = false;

function applyTheme(nextTheme) {
  theme = nextTheme;
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  themeToggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  document.getElementById('theme-label').textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#181e1b' : '#f3efe6';
  scene?.setTheme(theme);
}
applyTheme(theme);
themeToggle.addEventListener('click', () => {
  applyTheme(theme === 'dark' ? 'light' : 'dark');
  try { localStorage.setItem('portfolio-theme', theme); } catch {}
});
lampToggle.addEventListener('click', () => {
  lampOn = !lampOn;
  scene?.setLamp(lampOn);
  lampToggle.setAttribute('aria-pressed', String(lampOn));
  hidePreview();
});
curtainToggle.addEventListener('click', () => {
  curtainsClosed = !curtainsClosed;
  scene?.setCurtains(curtainsClosed);
  curtainToggle.setAttribute('aria-pressed', String(curtainsClosed));
  hidePreview();
});

// Use text nodes for portfolio copy so edits are never interpreted as HTML.
function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function showPreview(book, button) {
  if (reader.open) return;
  scene?.hover(book.id);
  preview.replaceChildren();
  preview.style.setProperty('--book-color', book.color);
  const meta = element('div', '', 'preview-meta');
  meta.append(element('span', book.category), element('span', book.number));
  const action = element('div', '', 'preview-action');
  action.append(element('span', 'Open this chapter'), element('span', '↗'));
  preview.append(meta, element('h2', book.title), element('p', book.summary), action);
  preview.hidden = false;
  const rect = button.getBoundingClientRect(), parent = room.getBoundingClientRect();
  let left = rect.left - parent.left + rect.width / 2 - preview.offsetWidth / 2;
  left = Math.max(12, Math.min(left, parent.width - preview.offsetWidth - 12));
  let top = rect.top - parent.top - preview.offsetHeight - 17;
  if (top < 10) top = rect.bottom - parent.top + 16;
  preview.style.left = `${left}px`; preview.style.top = `${top}px`;
}
function hidePreview() {
  preview.hidden = true;
  scene?.hover(null);
}
function openBook(book, button) {
  activeButton = button;
  hidePreview();
  reader.style.setProperty('--book-color', book.color);
  reader.classList.toggle('long-title', book.title.length > 22);
  document.getElementById('reader-category').textContent = book.category;
  document.getElementById('reader-title').textContent = book.title;
  document.getElementById('reader-volume').textContent = `AKHIL / VOLUME ${book.number}`;
  mountBookPages(content, book, { onChange: (index, total) => {
    document.getElementById('page-number').textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  } });
  reader.showModal();
  reader.scrollTop = 0;
  document.querySelector('.reader-pages').scrollTop = 0;
  document.body.style.overflow = 'hidden';
  closeButton.focus({ preventScroll: true });
}
for (const book of books) {
  const button = element('button', '', 'book-hit');
  button.type = 'button'; button.dataset.book = book.id;
  button.setAttribute('aria-label', `Open ${book.title}`);
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-controls', 'reader');
  button.style.setProperty('--book-color', book.color);
  button.append(element('span', book.title));
  button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch' && canHover.matches) showPreview(book, button); });
  button.addEventListener('pointerleave', () => { if (document.activeElement !== button) hidePreview(); });
  button.addEventListener('focus', () => { if (button.matches(':focus-visible')) showPreview(book, button); });
  button.addEventListener('blur', hidePreview);
  button.addEventListener('click', () => openBook(book, button));
  targets.append(button);

  // Larger, book-shaped targets keep every chapter comfortable to tap on phones.
  const mobileBook = element('button', '', 'mobile-book');
  mobileBook.type = 'button';
  mobileBook.style.setProperty('--book-color', book.color);
  mobileBook.setAttribute('aria-label', `Read ${book.title}`);
  mobileBook.setAttribute('aria-haspopup', 'dialog');
  mobileBook.setAttribute('aria-controls', 'reader');
  mobileBook.append(element('span', book.number, 'mobile-book-number'), element('span', book.title, 'mobile-book-title'), element('span', '✦', 'mobile-book-star'));
  mobileBook.addEventListener('click', () => openBook(book, mobileBook));
  document.getElementById('mobile-books').append(mobileBook);
}
let shelfPage = 0;
function showShelf(page, control) {
  const total = Math.ceil(books.length / BOOKS_PER_SHELF);
  if (page < 0 || page >= total) return;
  shelfPage = page; hidePreview();
  const start = page * BOOKS_PER_SHELF, end = Math.min(start + BOOKS_PER_SHELF, books.length);
  [...targets.children].forEach((button, index) => { button.hidden = index < start || index >= end; });
  [...document.getElementById('mobile-books').children].forEach((button, index) => { button.hidden = index < start || index >= end; });
  document.getElementById('shelf-navigation').hidden = total <= 1;
  document.getElementById('shelf-status').textContent = `Shelf ${page + 1} of ${total} · Books ${start + 1}–${end}`;
  const previous = document.getElementById('previous-shelf'), next = document.getElementById('next-shelf');
  previous.disabled = page === 0; next.disabled = page === total - 1;
  scene?.setShelfPage(page);
  if (control?.disabled) (control === next ? previous : next).focus({ preventScroll: true });
}
document.getElementById('previous-shelf').onclick = event => showShelf(shelfPage - 1, event.currentTarget);
document.getElementById('next-shelf').onclick = event => showShelf(shelfPage + 1, event.currentTarget);
document.querySelector('.guide-count').replaceChildren(document.createTextNode(`${books.length} BOOKS`), document.createElement('br'), document.createTextNode('ENDLESS CURIOSITY'));
showShelf(0);
closeButton.addEventListener('click', () => reader.close());
reader.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = [...reader.querySelectorAll('button:not(:disabled), select, a[href], summary, [tabindex="0"]')].filter(el => el.getClientRects().length);
  const first = focusable[0], last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
});
reader.addEventListener('click', event => {
  const rect = reader.getBoundingClientRect();
  if (event.target === reader && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) reader.close();
});
reader.addEventListener('close', () => {
  document.body.style.overflow = '';
  activeButton?.focus({ preventScroll: true });
  hidePreview();
});
window.addEventListener('keydown', event => { if (event.key === 'Escape' && !reader.open) hidePreview(); });
window.addEventListener('resize', hidePreview);
document.getElementById('year').textContent = new Date().getFullYear();

function showFallback() {
  scene = undefined;
  lampToggle.hidden = true;
  curtainToggle.hidden = true;
  room.classList.add('fallback', 'is-ready');
  document.getElementById('room-loading').hidden = true;
  if (!room.querySelector('.fallback-label')) room.append(element('p', 'Your collection, in a lighter view. Select any book to explore.', 'fallback-label'));
  hidePreview();
}
try {
  scene = createRoom(room, books, () => {
    room.classList.add('is-ready');
    document.getElementById('room-loading').hidden = true;
    lampToggle.hidden = room.classList.contains('fallback');
    curtainToggle.hidden = room.classList.contains('fallback');
  }, showFallback);
  scene.setTheme(theme);
  scene.setLamp(lampOn);
} catch (error) {
  console.warn('3D rendering is unavailable; using the accessible bookshelf.', error);
  showFallback();
}

if (import.meta.hot) {
  import.meta.hot.on('books-updated', () => window.location.reload());
}
