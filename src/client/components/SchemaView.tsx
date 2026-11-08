import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, Link2, ListOrdered, FileCode2 } from 'lucide-react';
import { TableSchema } from '../types.js';

interface SchemaViewProps {
  tableName: string;
}

export const SchemaView: React.FC<SchemaViewProps> = ({ tableName }) => {
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchSchema = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tables/${encodeURIComponent(tableName)}/schema`);
        if (!res.ok) throw new Error('Failed to fetch schema');
        const data = await res.json();
        if (!ignore) setSchema(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchSchema();
    return () => {
      ignore = true;
    };
  }, [tableName]);

  const handleCopyDDL = () => {
    if (schema?.ddl) {
      navigator.clipboard.writeText(schema.ddl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || !schema) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0e17] text-xs text-sky-400">
        Loading schema structure...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b0e17] p-6 space-y-6">
      {/* Columns Section */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
          <ListOrdered className="w-4 h-4 text-sky-400" />
          <span>Columns ({schema.columns.length})</span>
        </div>

        <div className="border border-[#1e2538] rounded-lg overflow-hidden bg-[#0e121d]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141926] border-b border-[#1e2538] text-slate-400 font-medium">
              <tr>
                <th className="px-4 py-2.5 w-16">#</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Nullable</th>
                <th className="px-4 py-2.5">Default</th>
                <th className="px-4 py-2.5">Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181f30] font-mono text-slate-300">
              {schema.columns.map((col) => (
                <tr key={col.cid} className="hover:bg-[#131724]">
                  <td className="px-4 py-2 text-slate-500">{col.cid}</td>
                  <td className="px-4 py-2 font-semibold text-slate-100 flex items-center gap-1.5">
                    {col.pk > 0 && <Key className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{col.name}</span>
                  </td>
                  <td className="px-4 py-2 text-sky-400">{col.type || 'ANY'}</td>
                  <td className="px-4 py-2">
                    {col.notnull ? (
                      <span className="text-rose-400">NOT NULL</span>
                    ) : (
                      <span className="text-slate-500">NULL</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-400">
                    {col.dflt_value === null ? '—' : String(col.dflt_value)}
                  </td>
                  <td className="px-4 py-2">
                    {col.pk > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                        PRIMARY KEY {col.pk > 1 ? `(${col.pk})` : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Foreign Keys Section */}
      {schema.foreignKeys && schema.foreignKeys.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
            <Link2 className="w-4 h-4 text-emerald-400" />
            <span>Foreign Keys ({schema.foreignKeys.length})</span>
          </div>

          <div className="border border-[#1e2538] rounded-lg overflow-hidden bg-[#0e121d]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#141926] border-b border-[#1e2538] text-slate-400 font-sans font-medium">
                <tr>
                  <th className="px-4 py-2.5">From Column</th>
                  <th className="px-4 py-2.5">Target Table</th>
                  <th className="px-4 py-2.5">Target Column</th>
                  <th className="px-4 py-2.5">On Update</th>
                  <th className="px-4 py-2.5">On Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181f30] text-slate-300">
                {schema.foreignKeys.map((fk, idx) => (
                  <tr key={idx} className="hover:bg-[#131724]">
                    <td className="px-4 py-2 text-sky-300 font-semibold">{fk.from}</td>
                    <td className="px-4 py-2 text-emerald-400">{fk.table}</td>
                    <td className="px-4 py-2 text-slate-200">{fk.to}</td>
                    <td className="px-4 py-2 text-slate-500">{fk.on_update}</td>
                    <td className="px-4 py-2 text-slate-500">{fk.on_delete}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Indexes Section */}
      {schema.indexes && schema.indexes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
            <Key className="w-4 h-4 text-amber-400" />
            <span>Indexes ({schema.indexes.length})</span>
          </div>

          <div className="border border-[#1e2538] rounded-lg overflow-hidden bg-[#0e121d]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#141926] border-b border-[#1e2538] text-slate-400 font-sans font-medium">
                <tr>
                  <th className="px-4 py-2.5">Index Name</th>
                  <th className="px-4 py-2.5">Unique</th>
                  <th className="px-4 py-2.5">Indexed Columns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181f30] text-slate-300">
                {schema.indexes.map((idx) => (
                  <tr key={idx.name} className="hover:bg-[#131724]">
                    <td className="px-4 py-2 text-amber-300 font-semibold">{idx.name}</td>
                    <td className="px-4 py-2">
                      {idx.unique ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                          UNIQUE
                        </span>
                      ) : (
                        <span className="text-slate-500">NON-UNIQUE</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-200">
                      {idx.columns ? idx.columns.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DDL SQL Section */}
      {schema.ddl && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
              <FileCode2 className="w-4 h-4 text-sky-400" />
              <span>Table DDL</span>
            </div>

            <button
              onClick={handleCopyDDL}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#161d2d] hover:bg-[#20293d] border border-[#263148] text-xs text-slate-300 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy DDL'}</span>
            </button>
          </div>

          <div className="p-4 rounded-lg bg-[#0e121d] border border-[#1e2538] font-mono text-xs text-sky-300 overflow-x-auto whitespace-pre-wrap">
            {schema.ddl}
          </div>
        </div>
      )}
    </div>
  );
};
