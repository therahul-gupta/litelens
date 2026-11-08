export interface DatabaseMetadata {
  filename: string;
  filepath: string;
  fileSizeBytes: number;
  sqliteVersion: string;
  tableCount: number;
  viewCount: number;
  readonly: boolean;
}

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

export interface TableSchema {
  tableName: string;
  columns: ColumnInfo[];
  foreignKeys: ForeignKeyInfo[];
  indexes: IndexInfo[];
  ddl: string;
}

export interface QueryResult {
  success: boolean;
  isSelect?: boolean;
  columns?: string[];
  rows?: any[];
  rowCount?: number;
  changes?: number;
  lastInsertRowid?: number | bigint;
  executionTimeMs?: number;
  error?: string;
}

