import React, { useState, useEffect } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Key,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Maximize2,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { CellModal } from './CellModal.js';

interface ColumnMeta {
  name: string;
  type: string;
  pk: number;
}

interface DataGridProps {
  tableName: string;
}

export const DataGrid: React.FC<DataGridProps> = ({ tableName }) => {
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inspector modal state
  const [inspectCell, setInspectCell] = useState<{ col: string; val: any } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Reset pagination when table changes
  useEffect(() => {
    setPage(1);
    setSearch('');
    setSortBy(undefined);
    setSortOrder('ASC');
  }, [tableName]);

  // Fetch rows
  useEffect(() => {
    let ignore = false;
    const fetchRows = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          sortOrder,
        });
        if (search.trim()) params.set('search', search.trim());
        if (sortBy) params.set('sortBy', sortBy);

        const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/rows?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load table rows');
        const data = await res.json();
        if (!ignore) {
          setColumns(data.columns || []);
          setRows(data.rows || []);
          setTotalRows(data.totalRows || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err: any) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchRows();
    return () => {
      ignore = true;
    };
  }, [tableName, page, pageSize, search, sortBy, sortOrder]);

  const handleSort = (colName: string) => {
    if (sortBy === colName) {
      if (sortOrder === 'ASC') {
        setSortOrder('DESC');
      } else {
        setSortBy(undefined);
      }
    } else {
      setSortBy(colName);
      setSortOrder('ASC');
    }
  };

  const formatCellValue = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-600 italic font-mono text-[11px]">NULL</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${val ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {val ? 'TRUE' : 'FALSE'}
        </span>
      );
    }
    const str = String(val);
    if (str.length > 60) {
      return (
        <span className="flex items-center space-x-1.5 group-hover:text-sky-300">
          <span className="truncate">{str.slice(0, 60)}…</span>
          <Maximize2 className="w-2.5 h-2.5 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
        </span>
      );
    }
    return <span>{str}</span>;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0e17] overflow-hidden">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-[#1c2233] flex items-center justify-between gap-4 shrink-0 bg-[#0d101a]">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search across ${tableName}...`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-[#131724] border border-[#20273c] text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-md focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        {/* Export & Controls */}
        <div className="flex items-center space-x-3">
          <div className="text-xs text-slate-400 font-mono">
            {totalRows.toLocaleString()} {totalRows === 1 ? 'row' : 'rows'}
          </div>

          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#141926] hover:bg-[#1e2538] text-slate-300 border border-[#242e44] transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-[#121623] border border-[#232b3e] rounded-lg shadow-xl py-1 z-20">
                <a
                  href={`/api/export/${encodeURIComponent(tableName)}?format=csv`}
                  download
                  onClick={() => setExportOpen(false)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1a2033] transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </a>
                <a
                  href={`/api/export/${encodeURIComponent(tableName)}?format=json`}
                  download
                  onClick={() => setExportOpen(false)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1a2033] transition"
                >
                  <FileCode className="w-3.5 h-3.5 text-sky-400" />
                  <span>Export JSON</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-[#0b0e17]/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-xs text-sky-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Loading records...</span>
            </div>
          </div>
        )}

        {error ? (
          <div className="p-8 text-center text-xs text-rose-400">
            Error loading table: {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
            {search ? 'No records match your search filter.' : 'This table has no rows.'}
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0f121d] sticky top-0 z-10 border-b border-[#1c2233]">
              <tr>
                <th className="w-12 px-3 py-2 text-[11px] font-mono font-medium text-slate-500 border-r border-[#1c2233] text-center select-none">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.name}
                    onClick={() => handleSort(col.name)}
                    className="px-3 py-2 font-medium text-slate-300 border-r border-[#1c2233] cursor-pointer hover:bg-[#171c2b] transition select-none group"
                  >
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex items-center space-x-1.5 truncate">
                        {col.pk > 0 && <Key className="w-3 h-3 text-amber-400 shrink-0" title="Primary Key" />}
                        <span className="font-semibold text-slate-200 truncate">{col.name}</span>
                        {col.type && (
                          <span className="text-[10px] font-mono text-slate-500 px-1 py-0.2 rounded bg-[#161a27]">
                            {col.type}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 group-hover:text-slate-300">
                        {sortBy === col.name ? (
                          sortOrder === 'ASC' ? (
                            <ArrowUp className="w-3 h-3 text-sky-400" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-sky-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                        )}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#171c2b] font-mono">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#131724] transition group">
                  <td className="px-3 py-1.5 text-[11px] text-slate-600 border-r border-[#171c2b] text-center">
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.name}
                      onClick={() => setInspectCell({ col: col.name, val: row[col.name] })}
                      className="px-3 py-1.5 border-r border-[#171c2b] text-slate-300 max-w-xs truncate cursor-pointer hover:bg-sky-500/10 hover:text-sky-200 transition"
                      title="Click to inspect cell"
                    >
                      {formatCellValue(row[col.name])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="h-12 border-t border-[#1c2233] bg-[#0d101a] px-4 flex items-center justify-between shrink-0 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-[#131724] border border-[#20273c] text-xs text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-sky-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <span className="font-mono text-slate-300">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-[#151a27] hover:bg-[#1f2638] border border-[#22293d] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded bg-[#151a27] hover:bg-[#1f2638] border border-[#22293d] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cell Inspector Modal */}
      {inspectCell && (
        <CellModal
          isOpen={true}
          onClose={() => setInspectCell(null)}
          columnName={inspectCell.col}
          value={inspectCell.val}
        />
      )}
    </div>
  );
};

