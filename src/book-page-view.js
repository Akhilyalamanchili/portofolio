import { getBookPages } from './book-pages.js';
import { renderCoding } from './coding-view.js';
import './book-pages.css';
import referenceImage from '../landing_page_images/Gemini_Generated_Image_pezvzhpezvzhpezv.png';

const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};

export function mountBookPages(container, book, { initialPage = 0, onChange = () => {} } = {}) {
  const pages = getBookPages(book);
  let index = Math.max(0, Math.min(initialPage, pages.length - 1));
  const root = el('div', undefined, 'book-reading');
  const nav = el('nav', undefined, 'book-navigation');
  nav.setAttribute('aria-label', 'Book pages');
  const previous = el('button', '← Previous'), next = el('button', 'Next →');
  previous.type = next.type = 'button';
  previous.setAttribute('aria-label', 'Previous page'); next.setAttribute('aria-label', 'Next page');
  const status = el('span', undefined, 'book-page-status');
  status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const row = el('div', undefined, 'book-page-controls');
  row.append(previous, status, next);
  const picker = el('select');
  picker.setAttribute('aria-label', 'Go to page');
  pages.forEach((page, i) => {
    const option = el('option', `${String(i + 1).padStart(2, '0')} · ${page.title || 'Untitled page'}`);
    option.value = i; picker.append(option);
  });
  nav.append(row, picker);
  const body = el('div', undefined, 'book-page-body');
  root.append(nav, body); container.replaceChildren(root);
  function render() {
    const page = pages[index];
    root.dataset.page = page.id;
    status.textContent = `Page ${index + 1} of ${pages.length}`;
    previous.disabled = index === 0; next.disabled = index === pages.length - 1;
    picker.value = index;
    body.replaceChildren(el('p', `${String(index + 1).padStart(2, '0')} / ${page.title || 'Untitled page'}`, 'book-page-eyebrow'));
    body.append(el('h3', index === 0 ? book.heading : page.title, 'content-heading'));
    if (index === 0 && book.lead) body.append(el('p', book.lead, 'content-lead'));
    if (page.platform && book.coding) body.append(renderCoding(book.coding, page.platform));
    for (const section of page.sections) {
      const block = el('section', undefined, 'content-section');
      block.append(el('h4', section.title), el('p', section.text));
      if (section.detail) block.append(el('span', section.detail, 'content-detail'));
      body.append(block);
    }
    if (!page.platform && !page.sections.length) body.append(el('p', 'This page is waiting for its story.', 'empty-page'));
    if (index === pages.length - 1) {
      if (book.showReference) {
        const figure = el('figure', undefined, 'reference-figure'), img = el('img');
        img.src = referenceImage; img.alt = 'The original room inspiration'; img.loading = 'lazy';
        figure.append(img, el('figcaption', 'The original room reference, translated into a 3D scene.')); body.append(figure);
      }
      const tags = el('div', undefined, 'content-tags');
      tags.append(...book.tags.map(tag => el('span', tag))); body.append(tags);
      if (book.note) body.append(el('p', book.note, 'sample-note'));
    }
    onChange(index, pages.length);
  }
  function go(nextIndex, control) {
    if (nextIndex < 0 || nextIndex >= pages.length || nextIndex === index) return;
    index = nextIndex; render();
    const scroller = root.closest('.reader-pages, .reading-preview');
    if (scroller) scroller.scrollTop = 0;
    // On mobile the dialog scrolls, including the cover.
    if (root.closest('dialog')?.scrollTop) nav.scrollIntoView({ block: 'start' });
    if (control?.disabled) (control === next ? previous : next).focus({ preventScroll: true });
  }
  previous.onclick = () => go(index - 1, previous);
  next.onclick = () => go(index + 1, next);
  picker.onchange = () => go(Number(picker.value));
  root.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('select, input, textarea')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); go(index + (event.key === 'ArrowRight' ? 1 : -1), event.target);
    }
  });
  render();
}
