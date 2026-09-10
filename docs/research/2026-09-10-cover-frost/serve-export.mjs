import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(process.argv[2] || '/private/tmp/cover-frost-expo-export');
createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const path = resolve(root, `.${decodeURIComponent(pathname)}`);
  if (path !== root && !path.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end();
    return;
  }
  const types = {
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.ttf': 'font/ttf',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
  };
  try {
    const bytes = await readFile(path);
    response.setHeader(
      'Content-Type',
      types[extname(path)] || 'application/octet-stream',
    );
    response.end(bytes);
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'EISDIR') {
      response.writeHead(500).end();
      return;
    }
    response.setHeader('Content-Type', 'text/html');
    response.end(await readFile(resolve(root, 'index.html')));
  }
}).listen(8097, '127.0.0.1', () =>
  console.log('Export on http://127.0.0.1:8097'),
);
