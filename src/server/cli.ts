#!/usr/bin/env node
import { Command } from 'commander';
import open from 'open';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { SQLiteManager } from './db.js';
import { createServer } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('litelens')
  .description('⚡ Lightning-fast, zero-config web studio for SQLite databases')
  .version('1.0.0')
  .argument('[database]', 'Path to SQLite database file (.db, .sqlite, .sqlite3)')
  .option('-p, --port <number>', 'Port to listen on', '4983')
  .option('-H, --host <host>', 'Host address to bind to', 'localhost')
  .option('-r, --readonly', 'Open database in read-only mode', false)
  .option('--no-open', 'Do not automatically open the browser')
  .action(async (databaseArg, options) => {
    const port = parseInt(options.port, 10) || 4983;
    const host = options.host;
    const isReadonly = Boolean(options.readonly);

    const manager = new SQLiteManager();

    if (databaseArg) {
      const resolvedPath = path.resolve(process.cwd(), databaseArg);
      if (!fs.existsSync(resolvedPath)) {
        console.error(`\x1b[31m✖ Error:\x1b[0m Database file does not exist: \x1b[33m${resolvedPath}\x1b[0m`);
        process.exit(1);
      }
      try {
        manager.open(resolvedPath, isReadonly);
      } catch (err: any) {
        console.error(`\x1b[31m✖ Failed to open database:\x1b[0m ${err.message}`);
        process.exit(1);
      }
    }

    const staticDir = path.resolve(__dirname, '../../dist/client');
    const server = createServer(manager, { staticDir });

    server.listen(port, host, async () => {
      const url = `http://${host}:${port}`;

      console.log('\n\x1b[36m  ⚡ LiteLens\x1b[0m \x1b[90mv1.0.0\x1b[0m');
      console.log('\x1b[90m  ──────────────────────────────────────────\x1b[0m');

      if (manager.isConnected()) {
        const meta = manager.getMetadata();
        console.log(`  \x1b[32m✔\x1b[0m Database:  \x1b[1m${meta.filename}\x1b[0m \x1b[90m(${Math.round(meta.fileSizeBytes / 1024)} KB)\x1b[0m`);
        console.log(`  \x1b[32m✔\x1b[0m Tables:    \x1b[33m${meta.tableCount} tables\x1b[0m, \x1b[33m${meta.viewCount} views\x1b[0m`);
        if (isReadonly) {
          console.log(`  \x1b[33m⚠ Mode:\x1b[0m      Read-only`);
        }
      } else {
        console.log('  \x1b[33m⚠ No database specified.\x1b[0m Drag & drop a .db file in the web UI.');
      }

      console.log(`  \x1b[32m✔\x1b[0m Studio:    \x1b[36m\x1b[4m${url}\x1b[0m`);
      console.log('\x1b[90m  ──────────────────────────────────────────\x1b[0m');
      console.log('  \x1b[90mPress \x1b[37mCtrl+C\x1b[90m to exit\x1b[0m\n');

      if (options.open !== false) {
        try {
          await open(url);
        } catch {
          // ignore auto-open failures in headless/SSH environments
        }
      }
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\x1b[31m✖ Port ${port} is already in use.\x1b[0m Try specifying a different port with: \x1b[33m--port <number>\x1b[0m`);
      } else {
        console.error(`\x1b[31m✖ Server error:\x1b[0m`, err);
      }
      process.exit(1);
    });

    const shutdown = () => {
      manager.close();
      server.close(() => {
        console.log('\n\x1b[90m[LiteLens] Shutting down. Bye!\x1b[0m');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });

program.parse(process.argv);
