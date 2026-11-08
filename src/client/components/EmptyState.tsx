import React, { useState } from 'react';
import { Database, FolderOpen, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface EmptyStateProps {
  onDatabaseOpened: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onDatabaseOpened }) => {
  const [filePath, setFilePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async (path?: string) => {
    const targetPath = path || filePath;
    if (!targetPath.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: targetPath.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to open database');
      }
      onDatabaseOpened();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sample', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load sample database');
      onDatabaseOpened();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#090b12] p-6 text-center select-none">
      <div className="max-w-md w-full space-y-8">
        {/* Logo & Headline */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto shadow-2xl shadow-sky-500/10">
            <Database className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to LiteLens</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Zero-config, high-performance web viewer and query studio for SQLite.
          </p>
        </div>

        {/* Action card */}
        <div className="bg-[#0f131f] border border-[#1f2638] rounded-xl p-6 shadow-xl space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleOpen();
            }}
            className="space-y-3"
          >
            <label className="block text-left text-xs font-semibold text-slate-300">
              Open a local SQLite database:
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <FolderOpen className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="/path/to/database.db or ./app.sqlite"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  className="w-full bg-[#151a28] border border-[#232b3e] text-xs text-slate-200 pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-sky-500 transition font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !filePath.trim()}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-xs font-medium rounded-lg flex items-center space-x-1.5 transition shadow"
              >
                <span>Connect</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {error && (
            <div className="text-left text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#1e2538]"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Or
            </span>
            <div className="flex-grow border-t border-[#1e2538]"></div>
          </div>

          {/* Sample DB button */}
          <button
            onClick={handleLoadSample}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#151a28] hover:bg-sky-500/10 text-slate-300 hover:text-sky-300 border border-[#232b3e] hover:border-sky-500/30 rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition group"
          >
            <Sparkles className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <span>Load Demo Store Database (Instant Preview)</span>
          </button>
        </div>

        {/* Feature bullets */}
        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="flex items-start space-x-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Ultra-fast schema & table navigation</span>
          </div>
          <div className="flex items-start space-x-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Interactive SQL with execution timing</span>
          </div>
          <div className="flex items-start space-x-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Cell inspector for JSON and blobs</span>
          </div>
          <div className="flex items-start space-x-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>One-click CSV & JSON export</span>
          </div>
        </div>
      </div>
    </div>
  );
};
