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

Edit **`src/content.js`** to replace the temporary biography, skills, projects, education, experience, and contact copy. Each entry provides the spine label, cover color, preview, and full chapter content. Personal links and credentials have deliberately not been invented.

The visible name and introduction are in `index.html`. Room geometry, materials, camera, and lighting are in `src/scene.js`; application interactions are in `src/main.js`; styling is in `src/styles.css`.

The supplied image remains unchanged in `landing_page_images/` and is also displayed in the Selected Work chapter. The room is actual procedural 3D geometry, not an image with invisible hotspots.

## Checks

```sh
npx playwright install chromium
npm test
```

The tests exercise every book, hover previews, keyboard interaction, touch, and the non-WebGL fallback. On this machine the browser download is kept outside the nearly-full system disk:

```sh
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-browsers npx playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-browsers npm test
```

The `/tmp` browser installation is temporary and may need reinstalling after a reboot. The app itself does not need Playwright to run.

## Notes

- Font styling uses Google Fonts, with local serif/sans-serif fallbacks if offline.
- The room renders on demand, with capped pixel density, rather than continuously animating decorative objects.
- See `PROGRESS.md` for implementation status and verification results.
