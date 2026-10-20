<<<<<<< HEAD
# A shelf full of stories

Akhil’s interactive 3D bookshelf portfolio. A warm, plant-filled workspace modeled with Three.js from the supplied landing-page reference.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

```sh
npm run build
npm run preview
```

The production site is generated in `dist/` and can be served by any static host.

## Explore

- Hover over a book to pull it slightly out of the shelf and see an overview.
- Click or tap a book to open its complete chapter.
- Use Tab and Enter for keyboard access; Escape or the close button returns to the shelf.
- Use the header toggle to switch between light and dark mode. Your choice is remembered; the first visit follows your system preference.
- Click or tap the desk lamp to turn its bulb and warm light on or off, independently of the page theme. The lamp also works with Tab and Enter/Space.
- The window, desk, plants, and other room objects are decorative.
- Reduced-motion preferences are respected. A lightweight bookshelf appears if WebGL is unavailable.

## Personalize

Run `npm run dev`, then open **`http://localhost:5173/admin`** (use the port Vite prints if different). Select a book to edit its name, color, category, volume, summary, chapter heading, introduction, tags, and closing note. Use **Add book** to create a new volume. Select a page to edit its title and sections; **Add page**, **Move page up/down**, and **Remove page** organize the story. The preview follows the selected page and also has working page navigation. **Save all changes** (or Ctrl/Cmd+S) saves drafts across all books.

Changes are written directly to **`src/books.json`**, the shared source for the 3D shelf and reader. Open bookshelf tabs refresh after saving, and the next `npm run build` includes the updated content. Line breaks are preserved, and copy is rendered as plain text. `src/content.js` exports this shared collection. The book name also supplies the 3D spine lettering, so renaming a book updates every view. Spine titles use large, wrapped, high-contrast labels; exceptionally long names are shortened on the spine and remain complete in the hover preview and reader. The legacy `spine` JSON field is retained for compatibility but does not override the name. Saved book identifiers and their order stay fixed; new books are appended.

The collection supports up to **60 books**, displayed **12 at a time** with Previous/Next shelf controls. Additional 3D books are constructed when their shelf is first visited. Mobile and non-WebGL views use the same shelf groups. Each regular book supports **1–50 pages** and up to 100 sections per page, within the existing 2 MB collection limit. Discarding an unsaved new book removes that draft.

Every reader has **Previous/Next**, a **Go to page** picker, and a page count. Left/Right arrow keys work while the reader's page controls or content have focus (the picker retains its native keyboard behavior). Book introductions appear on the first page; tags, reference images, and closing notes appear on the last. Existing content was migrated to one page per section without changing the copy; a local backup is in `.book-editor/books.before-pages.json`. Legacy collections without a `pages` field are still readable.

**DSA and CP each have exactly three pages, one per coding platform.** Profile pages can be reordered, retitled, and given notes, but not added or removed. Imports update statistics without replacing page titles or notes.

The editor warns before leaving with unsaved changes, detects conflicting saves from another tab, and retains the previous save in `.book-editor/books.previous.json`. **Discard book changes** restores only the selected book; **Export draft as JSON** downloads all current drafts for backup. You can also edit `src/books.json` directly.

This is a **local project editor**, available through the development server on localhost. The static production build has no write API or live admin login; rebuild and deploy after editing locally. `/admin` on a static host requires an index fallback and displays the local-editor instructions. Personal links and credentials have deliberately not been invented.

The visible name and introduction are in `index.html`. Room geometry, materials, camera, and lighting are in `src/scene.js`; application interactions are in `src/main.js`; styling is in `src/styles.css`.

The supplied image remains unchanged in `landing_page_images/` and is also displayed in the Selected Work chapter. The room is actual procedural 3D geometry, not an image with invisible hotspots.

## Coding profile webminer

Open **`/admin`** while running `npm run dev`. Enter a shared username, optionally override the handle for each platform, and uncheck platforms you do not use. **Fetch & save books** fetches public profiles and saves the imported results together with your current book drafts.

- **Book 01 — DSA:** LeetCode, HackerRank, and GeeksforGeeks.
- **Book 02 — Competitive Programming:** CodeChef, Codeforces, and AtCoder (algorithm contests).

The importer is only in the admin page. Visitors see saved profile cards, available metrics, difficulty breakdowns, links, timestamps, and progression charts inside the two books. No usernames or example statistics are prefilled. The previous first two chapters were backed up locally to `.book-editor/books.before-coding.json`.

Codeforces uses its [public API](https://codeforces.com/apiHelp/methods); the other adapters read their platforms’ public profile responses. HackerRank shows the Problem Solving track only; language badges are not summed because their problem counts can overlap. Ratings are never combined across platforms. Contest rating history is imported where available (up to 500 points). DSA progress starts with the first successful import and grows with subsequent imports (up to 120 snapshots per profile). Successful responses are cached for 60 seconds; a cached response does not add a duplicate snapshot.

Unavailable, private, rate-limited, or changed profile responses show a per-platform message. A failed refresh preserves the last successful profile and history, including when a different username was attempted. Changing to a new username successfully starts a new snapshot history. Deselected platforms keep their saved data. Save conflicts retain the imported draft so it can be exported before reloading.

The local `/api/profiles` endpoint accepts only the six supported platforms and validated handles. Requests have timeouts and size limits; redirects stay on the platform host. No login credentials or third-party proxy services are required. Public endpoints can change or restrict automated access, so some imports may need retrying or adapter updates.

Like the book editor, fetching runs only in the local development server. The static production build includes saved results; rebuild and deploy to publish refreshed statistics.

Adapter and history checks:

```sh
node tests/profile-miner.unit.mjs
node tests/book-pages.unit.mjs
```

Browser import tests use an isolated temporary collection and simulated platform responses; they never write example profiles into your actual books.

## Checks

```sh
npx playwright install chromium
npm test
```

The tests exercise every book, hover previews, keyboard interaction, touch, the non-WebGL fallback, and the admin save/edit flow. Admin tests use a temporary project copy so they never overwrite your content. On this machine the browser download is kept outside the system disk:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-browsers npx playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-browsers npm test
```

The `/tmp` browser installation is temporary and may need reinstalling after a reboot. The app itself does not need Playwright to run.

## Notes

- Font styling uses Google Fonts, with local serif/sans-serif fallbacks if offline.
- The room renders on demand with antialiasing and supersampling (up to 2.5× on desktop and 2× on mobile), bounded by a 5-megapixel desktop / 1.6-megapixel mobile drawing buffer.
- Procedural high-resolution textures add wood grain, cloth weave, paper edges, and leaf veins. Beveled furniture, smoother curved geometry, studio reflections, and up to 4096px sunlight shadows improve detail without downloading external 3D assets.
- See `PROGRESS.md` for implementation status and verification results.
=======
# portofolio
I 3D based protofolio using tree js 
>>>>>>> b56175706e7032d741ab7fbd71b331c8d5f4eead
