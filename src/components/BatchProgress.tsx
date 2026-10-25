import React from 'react';
import {
  Play,
  Pause,
  Download,
  FolderArchive,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface BatchProgressProps {
  total: number;
  completed: number;
  errors: number;
  generating: number;
  pending: number;
  isRunningQueue: boolean;
  onStartAll: () => void;
  onStartPending: () => void;
  onStopQueue: () => void;
  onDownloadAllImagesZip: () => void;
  onDownloadAllPromptFilesZip: () => void;
  filter: 'all' | 'pending' | 'completed' | 'error';
  onFilterChange: (filter: 'all' | 'pending' | 'completed' | 'error') => void;
}

export const BatchProgress: React.FC<BatchProgressProps> = ({
  total,
  completed,
  errors,
  generating,
  pending,
  isRunningQueue,
  onStartAll,
  onStartPending,
  onStopQueue,
  onDownloadAllImagesZip,
  onDownloadAllPromptFilesZip,
  filter,
  onFilterChange,
}) => {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Top bar with Queue controls and Zip download */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Tiến trình hàng đợi tạo ảnh
              {isRunningQueue && (
                <span className="text-[11px] font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                  Đang chạy batch...
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {completed}/{total} hoàn tất ({percent}%) • Nano Banana 2.1 Engine
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isRunningQueue ? (
            <button
              onClick={onStopQueue}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              Tạm dừng hàng đợi
            </button>
          ) : (
            <>
              {pending > 0 && completed > 0 && (
                <button
                  onClick={onStartPending}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title="Chỉ tạo các mục chưa hoàn thành"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tạo các mục chờ ({pending})
                </button>
              )}

              <button
                onClick={onStartAll}
                disabled={total === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Tạo tất cả ảnh ({total})
              </button>
            </>
          )}

          {/* Download Buttons */}
          {completed > 0 && (
            <button
              onClick={onDownloadAllImagesZip}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Tải tất cả ảnh đã tạo thành 1 file ZIP"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Tải ảnh (ZIP)
            </button>
          )}

          {total > 0 && (
            <button
              onClick={onDownloadAllPromptFilesZip}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Tải toàn bộ các file text prompt đã chỉnh sửa về máy (ZIP)"
            >
              <FolderArchive className="w-3.5 h-3.5 text-sky-400" />
              Xuất files .txt
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 h-full rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-800 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả ({total})
          </button>
          <button
            onClick={() => onFilterChange('pending')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              filter === 'pending'
                ? 'bg-slate-800 text-amber-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-400" />
            Chờ tạo ({pending + generating})
          </button>
          <button
            onClick={() => onFilterChange('completed')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              filter === 'completed'
                ? 'bg-slate-800 text-emerald-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Đã xong ({completed})
          </button>
          {errors > 0 && (
            <button
              onClick={() => onFilterChange('error')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                filter === 'error'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold shadow-sm'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Lỗi ({errors})
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <span>Nano Banana 2.1</span>
          <span>•</span>
          <span>Hỗ trợ tải toàn bộ ảnh ZIP kèm prompt metadata</span>
        </div>
      </div>
    </div>
  );
};
