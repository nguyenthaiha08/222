import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  Cpu,
  RotateCcw,
  KeyRound,
  Info,
  Check,
  X,
} from 'lucide-react';

interface KeyPoolInfo {
  totalKeys: number;
  currentIndex: number;
  currentMasked: string;
  autoRotate: boolean;
}

interface HeaderProps {
  totalFiles: number;
  totalPrompts: number;
  completedImages: number;
  keyPool?: KeyPoolInfo | null;
  onLoadSamples: () => void;
  onResetAll: () => void;
  onOpenKeyManager: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalFiles,
  totalPrompts,
  completedImages,
  keyPool,
  onLoadSamples,
  onResetAll,
  onOpenKeyManager,
}) => {

  return (
    <>
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  NanoFlow <span className="text-amber-400 font-extrabold">Studio</span>
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Nano Banana 2.1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Batch Image Generator từ file Text Prompts • Google GenAI
              </p>
            </div>
          </div>

          {/* Stats & Key Pool Badge & Quick Actions */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* API Key Manager Modal Button */}
            <button
              onClick={onOpenKeyManager}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-xs font-medium transition cursor-pointer active:scale-95 shadow-sm"
              title="Mở bảng quản lý API Key Manager (thêm nhiều key, copy, xóa, xoay vòng tự động)"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                API Key Manager:{' '}
                <strong className="text-white font-mono">
                  {keyPool?.totalKeys && keyPool.totalKeys > 0 ? keyPool.totalKeys : 0} Keys
                </strong>
              </span>
              <span className="text-[10px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300 ml-1 hidden sm:inline">
                Auto-Rotate
              </span>
            </button>

            {/* Counts */}
            <div className="flex items-center gap-4 bg-slate-800/50 border border-slate-700/60 rounded-xl px-3.5 py-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Files: <strong className="text-white font-mono">{totalFiles}</strong></span>
              </div>
              <div className="w-px h-3.5 bg-slate-700" />
              <div className="flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Prompts: <strong className="text-white font-mono">{totalPrompts}</strong></span>
              </div>
              <div className="w-px h-3.5 bg-slate-700" />
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đã tạo: <strong className="text-emerald-400 font-mono">{completedImages}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onLoadSamples}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                title="Tải 4 file prompt mẫu để thử nghiệm nhanh"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>File mẫu</span>
              </button>

              {totalFiles > 0 && (
                <button
                  onClick={onResetAll}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Đặt lại toàn bộ danh sách"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
