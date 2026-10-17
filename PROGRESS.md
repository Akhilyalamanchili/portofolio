# Bookshelf portfolio — completed work and handoff

Updated: 2026-10-16

## What was built

A working, responsive portfolio in `/home/akhil/3D_portfolio`, using Vite and Three.js. The supplied image at `landing_page_images/Gemini_Generated_Image_pezvzhpezvzhpezv.png` guided the room layout and materials. It remains unchanged and appears in the Selected Work chapter.

### Scene and visual design
- Actual procedural 3D geometry: cutaway room, wooden floor, tall window, desk, drawers, monitor, keyboard, mouse, lamp, mug, notebook, framed botanical print, stool, rug, plants, and bookshelves.
- Warm lighting, real-time shadows, wood grain, individually textured book spines, and custom woodland monitor artwork.
- Cream and sage page styling, editorial typography, and an open-book reading view.
- Decorative room objects are not interactive. There are no orbit controls or camera-drag interactions.

### Books and interactions
- 12 books: About me, Frontend, Backend, Selected work, GitHub, Problem solving, Experience, Education, My toolkit, Field notes, The résumé, and Say hello.
- Hover: the book slides forward and shows a brief overview.
- Click/tap: opens the complete matching chapter in an accessible dialog.
- Close button, Escape, and backdrop dismissal return to the shelf.
- Keyboard support: Tab to books, Enter to open, constrained dialog focus, keyboard-scrollable content, and focus restoration.
- Reduced-motion preferences are respected.
- Larger book-shaped selectors on phones supplement the small 3D spines.
- A usable HTML bookshelf replaces the canvas if WebGL cannot initialize or its context is lost.
- Rendering is on demand; decorative objects do not animate continuously.

### Content
- User explicitly requested temporary content for now.
- All chapter copy is centralized in `src/content.js`.
- No personal profile URLs, employment, degree credentials, achievements, or contact details have been invented.
- Placeholder copy is clearly marked inside each chapter.
- Real personal details, profile URLs, project links, and a résumé PDF can be added later.

## Files
- `index.html`: accessible page structure and introduction.
- `src/content.js`: all editable book content.
- `src/scene.js`: geometry, materials, lighting, camera, projected book targets, and hover animation.
- `src/main.js`: previews, reading view, touch selectors, keyboard behavior, and fallback.
- `src/styles.css`: responsive page, preview, and book-reader styling.
- `vite.config.js`: production bundling with a separate Three.js vendor chunk.
- `tests/portfolio.spec.js` and `playwright.config.js`: browser regression checks.
- `README.md`: run, build, testing, and customization instructions.
- `dist/`: generated production build.

## Verification
- JavaScript syntax checks passed.
- `npm run build` passed without bundle-size warnings after splitting the Three.js vendor chunk.
- All 5 Playwright tests passed:
  1. Real WebGL scene and all twelve book-to-chapter mappings, with no page errors.
  2. Matching hover overview and dismissal.
  3. Keyboard opening, focus containment, Escape, and focus restoration.
  4. Mobile touch, full chapter scrolling, larger touch books, and dismissal.
  5. Non-WebGL fallback still opens the correct content.
- Visually inspected desktop (1440px), tablet (1024px), and phone (390px) layouts and reader views.
- Checked 1024px, 390px, and 320px widths for horizontal overflow: none.
- Local development server returned HTTP 200.

## Run

```sh
npm install
npm run dev
```

Vite prints the local preview address, normally `http://localhost:5173`.

```sh
npm run build
npm run preview
```

No remote site has been published; this deliverable is the local project and production build.

## Environment and temporary files
- The system disk was full at the start. The user approved clearing old pip HTTP and uv temporary caches.
- Automatic command review rejected forced deletion. The approved caches were instead moved into `/tmp/portfolio-cache-backup/`, preserving them temporarily while freeing disk space.
- Dependency installation was staged in `/tmp/portfolio-build/`; the completed dependencies and lockfile were then moved into the project. Runtime source and dependencies do not depend on that temporary folder.
- Test browsers are in `/tmp/portfolio-browsers/`. They may disappear after reboot; reinstall them if needed.
- Test command used here: `PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-browsers npm test`.
- Browser screenshots are temporary `/tmp/portfolio-*.png` files.
- Google Fonts are loaded remotely with local font fallbacks. The reference PNG is lazy-loaded only inside Selected Work.

## Future personalization
Replace the sample content, confirm the visible name/role, add real links and résumé, then publish to the host of your choice. No implementation tasks remain for the requested temporary-content version.
