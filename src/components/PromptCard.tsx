import React, { useState } from 'react';
import { PromptTask } from '../types';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Download,
  Eye,
  RotateCcw,
  FileText,
  Copy,
  Check,
  Maximize2,
} from 'lucide-react';
import { downloadDataUrl } from '../utils/fileHelpers';

interface PromptCardProps {
  task: PromptTask;
  onGenerate: (taskId: string) => void;
  onOpenLightbox: (task: PromptTask) => void;
  onEditPrompt: (fileId: string) => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  task,
  onGenerate,
  onOpenLightbox,
  onEditPrompt,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(task.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.imageUrl) return;
    const cleanName = task.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanName}_${task.id.slice(0, 4)}.png`;
    downloadDataUrl(task.imageUrl, filename);
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg ${
        task.status === 'generating'
          ? 'bg-slate-900/90 border-amber-500/60 ring-2 ring-amber-500/20'
          : task.status === 'completed'
          ? 'bg-slate-900/80 border-slate-700/80 hover:border-amber-500/40'
          : task.status === 'error'
          ? 'bg-slate-900/80 border-rose-500/40'
          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top Header */}
      <div className="p-3.5 pb-2 flex items-center justify-between gap-2 border-b border-slate-800/60 bg-slate-950/40">
        <div
          onClick={() => onEditPrompt(task.fileId)}
          className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:text-amber-400 transition"
          title="Bấm để xem và chỉnh sửa file text này"
        >
          <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-300 truncate font-mono">
            {task.fileName}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5">
          {task.status === 'idle' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-medium">
              Chờ tạo
            </span>
          )}
          {task.status === 'queued' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium animate-pulse">
              Trong hàng đợi
            </span>
          )}
          {task.status === 'generating' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Đang vẽ...
            </span>
          )}
          {task.status === 'completed' && (
            <div className="flex items-center gap-1">
              {task.keyUsed && task.keyUsed.totalKeys > 1 && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                    task.keyUsed.rotated
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title={`Tạo bằng Key #${task.keyUsed.index} (${task.keyUsed.masked})${task.keyUsed.rotated ? ' - Đã tự động đổi key khi key trước hết quota' : ''}`}
                >
                  Key #{task.keyUsed.index}
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                ✓ Hoàn tất
              </span>
            </div>
          )}
          {task.status === 'error' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium flex items-center gap-1">
              Lỗi
            </span>
          )}
        </div>
      </div>

      {/* Media / Preview Area */}
      <div className="relative aspect-square w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {task.status === 'completed' && task.imageUrl ? (
          <div
            onClick={() => onOpenLightbox(task)}
            className="w-full h-full relative cursor-pointer group/img"
          >
            <img
              src={task.imageUrl}
              alt={task.prompt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
              loading="lazy"
            />
            {/* Hover overlay with action buttons */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-between p-3">
              <span className="text-[11px] font-mono text-slate-200 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-700 flex items-center gap-1">
                <Maximize2 className="w-3 h-3" />
                Xem lớn
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 transition cursor-pointer shadow-md"
                  title="Tải ảnh về máy (.png)"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>
          </div>
        ) : task.status === 'generating' ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-300">Nano Banana 2.1 đang sinh ảnh...</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Xử lý ánh sáng & chi tiết texture</p>
            </div>
          </div>
        ) : task.status === 'error' ? (
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-rose-300">Không thể tạo ảnh</p>
            <p className="text-[10px] text-rose-400/80 line-clamp-3 px-2">
              {task.errorMessage || 'Vui lòng kiểm tra lại prompt hoặc thử lại.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-600 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500">Chưa bắt đầu tạo</p>
          </div>
        )}
      </div>

      {/* Prompt Preview & Controls */}
      <div className="p-3.5 space-y-2.5 bg-slate-900/60 border-t border-slate-800/80">
        <div className="relative">
          <p
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-xs text-slate-300 font-['Plus_Jakarta_Sans',sans-serif] leading-relaxed cursor-pointer hover:text-slate-100 transition ${
              isExpanded ? '' : 'line-clamp-2'
            }`}
            title="Bấm để đọc toàn bộ prompt"
          >
            {task.prompt}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/50">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition text-xs cursor-pointer flex items-center gap-1"
              title="Sao chép prompt"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>

            {task.status === 'completed' && (
              <button
                onClick={() => onOpenLightbox(task)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition text-xs cursor-pointer"
                title="Xem chi tiết ảnh"
              >
                <Eye className="w-3 h-3" />
              </button>
            )}
          </div>

          <div>
            {task.status === 'completed' ? (
              <button
                onClick={() => onGenerate(task.id)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/30 transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                Tạo lại
              </button>
            ) : task.status === 'error' ? (
              <button
                onClick={() => onGenerate(task.id)}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                Thử lại
              </button>
            ) : (
              <button
                onClick={() => onGenerate(task.id)}
                disabled={task.status === 'generating'}
                className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm shadow-amber-500/20 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                Tạo ảnh
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
