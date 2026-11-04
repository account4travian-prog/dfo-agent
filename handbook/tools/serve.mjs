/** Local preview only. Bind loopback and preserve sub-path URLs, no dependencies. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(process.argv[2] || fileURLToPath(new URL('../dist/', import.meta.url)));
const port = Number(process.argv[3] || 5197);
if (!Number.isInteger(port) || (port !== 0 && port < 1024) || port > 65535) throw Error('Use port 0 for a free port, or an unprivileged port from 1024 to 65535');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.avif': 'image/avif'
};
const server = createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }
    const url = new URL(req.url, 'http://localhost');
    const file = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const targetFile = await routeFile(file, url, res);
    if (!targetFile) return;
    const {
      data, code, target
    } = await readResponse(targetFile);
    res.writeHead(code, {
      'Content-Type': types[extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(req.method === 'HEAD' ? undefined: data);
  } catch {
    res.writeHead(500);
    res.end('Preview unavailable');
  }
});
// Normalize directory requests while preserving a sub-path deployment's URL.
async function routeFile(file, url, res) {
  let target = file;
  try {
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        res.writeHead(301, {
          Location: url.pathname + '/' + url.search
        });
        res.end();
        return null;
      }
      target = join(file, 'index.html');
    }
  } catch {}
  return target;
}
// Unknown routes receive the site's real 404 page and status code.
async function readResponse(target) {
  let data, code = 200;
  try {
    data = await readFile(target);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    data = await readFile(join(root, '404.html'));
    target = '404.html';
    code = 404;
  }
  return {
    data, code, target
  };
}
server.listen(port, '127.0.0.1', () => console.log(`Handbook preview: http://127.0.0.1:${server.address().port}/`));
