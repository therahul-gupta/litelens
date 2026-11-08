import React, { useState } from 'react';
import { Table, Eye, Search, PlusCircle, Layers } from 'lucide-react';
import { TableSummary } from '../types.js';

interface SidebarProps {
  tables: TableSummary[];
  selectedTable: string | null;
  onSelectTable: (tableName: string) => void;
  onNewQuery: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tables,
  selectedTable,
  onSelectTable,
  onNewQuery,
}) => {
  const [filter, setFilter] = useState('');

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase())
  );

  const regularTables = filteredTables.filter((t) => t.type === 'table');
  const viewTables = filteredTables.filter((t) => t.type === 'view');

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString();
  };

  return (
    <aside className="w-64 border-r border-[#1c2233] bg-[#0b0e17] flex flex-col h-full shrink-0">
      {/* Search & Actions */}
      <div className="p-3 border-b border-[#1c2233] space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter tables..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-[#131724] border border-[#20273c] text-xs text-slate-200 placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-md focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <button
          onClick={onNewQuery}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-[#161d2d] hover:bg-sky-500/10 text-slate-300 hover:text-sky-400 text-xs font-medium rounded-md border border-[#242e47] hover:border-sky-500/30 transition group"
        >
          <PlusCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400" />
          <span>New SQL Query</span>
        </button>
      </div>

      {/* Table list scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Tables */}
        <div>
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-slate-500" />
              Tables
            </span>
            <span className="text-[10px] bg-[#171c2b] text-slate-400 px-1.5 py-0.2 rounded font-mono">
              {regularTables.length}
            </span>
          </div>

          <div className="mt-1 space-y-0.5">
            {regularTables.length === 0 ? (
              <div className="text-xs text-slate-600 px-2 py-2 italic">No tables found</div>
            ) : (
              regularTables.map((table) => {
                const isSelected = selectedTable === table.name;
                return (
                  <button
                    key={table.name}
                    onClick={() => onSelectTable(table.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all group ${
                      isSelected
                        ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium'
                        : 'text-slate-300 hover:bg-[#151a27] hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Table
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{table.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-200'
                          : 'bg-[#181d2c] text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      {formatCount(table.rowCount)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Views (if any) */}
        {viewTables.length > 0 && (
          <div>
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-slate-500" />
                Views
              </span>
              <span className="text-[10px] bg-[#171c2b] text-slate-400 px-1.5 py-0.2 rounded font-mono">
                {viewTables.length}
              </span>
            </div>

            <div className="mt-1 space-y-0.5">
              {viewTables.map((view) => {
                const isSelected = selectedTable === view.name;
                return (
                  <button
                    key={view.name}
                    onClick={() => onSelectTable(view.name)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all group ${
                      isSelected
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium'
                        : 'text-slate-300 hover:bg-[#151a27] hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Eye
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected
                            ? 'text-purple-400'
                            : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{view.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
