import React from 'react';
import { Database, Terminal, Table as TableIcon, Code2, RefreshCw, ShieldAlert, HardDrive } from 'lucide-react';
import { DatabaseMetadata } from '../types.js';

interface HeaderProps {
  metadata: DatabaseMetadata | null;
  activeTab: 'data' | 'schema' | 'sql';
  setActiveTab: (tab: 'data' | 'schema' | 'sql') => void;
  selectedTable: string | null;
  onRefresh: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  activeTab,
  setActiveTab,
  selectedTable,
  onRefresh,
  loading,
}) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <header className="h-14 border-b border-[#1c2233] bg-[#0e111a] px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center space-x-3">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold shadow-inner">
            <Database className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-semibold text-slate-100 tracking-tight">LiteLens</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono border border-sky-500/20">
              SQLite
            </span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[#22293d] mx-1" />

        {/* Database metadata badges */}
        {metadata && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-mono text-slate-300 font-medium px-2 py-1 rounded bg-[#161b29] border border-[#22293d]">
              {metadata.filename}
            </span>
            <span className="text-slate-400 hidden sm:flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-500" />
              {formatSize(metadata.fileSizeBytes)}
            </span>
            {metadata.readonly && (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[11px] border border-amber-500/20">
                <ShieldAlert className="w-3 h-3" />
                Read-only
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-[#131722] p-1 rounded-lg border border-[#22293d]">
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'data'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1c2233]'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Data Grid</span>
          {selectedTable && (
            <span className="ml-1 opacity-75 font-mono text-[10px] hidden md:inline">
              ({selectedTable})
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          disabled={!selectedTable}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'schema'
              ? 'bg-sky-500 text-white shadow-sm'
              : !selectedTable
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1c2233]'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Schema</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'sql'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#1c2233]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>SQL Studio</span>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          title="Refresh database"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1c2233] border border-transparent hover:border-[#2b334c] transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};

