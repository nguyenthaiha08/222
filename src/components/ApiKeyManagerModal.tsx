import React, { useState, useEffect } from 'react';
import {
  Layers,
  X,
  Plus,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Check,
  ExternalLink,
} from 'lucide-react';

interface ApiKeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysSaved: (keys: string[]) => void;
  initialKeys?: string[];
}

export const ApiKeyManagerModal: React.FC<ApiKeyManagerModalProps> = ({
  isOpen,
  onClose,
  onKeysSaved,
  initialKeys = [],
}) => {
  const [inputText, setInputText] = useState('');
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [showPlainKeys, setShowPlainKeys] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize or load keys from localStorage / server on open
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem('nanoflow_api_keys');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setActiveKeys(parsed);
            return;
          }
        }
      } catch (e) {
        console.warn('Error reading stored keys', e);
      }
      if (initialKeys && initialKeys.length > 0) {
        setActiveKeys(initialKeys);
      }
    }
  }, [isOpen, initialKeys]);

  if (!isOpen) return null;

  // Mask key utility: e.g. AIzaSyBg...j0tE
  const maskKey = (key: string): string => {
    if (key.length <= 10) return key;
    return `${key.slice(0, 8)}...${key.slice(-4)}`;
  };

  // Add new keys from textarea
  const handleAddKeys = () => {
    if (!inputText.trim()) return;

    // Split by newlines, commas, or semicolons
    const rawList = inputText
      .split(/[\n,;]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 5);

    if (rawList.length === 0) return;

    setActiveKeys((prev) => {
      const combined = [...prev, ...rawList];
      // Filter unique
      return Array.from(new Set(combined));
    });

    setInputText('');
  };

  // Delete single key
  const handleDeleteKey = (index: number) => {
    setActiveKeys((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear all keys
  const handleClearAll = () => {
    if (activeKeys.length === 0) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả các API Key trong danh sách không?')) {
      setActiveKeys([]);
    }
  };

  // Copy all keys to clipboard
  const handleCopyAll = () => {
    if (activeKeys.length === 0) return;
    navigator.clipboard.writeText(activeKeys.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Save configuration
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save to localStorage
      localStorage.setItem('nanoflow_api_keys', JSON.stringify(activeKeys));

      // 2. Sync to backend KeyManager
      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: activeKeys }),
      });

      // 3. Notify parent
      onKeysSaved(activeKeys);
      onClose();
    } catch (e) {
      console.error('Failed to sync keys to server', e);
      // Still close and notify client
      onKeysSaved(activeKeys);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-[#0d1322] border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">API Key Manager</h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 flex-1 overflow-y-auto">
          {/* Left Column: Add New Keys */}
          <div className="p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3 flex-1 flex flex-col">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Add New Keys
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Paste keys here (one per line). Duplicates will be ignored.
                </p>
              </div>

              <div className="flex-1 min-h-[260px] flex flex-col">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={'AIzaSy...\nAIzaSy...'}
                  rows={10}
                  className="w-full flex-1 p-4 bg-[#080d19] border border-slate-800 rounded-2xl text-slate-200 placeholder:text-slate-600 font-mono text-xs focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </div>

            <button
              onClick={handleAddKeys}
              disabled={!inputText.trim()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700/80 transition active:scale-98 disabled:opacity-40 cursor-pointer shadow-sm"
            >
              Add to List
            </button>
          </div>

          {/* Right Column: Active Keys */}
          <div className="p-6 flex flex-col justify-between space-y-4 bg-[#0a0f1d]/50">
            <div className="space-y-3 flex-1 flex flex-col">
              {/* Active Keys Header & Show Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Active Keys ({activeKeys.length})
                  </h3>
                </div>

                <button
                  onClick={() => setShowPlainKeys(!showPlainKeys)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {showPlainKeys ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons: Copy All & Clear All */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleCopyAll}
                  disabled={activeKeys.length === 0}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-40 cursor-pointer"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy All</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleClearAll}
                  disabled={activeKeys.length === 0}
                  className="py-2 px-3 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 text-rose-300 hover:text-rose-200 text-xs font-medium flex items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear All</span>
                </button>
              </div>

              {/* Scrollable Keys List */}
              <div className="flex-1 min-h-[220px] max-h-[280px] overflow-y-auto space-y-2 pr-1.5 mt-2">
                {activeKeys.length === 0 ? (
                  <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl text-slate-500">
                    <KeyRound className="w-8 h-8 opacity-40 mb-2" />
                    <p className="text-xs">No active keys added yet.</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Paste keys on the left and click "Add to List".
                    </p>
                  </div>
                ) : (
                  activeKeys.map((key, index) => (
                    <div
                      key={`${key}-${index}`}
                      className="group flex items-center justify-between p-3 rounded-xl bg-[#080d19] border border-slate-800/80 hover:border-slate-700 transition"
                    >
                      <span className="font-mono text-xs text-slate-200 truncate select-all">
                        {showPlainKeys ? key : maskKey(key)}
                      </span>

                      <button
                        onClick={() => handleDeleteKey(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                        title="Remove key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Note below list */}
              <p className="text-[11px] text-slate-500 text-center pt-2">
                System will automatically rotate through these keys if Quota limits are reached.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#090e1b] flex items-center justify-between gap-4">
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
          >
            <span>Get more keys</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-4 py-2 rounded-xl transition cursor-pointer font-medium"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs font-semibold px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
