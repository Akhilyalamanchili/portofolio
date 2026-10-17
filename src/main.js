import './styles.css';
import { books } from './content.js';
import { createRoom } from './scene.js';
import referenceImage from '../landing_page_images/Gemini_Generated_Image_pezvzhpezvzhpezv.png';

const room = document.getElementById('room');
const targets = document.getElementById('book-targets');
const preview = document.getElementById('book-preview');
const reader = document.getElementById('reader');
const content = document.getElementById('reader-content');
const closeButton = document.querySelector('.close-reader');
let scene, activeButton;
const canHover = window.matchMedia('(hover: hover)');

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
  document.getElementById('reader-category').textContent = book.category;
  document.getElementById('reader-title').textContent = book.title;
  document.getElementById('reader-volume').textContent = `AKHIL / VOLUME ${book.number}`;
  document.getElementById('page-number').textContent = book.number;
  content.replaceChildren(element('h3', book.heading, 'content-heading'), element('p', book.lead, 'content-lead'));
  for (const section of book.sections) {
    const sectionElement = element('section', '', 'content-section');
    sectionElement.append(element('h4', section.title), element('p', section.text));
    if (section.detail) sectionElement.append(element('span', section.detail, 'content-detail'));
    content.append(sectionElement);
  }
  if (book.id === 'projects') {
    const figure = element('figure', '', 'reference-figure');
    const img = document.createElement('img');
    img.src = referenceImage; img.alt = 'The supplied inspiration image: a warm workspace with trailing plants, a window, wooden desk, and bookshelves.';
    img.loading = 'lazy';
    figure.append(img, element('figcaption', 'The original room reference, translated into a 3D scene.'));
    content.append(figure);
  }
  const tags = element('div', '', 'content-tags');
  tags.append(...book.tags.map(tag => element('span', tag)));
  content.append(tags, element('p', 'A chapter in progress. This is temporary portfolio content; personal details and verified links will be added later.', 'sample-note'));
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
closeButton.addEventListener('click', () => reader.close());
reader.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = [...reader.querySelectorAll('button, a[href], [tabindex="0"]')];
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
  room.classList.add('fallback', 'is-ready');
  document.getElementById('room-loading').hidden = true;
  if (!room.querySelector('.fallback-label')) room.append(element('p', 'Your collection, in a lighter view. Select any book to explore.', 'fallback-label'));
  hidePreview();
}
try {
  scene = createRoom(room, books, () => {
    room.classList.add('is-ready');
    document.getElementById('room-loading').hidden = true;
  }, showFallback);
} catch (error) {
  console.warn('3D rendering is unavailable; using the accessible bookshelf.', error);
  showFallback();
}
