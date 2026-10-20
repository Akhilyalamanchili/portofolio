import { validateCoding, platforms } from './coding-data.js';
import { MAX_BOOKS, MAX_PAGES } from './book-pages.js';

const validSections = sections => Array.isArray(sections) && sections.length <= 100 && sections.every(section =>
  section && typeof section.title === 'string' && section.title.length <= 500 &&
  typeof section.text === 'string' && section.text.length <= 50000 &&
  (section.detail === undefined || (typeof section.detail === 'string' && section.detail.length <= 2000)));
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);

export function validateBooks(books, expectedIds) {
  if (!Array.isArray(books) || books.length < expectedIds.length || books.length > MAX_BOOKS) return `Keep the saved books and use up to ${MAX_BOOKS} books in the collection.`;
  const ids = new Set();
  for (const [index, book] of books.entries()) {
    if (!book || !validId(book.id) || ids.has(book.id)) return 'Every book needs a unique, valid identifier.';
    if (index < expectedIds.length && book.id !== expectedIds[index]) return 'Saved book identifiers and shelf positions cannot change.';
    ids.add(book.id);
    if (book.coding !== undefined) {
      if (index > 1 || book.coding?.group !== (index === 0 ? 'dsa' : 'cp')) return 'Keep DSA in book one and competitive programming in book two.';
      const codingError = validateCoding(book.coding);
      if (codingError) return codingError;
    }
    for (const key of ['title', 'spine', 'category', 'number', 'summary', 'heading', 'lead', 'note']) {
      if (typeof book[key] !== 'string' || book[key].length > 20000) return `Invalid ${key} in book ${index + 1}.`;
    }
    if (!book.title.trim() || !book.spine.trim()) return 'Every book needs a name and spine label.';
    if (typeof book.color !== 'string' || !/^#[\da-f]{6}$/i.test(book.color)) return 'Choose a valid cover color.';
    if (typeof book.showReference !== 'boolean') return 'Invalid reference image setting.';
    if (!Array.isArray(book.tags) || book.tags.length > 50 || book.tags.some(tag => typeof tag !== 'string' || tag.length > 200)) return 'Use up to 50 tags of 200 characters each.';
    if (!validSections(book.sections)) return 'A section contains invalid or oversized text.';
    if (book.pages !== undefined) {
      if (!Array.isArray(book.pages) || !book.pages.length || book.pages.length > MAX_PAGES) return `Each book needs 1–${MAX_PAGES} pages.`;
      const pageIds = new Set(), pagePlatforms = new Set();
      for (const page of book.pages) {
        if (!page || !validId(page.id) || pageIds.has(page.id) || typeof page.title !== 'string' || page.title.length > 500 || !validSections(page.sections)) return 'A page has invalid content or a duplicate identifier.';
        pageIds.add(page.id);
        if (book.coding) {
          if (!platforms.some(p => p.id === page.platform && p.group === book.coding.group) || pagePlatforms.has(page.platform)) return 'Each coding profile needs its own page.';
          pagePlatforms.add(page.platform);
        } else if (page.platform !== undefined) return 'Profile pages belong in the DSA and CP books.';
      }
      if (book.coding && pagePlatforms.size !== 3) return 'DSA and CP each need exactly three profile pages.';
    }
  }
  return null;
}
