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

Run `npm run dev`, then open **`http://localhost:5173/admin`** (use the port Vite prints if different). Select a book to edit its name, color, category, volume, summary, chapter heading, introduction, tags, and closing note. Add, remove, and reorder content sections, including their optional supporting details. The preview updates as you type; **Save all changes** (or Ctrl/Cmd+S) saves drafts across all books.

Changes are written directly to **`src/books.json`**, the shared source for the 3D shelf and reader. Open bookshelf tabs refresh after saving, and the next `npm run build` includes the updated content. Line breaks are preserved, and copy is rendered as plain text. `src/content.js` exports this shared collection. The book name also supplies the 3D spine lettering, so renaming a book updates every view. Spine titles use large, wrapped, high-contrast labels; exceptionally long names are shortened on the spine and remain complete in the hover preview and reader. The legacy `spine` JSON field is retained for compatibility but does not override the name. Book identifiers and the twelve shelf positions stay fixed.

The editor warns before leaving with unsaved changes, detects conflicting saves from another tab, and retains the previous save in `.book-editor/books.previous.json`. **Discard book changes** restores only the selected book; **Export draft as JSON** downloads all current drafts for backup. You can also edit `src/books.json` directly.

This is a **local project editor**, available through the development server on localhost. The static production build has no write API or live admin login; rebuild and deploy after editing locally. `/admin` on a static host requires an index fallback and displays the local-editor instructions. Personal links and credentials have deliberately not been invented.

The visible name and introduction are in `index.html`. Room geometry, materials, camera, and lighting are in `src/scene.js`; application interactions are in `src/main.js`; styling is in `src/styles.css`.

The supplied image remains unchanged in `landing_page_images/` and is also displayed in the Selected Work chapter. The room is actual procedural 3D geometry, not an image with invisible hotspots.

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
