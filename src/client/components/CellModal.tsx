import React, { useState } from 'react';
import { X, Copy, Check, FileJson, AlignLeft } from 'lucide-react';

interface CellModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnName: string;
  value: any;
}

export const CellModal: React.FC<CellModalProps> = ({ isOpen, onClose, columnName, value }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  if (!isOpen) return null;

  let stringVal = value === null || value === undefined ? 'NULL' : String(value);
  let isJson = false;
  let formattedJson = '';

  if (typeof value === 'object' && value !== null) {
    isJson = true;
    formattedJson = JSON.stringify(value, null, 2);
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        isJson = true;
        formattedJson = JSON.stringify(parsed, null, 2);
      }
    } catch {
      // not JSON
    }
  }

  const textToCopy = isJson && viewMode === 'formatted' ? formattedJson : stringVal;

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f131f] border border-[#232b3e] rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1f2638] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {columnName}
            </span>
            <span className="text-xs text-slate-400">Cell Inspector</span>
          </div>

          <div className="flex items-center space-x-2">
            {isJson && (
              <div className="flex bg-[#161d2d] p-0.5 rounded border border-[#232b3e] text-[11px]">
                <button
                  onClick={() => setViewMode('formatted')}
                  className={`flex items-center space-x-1 px-2 py-1 rounded ${
                    viewMode === 'formatted' ? 'bg-sky-500 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  <FileJson className="w-3 h-3" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`flex items-center space-x-1 px-2 py-1 rounded ${
                    viewMode === 'raw' ? 'bg-sky-500 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  <AlignLeft className="w-3 h-3" />
                  <span>Raw</span>
                </button>
              </div>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#161d2d] hover:bg-[#20293d] border border-[#263148] text-xs text-slate-300 transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1e2536] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-auto font-mono text-xs text-slate-200 bg-[#0a0d16] select-text">
          <pre className="whitespace-pre-wrap break-words">
            {isJson && viewMode === 'formatted' ? formattedJson : stringVal}
          </pre>
        </div>
      </div>
    </div>
  );
};

