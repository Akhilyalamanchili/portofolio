import { platforms } from './coding-data.js';

export const MAX_BOOKS = 60;
export const MAX_PAGES = 50;
export const BOOKS_PER_SHELF = 12;

export function getBookPages(book) {
  if (book.pages?.length) return book.pages;
  if (book.coding) return platforms.filter(p => p.group === book.coding.group)
    .map((p, index) => ({ id: p.id, platform: p.id, title: p.name, sections: index === 0 ? book.sections || [] : [] }));
  return book.sections?.length ? book.sections.map((section, index) => ({
    id: `page-${index + 1}`, title: section.title || `Page ${index + 1}`, sections: [section],
  })) : [{ id: 'page-1', title: 'The beginning', sections: [] }];
}

export function createPage(title = 'New page') {
  return { id: `page-${crypto.randomUUID()}`, title, sections: [] };
}

export function createBook(index) {
  return {
    id: `book-${crypto.randomUUID()}`, title: 'Untitled book', spine: 'Untitled book',
    category: 'A new chapter', color: ['#577d7b', '#8c5350', '#7f8765', '#686e85'][index % 4],
    number: String(index + 1).padStart(2, '0'), summary: '', heading: 'A new story begins.',
    lead: '', sections: [], pages: [createPage('The beginning')], tags: [], note: '', showReference: false,
  };
}
