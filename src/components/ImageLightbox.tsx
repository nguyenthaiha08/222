import React, { useEffect } from 'react';
import { PromptTask } from '../types';
import {
  X,
  Download,
  Copy,
  Check,
  Sparkles,
  FileText,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { downloadDataUrl } from '../utils/fileHelpers';

interface ImageLightboxProps {
  task: PromptTask | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  task,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext && hasNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, hasNext, hasPrev]);

  if (!task || !task.imageUrl) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(task.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownload = () => {
    if (!task.imageUrl) return;
    const cleanName = task.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${cleanName}_${task.id.slice(0, 4)}.png`;
    downloadDataUrl(task.imageUrl, filename);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Preview Canvas */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[350px] p-4">
          <img
            src={task.imageUrl}
            alt={task.prompt}
            className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl"
          />

          {/* Navigation Controls */}
          {hasPrev && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center transition cursor-pointer backdrop-blur-md"
              title="Ảnh trước (Phím mũi tên trái)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {hasNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center transition cursor-pointer backdrop-blur-md"
              title="Ảnh kế tiếp (Phím mũi tên phải)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sidebar Info & Metadata */}
        <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Google Nano Banana 2.1</span>
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                <FileText className="w-4 h-4 text-sky-400" />
                {task.fileName}
              </h3>
            </div>

            {/* Prompt View with Copy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold">Nội dung prompt:</span>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto font-['JetBrains_Mono',monospace]">
                {task.prompt}
              </div>
            </div>

            {/* Metadata Tags */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Tỷ lệ khung hình</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {task.aspectRatio || '1:1'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Độ phân giải</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {task.imageSize || '1K'} Ultra HD
                </span>
              </div>

              {task.generatedAt && (
                <div className="col-span-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <div className="text-[11px] text-slate-400">
                      Tạo lúc: {new Date(task.generatedAt).toLocaleTimeString('vi-VN')} -{' '}
                      {new Date(task.generatedAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  {task.keyUsed && task.keyUsed.totalKeys > 1 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Key #{task.keyUsed.index}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Download Action */}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <button
              onClick={handleDownload}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Tải ảnh chất lượng cao (.PNG)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
