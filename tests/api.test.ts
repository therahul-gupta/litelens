import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SQLiteManager } from '../src/server/db.js';
import { createServer } from '../src/server/server.js';
import { createSampleDatabase } from '../src/server/sampleDb.js';

describe('LiteLens Core Engine & Server Tests', () => {
  let dbPath: string;
  let manager: SQLiteManager;
  let server: any;
  const testPort = 5991;

  before(async () => {
    // Create sample database
    dbPath = createSampleDatabase();
    manager = new SQLiteManager(dbPath);
    server = createServer(manager);

    await new Promise<void>((resolve) => {
      server.listen(testPort, 'localhost', () => resolve());
    });
  });

  after(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (manager) {
      manager.close();
    }
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch {}
    }
  });

  test('Database metadata should return table and view counts', () => {
    const meta = manager.getMetadata();
    assert.equal(typeof meta.filename, 'string');
    assert.ok(meta.tableCount >= 4, `Expected at least 4 tables, got ${meta.tableCount}`);
    assert.ok(meta.viewCount >= 1, `Expected at least 1 view, got ${meta.viewCount}`);
    assert.equal(meta.readonly, false);
  });

  test('Table schema retrieves column definitions and indexes', () => {
    const schema = manager.getTableSchema('users');
    assert.equal(schema.tableName, 'users');
    assert.ok(schema.columns.some((c) => c.name === 'id' && c.pk > 0));
    assert.ok(schema.columns.some((c) => c.name === 'email'));
    assert.ok(schema.indexes.some((i) => i.name === 'idx_users_email'));
  });

  test('Table rows are properly paginated and searchable', () => {
    const result = manager.getTableRows('products', { page: 1, pageSize: 5 });
    assert.equal(result.rows.length, 5);
    assert.ok(result.totalRows >= 8);

    // Test search filter
    const searchResult = manager.getTableRows('products', { search: 'Keyboard' });
    assert.ok(searchResult.rows.length >= 1);
    assert.match(searchResult.rows[0].title, /Keyboard/i);
  });

  test('Arbitrary SQL execution handles SELECT and returns execution time', () => {
    const res = manager.executeQuery('SELECT COUNT(*) as count FROM users');
    assert.equal(res.success, true);
    assert.equal(res.isSelect, true);
    assert.equal(res.rows?.[0].count >= 6, true);
    assert.ok(typeof res.executionTimeMs === 'number');
  });

  test('HTTP API /api/status returns database connection info', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.connected, true);
    assert.ok(data.tableCount >= 4);
  });

  test('HTTP API /api/tables lists all tables and views', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/tables`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.tables));
    assert.ok(data.tables.some((t: any) => t.name === 'users'));
    assert.ok(data.tables.some((t: any) => t.name === 'v_top_selling_products'));
  });

  test('HTTP API /api/export returns valid CSV', async () => {
    const res = await fetch(`http://localhost:${testPort}/api/export/users?format=csv`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('"id","name","email"'));
    assert.ok(text.includes('Sarah Connor'));
  });
});

