import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { validateBooks } from '../src/book-schema.js';

const sourcePath = fileURLToPath(new URL('../src/books.json', import.meta.url));
const revision = text => createHash('sha256').update(text).digest('hex');
const isLoopback = address => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address);

// File editing exists only in the local development server, never in a build.
export function bookEditor({ filePath = sourcePath } = {}) {
  let saving = false;
  return {
    name: 'local-book-editor',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/books', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        const send = (status, data) => { res.statusCode = status; res.end(JSON.stringify(data)); };
        const host = req.headers.host;
        // Prevent LAN clients, cross-origin requests, and DNS rebinding writes.
        if (!isLoopback(req.socket.remoteAddress) || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host || '')) return send(403, { error: 'Open the editor on localhost to edit this project.' });
        if (req.headers.origin && req.headers.origin !== `http://${host}` && req.headers.origin !== `https://${host}`) return send(403, { error: 'Cross-origin editing is not allowed.' });
        if (req.headers['sec-fetch-site'] === 'cross-site') return send(403, { error: 'Open the editor on localhost.' });
        if (req.method !== 'GET' && req.method !== 'PUT') return send(405, { error: 'Method not allowed.' });
        let ownsLock = false;
        try {
          if (req.method === 'GET') {
            const raw = await readFile(filePath, 'utf8');
            return send(200, { books: JSON.parse(raw), revision: revision(raw) });
          }
          if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'Send JSON content.' });
          const chunks = [];
          let bytes = 0;
          for await (const chunk of req) {
            bytes += chunk.length;
            if (bytes > 2_000_000) return send(413, { error: 'The collection is too large (maximum 2 MB).' });
            chunks.push(chunk);
          }
          let payload;
          try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(400, { error: 'Invalid JSON.' }); }
          if (saving) return send(409, { error: 'Another save is in progress. Try again.' });
          saving = true; ownsLock = true;
          const raw = await readFile(filePath, 'utf8');
          if (payload?.revision !== revision(raw)) return send(409, { error: 'The collection changed in another editor. Export your draft, then reload before saving.' });
          const error = validateBooks(payload.books, JSON.parse(raw).map(book => book.id));
          if (error) return send(400, { error });
          const next = JSON.stringify(payload.books, null, 2) + '\n';
          // Write atomically and retain the previous collection for recovery.
          const backupDir = resolve(dirname(filePath), '../.book-editor');
          await mkdir(backupDir, { recursive: true });
          await writeFile(`${backupDir}/books.previous.json`, raw);
          await writeFile(`${filePath}.tmp`, next);
          await rename(`${filePath}.tmp`, filePath);
          send(200, { revision: revision(next) });
        } catch (error) {
          console.error('Book editor:', error.message);
          send(500, { error: 'Could not read or save the collection. Your draft is still in the editor.' });
        } finally {
          if (ownsLock) saving = false;
        }
      });
      // A save updates the reader through HMR, but must not reload an unsaved admin draft.
    },
    handleHotUpdate(context) {
      if (context.file === filePath) {
        for (const module of context.modules) context.server.moduleGraph.invalidateModule(module);
        context.server.ws.send({ type: 'custom', event: 'books-updated' });
        return [];
      }
    },
  };
}
