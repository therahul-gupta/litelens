import React, { useState, useEffect } from 'react';
import { Play, Clock, CheckCircle2, AlertCircle, History, Sparkles, Download, FileSpreadsheet, FileCode } from 'lucide-react';
import { QueryResult } from '../types.js';
import { CellModal } from './CellModal.js';

interface SqlStudioProps {
  initialTable?: string | null;
}

export const SqlStudio: React.FC<SqlStudioProps> = ({ initialTable }) => {
  const [sql, setSql] = useState<string>(
    initialTable ? `SELECT * FROM "${initialTable}" LIMIT 25;` : 'SELECT sqlite_version();'
  );
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [inspectCell, setInspectCell] = useState<{ col: string; val: any } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const exportResults = (format: 'csv' | 'json') => {
    if (!result?.rows || result.rows.length === 0) return;
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(result.rows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_result_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const cols = result.columns || Object.keys(result.rows[0]);
      const header = cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(',');
      const body = result.rows.map((row) =>
        cols.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
      ).join('\n');
      const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_result_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExportOpen(false);
  };

  // Update SQL when table changes
  useEffect(() => {
    if (initialTable) {
      setSql(`SELECT * FROM "${initialTable}" LIMIT 25;`);
    }
  }, [initialTable]);

  const runQuery = async () => {
    if (!sql.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      const data: QueryResult = await res.json();
      setResult(data);

      if (data.success) {
        setHistory((prev) => {
          const filtered = prev.filter((q) => q !== sql);
          return [sql, ...filtered].slice(0, 15);
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Failed to execute query',
      });
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut Cmd+Enter or Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery();
    }
  };

  const templates = [
    { label: 'All Tables', query: "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view');" },
    { label: 'Database Size', query: "SELECT page_count * page_size as size_bytes FROM pragma_page_count(), pragma_page_size();" },
    { label: 'Integrity Check', query: 'PRAGMA integrity_check;' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0e17] overflow-hidden">
      {/* Editor Container */}
      <div className="p-4 border-b border-[#1c2233] bg-[#0d101a] flex flex-col space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-300">SQL Query</span>
            <span className="text-[11px] text-slate-500 font-mono">Press Cmd+Enter to run</span>
          </div>

          <div className="flex items-center space-x-2">
            {templates.map((tpl) => (
              <button
                key={tpl.label}
                onClick={() => setSql(tpl.query)}
                className="text-[11px] px-2 py-1 rounded bg-[#151a28] hover:bg-[#1e2538] text-slate-400 hover:text-slate-200 border border-[#22293d] transition flex items-center space-x-1"
              >
                <Sparkles className="w-2.5 h-2.5 text-sky-400" />
                <span>{tpl.label}</span>
              </button>
            ))}

            {history.length > 0 && (
              <div className="relative group">
                <button className="text-[11px] px-2 py-1 rounded bg-[#151a28] hover:bg-[#1e2538] text-slate-400 hover:text-slate-200 border border-[#22293d] transition flex items-center space-x-1">
                  <History className="w-2.5 h-2.5" />
                  <span>History ({history.length})</span>
                </button>
                <div className="absolute right-0 mt-1 w-80 bg-[#121623] border border-[#232b3e] rounded-lg shadow-2xl py-1 hidden group-hover:block z-30 max-h-60 overflow-y-auto">
                  {history.map((histSql, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSql(histSql)}
                      className="w-full text-left px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-[#1d2437] truncate block"
                    >
                      {histSql}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative rounded-lg overflow-hidden border border-[#20273c] focus-within:border-sky-500 transition">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            placeholder="SELECT * FROM users WHERE active = 1;"
            className="w-full p-3 bg-[#0a0d16] text-slate-200 font-mono text-xs focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Run Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-xs">
            {result?.executionTimeMs !== undefined && (
              <span className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{result.executionTimeMs} ms</span>
              </span>
            )}
            {result?.success && result.isSelect && (
              <span className="text-emerald-400 flex items-center space-x-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                <span>{result.rowCount} rows returned</span>
              </span>
            )}
            {result?.success && !result.isSelect && (
              <span className="text-emerald-400 flex items-center space-x-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                <span>{result.changes} rows affected</span>
              </span>
            )}
            {result?.error && (
              <span className="text-rose-400 flex items-center space-x-1 text-[11px]">
                <AlertCircle className="w-3 h-3" />
                <span>{result.error}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {result?.isSelect && result.rows && result.rows.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setExportOpen(!exportOpen)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#141926] hover:bg-[#1e2538] text-slate-300 border border-[#242e44] text-xs font-medium rounded-md transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>

                {exportOpen && (
                  <div className="absolute right-0 mt-1 w-36 bg-[#121623] border border-[#232b3e] rounded-lg shadow-xl py-1 z-20">
                    <button
                      onClick={() => exportResults('csv')}
                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1a2033] transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={() => exportResults('json')}
                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1a2033] transition"
                    >
                      <FileCode className="w-3.5 h-3.5 text-sky-400" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={runQuery}
              disabled={loading || !sql.trim()}
              className="flex items-center space-x-2 px-4 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md shadow transition"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Running...' : 'Execute Query'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      <div className="flex-1 overflow-auto relative">
        {!result && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs">
            Write a SQL query above and click Execute (or press Cmd+Enter).
          </div>
        )}

        {result && !result.success && (
          <div className="p-6">
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs whitespace-pre-wrap">
              {result.error}
            </div>
          </div>
        )}

        {result && result.success && result.isSelect && (
          <>
            {result.rows && result.rows.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Query executed successfully. (0 rows returned)
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0f121d] sticky top-0 z-10 border-b border-[#1c2233]">
                  <tr>
                    <th className="w-12 px-3 py-2 text-[11px] font-mono font-medium text-slate-500 border-r border-[#1c2233] text-center">
                      #
                    </th>
                    {result.columns?.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 font-semibold text-slate-200 border-r border-[#1c2233]"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171c2b] font-mono">
                  {result.rows?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#131724] transition">
                      <td className="px-3 py-1.5 text-[11px] text-slate-600 border-r border-[#171c2b] text-center">
                        {idx + 1}
                      </td>
                      {result.columns?.map((col) => (
                        <td
                          key={col}
                          onClick={() => setInspectCell({ col, val: row[col] })}
                          className="px-3 py-1.5 border-r border-[#171c2b] text-slate-300 max-w-xs truncate cursor-pointer hover:bg-sky-500/10 hover:text-sky-200 transition"
                        >
                          {row[col] === null || row[col] === undefined ? (
                            <span className="text-slate-600 italic">NULL</span>
                          ) : (
                            String(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

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

