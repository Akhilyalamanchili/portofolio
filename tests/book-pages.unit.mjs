import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getBookPages, createBook, createPage, MAX_BOOKS, MAX_PAGES } from '../src/book-pages.js';
import { validateBooks } from '../src/book-schema.js';
const original = JSON.parse(await readFile(new URL('../src/books.json', import.meta.url)));
const ids = original.map(b => b.id);

test('legacy content and coding profiles become separate pages without losing text', () => {
  const sections = [{ title: 'First', text: 'One' }, { title: 'Second', text: 'Two' }];
  assert.deepEqual(getBookPages({ sections }).flatMap(p => p.sections), sections);
  assert.equal(getBookPages({ sections: [] }).length, 1);
  assert.deepEqual(getBookPages({ coding: { group: 'cp' }, sections }).map(p => p.platform), ['codechef', 'codeforces', 'atcoder']);
  assert.deepEqual(getBookPages({ coding: { group: 'cp' }, sections })[0].sections, sections);
});
test('new books and reordered pages validate while existing book identities remain stable', () => {
  const books = structuredClone(original);
  const book = createBook(books.length);
  book.pages.push(createPage('Another page'));
  book.pages.reverse(); books.push(book);
  assert.equal(validateBooks(books, ids), null);
  books[0].id = 'different-id';
  assert.ok(validateBooks(books, ids));
});
test('page identities and profile assignments must be unique and coding books retain exactly three pages', () => {
  for (const change of [
    b => b[0].pages.pop(),
    b => b[0].pages[0].platform = 'codechef',
    b => b[0].pages[1].platform = b[0].pages[0].platform,
    b => b[2].pages[1].id = b[2].pages[0].id,
    b => b[2].pages[0].platform = 'leetcode',
    b => b[2].pages = [],
    b => b[2].pages[0].sections = [{ title: 'Bad', text: 42 }],
  ]) {
    const books = structuredClone(original); change(books);
    assert.ok(validateBooks(books, ids));
  }
});
test('book and page limits are enforced and duplicate book IDs rejected', () => {
  const books = structuredClone(original);
  while (books.length < MAX_BOOKS) books.push(createBook(books.length));
  assert.equal(validateBooks(books, ids), null);
  books.push(createBook(books.length));
  assert.ok(validateBooks(books, ids));
  books.pop(); books.at(-1).id = books[0].id;
  assert.ok(validateBooks(books, ids));
  const pages = structuredClone(original);
  pages[2].pages = Array.from({ length: MAX_PAGES + 1 }, () => createPage());
  assert.ok(validateBooks(pages, ids));
});
