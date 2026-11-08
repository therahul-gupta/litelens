import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export interface TableSummary {
  name: string;
  type: 'table' | 'view';
  rowCount: number;
  columnsCount: number;
  sql?: string;
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface ForeignKeyInfo {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
}

export interface IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
  columns?: string[];
}

export interface DatabaseMetadata {
  filename: string;
  filepath: string;
  fileSizeBytes: number;
  sqliteVersion: string;
  tableCount: number;
  viewCount: number;
  readonly: boolean;
}

export class SQLiteManager {
  private db: Database.Database | null = null;
  public filepath: string = '';
  public readonly: boolean = false;

  constructor(filepath?: string, readonly: boolean = false) {
    if (filepath) {
      this.open(filepath, readonly);
    }
  }

  public open(filepath: string, readonly: boolean = false): void {
    if (this.db) {
      this.db.close();
    }
    const resolvedPath = path.resolve(filepath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Database file not found at: ${resolvedPath}`);
    }
    this.filepath = resolvedPath;
    this.readonly = readonly;
    this.db = new Database(resolvedPath, { readonly });
    this.db.pragma('journal_mode = WAL');
  }

  public isConnected(): boolean {
    return this.db !== null;
  }

  public getMetadata(): DatabaseMetadata {
    if (!this.db) throw new Error('No database connected');

    const stats = fs.statSync(this.filepath);
    const versionRow = this.db.prepare('SELECT sqlite_version() as version').get() as { version: string };

    const tables = this.getTables();
    const tableCount = tables.filter((t) => t.type === 'table').length;
    const viewCount = tables.filter((t) => t.type === 'view').length;

    return {
      filename: path.basename(this.filepath),
      filepath: this.filepath,
      fileSizeBytes: stats.size,
      sqliteVersion: versionRow.version,
      tableCount,
      viewCount,
      readonly: this.readonly,
    };
  }

  public getTables(): TableSummary[] {
    if (!this.db) throw new Error('No database connected');

    const query = `
      SELECT name, type, sql 
      FROM sqlite_master 
      WHERE type IN ('table', 'view') 
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC
    `;
    const rows = this.db.prepare(query).all() as Array<{ name: string; type: string; sql: string }>;

    return rows.map((row) => {
      let rowCount = 0;
      let columnsCount = 0;
      try {
        if (row.type === 'table') {
          const countRes = this.db!.prepare(`SELECT COUNT(*) as count FROM "${row.name}"`).get() as { count: number };
          rowCount = countRes ? countRes.count : 0;
        }
        const colInfo = this.db!.prepare(`PRAGMA table_info("${row.name}")`).all();
        columnsCount = colInfo.length;
      } catch (err) {
        // Table might be locked or virtual
      }

      return {
        name: row.name,
        type: row.type as 'table' | 'view',
        rowCount,
        columnsCount,
        sql: row.sql,
      };
    });
  }

  public getTableSchema(tableName: string) {
    if (!this.db) throw new Error('No database connected');

    const columns = this.db.prepare(`PRAGMA table_info("${tableName}")`).all() as ColumnInfo[];
    const foreignKeys = this.db.prepare(`PRAGMA foreign_key_list("${tableName}")`).all() as ForeignKeyInfo[];
    const indexesRaw = this.db.prepare(`PRAGMA index_list("${tableName}")`).all() as IndexInfo[];

    const indexes = indexesRaw.map((idx) => {
      try {
        const info = this.db!.prepare(`PRAGMA index_info("${idx.name}")`).all() as Array<{ name: string }>;
        return {
          ...idx,
          columns: info.map((c) => c.name),
        };
      } catch {
        return idx;
      }
    });

    const ddlRow = this.db.prepare(`SELECT sql FROM sqlite_master WHERE name = ?`).get(tableName) as { sql: string } | undefined;

    return {
      tableName,
      columns,
      foreignKeys,
      indexes,
      ddl: ddlRow ? ddlRow.sql : '',
    };
  }

  public getTableRows(
    tableName: string,
    options: {
      page?: number;
      pageSize?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {}
  ) {
    if (!this.db) throw new Error('No database connected');

    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, Math.min(500, options.pageSize || 50));
    const offset = (page - 1) * pageSize;

    const columns = this.db.prepare(`PRAGMA table_info("${tableName}")`).all() as ColumnInfo[];

    let whereClause = '';
    const params: any[] = [];

    if (options.search && options.search.trim()) {
      const term = `%${options.search.trim()}%`;
      const searchConditions = columns
        .filter((col) => !col.type.toLowerCase().includes('blob'))
        .map((col) => `CAST("${col.name}" AS TEXT) LIKE ?`);

      if (searchConditions.length > 0) {
        whereClause = ` WHERE ` + searchConditions.join(' OR ');
        searchConditions.forEach(() => params.push(term));
      }
    }

    let orderClause = '';
    if (options.sortBy) {
      const validCol = columns.find((c) => c.name === options.sortBy);
      if (validCol) {
        const orderDir = options.sortOrder === 'DESC' ? 'DESC' : 'ASC';
        orderClause = ` ORDER BY "${validCol.name}" ${orderDir}`;
      }
    }

    const totalCountQuery = `SELECT COUNT(*) as count FROM "${tableName}"${whereClause}`;
    const totalCountRes = this.db.prepare(totalCountQuery).get(...params) as { count: number };
    const totalRows = totalCountRes ? totalCountRes.count : 0;

    const dataQuery = `SELECT * FROM "${tableName}"${whereClause}${orderClause} LIMIT ? OFFSET ?`;
    const rows = this.db.prepare(dataQuery).all(...params, pageSize, offset);

    return {
      columns: columns.map((c) => ({ name: c.name, type: c.type, pk: c.pk })),
      rows,
      page,
      pageSize,
      totalRows,
      totalPages: Math.ceil(totalRows / pageSize),
    };
  }

  public executeQuery(sql: string) {
    if (!this.db) throw new Error('No database connected');

    const trimmed = sql.trim();
    const startTime = process.hrtime.bigint();

    try {
      const stmt = this.db.prepare(trimmed);
      const isSelect = stmt.reader;

      if (isSelect) {
        const rows = stmt.all();
        const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
        const columns = rows.length > 0 ? Object.keys(rows[0] as object) : stmt.columns().map((c) => c.name);

        return {
          success: true,
          isSelect: true,
          columns,
          rows,
          rowCount: rows.length,
          executionTimeMs: Math.round(durationMs * 100) / 100,
        };
      } else {
        if (this.readonly) {
          throw new Error('Database is opened in read-only mode.');
        }
        const info = stmt.run();
        const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;

        return {
          success: true,
          isSelect: false,
          changes: info.changes,
          lastInsertRowid: info.lastInsertRowid,
          executionTimeMs: Math.round(durationMs * 100) / 100,
        };
      }
    } catch (err: any) {
      const durationMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
      return {
        success: false,
        error: err.message,
        executionTimeMs: Math.round(durationMs * 100) / 100,
      };
    }
  }

  public close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
