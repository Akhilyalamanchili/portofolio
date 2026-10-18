export function validateBooks(books, expectedIds) {
  if (!Array.isArray(books) || books.length !== expectedIds.length) return 'Keep all twelve books in the collection.';
  for (const [index, book] of books.entries()) {
    if (!book || book.id !== expectedIds[index]) return 'Book identifiers and shelf positions cannot change.';
    for (const key of ['title', 'spine', 'category', 'number', 'summary', 'heading', 'lead', 'note']) {
      if (typeof book[key] !== 'string' || book[key].length > 20000) return `Invalid ${key} in book ${index + 1}.`;
    }
    if (!book.title.trim() || !book.spine.trim()) return 'Every book needs a name and spine label.';
    if (typeof book.color !== 'string' || !/^#[\da-f]{6}$/i.test(book.color)) return 'Choose a valid cover color.';
    if (typeof book.showReference !== 'boolean') return 'Invalid reference image setting.';
    if (!Array.isArray(book.tags) || book.tags.length > 50 || book.tags.some(tag => typeof tag !== 'string' || tag.length > 200)) return 'Use up to 50 tags of 200 characters each.';
    if (!Array.isArray(book.sections) || book.sections.length > 100) return 'Use up to 100 sections per book.';
    for (const section of book.sections) {
      if (!section || typeof section.title !== 'string' || section.title.length > 500 || typeof section.text !== 'string' || section.text.length > 50000 || (section.detail !== undefined && (typeof section.detail !== 'string' || section.detail.length > 2000))) return 'A section contains invalid or oversized text.';
    }
  }
  return null;
}
