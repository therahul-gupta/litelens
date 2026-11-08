import http from 'http';
import fs from 'fs';
import path from 'path';
import { URL, fileURLToPath } from 'url';
import { SQLiteManager } from './db.js';
import { createSampleDatabase } from './sampleDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

export function createServer(manager: SQLiteManager, options: { staticDir?: string } = {}) {
  const staticDir = options.staticDir || path.resolve(__dirname, '../client');

  const server = http.createServer(async (req, res) => {
    // CORS headers for local dev
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;

    const sendJson = (statusCode: number, data: any) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    const readBody = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (e) {
            reject(new Error('Invalid JSON payload'));
          }
        });
        req.on('error', reject);
      });
    };

    // API Routing
    try {
      if (pathname.startsWith('/api/')) {
        if (pathname === '/api/status' && req.method === 'GET') {
          if (!manager.isConnected()) {
            return sendJson(200, { connected: false });
          }
          const meta = manager.getMetadata();
          return sendJson(200, { connected: true, ...meta });
        }

        if (pathname === '/api/tables' && req.method === 'GET') {
          if (!manager.isConnected()) {
            return sendJson(400, { error: 'No database loaded' });
          }
          const tables = manager.getTables();
          return sendJson(200, { tables });
        }

        // GET /api/tables/:tableName/schema
        const schemaMatch = pathname.match(/^\/api\/tables\/([^/]+)\/schema$/);
        if (schemaMatch && req.method === 'GET') {
          if (!manager.isConnected()) {
            return sendJson(400, { error: 'No database loaded' });
          }
          const tableName = decodeURIComponent(schemaMatch[1]);
          const schema = manager.getTableSchema(tableName);
          return sendJson(200, schema);
        }

        // GET /api/tables/:tableName/rows
        const rowsMatch = pathname.match(/^\/api\/tables\/([^/]+)\/rows$/);
        if (rowsMatch && req.method === 'GET') {
          if (!manager.isConnected()) {
            return sendJson(400, { error: 'No database loaded' });
          }
          const tableName = decodeURIComponent(rowsMatch[1]);
          const page = parseInt(reqUrl.searchParams.get('page') || '1', 10);
          const pageSize = parseInt(reqUrl.searchParams.get('pageSize') || '50', 10);
          const search = reqUrl.searchParams.get('search') || undefined;
          const sortBy = reqUrl.searchParams.get('sortBy') || undefined;
          const sortOrder = (reqUrl.searchParams.get('sortOrder')?.toUpperCase() as 'ASC' | 'DESC') || 'ASC';

          const result = manager.getTableRows(tableName, {
            page,
            pageSize,
            search,
            sortBy,
            sortOrder,
          });
          return sendJson(200, result);
        }

        // POST /api/query
        if (pathname === '/api/query' && req.method === 'POST') {
          if (!manager.isConnected()) {
            return sendJson(400, { error: 'No database loaded' });
          }
          const body = await readBody();
          if (!body.sql || typeof body.sql !== 'string') {
            return sendJson(400, { error: 'Missing "sql" field in request' });
          }
          const result = manager.executeQuery(body.sql);
          return sendJson(200, result);
        }

        // POST /api/open
        if (pathname === '/api/open' && req.method === 'POST') {
          const body = await readBody();
          if (!body.filepath) {
            return sendJson(400, { error: 'Missing filepath' });
          }
          try {
            manager.open(body.filepath, Boolean(body.readonly));
            return sendJson(200, { success: true, metadata: manager.getMetadata() });
          } catch (err: any) {
            return sendJson(400, { error: err.message });
          }
        }

        // POST /api/sample
        if (pathname === '/api/sample' && req.method === 'POST') {
          try {
            const samplePath = createSampleDatabase();
            manager.open(samplePath, false);
            return sendJson(200, { success: true, metadata: manager.getMetadata() });
          } catch (err: any) {
            return sendJson(500, { error: err.message });
          }
        }

        // GET /api/export/:tableName
        const exportMatch = pathname.match(/^\/api\/export\/([^/]+)$/);
        if (exportMatch && req.method === 'GET') {
          if (!manager.isConnected()) {
            return sendJson(400, { error: 'No database loaded' });
          }
          const tableName = decodeURIComponent(exportMatch[1]);
          const format = reqUrl.searchParams.get('format') || 'csv';
          const { rows } = manager.getTableRows(tableName, { page: 1, pageSize: 100000 });

          if (format === 'json') {
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Content-Disposition': `attachment; filename="${tableName}.json"`,
            });
            res.end(JSON.stringify(rows, null, 2));
            return;
          } else {
            // CSV Format
            if (rows.length === 0) {
              res.writeHead(200, { 'Content-Type': 'text/csv' });
              res.end('');
              return;
            }
            const headers = Object.keys(rows[0] as object);
            const csvRows = [
              headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
              ...rows.map((row: any) =>
                headers
                  .map((h) => {
                    const val = row[h];
                    if (val === null || val === undefined) return '';
                    return `"${String(val).replace(/"/g, '""')}"`;
                  })
                  .join(',')
              ),
            ];
            res.writeHead(200, {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="${tableName}.csv"`,
            });
            res.end(csvRows.join('\n'));
            return;
          }
        }

        return sendJson(404, { error: 'API route not found' });
      }

      // Serve static frontend assets
      if (fs.existsSync(staticDir)) {
        let filePath = path.join(staticDir, pathname === '/' ? 'index.html' : pathname);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(staticDir, 'index.html');
        }

        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      // Default fallback if UI hasn't been built yet
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family:sans-serif;background:#090a0f;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h2>⚡ LiteLens Server Running</h2>
              <p style="color:#94a3b8;">Frontend UI is compiling. Check Vite dev server or run <code>npm run build</code>.</p>
            </div>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Server error:', err);
      sendJson(500, { error: err.message || 'Internal server error' });
    }
  });

  return server;
}
